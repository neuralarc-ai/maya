import React, { useRef } from 'react';
import { View, FlatList, SafeAreaView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { ConversationBubble } from '../components/ConversationBubble';
import type { VoiceMessage } from '../types/voice';

const mockMessages: VoiceMessage[] = [
  {
    id: '1',
    text: 'Hello, how can I help you today?',
    isUser: false,
    timestamp: new Date(),
  },
  {
    id: '2',
    text: 'I need help with my project.',
    isUser: true,
    timestamp: new Date(),
  },
];

type ConversationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Conversation'>;
};

export default function ConversationScreen({ navigation }: ConversationScreenProps) {
  const flatListRef = useRef<FlatList<VoiceMessage>>(null);

  const handleVoiceInput = (text: string) => {
    // TODO: Handle voice input
    console.log('Voice input:', text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={mockMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationBubble
            message={item.text}
            isUser={item.isUser}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.recorderContainer}>
        <VoiceRecorder onVoiceInput={handleVoiceInput} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  messageList: {
    padding: 16,
  },
  recorderContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
