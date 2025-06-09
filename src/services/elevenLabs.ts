import { Audio } from 'expo-av';
import Constants from 'expo-constants';

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

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

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      // Convert audio to base64
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const base64Audio = await this.blobToBase64(blob);

      console.log('Sending audio to ElevenLabs API...');
      
      // Send to ElevenLabs API
      const apiResponse = await fetch(`${ELEVEN_LABS_API_URL}/speech-to-text/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          model_id: 'whisper-1',
          language: 'en',
          response_format: 'text',
          word_timestamps: false,
          speaker_diarization: false,
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
      }

      const data = await apiResponse.json();
      console.log('Transcription successful:', data);
      return data.text;
    } catch (error) {
      console.error('Transcription error:', error);
      if (error instanceof Error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }
      throw error;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
} 