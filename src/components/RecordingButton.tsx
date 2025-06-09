import React from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';

interface RecordingButtonProps {
  isRecording: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({ isRecording, disabled, onPress }) => {
  // TODO: Add animation, haptic feedback, and pulsing indicator
  return (
    <Pressable
      className={`w-20 h-20 rounded-full bg-primary items-center justify-center shadow-lg ${
        disabled ? 'opacity-50' : ''
      }`}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Record Voice"
    >
      <View className="w-16 h-16 rounded-full bg-background items-center justify-center">
        {isRecording ? (
          <View className="w-4 h-4 rounded-full bg-red-500 mt-1" />
        ) : null}
        {disabled && <ActivityIndicator color="#007AFF" />}
      </View>
    </Pressable>
  );
};
