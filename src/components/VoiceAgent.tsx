import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { AnimatedMic } from './AnimatedMic';

interface VoiceAgentProps {
  agentId: string;
}

interface Message {
  source: 'ai' | 'user';
  message: string;
}

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/agents';

export default function VoiceAgent({ agentId }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoStartTried, setAutoStartTried] = useState(false);
  const [autoStartFailed, setAutoStartFailed] = useState(false);
  
  // Extract the actual agent ID (remove 'agent_' prefix if present)
  const actualAgentId = agentId.replace('agent_', '');

  // Initialize audio mode
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Failed to setup audio:', error);
      }
    };
    setupAudio();
  }, []);

  const startConversation = useCallback(async () => {
    try {
      console.log('🎤 Starting conversation with agent:', agentId);
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }

      // Get API key
      const apiKey = Constants.expoConfig?.extra?.elevenLabsApiKey;
      if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      // Debug log the agent ID
      console.log('🔍 Using agent ID:', agentId);
      
      // Debug log the actual agent ID
      console.log('🔍 Using actual agent ID:', actualAgentId);

      // Start conversation
      console.log('🎯 Starting conversation...');
      const response = await fetch(`${ELEVEN_LABS_API_URL}/${actualAgentId}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'Jarvis/1.0',
        },
        body: JSON.stringify({ 
          mode: "streaming",
          recording_enabled: true,
          language: "en",
          model_id: "eleven_turbo_v2"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Request URL:', `${ELEVEN_LABS_API_URL}/${actualAgentId}/conversations`);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Conversation Response:', data);

      if (!data.conversation_id) {
        throw new Error('No conversation ID received from API');
      }

      setConversationId(data.conversation_id);
      console.log('✅ Conversation started:', data.conversation_id);

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => console.log('Recording status:', status)
      );
      setRecording(recording);
      setIsListening(true);

      // Add initial message if available
      if (data.message) {
        setMessages(prev => [...prev, {
          source: 'ai' as const,
          message: data.message
        }]);
      }
    } catch (error) {
      console.error('🚨 Failed to start conversation:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to start conversation'
      );
    }
  }, [agentId]);

  const stopConversation = useCallback(async () => {
    if (!recording || !conversationId) return;

    try {
      console.log('🎤 Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsListening(false);

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Get API key
      const apiKey = Constants.expoConfig?.extra?.elevenLabsApiKey;
      if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      // Convert audio to base64
      console.log('🎤 Converting audio to base64...');
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Send audio
      console.log('🎤 Sending audio...');
      const apiResponse = await fetch(`${ELEVEN_LABS_API_URL}/${actualAgentId}/conversations/${conversationId}/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'Jarvis/1.0',
        },
        body: JSON.stringify({
          audio: base64Audio,
          model_id: "eleven_turbo_v2"
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
      }

      const data = await apiResponse.json();
      console.log('📦 Audio Response:', data);

      // Add messages
      setMessages(prev => [
        ...prev,
        { source: 'user' as const, message: 'Audio message sent' },
        ...(data.text ? [{ source: 'ai' as const, message: data.text }] : [])
      ]);

      // End conversation
      console.log('🔚 Ending conversation...');
      const endResponse = await fetch(`${ELEVEN_LABS_API_URL}/${actualAgentId}/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'Jarvis/1.0',
        },
      });

      if (!endResponse.ok) {
        const errorText = await endResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${endResponse.status} ${endResponse.statusText} - ${errorText}`);
      }

      setConversationId(null);
    } catch (error) {
      console.error('🚨 Error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }, [recording, conversationId, agentId]);

  const handleMicPress = useCallback(async () => {
    if (isListening) {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [isListening, startConversation, stopConversation]);

  // Attempt to auto-start conversation and recording on mount
  useEffect(() => {
    (async () => {
      setAutoStartTried(true);
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          setAutoStartFailed(true);
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        if (!conversationId) {
          await startConversation();
        }
        if (!recording) {
          try {
            const { recording: newRecording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY,
              (status) => console.log('Recording status:', status)
            );
            setRecording(newRecording);
            setIsListening(true);
            setAutoStartFailed(false);
          } catch (err) {
            setAutoStartFailed(true);
          }
        }
      } catch (err) {
        setAutoStartFailed(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for manual start (fallback for web)
  const handleManualStart = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setAutoStartFailed(true);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      if (!conversationId) {
        await startConversation();
      }
      if (!recording) {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
          (status) => console.log('Recording status:', status)
        );
        setRecording(newRecording);
        setIsListening(true);
        setAutoStartFailed(false);
      }
    } catch (err) {
      setAutoStartFailed(true);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedMic 
        listening={!!recording} 
        onPress={autoStartFailed ? handleManualStart : (recording ? handleMicPress : undefined)}
      />
      <Text style={styles.infoText}>
        {recording
          ? 'Recording... Tap again to stop'
          : autoStartFailed
            ? 'Click the mic to start (browser requires permission)'
            : 'Starting...'}
      </Text>
      <View style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <Text 
            key={index} 
            style={[
              styles.message,
              msg.source === 'ai' ? styles.aiMessage : styles.userMessage
            ]}
          >
            {msg.message}
          </Text>
        ))}
      </View>
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
  messagesContainer: {
    width: '100%',
    padding: 16,
    marginTop: 16,
  },
  message: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    color: 'white',
    alignSelf: 'flex-end',
  },
}); 