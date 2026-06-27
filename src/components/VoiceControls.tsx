'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useTTS } from '@/hooks/useTTS';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

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

export const VoiceControls = () => {
  const voiceEnabled = useUIStore((s) => s.voiceEnabled);
  const toggleVoice = useUIStore((s) => s.toggleVoice);
  const soundsEnabled = useUIStore((s) => s.soundsEnabled);
  const toggleSounds = useUIStore((s) => s.toggleSounds);
  const { speak, stop: stopTTS, isSpeaking, canSpeak } = useTTS();

  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleVoiceCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    // Dispatch custom event so ChatWindow / JarvisPanel can pick it up
    window.dispatchEvent(new CustomEvent('overlord-voice-input', { detail: { text } }));
  }, []);

  const startRecording = useCallback(() => {
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
      setIsRecording(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim || finalTranscript);

      if (finalTranscript) {
        handleVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('[VoiceControls] STT error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          setIsRecording(false);
          recognitionRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  }, [handleVoiceCommand]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      ref.abort();
    }
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSpeakerToggle = () => {
    if (isSpeaking) {
      stopTTS();
    }
    toggleSounds();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Microphone / STT */}
      <button
        onClick={handleMicToggle}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          isRecording
            ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
            : voiceEnabled
              ? 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
              : 'bg-zinc-800/30 border border-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
        title={isRecording ? 'Stop recording' : voiceEnabled ? 'Start voice input' : 'Voice disabled'}
        disabled={!voiceEnabled}
      >
        {isRecording ? (
          <MicOff className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
        {isRecording && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
        )}
      </button>

      {/* Speaker / TTS */}
      <button
        onClick={handleSpeakerToggle}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          !soundsEnabled
            ? 'bg-zinc-800/30 border border-zinc-800 text-zinc-600'
            : isSpeaking
              ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)]'
              : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
        }`}
        title={!soundsEnabled ? 'Sound off' : isSpeaking ? 'Stop speaking' : `TTS ${canSpeak ? 'ready' : 'unavailable'}`}
      >
        {!soundsEnabled ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Voice toggle */}
      <button
        onClick={toggleVoice}
        className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all duration-200 ${
          voiceEnabled
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700 hover:text-zinc-400'
        }`}
        title="Toggle voice features"
      >
        {voiceEnabled ? 'VOICE' : 'voice'}
      </button>

      {/* Interim transcript indicator */}
      {isRecording && interimTranscript && (
        <span className="text-[10px] text-zinc-400 max-w-[100px] truncate" title={interimTranscript}>
          {interimTranscript}
        </span>
      )}
    </div>
  );
};
