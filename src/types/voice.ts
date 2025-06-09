export interface VoiceMessage {
  id: string;
  sender: 'user' | 'ai';
  audioUri?: string;
  text?: string;
  timestamp: number;
  duration?: number;
}

export interface Conversation {
  id: string;
  messages: VoiceMessage[];
}

export interface ConversationResponse {
  conversation_id: string;
  audio_url: string;
}
