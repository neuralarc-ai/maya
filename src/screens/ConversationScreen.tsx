import React from 'react';
import { SafeAreaView } from 'react-native';
import { VoiceAgent } from '../components/VoiceAgent';

export default function ConversationScreen() {
  // Replace with your actual ElevenLabs agent ID
  const agentId = 'agent_01jxajnxg3eb69kz07dnpspvrk';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <VoiceAgent agentId={agentId} />
    </SafeAreaView>
  );
}
