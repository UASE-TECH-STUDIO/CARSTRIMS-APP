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
 * - Native (Android/iOS app): uses @capacitor-community/speech-recognition,
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
  const recognitionRef = useRef<any>(null);

  const isNative = () =>
    typeof window !== "undefined" &&
    (window as any).Capacitor?.isNativePlatform?.();

  const startNative = useCallback(async () => {
    try {
      const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");

      const { available } = await SpeechRecognition.available();
      if (!available) {
        setSupported(false);
        return;
      }

      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== "granted") {
        setSupported(false);
        return;
      }

      setSupported(true);
      setListening(true);

      // en-GB rather than en-US: Nigeria's spoken English follows
      // British pronunciation patterns much more closely than
      // American ones (education system, media, etc.), and this was
      // a real, confirmed mismatch — this file previously hardcoded
      // en-US here while the web version already correctly tried
      // en-NG first.
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
        language: "en-GB",
        maxResults: 3,
        partialResults: false,
        popup: false,
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
    } catch {
      setListening(false);
      setSupported(false);
    }
  }, [onResult]);

  const stopNative = useCallback(async () => {
    try {
      const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
      await SpeechRecognition.stop();
    } catch {}
    setListening(false);
  }, []);

  const startWeb = useCallback(() => {
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

  return { listening, supported, start, stop };
}
