export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  platform: 'chatgpt' | 'claude' | 'gemini' | 'grok';
}

export interface Conversation {
  id: string;
  title: string;
  platform: 'chatgpt' | 'claude' | 'gemini' | 'grok';
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  url?: string;
  tags?: string[];
}

export interface SyncStatus {
  platform: 'chatgpt' | 'claude' | 'gemini' | 'grok';
  isConnected: boolean;
  lastSync: number | null;
  totalConversations: number;
  isExtracting: boolean;
  extractionProgress: number;
}

export interface ExtensionSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  enabledPlatforms: ('chatgpt' | 'claude' | 'gemini' | 'grok')[];
  maxContextLength: number;
  enableContextInjection: boolean;
}