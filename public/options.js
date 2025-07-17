// Options page JavaScript for AI Chat History Sync Extension

class OptionsPage {
  constructor() {
    this.platforms = [
      { id: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
      { id: 'claude', name: 'Claude', icon: '🧠' },
      { id: 'gemini', name: 'Gemini', icon: '💎' },
      { id: 'grok', name: 'Grok', icon: '🚀' }
    ];
    
    this.settings = null;
    this.syncStatus = [];
    
    this.init();
  }

  async init() {
    console.log('Options page initialized');
    
    // Load current settings and status
    await this.loadData();
    
    // Render UI
    this.renderPlatformStatus();
    this.renderPlatformGrid();
    this.bindEvents();
    
    // Populate form with current settings
    this.populateForm();
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(['settings', 'syncStatus']);
      
      this.settings = result.settings || {
        autoSync: true,
        syncInterval: 30,
        enabledPlatforms: ['chatgpt', 'claude', 'gemini', 'grok'],
        maxContextLength: 10000,
        enableContextInjection: true
      };
      
      this.syncStatus = result.syncStatus || this.platforms.map(p => ({
        platform: p.id,
        isConnected: false,
        lastSync: null,
        totalConversations: 0,
        isExtracting: false,
        extractionProgress: 0
      }));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  renderPlatformStatus() {
    const container = document.getElementById('platform-status');
    
    container.innerHTML = this.platforms.map(platform => {
      const status = this.syncStatus.find(s => s.platform === platform.id);
      const isConnected = status?.isConnected || false;
      const totalConversations = status?.totalConversations || 0;
      const lastSync = status?.lastSync;
      
      return `
        <div class="setting-item">
          <div class="setting-label">
            <h3>
              <span class="status-indicator ${isConnected ? 'connected' : 'disconnected'}"></span>
              ${platform.icon} ${platform.name}
            </h3>
            <p>
              ${totalConversations} conversations
              ${lastSync ? `• Last sync: ${new Date(lastSync).toLocaleDateString()}` : '• Never synced'}
            </p>
          </div>
          <div class="setting-control">
            <button class="button" onclick="optionsPage.syncPlatform('${platform.id}')">
              Sync Now
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPlatformGrid() {
    const container = document.getElementById('platform-grid');
    
    container.innerHTML = this.platforms.map(platform => {
      const isEnabled = this.settings.enabledPlatforms.includes(platform.id);
      
      return `
        <div class="platform-card ${isEnabled ? 'enabled' : ''}" 
             onclick="optionsPage.togglePlatform('${platform.id}')">
          <div class="platform-icon">${platform.icon}</div>
          <div class="platform-name">${platform.name}</div>
        </div>
      `;
    }).join('');
  }

  populateForm() {
    document.getElementById('auto-sync').checked = this.settings.autoSync;
    document.getElementById('sync-interval').value = this.settings.syncInterval;
    document.getElementById('context-injection').checked = this.settings.enableContextInjection;
    document.getElementById('max-context').value = this.settings.maxContextLength;
  }

  bindEvents() {
    // Settings form events
    document.getElementById('auto-sync').addEventListener('change', (e) => {
      this.updateSetting('autoSync', e.target.checked);
    });
    
    document.getElementById('sync-interval').addEventListener('change', (e) => {
      this.updateSetting('syncInterval', parseInt(e.target.value));
    });
    
    document.getElementById('context-injection').addEventListener('change', (e) => {
      this.updateSetting('enableContextInjection', e.target.checked);
    });
    
    document.getElementById('max-context').addEventListener('change', (e) => {
      this.updateSetting('maxContextLength', parseInt(e.target.value));
    });
    
    // Data management events
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportData();
    });
    
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importData(e);
    });
    
    document.getElementById('clear-btn').addEventListener('click', () => {
      this.clearData();
    });
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await chrome.storage.local.set({ settings: this.settings });
    console.log(`Updated setting ${key}:`, value);
  }

  togglePlatform(platformId) {
    const index = this.settings.enabledPlatforms.indexOf(platformId);
    
    if (index >= 0) {
      this.settings.enabledPlatforms.splice(index, 1);
    } else {
      this.settings.enabledPlatforms.push(platformId);
    }
    
    this.updateSetting('enabledPlatforms', this.settings.enabledPlatforms);
    this.renderPlatformGrid();
  }

  async syncPlatform(platformId) {
    console.log(`Syncing platform: ${platformId}`);
    
    // Send message to background script to start sync
    chrome.runtime.sendMessage({
      type: 'START_EXTRACTION',
      platform: platformId
    });
    
    // Show feedback
    this.showNotification(`Starting sync for ${platformId}...`);
  }

  async exportData() {
    try {
      const result = await chrome.storage.local.get(['conversations', 'settings', 'syncStatus']);
      
      const exportData = {
        conversations: result.conversations || [],
        settings: result.settings || {},
        syncStatus: result.syncStatus || [],
        exportedAt: Date.now(),
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-chat-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      this.showNotification('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      this.showNotification('Export failed. Please try again.', 'error');
    }
  }

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.conversations || !Array.isArray(data.conversations)) {
        throw new Error('Invalid data format');
      }
      
      // Import data
      await chrome.storage.local.set({
        conversations: data.conversations,
        settings: data.settings || this.settings,
        syncStatus: data.syncStatus || this.syncStatus
      });
      
      // Reload page data
      await this.loadData();
      this.renderPlatformStatus();
      this.renderPlatformGrid();
      this.populateForm();
      
      this.showNotification('Data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      this.showNotification('Import failed. Please check the file format.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  }

  async clearData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    try {
      await chrome.storage.local.clear();
      
      // Reinitialize with default settings
      await chrome.storage.local.set({
        settings: {
          autoSync: true,
          syncInterval: 30,
          enabledPlatforms: ['chatgpt', 'claude', 'gemini', 'grok'],
          maxContextLength: 10000,
          enableContextInjection: true
        },
        conversations: [],
        syncStatus: this.platforms.map(p => ({
          platform: p.id,
          isConnected: false,
          lastSync: null,
          totalConversations: 0,
          isExtracting: false,
          extractionProgress: 0
        }))
      });
      
      // Reload page
      window.location.reload();
    } catch (error) {
      console.error('Clear data failed:', error);
      this.showNotification('Failed to clear data. Please try again.', 'error');
    }
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 0.875rem;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize options page
const optionsPage = new OptionsPage();