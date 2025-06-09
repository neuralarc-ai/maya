import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

interface ConversationBubbleProps {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  onPlayAudio?: () => void;
}

export const ConversationBubble: React.FC<ConversationBubbleProps> = ({ sender, text, timestamp, onPlayAudio }) => {
  const isAI = sender === 'ai';
  const [isPlaying, setIsPlaying] = React.useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const handlePlayAudio = async () => {
    if (onPlayAudio) {
      onPlayAudio();
    }
  };

  return (
    <View className={`max-w-[80%] rounded-2xl p-3.5 my-1.5 mx-3 shadow-sm ${
      isAI ? 'bg-cardBackground self-start' : 'bg-primary self-end'
    }`}>
      <Text className={`text-base font-medium ${
        isAI ? 'text-textSecondary' : 'text-text'
      }`}>
        {text}
      </Text>
      <View className="flex-row items-center mt-2">
        <Text className="text-xs text-textSecondary mr-2">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {isAI && onPlayAudio && (
          <TouchableOpacity 
            onPress={handlePlayAudio} 
            className="p-1"
            accessibilityLabel="Play AI message"
          >
            <Text className="text-accent text-base">🔊</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
