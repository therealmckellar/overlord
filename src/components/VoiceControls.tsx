'use client';

import React, { useState, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useTTS } from '@/hooks/useTTS';
import { useSTT } from '@/hooks/useSTT';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export const VoiceControls = () => {
  const { voiceEnabled, toggleVoice, soundsEnabled, toggleSounds } = useUIStore();
  const { speak, stop: stopTTS, isSpeaking, canSpeak } = useTTS();
  const { startRecording, stopRecording, isRecording, error: sttError } = useSTT(
    useCallback((text: string) => {
      // When STT returns text, auto-send as message
      // For now, just speak it back as confirmation
      if (voiceEnabled && text) {
        speak(`Got it: ${text}`);
      }
    }, [voiceEnabled, speak])
  );

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

      {/* STT error toast */}
      {sttError && (
        <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={sttError}>
          {sttError}
        </span>
      )}
    </div>
  );
};
