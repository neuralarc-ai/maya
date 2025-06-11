import { useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface ConversationMessage {
  message: string;
  source: 'user' | 'ai';
  conversation_id?: string;
}

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/agents';

export function useVoiceRecording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
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
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }, [recording]);

  const startConversation = useCallback(async (agentId: string) => {
    try {
      console.log('Starting conversation with agent:', agentId);
      
      const apiKey = Constants.expoConfig?.extra?.elevenLabsApiKey;
      if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      // Extract the actual agent ID (remove 'agent_' prefix if present)
      const actualAgentId = agentId.replace('agent_', '');
      
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
      if (!data.conversation_id) {
        throw new Error('No conversation ID received from API');
      }

      setConversationId(data.conversation_id);
      console.log('Conversation started successfully:', data.conversation_id);
      return data.conversation_id;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }, []);

  const sendAudio = useCallback(async (audioUri: string) => {
    if (!conversationId) {
      throw new Error('No active conversation');
    }

    try {
      console.log('Sending audio to conversation:', conversationId);

      const apiKey = Constants.expoConfig?.extra?.elevenLabsApiKey;
      if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      // Convert audio to base64
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Send audio using direct API call
      const apiResponse = await fetch(`${ELEVEN_LABS_API_URL}/${conversationId}/audio`, {
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
      console.log('Audio sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to send audio:', error);
      throw error;
    }
  }, [conversationId]);

  const endConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      console.log('Ending conversation:', conversationId);

      const apiKey = Constants.expoConfig?.extra?.elevenLabsApiKey;
      if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      const response = await fetch(`${ELEVEN_LABS_API_URL}/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'Jarvis/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('Conversation ended successfully');
      setConversationId(null);
    } catch (error) {
      console.error('Failed to end conversation:', error);
      throw error;
    }
  }, [conversationId]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    startConversation,
    sendAudio,
    endConversation,
  };
} 