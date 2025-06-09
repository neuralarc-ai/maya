import { useState, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Audio } from 'expo-av';
import { VoiceMessage } from '../types/voice';

interface UseVoiceConversation {
  isRecording: boolean;
  recordingDuration: number;
  error: string | null;
  messages: VoiceMessage[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export function useVoiceConversation(agentId: string): UseVoiceConversation {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use the ElevenLabs React SDK
  const conversation = useConversation({
    onConnect: () => {},
    onDisconnect: () => {},
    onMessage: (message) => {
      setMessages((prev) => [
        ...prev,
        {
          id: message.id || Date.now().toString(),
          sender: message.role === 'user' ? 'user' : 'ai',
          text: message.text,
          audioUri: message.audio_url,
          timestamp: Date.now(),
        },
      ]);
    },
    onError: (err) => setError(err.message || 'Unknown error'),
  });

  const startRecording = useCallback(async () => {
    setError(null);
    setIsRecording(true);
    setRecordingDuration(0);
    intervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    // Start the conversation session if not already started
    if (!conversation.session) {
      await conversation.startSession({ agentId });
    }
    await conversation.startRecording();
  }, [agentId, conversation]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRecordingDuration(0);
    await conversation.stopRecording();
  }, [conversation]);

  return {
    isRecording,
    recordingDuration,
    error,
    messages,
    startRecording,
    stopRecording,
  };
} 