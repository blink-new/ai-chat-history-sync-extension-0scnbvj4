// Content script for Grok conversation extraction

class GrokExtractor {
  constructor() {
    this.platform = 'grok';
    this.conversations = [];
    this.isExtracting = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.init();
  }

  init() {
    console.log('AI Chat History Sync: Grok content script loaded');
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Monitor for new conversations
    this.observeConversations();
    
    // Inject context if enabled
    this.injectContext();
    
    // Mark platform as connected
    this.markAsConnected();
  }

  async markAsConnected() {
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_SYNC_STATUS',
        platform: this.platform,
        updates: { isConnected: true }
      });
    } catch (error) {
      console.error('Failed to mark platform as connected:', error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'START_EXTRACTION':
        this.startFullExtraction();
        break;
      case 'AUTO_SYNC':
        this.syncNewConversations();
        break;
    }
  }

  async startFullExtraction() {
    if (this.isExtracting) return;
    
    this.isExtracting = true;
    console.log('Starting full Grok extraction...');
    
    try {
      // Navigate to main chat page if not already there
      if (!window.location.pathname.includes('/grok')) {
        window.location.href = 'https://grok.x.com/';
        return;
      }
      
      // Wait for page to load
      await this.waitForElement('[data-testid="grok-message"], .conversation-item, [role="main"]', 5000);
      
      // Get all conversation links from sidebar
      const conversationLinks = this.getConversationLinks();
      console.log(`Found ${conversationLinks.length} conversations`);
      
      for (let i = 0; i < conversationLinks.length; i++) {
        const link = conversationLinks[i];
        await this.extractConversation(link, i, conversationLinks.length);
        
        // Update progress
        const progress = Math.round(((i + 1) / conversationLinks.length) * 100);
        chrome.runtime.sendMessage({
          type: 'UPDATE_SYNC_STATUS',
          platform: this.platform,
          updates: { extractionProgress: progress }
        });
        
        // Small delay to avoid overwhelming the page
        await this.sleep(500);
      }
      
      // Mark extraction as complete
      chrome.runtime.sendMessage({
        type: 'UPDATE_SYNC_STATUS',
        platform: this.platform,
        updates: { 
          isExtracting: false, 
          lastSync: Date.now(),
          isConnected: true,
          totalConversations: conversationLinks.length
        }
      });
      
    } catch (error) {
      console.error('Grok extraction failed:', error);
      chrome.runtime.sendMessage({
        type: 'UPDATE_SYNC_STATUS',
        platform: this.platform,
        updates: { isExtracting: false }
      });
    }
    
    this.isExtracting = false;
  }

  getConversationLinks() {
    // Look for conversation links in the sidebar - Grok uses X/Twitter-like structure
    const selectors = [
      '[data-testid="conversation-item"] a',
      '.conversation-link',
      'a[href*="/grok/"]',
      '[role="listitem"] a',
      '.chat-history-item'
    ];
    
    let links = [];
    for (const selector of selectors) {
      links = Array.from(document.querySelectorAll(selector));
      if (links.length > 0) break;
    }
    
    return links.map(link => ({
      url: link.href || window.location.href,
      title: this.extractTitleFromLink(link),
      element: link
    })).filter(link => link.title && link.title !== 'New Chat' && link.title !== 'Start new conversation');
  }

  extractTitleFromLink(link) {
    // Try different selectors for conversation title
    const titleSelectors = [
      '[data-testid="conversation-title"]',
      '.conversation-title',
      '.chat-title',
      '.truncate',
      'span[dir="auto"]',
      'span',
      'div'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = link.querySelector(selector);
      if (titleElement && titleElement.textContent?.trim()) {
        return titleElement.textContent.trim();
      }
    }
    
    // Fallback to link text content
    const linkText = link.textContent?.trim();
    if (linkText && linkText.length > 0 && linkText.length < 100) {
      return linkText;
    }
    
    return 'Untitled Conversation';
  }

  async extractConversation(linkInfo, index, total) {
    try {
      // Click on the conversation link
      if (linkInfo.element && linkInfo.element.click) {
        linkInfo.element.click();
      }
      
      // Wait for conversation to load
      await this.waitForElement('[data-testid="grok-message"], .message-content, [role="group"]', 3000);
      
      // Extract conversation data
      const conversation = this.parseCurrentConversation(linkInfo);
      
      if (conversation && conversation.messages.length > 0) {
        // Send to background script for storage
        chrome.runtime.sendMessage({
          type: 'CONVERSATION_EXTRACTED',
          conversation: conversation
        });
        
        console.log(`Extracted conversation: ${conversation.title}`);
      }
      
    } catch (error) {
      console.error(`Failed to extract conversation ${index + 1}:`, error);
    }
  }

  parseCurrentConversation(linkInfo) {
    try {
      const conversationId = this.extractConversationId(linkInfo.url);
      const messages = this.extractMessages();
      
      if (messages.length === 0) return null;
      
      return {
        id: `grok-${conversationId}`,
        title: linkInfo.title,
        platform: this.platform,
        messages: messages,
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: messages[messages.length - 1]?.timestamp || Date.now(),
        url: linkInfo.url
      };
    } catch (error) {
      console.error('Failed to parse conversation:', error);
      return null;
    }
  }

  extractMessages() {
    const messages = [];
    
    // Try multiple selectors for Grok messages
    const messageSelectors = [
      '[data-testid="grok-message"]',
      '[data-testid="user-message"]',
      '.message-content',
      '.conversation-turn',
      '[role="group"]',
      '.chat-message'
    ];
    
    let messageElements = [];
    for (const selector of messageSelectors) {
      messageElements = document.querySelectorAll(selector);
      if (messageElements.length > 0) break;
    }
    
    // If no specific message elements found, try to find conversation content
    if (messageElements.length === 0) {
      messageElements = document.querySelectorAll('[role="main"] > div > div, .conversation-container > div');
    }
    
    messageElements.forEach((element, index) => {
      try {
        // Determine message role based on various indicators
        let role = 'user';
        
        // Check for Grok/assistant-specific indicators
        if (element.getAttribute('data-testid') === 'grok-message' ||
            element.classList.contains('grok-message') ||
            element.classList.contains('assistant-message') ||
            element.querySelector('[data-testid="grok-message"]') ||
            element.textContent.includes('Grok:') ||
            element.textContent.includes('🤖')) {
          role = 'assistant';
        }
        
        // Check for user-specific indicators
        if (element.getAttribute('data-testid') === 'user-message' ||
            element.classList.contains('user-message') ||
            element.querySelector('[data-testid="user-message"]')) {
          role = 'user';
        }
        
        // Extract message content
        const contentSelectors = [
          '[data-testid="message-text"]',
          '.message-text',
          '.tweet-text',
          '[dir="auto"]',
          'p',
          'div',
          'span'
        ];
        
        let content = '';
        for (const selector of contentSelectors) {
          const contentElement = element.querySelector(selector);
          if (contentElement && contentElement.textContent?.trim()) {
            content = contentElement.textContent.trim();
            break;
          }
        }
        
        if (!content) {
          content = element.textContent?.trim() || '';
        }
        
        // Clean up content - remove common UI elements
        content = content.replace(/^(Grok:|You:)\s*/, '');
        content = content.replace(/\s*(Show more|Show less|Copy|Share)\s*$/, '');
        
        if (content && content.length > 10 && !this.isUIElement(content)) {
          messages.push({
            id: `grok-msg-${Date.now()}-${index}`,
            role: role,
            content: content,
            timestamp: Date.now() - (messageElements.length - index) * 1000, // Approximate timestamps
            platform: this.platform
          });
        }
      } catch (error) {
        console.error('Failed to extract message:', error);
      }
    });
    
    return messages;
  }

  isUIElement(content) {
    const uiPatterns = [
      /^(New chat|Start new conversation|Settings|Profile)$/i,
      /^(Loading|Thinking|Typing)\.\.\.$/i,
      /^\d+\s*(like|retweet|reply|share)s?$/i,
      /^(Show more|Show less|Copy|Share|Delete)$/i
    ];
    
    return uiPatterns.some(pattern => pattern.test(content));
  }

  extractConversationId(url) {
    const match = url.match(/\/grok\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : `unknown-${Date.now()}`;
  }

  async syncNewConversations() {
    console.log('Syncing new Grok conversations...');
    
    const currentConversations = this.getConversationLinks();
    
    // For simplicity, just sync the first few conversations
    for (let i = 0; i < Math.min(3, currentConversations.length); i++) {
      await this.extractConversation(currentConversations[i], i, currentConversations.length);
    }
  }

  observeConversations() {
    // Monitor for new messages in the current conversation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // Check if new message was added
          const newMessages = Array.from(mutation.addedNodes).filter(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.querySelector && 
             (node.querySelector('[data-testid="grok-message"]') ||
              node.querySelector('[data-testid="user-message"]') ||
              node.classList.contains('message-content') ||
              node.classList.contains('conversation-turn')))
          );
          
          if (newMessages.length > 0) {
            // New message detected, sync current conversation
            setTimeout(() => this.syncCurrentConversation(), 2000);
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async syncCurrentConversation() {
    try {
      const currentUrl = window.location.href;
      
      const conversation = this.parseCurrentConversation({
        url: currentUrl,
        title: document.title || 'Current Conversation'
      });
      
      if (conversation) {
        chrome.runtime.sendMessage({
          type: 'CONVERSATION_EXTRACTED',
          conversation: conversation
        });
      }
    } catch (error) {
      console.error('Failed to sync current conversation:', error);
    }
  }

  async injectContext() {
    // Request context from background script
    chrome.runtime.sendMessage({
      type: 'REQUEST_CONTEXT',
      platform: this.platform
    }, (response) => {
      if (response && response.context && response.context.trim()) {
        this.insertContextIntoChat(response.context);
      }
    });
  }

  insertContextIntoChat(context) {
    // Find the chat input - Grok uses X/Twitter-like input structure
    const inputSelectors = [
      '[data-testid="grok-input"]',
      '[data-testid="tweet-text-input"]',
      '.chat-input',
      'textarea[placeholder*="Ask Grok"]',
      'textarea[placeholder*="What\'s happening"]',
      'textarea',
      '[contenteditable="true"]'
    ];
    
    let inputElement = null;
    for (const selector of inputSelectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) break;
    }
    
    if (inputElement && !inputElement.textContent.includes('Previous conversation context')) {
      const contextMessage = `${context}\n\n---\n\nBased on the above context from my previous conversations with other AI assistants, please help me with: `;
      
      if (inputElement.tagName === 'TEXTAREA') {
        inputElement.value = contextMessage;
        const event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);
      } else {
        // For contenteditable
        inputElement.textContent = contextMessage;
        
        // Trigger input events
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        inputElement.dispatchEvent(changeEvent);
      }
      
      console.log('Context injected into Grok');
    }
  }

  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize Grok extractor
new GrokExtractor();