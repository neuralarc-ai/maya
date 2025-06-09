// This file is no longer needed. ElevenLabs API calls are now handled by the @elevenlabs/react SDK.
// See https://elevenlabs.io/docs/cookbooks/conversational-ai/expo-react-native for details.

import { Audio } from 'expo-av';
import Constants from 'expo-constants';

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/convai/conversation';

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string;

  private constructor() {
    const apiKey = Constants.expoConfig?.extra?.elevenLabsApiKey;
    if (!apiKey) {
      throw new Error('ELEVEN_LABS_API_KEY is not defined in app.config.js');
    }
    this.apiKey = apiKey;
  }

  public static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  async startConversation(agentId: string): Promise<string> {
    try {
      const response = await fetch(`${ELEVEN_LABS_API_URL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ agent_id: agentId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.conversation_id;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to start conversation: ${error.message}`);
      }
      throw error;
    }
  }

  async sendAudio(conversationId: string, audioUri: string): Promise<string> {
    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const base64Audio = await this.blobToBase64(blob);

      const apiResponse = await fetch(`${ELEVEN_LABS_API_URL}/${conversationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
      }

      const data = await apiResponse.json();
      return data.audio_url;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send audio: ${error.message}`);
      }
      throw error;
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${ELEVEN_LABS_API_URL}/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to end conversation: ${error.message}`);
      }
      throw error;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
} 