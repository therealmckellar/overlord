'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { SSEClient } from '@/lib/sse';
import { SSEEvent } from '@/types';

export function useBackgroundTasks() {
  const addToast = useUIStore((s) => s.addToast);
  const [recentTasks, setRecentTasks] = useState<string[]>([]);
  const taskBuffer: string[] = []; // Using a simple array as a dedupe ring buffer

  useEffect(() => {
    const sse = new SSEClient('/api/chat'); // In a real app, this might be a separate endpoint
    
    sse.setOnMessage((event: SSEEvent) => {
      if (event.type === 'bg_task_complete') {
        const taskId = event.data;
        
        // Dedupe check (last 50 task IDs)
        if (!taskBuffer.length || !taskBuffer.includes(taskId)) {
          taskBuffer.push(taskId);
          if (taskBuffer.length > 50) {
            taskBuffer.shift();
          }

          // Auto-generate toast
          addToast({
            type: 'success',
            message: `Background task ${taskId} completed successfully!`,
          });
          
          setRecentTasks((prev) => [taskId, ...prev].slice(0, 20));
        }
      }
    });

    sse.connect();

    return () => {
      sse.disconnect();
    };
  }, [addToast]);

  function clearTasks() {
    setRecentTasks([]);
  }

  return {
    recentTasks,
    clearTasks,
  };
}
