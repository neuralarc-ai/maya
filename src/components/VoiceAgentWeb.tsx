'use dom';

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useConversation } from '@elevenlabs/react';
import { AnimatedMic } from './AnimatedMic';

interface VoiceAgentProps {
  agentId: string;
}

export default function VoiceAgent({ agentId }: VoiceAgentProps) {
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
      <AnimatedMic 
        listening={isListening} 
        onPress={startConversation}
      />
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
    backgroundColor: '#F9F0E4',
  },
  infoText: {
    color: '#8E8E93',
    marginTop: 8,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
}); 