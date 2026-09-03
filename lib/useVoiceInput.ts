"use client";
import { useState, useRef, useCallback } from "react";
import { correctVoiceTranscript, CAR_VOCABULARY } from "./voiceCarCorrection";

const VOCAB_LOWER = new Set(CAR_VOCABULARY.map((v) => v.toLowerCase()));

/**
 * Scores a transcript by how many of its words are already-recognized
 * car-shopping vocabulary — a rough proxy for "this candidate is
 * probably the accurate one" versus a garbled alternative. Used to
 * pick the best of several ranked candidates the native speech engine
 * returns, rather than blindly trusting whichever it ranked first.
 */
function scoreTranscript(text: string): number {
  const words = text.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, ""));
  return words.filter((w) => w.length >= 3 && VOCAB_LOWER.has(w)).length;
}

/**
 * Voice-to-text with two paths:
 *
 * - Native (Android/iOS app): uses @capgo/capacitor-speech-recognition,
 *   a real native plugin backed by the device's own speech engine
 *   (Google's on Android, Apple's on iOS). This is necessary because
 *   the browser-standard Web Speech API (SpeechRecognition) generally
 *   does NOT work inside a Capacitor WebView at all — it's typically
 *   only available in the full Chrome/Safari browser apps, not
 *   embedded WebViews, which is why voice search worked on web but
 *   not in the installed app.
 *
 * - Web: uses the browser's built-in Web Speech API directly, same as
 *   before — no native plugin needed there.
 *
 * Either way, the caller gets the same { listening, supported, start,
 * stop } shape back, so nothing else in the app needs to know which
 * path is active.
 */
