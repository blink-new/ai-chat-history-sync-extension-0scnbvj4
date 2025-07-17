// Background service worker for AI Chat History Sync Extension

class BackgroundService {
  constructor() {
    this.storage = null;
    this.syncInterval = null;
    this.init();
  }

  async init() {
    console.log('AI Chat History Sync: Background service initialized');
    
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Set up periodic sync
    this.setupPeriodicSync();
  }

  async handleInstall(details) {
    if (details.reason === 'install') {
      console.log('AI Chat History Sync: Extension installed');
      
      // Initialize default settings
      await chrome.storage.local.set({
        settings: {
          autoSync: true,
          syncInterval: 30,
          enabledPlatforms: ['chatgpt', 'claude', 'gemini', 'grok'],
          maxContextLength: 10000,
          enableContextInjection: true
        },
        conversations: [],
        syncStatus: [
          { platform: 'chatgpt', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
          { platform: 'claude', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
          { platform: 'gemini', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 },
          { platform: 'grok', isConnected: false, lastSync: null, totalConversations: 0, isExtracting: false, extractionProgress: 0 }
        ]
      });
    }
  }

  async handleMessage(message, sender, sendResponse) {
    console.log('Background received message:', message);
    
    switch (message.type) {
      case 'CONVERSATION_EXTRACTED':
        await this.saveConversation(message.conversation);
        break;
        
      case 'REQUEST_CONTEXT':
        const context = await this.getContextForPlatform(message.platform);
        sendResponse({ context });
        break;
        
      case 'UPDATE_SYNC_STATUS':
        await this.updateSyncStatus(message.platform, message.updates);
        break;
        
      case 'START_EXTRACTION':
        await this.startExtraction(message.platform);
        break;
    }
    
    return true; // Keep message channel open for async response
  }

  async saveConversation(conversation) {
    try {
      const result = await chrome.storage.local.get(['conversations']);
      const conversations = result.conversations || [];
      
      // Check if conversation already exists
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      await chrome.storage.local.set({ conversations });
      console.log('Conversation saved:', conversation.title);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  async getContextForPlatform(platform) {
    try {
      const result = await chrome.storage.local.get(['conversations', 'settings']);
      const conversations = result.conversations || [];
      const settings = result.settings || {};
      
      if (!settings.enableContextInjection) {
        return '';
      }
      
      // Get recent conversations from other platforms
      const otherPlatformConversations = conversations
        .filter(conv => conv.platform !== platform)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10); // Get last 10 conversations
      
      if (otherPlatformConversations.length === 0) {
        return '';
      }
      
      // Build context summary
      let context = "Previous conversation context from other AI platforms:\n\n";
      
      otherPlatformConversations.forEach(conv => {
        context += `[${conv.platform.toUpperCase()}] ${conv.title}\n`;
        
        // Add last few messages from each conversation
        const recentMessages = conv.messages.slice(-3);
        recentMessages.forEach(msg => {
          const truncatedContent = msg.content.length > 200 
            ? msg.content.substring(0, 200) + '...'
            : msg.content;
          context += `${msg.role}: ${truncatedContent}\n`;
        });
        
        context += '\n';
      });
      
      // Truncate if too long
      if (context.length > settings.maxContextLength) {
        context = context.substring(0, settings.maxContextLength) + '...\n\n[Context truncated]';
      }
      
      return context;
    } catch (error) {
      console.error('Failed to get context:', error);
      return '';
    }
  }

  async updateSyncStatus(platform, updates) {
    try {
      const result = await chrome.storage.local.get(['syncStatus']);
      const syncStatus = result.syncStatus || [];
      
      const index = syncStatus.findIndex(s => s.platform === platform);
      if (index >= 0) {
        syncStatus[index] = { ...syncStatus[index], ...updates };
        await chrome.storage.local.set({ syncStatus });
      }
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  async startExtraction(platform) {
    console.log(`Starting extraction for ${platform}`);
    
    // Update status to show extraction started
    await this.updateSyncStatus(platform, { 
      isExtracting: true, 
      extractionProgress: 0 
    });
    
    // Send message to content script to start extraction
    const tabs = await chrome.tabs.query({ 
      url: this.getPlatformUrl(platform) 
    });
    
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'START_EXTRACTION' 
      });
    }
  }

  getPlatformUrl(platform) {
    const urls = {
      chatgpt: 'https://chat.openai.com/*',
      claude: 'https://claude.ai/*',
      gemini: 'https://gemini.google.com/*',
      grok: 'https://grok.x.com/*'
    };
    return urls[platform] || '*';
  }

  async setupPeriodicSync() {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};
    
    if (settings.autoSync) {
      // Clear existing interval
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }
      
      // Set up new interval
      const intervalMs = (settings.syncInterval || 30) * 60 * 1000; // Convert minutes to ms
      this.syncInterval = setInterval(() => {
        this.performAutoSync();
      }, intervalMs);
      
      console.log(`Auto-sync enabled with ${settings.syncInterval} minute interval`);
    }
  }

  async performAutoSync() {
    console.log('Performing auto-sync...');
    
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};
    
    for (const platform of settings.enabledPlatforms || []) {
      // Check if there are active tabs for this platform
      const tabs = await chrome.tabs.query({ 
        url: this.getPlatformUrl(platform) 
      });
      
      if (tabs.length > 0) {
        // Send sync request to content script
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'AUTO_SYNC' 
        });
      }
    }
  }
}

// Initialize background service
new BackgroundService();