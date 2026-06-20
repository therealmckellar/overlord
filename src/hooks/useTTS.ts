'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { soundsEnabled } = useUIStore();
  
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const stop = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [synth]);

  const pause = useCallback(() => {
    if (!synth) return;
    synth.pause();
    setIsPaused(true);
  }, [synth]);

  const resume = useCallback(() => {
    if (!synth) return;
    synth.resume();
    setIsPaused(false);
  }, [synth]);

  const speak = useCallback((text: string, options: Partial<Pick<SpeechSynthesisUtterance, 'rate' | 'pitch' | 'volume' | 'voice'>> = {}) => {
    if (!synth || !soundsEnabled) return;

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, options);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
  }, [synth, soundsEnabled, stop]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    canSpeak: !!synth && soundsEnabled,
  };
};
