'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useConnectorStore } from '@/stores/connectorStore';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const soundsEnabled = useUIStore((s) => s.soundsEnabled);
  const selectedVoice = useUIStore((s) => s.selectedVoice || 'aura-asteria-en');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, []);

  const speak = useCallback(async (text: string, options: { voice?: string } = {}) => {
    if (!soundsEnabled) return;

    stop();

    try {
      const deepgramKeyObj = useConnectorStore.getState().apiKeys.find(k => k.service === 'deepgram');
      const deepgramKey = deepgramKeyObj?.enabled ? deepgramKeyObj.key : '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (deepgramKey) {
        headers['Authorization'] = `Bearer ${deepgramKey}`;
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          voice: options.voice || selectedVoice,
        }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  }, [soundsEnabled, stop]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    canSpeak: soundsEnabled,
  };
};

// Need to add useRef import at top