export function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isNative = () =>
    typeof window !== "undefined" &&
    (window as any).Capacitor?.isNativePlatform?.();

  const startNative = useCallback(async () => {
    setLastError(null);
    let SpeechRecognition: any;
    try {
      ({ SpeechRecognition } = await import("@capgo/capacitor-speech-recognition"));
    } catch (importErr: any) {
      // This specific failure means the plugin's JS bridge never got
      // bundled into the app at all — almost always because `npm
      // install` and/or `npx cap sync` weren't run after the plugin
      // was added to package.json, so the native build never actually
      // included it. This is DIFFERENT from "device has no speech
      // engine" and needs a different fix (rebuild pipeline, not the
      // device), so it gets its own distinct error rather than being
      // lumped in with "not supported".
      console.error("[useVoiceInput] Speech recognition plugin failed to import - likely missing npm install / npx cap sync after adding it:", importErr);
      setLastError("plugin-not-bundled");
      setSupported(false);
      return;
    }

    let partialListener: { remove: () => Promise<void> } | null = null;

    try {
      // Retry the availability check once with a short delay before
      // giving up - a "device reports no speech engine" result is
      // sometimes just the OS speech service being momentarily busy
      // (another app just released the mic, a brief system hiccup),
      // not a genuine permanent limitation, and immediately trusting
      // a single check was causing the mic to report unavailable more
      // often than it actually was.
      let availableResult = await SpeechRecognition.available();
      if (!availableResult.available) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        availableResult = await SpeechRecognition.available();
      }
      if (!availableResult.available) {
        // Still unavailable after a retry - genuinely report it, but
        // do NOT set supported=false here. This can still be
        // transient (network came back, another app released the
        // mic a moment later) and permanently disabling the button
        // for the rest of the session over what might be a one-off
        // hiccup was the actual bug behind "mic sometimes fails and
        // then never works again until I reopen search."
        console.warn("[useVoiceInput] Plugin loaded but device reports no available speech recognition engine (after retry).");
        setLastError("device-unavailable");
        setListening(false);
        return;
      }

      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== "granted") {
        setLastError("permission-denied");
        setListening(false);
        return;
      }

      setSupported(true);

      // Real fix for "Speech recognition is already running": a
      // previous session interrupted at any point (app backgrounded
      // mid-recording, an earlier failed attempt, anything) can leave
      // the native plugin's own internal state stuck thinking a
      // session is still active - every subsequent start() then fails
      // immediately with this exact error, no matter how many times
      // the mic is tapped, until the app is fully force-closed and
      // reopened. Unconditionally stopping any lingering session
      // before every new attempt clears this regardless of how it got
      // stuck in the first place - a stop() call when nothing is
      // actually running is a harmless no-op, so this is always safe
      // to do defensively rather than only reactively after seeing
      // the error.
      await SpeechRecognition.stop().catch(() => {});

      setListening(true);

      // Real fix for "recording starts, nothing ever gets written":
      // relying entirely on start()'s own promise resolving once the
      // native engine detects silence assumed a specific finalization
      // behavior that this plugin's iOS implementation doesn't
      // reliably match - the promise could sit unresolved indefinitely
      // depending on how/when the native side decides an utterance is
      // "done". Listening to live partialResults instead removes that
      // dependency entirely: the latest transcript is captured as it
      // streams in, independent of whatever finalization behavior the
      // current platform/fork actually implements.
      let latestMatches: string[] = [];
      partialListener = await SpeechRecognition.addListener("partialResults", (data: { matches?: string[] }) => {
        if (data?.matches?.length) latestMatches = data.matches;
      });

      const result = await SpeechRecognition.start({
        maxResults: 3,
        partialResults: true,
        popup: false,
      }).catch(async (deviceDefaultErr: any) => {
        // Defensive fallback: if the device's own default language
        // somehow still fails to start recognition, retry once with
        // en-US explicitly - the single most universally-supported
        // locale on Android, present on virtually every device
        // regardless of region settings.
        console.warn("[useVoiceInput] Device-default language failed, retrying with en-US:", deviceDefaultErr);
        await SpeechRecognition.stop().catch(() => {});
        return SpeechRecognition.start({
          language: "en-US",
          maxResults: 3,
          partialResults: true,
          popup: false,
        });
      });

      await partialListener.remove();
      setListening(false);

      // Prefer whatever start() itself resolved with, if it actually
      // did resolve with real matches - falls back to the latest
      // partial transcript captured via the listener above when it
      // didn't (empty matches, or the promise never meaningfully
      // resolved with content).
      const matches: string[] = result?.matches?.length ? result.matches : latestMatches;
      if (!matches.length) return;

      // Pick whichever candidate scores highest against known
      // car-shopping vocabulary (after correction), rather than
      // blindly trusting the engine's top-ranked pick — ties/no
      // matches fall back to the top-ranked candidate, preserving
      // normal behavior when scoring doesn't clearly favor one.
      let best = matches[0];
      let bestScore = -1;
      for (const candidate of matches) {
        const score = scoreTranscript(correctVoiceTranscript(candidate));
        if (score > bestScore) { bestScore = score; best = candidate; }
      }
      onResult(best);
    } catch (runErr: any) {
      console.error("[useVoiceInput] Speech recognition failed while listening:", runErr);
      await partialListener?.remove().catch(() => {});
      await SpeechRecognition.stop().catch(() => {});
      setLastError("runtime-error");
      setListening(false);
      // Deliberately NOT setSupported(false) here - a failure mid-
      // listening (network dropped during recognition, OS hiccup)
      // doesn't mean the mic is permanently broken, and locking the
      // button out for the rest of the session over what's often a
      // one-off issue was the actual bug behind "mic sometimes fails
      // and then never works again until I reopen search."
    }
  }, [onResult]);

  const stopNative = useCallback(async () => {
    try {
      const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition");
      await SpeechRecognition.stop();
    } catch {}
    setListening(false);
  }, []);

  const startWeb = useCallback(() => {
    setLastError(null);
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-NG"; // falls back gracefully to en-US-style recognition where en-NG isn't available
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, [onResult]);

  const stopWeb = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (isNative()) startNative();
    else startWeb();
  }, [startNative, startWeb]);

  const stop = useCallback(() => {
    if (isNative()) stopNative();
    else stopWeb();
  }, [stopNative, stopWeb]);

  return { listening, supported, lastError, start, stop };
}
