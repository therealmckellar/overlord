'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface JarvisState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  lastCommand: string | null;
  error: string | null;
}

interface JarvisActions {
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  speak: (text: string, voice?: string | null) => void;
}

type JarvisCommandCallback = (command: string) => void;

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const WAKE_WORDS = ['jarvis', 'hey jarvis', 'okay jarvis', 'jarvis hey'];

export function useJarvis(onCommand?: JarvisCommandCallback) {
  const [state, setState] = useState<JarvisState>({
    isListening: false,
    isSpeaking: false,
    isSupported: false,
    transcript: '',
    lastCommand: null,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setState((s) => ({ ...s, isSupported: supported }));
  }, []);

  const processVoiceCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    
    const hasWakeWord = WAKE_WORDS.some((w) => lower.includes(w));
    if (!hasWakeWord && state.isListening) {
      setState((s) => ({ ...s, transcript: text }));
      return;
    }

    let command = lower;
    for (const w of WAKE_WORDS) {
      if (command.includes(w)) {
        command = command.replace(w, '').trim();
        break;
      }
    }

    if (!command) {
      setState((s) => ({ ...s, transcript: text, lastCommand: 'Listening...' }));
      return;
    }

    setState((s) => ({ ...s, transcript: text, lastCommand: command, isListening: false }));

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    onCommandRef.current?.(command);
  }, [state.isListening]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState((s) => ({ ...s, isListening: true, error: null }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const displayTranscript = finalTranscript || interimTranscript;
      setState((s) => ({
        ...s,
        transcript: displayTranscript,
        lastCommand: finalTranscript ? `Heard: "${finalTranscript}"` : null,
      }));

      if (finalTranscript) {
        processVoiceCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setState((s) => ({ ...s, error: event.error, isListening: false }));
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          setState((s) => ({ ...s, isListening: false }));
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setState((s) => ({ ...s, error: 'Failed to start speech recognition' }));
    }
  }, [processVoiceCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      ref.abort();
    }
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  const activate = useCallback(() => {
    startListening();
  }, [startListening]);

  const deactivate = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const toggle = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const speak = useCallback(async (text: string, voice?: string | null) => {
    // We now delegate TTS to the useTTS hook via the JarvisPanel or the useTTS hook directly
    // This function is kept for compatibility but should be used via the useTTS hook
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      if (!response.ok) throw new Error('TTS failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Jarvis speak error:', e);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    ...state,
    activate,
    deactivate,
    toggle,
    speak,
  } as JarvisState & JarvisActions;
}
