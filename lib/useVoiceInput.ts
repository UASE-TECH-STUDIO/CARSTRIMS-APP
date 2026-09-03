"use client";
import { useState, useRef, useCallback, useEffect } from "react";
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

  const isIOSNative = () =>
    typeof window !== "undefined" &&
    (window as any).Capacitor?.getPlatform?.() === "ios";

  // Proactively hides the mic button on iOS from the very first
  // render, rather than only after the user taps it once and gets a
  // failed attempt - matches "iPhone users shouldn't see a mic button
  // at all for now" rather than "the mic button silently stops
  // working after one try."
  useEffect(() => {
    if (isIOSNative()) setSupported(false);
  }, []);

  const startNative = useCallback(async () => {
    setLastError(null);

    // Voice search is disabled on iOS specifically for now - every
    // attempt to make the native speech plugin work reliably there
    // (the plugin's own SPM incompatibility, a wrong installed
    // version, a stuck native "already running" state, and finally
    // the recognizer accepting a session but never producing a
    // transcript) surfaced a new, different problem each time, with
    // the most recent attempt causing an outright app crash on both
    // platforms. Android and web voice search are confirmed working
    // and unaffected by this - this only turns the mic off on iOS,
    // where typing remains the only input method until this is
    // revisited properly, without time pressure, rather than risking
    // another attempt that could break something working again.
    if (isIOSNative()) {
      setSupported(false);
      setLastError("device-unavailable");
      return;
    }

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
      setListening(true);

      // No language specified — lets the device use its own
      // configured default, which is ALWAYS guaranteed to be valid
      // and installed, unlike a hardcoded locale. An earlier version
      // hardcoded "en-GB" here (reasoning: closer to Nigerian spoken
      // English than "en-US") but that's very likely the actual cause
      // of the native-only "unexpected error" — if a given device
      // doesn't have that specific locale installed for recognition,
      // start() rejects outright rather than falling back gracefully.
      // The device's own default is a safer bet: most Nigerian Android
      // phones (Samsung/Tecno/Infinix etc.) are commonly already
      // configured close to what was being targeted anyway, without
      // the risk of hardcoding something unsupported.
      //
      // maxResults raised from 1 to 3: native speech engines often
      // rank alternative interpretations, and the single top pick
      // isn't always the best one for domain-specific speech like car
      // shopping terms. Returning all matches lets the caller's own
      // correction/vocabulary-matching logic pick whichever candidate
      // actually makes sense, rather than being stuck with whatever
      // the engine ranked first.
      //
      // partialResults off, popup off — keeps this feeling like part
      // of the app's own search box (the mic icon pulses) rather than
      // a jarring native overlay taking over the screen.
      const result = await SpeechRecognition.start({
        maxResults: 3,
        partialResults: false,
        popup: false,
      }).catch(async (deviceDefaultErr: any) => {
        // Defensive fallback: if the device's own default language
        // somehow still fails to start recognition, retry once with
        // en-US explicitly - the single most universally-supported
        // locale on Android, present on virtually every device
        // regardless of region settings.
        console.warn("[useVoiceInput] Device-default language failed, retrying with en-US:", deviceDefaultErr);
        return SpeechRecognition.start({
          language: "en-US",
          maxResults: 3,
          partialResults: false,
          popup: false,
        });
      });

      setListening(false);
      const matches: string[] = result?.matches || [];
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

  return { listening, supported, lastError, start, stop, voiceDisabledOnThisPlatform: isIOSNative() };
}
