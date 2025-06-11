import { useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { VoiceMessage } from '../types/voice';

interface UseVoiceConversation {
  error: string | null;
  messages: VoiceMessage[];
}

export function useVoiceConversation(agentId: string): UseVoiceConversation {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  useConversation({
    onConnect: () => {},
    onDisconnect: () => {},
    onMessage: (message) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: message.source === 'user' ? 'user' : 'ai',
          text: message.message,
          timestamp: Date.now(),
        },
      ]);
    },
    onError: (err) => setError(typeof err === 'string' ? err : 'Unknown error'),
  });

  return {
    error,
    messages,
  };
} 