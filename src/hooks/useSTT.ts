'use client';

import { useState, useCallback } from 'react';

export const useSTT = (onTranscription: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          if (data.text) {
            onTranscription(data.text);
          } else if (data.error) {
            setError(data.error);
          }
        } catch (err: any) {
          setError(`Request failed: ${err.message}`);
        }

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      setError(`Microphone access denied: ${err.message}`);
    }
  }, [onTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    error,
  };
};
