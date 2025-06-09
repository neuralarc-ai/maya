'use dom';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { AnimatedMic } from './AnimatedMic';

interface VoiceAgentProps {
  agentId: string;
}

export function VoiceAgent({ agentId }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const conversation = useConversation({
    onConnect: () => setIsListening(true),
    onDisconnect: () => setIsListening(false),
    onMessage: (message) => { console.log(message); },
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    await conversation.startSession({
      agentId,
    });
  }, [conversation, agentId]);

  return (
    <View style={styles.container}>
      <Pressable onPress={startConversation}>
        <AnimatedMic listening={isListening} />
      </Pressable>
      <Text style={styles.infoText}>Tap the mic to start a conversation</Text>
      {/* You can add more UI here to show conversation state/messages */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  infoText: {
    color: '#8E8E93',
    marginTop: 8,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 