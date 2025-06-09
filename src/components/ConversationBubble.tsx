import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ConversationBubbleProps = {
  message: string;
  isUser: boolean;
  timestamp: Date;
};

export function ConversationBubble({ message, isUser, timestamp }: ConversationBubbleProps) {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.text}>{message}</Text>
      </View>
      <Text style={styles.timestamp}>
        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    backgroundColor: '#2C2C2E',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
