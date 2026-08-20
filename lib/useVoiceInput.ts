"use client";
import { useState, useRef, useCallback } from "react";

/**
 * Voice-to-text using the browser's built-in Web Speech API
 * (SpeechRecognition) — no external service, no API key, works on
 * Chrome/Edge and Safari (iOS 14.5+) out of the box, which covers the
 * WebView used by the Android and iOS apps too.
 *
 * Returns a listening flag, the live transcript, and start/stop
 * controls. The caller decides what to do with the transcript (e.g.
 * feed it into the search box).
 */
export function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new SpeechRecognition();
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

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
