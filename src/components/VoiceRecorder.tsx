import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { ElevenLabsService } from '../services/elevenLabs';

type VoiceRecorderProps = {
  onVoiceInput: (text: string) => void;
};

export function VoiceRecorder({ onVoiceInput }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      isRecordingRef.current = true;

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access microphone was denied');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        if (isRecordingRef.current) {
          setRecordingDuration(prev => prev + 1);
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      isRecordingRef.current = false;

      // Clear duration timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop recording if it exists
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (uri) {
          setIsTranscribing(true);
          try {
            // Get transcription from ElevenLabs
            const transcription = await ElevenLabsService.getInstance().transcribeAudio(uri);
            onVoiceInput(transcription);
          } catch (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
            setError('Failed to transcribe audio');
          } finally {
            setIsTranscribing(false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const handlePressIn = () => {
    if (!isRecording) {
      startRecording();
    }
  };

  const handlePressOut = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recordingButton]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={isTranscribing}
      >
        {isTranscribing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <MaterialIcons
            name={isRecording ? 'mic' : 'mic-none'}
            size={32}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>
      {isRecording && (
        <Text style={styles.duration}>
          {recordingDuration.toFixed(0)}s
        </Text>
      )}
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
    transform: [{ scale: 1.1 }],
  },
  duration: {
    color: '#8E8E93',
    marginTop: 8,
    fontSize: 16,
  },
  error: {
    color: '#FF3B30',
    marginTop: 4,
    fontSize: 14,
  },
});
