import { Conversation, SyncStatus, ExtensionSettings } from '../types/conversation';

export class ExtensionStorage {
  private static instance: ExtensionStorage;
  private isExtensionContext: boolean;

  constructor() {
    // Check if we're running in a Chrome extension context
    this.isExtensionContext = this.detectExtensionContext();
  }

  private detectExtensionContext(): boolean {
    try {
      return (
        typeof chrome !== 'undefined' && 
        chrome.storage !== undefined && 
        chrome.storage.local !== undefined &&
        typeof chrome.storage.local.get === 'function' &&
        typeof chrome.storage.local.set === 'function'
      );
    } catch (error) {
      console.warn('Chrome extension context detection failed:', error);
      return false;
    }
  }

  static getInstance(): ExtensionStorage {
    if (!ExtensionStorage.instance) {
      ExtensionStorage.instance = new ExtensionStorage();
    }
    return ExtensionStorage.instance;
  }

  // Chrome extension storage methods
  private async chromeGet(keys: string[]): Promise<any> {
    if (!this.isExtensionContext) {
      throw new Error('Chrome storage not available');
    }
    try {
      return await chrome.storage.local.get(keys);
    } catch (error) {
      console.error('Chrome storage get error:', error);
      throw new Error('Failed to access Chrome storage');
    }
  }

  private async chromeSet(items: Record<string, any>): Promise<void> {
    if (!this.isExtensionContext) {
      throw new Error('Chrome storage not available');
    }
    try {
      return await chrome.storage.local.set(items);
    } catch (error) {
      console.error('Chrome storage set error:', error);
      throw new Error('Failed to write to Chrome storage');
    }
  }

  // LocalStorage fallback methods
  private localStorageGet(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  private localStorageSet(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  }

  // Unified storage methods
  private async getStorageItem(key: string): Promise<any> {
    try {
      if (this.isExtensionContext) {
        const result = await this.chromeGet([key]);
        return result[key];
      } else {
        return this.localStorageGet(key);
      }
    } catch (error) {
      console.error(`Failed to get storage item "${key}":`, error);
      return null;
    }
  }

  private async setStorageItem(key: string, value: any): Promise<void> {
    try {
      if (this.isExtensionContext) {
        await this.chromeSet({ [key]: value });
      } else {
        this.localStorageSet(key, value);
      }
    } catch (error) {
      console.error(`Failed to set storage item "${key}":`, error);
      throw error;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const conversations = await this.getStorageItem('conversations');
      return conversations || [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      await this.setStorageItem('conversations', conversations);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  async saveConversations(conversations: Conversation[]): Promise<void> {
    try {
      await this.setStorageItem('conversations', conversations);
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  async getSyncStatus(): Promise<SyncStatus[]> {
    try {
      const syncStatus = await this.getStorageItem('syncStatus');
      return syncStatus || [
        { platform: 'chatgpt', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
        { platform: 'claude', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
        { platform: 'gemini', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
        { platform: 'grok', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 }
      ];
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return [
        { platform: 'chatgpt', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
        { platform: 'claude', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
        { platform: 'gemini', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
        { platform: 'grok', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 }
      ];
    }
  }

  async updateSyncStatus(platform: string, updates: Partial<SyncStatus>): Promise<void> {
    try {
      const statuses = await this.getSyncStatus();
      const index = statuses.findIndex(s => s.platform === platform);
      
      if (index >= 0) {
        statuses[index] = { ...statuses[index], ...updates };
        await this.setStorageItem('syncStatus', statuses);
      }
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  async getSettings(): Promise<ExtensionSettings> {
    try {
      const settings = await this.getStorageItem('settings');
      return settings || {
        autoSync: true,
        syncInterval: 30,
        enabledPlatforms: ['chatgpt', 'claude', 'gemini', 'grok'],
        maxContextLength: 10000,
        enableContextInjection: true
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        autoSync: true,
        syncInterval: 30,
        enabledPlatforms: ['chatgpt', 'claude', 'gemini', 'grok'],
        maxContextLength: 10000,
        enableContextInjection: true
      };
    }
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await this.setStorageItem('settings', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const conversations = await this.getConversations();
      const lowercaseQuery = query.toLowerCase();
      
      return conversations.filter(conv => 
        conv.title.toLowerCase().includes(lowercaseQuery) ||
        conv.messages.some(msg => 
          msg.content.toLowerCase().includes(lowercaseQuery)
        )
      );
    } catch (error) {
      console.error('Failed to search conversations:', error);
      return [];
    }
  }

  async getConversationsByPlatform(platform: string): Promise<Conversation[]> {
    try {
      const conversations = await this.getConversations();
      return conversations.filter(conv => conv.platform === platform);
    } catch (error) {
      console.error('Failed to get conversations by platform:', error);
      return [];
    }
  }

  async exportData(): Promise<string> {
    try {
      const conversations = await this.getConversations();
      const settings = await this.getSettings();
      const syncStatus = await this.getSyncStatus();
      
      return JSON.stringify({
        conversations,
        settings,
        syncStatus,
        exportedAt: Date.now()
      }, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.conversations) {
        await this.saveConversations(data.conversations);
      }
      
      if (data.settings) {
        await this.saveSettings(data.settings);
      }
      
      if (data.syncStatus) {
        await this.setStorageItem('syncStatus', data.syncStatus);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid import data format');
    }
  }

  async isFirstTime(): Promise<boolean> {
    try {
      const setupCompleted = await this.getStorageItem('setupCompleted');
      return !setupCompleted;
    } catch (error) {
      console.error('Failed to check first time:', error);
      return true;
    }
  }

  async markSetupComplete(): Promise<void> {
    try {
      await this.setStorageItem('setupCompleted', true);
    } catch (error) {
      console.error('Failed to mark setup complete:', error);
    }
  }

  // Method to check if extension context is available
  isExtensionEnvironment(): boolean {
    return this.isExtensionContext;
  }

  // Method to get environment info
  getEnvironmentInfo(): { isExtension: boolean; storageType: string } {
    return {
      isExtension: this.isExtensionContext,
      storageType: this.isExtensionContext ? 'chrome.storage.local' : 'localStorage'
    };
  }
}