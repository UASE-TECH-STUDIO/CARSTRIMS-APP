"use client";
import { useState, useRef, useCallback } from "react";

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

      // partialResults off, popup off — keeps this feeling like part
      // of the app's own search box (the mic icon pulses) rather than
      // a jarring native overlay taking over the screen.
      const result = await SpeechRecognition.start({
        language: "en-US",
        maxResults: 1,
        partialResults: false,
        popup: false,
      });

      setListening(false);
      const transcript = result?.matches?.[0];
      if (transcript) onResult(transcript);
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
