// ChatGPT Content Script - Enhanced Version
(function() {
  'use strict';

  console.log('🤖 ChatGPT Content Script Loaded');

  let isExtracting = false;
  let extractionProgress = 0;
  let totalConversations = 0;

  // Enhanced selectors for ChatGPT
  const SELECTORS = {
    conversationList: '[data-testid="conversation-turn"], .conversation-turn, .group',
    conversationTitle: 'h1, .text-2xl, [data-testid="conversation-title"]',
    messageContainer: '[data-message-author-role], .message, [data-testid="conversation-turn"]',
    userMessage: '[data-message-author-role="user"], .user-message',
    assistantMessage: '[data-message-author-role="assistant"], .assistant-message',
    messageContent: '.prose, .markdown, .message-content, p',
    conversationItem: 'li[data-testid="conversation-item"], .conversation-item, nav li',
    conversationLink: 'a[href*="/c/"], a[href*="/chat/"]',
    sidebar: 'nav, .sidebar, [data-testid="sidebar"]',
    newChatButton: '[data-testid="new-chat-button"], button[aria-label*="New chat"]'
  };

  // Enhanced conversation extraction
  function extractConversations() {
    console.log('🔍 Starting ChatGPT conversation extraction...');
    
    const conversations = [];
    const conversationItems = document.querySelectorAll(SELECTORS.conversationItem);
    
    console.log(`📊 Found ${conversationItems.length} conversation items`);
    
    conversationItems.forEach((item, index) => {
      try {
        const link = item.querySelector(SELECTORS.conversationLink);
        if (!link) return;

        const href = link.getAttribute('href');
        const conversationId = extractConversationId(href);
        if (!conversationId) return;

        const title = extractTitle(item) || `Conversation ${index + 1}`;
        const timestamp = extractTimestamp(item) || Date.now();

        // Extract messages if we're on the conversation page
        const messages = extractMessagesFromCurrentPage();

        const conversation = {
          id: `chatgpt_${conversationId}`,
          title: title.trim(),
          platform: 'chatgpt',
          url: `https://chat.openai.com${href}`,
          createdAt: timestamp,
          updatedAt: timestamp,
          messages: messages,
          tags: extractTags(title),
          metadata: {
            conversationId,
            source: 'chatgpt-extension',
            extractedAt: Date.now()
          }
        };

        conversations.push(conversation);
        console.log(`✅ Extracted conversation: ${title}`);
      } catch (error) {
        console.error('❌ Error extracting conversation:', error);
      }
    });

    totalConversations = conversations.length;
    console.log(`🎉 Successfully extracted ${totalConversations} conversations from ChatGPT`);
    
    return conversations;
  }

  function extractConversationId(href) {
    if (!href) return null;
    
    // Match various ChatGPT URL patterns
    const patterns = [
      /\/c\/([a-f0-9-]+)/,
      /\/chat\/([a-f0-9-]+)/,
      /conversation\/([a-f0-9-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = href.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  function extractTitle(item) {
    const titleSelectors = [
      '.conversation-title',
      '.text-sm',
      'span',
      'div[title]',
      '[data-testid="conversation-title"]'
    ];
    
    for (const selector of titleSelectors) {
      const element = item.querySelector(selector);
      if (element) {
        const title = element.textContent || element.getAttribute('title');
        if (title && title.trim().length > 0) {
          return title.trim();
        }
      }
    }
    
    return null;
  }

  function extractTimestamp(item) {
    // Try to extract timestamp from various sources
    const timeElement = item.querySelector('time, .timestamp, [data-timestamp]');
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime') || 
                     timeElement.getAttribute('data-timestamp') ||
                     timeElement.textContent;
      
      if (datetime) {
        const parsed = new Date(datetime);
        if (!isNaN(parsed.getTime())) {
          return parsed.getTime();
        }
      }
    }
    
    // Fallback to current time
    return Date.now();
  }

  function extractMessagesFromCurrentPage() {
    const messages = [];
    const messageElements = document.querySelectorAll(SELECTORS.messageContainer);
    
    messageElements.forEach((element, index) => {
      try {
        const role = determineMessageRole(element);
        const content = extractMessageContent(element);
        
        if (content && content.trim().length > 0) {
          messages.push({
            id: `msg_${Date.now()}_${index}`,
            role: role,
            content: content.trim(),
            timestamp: Date.now() - (messageElements.length - index) * 1000 // Approximate timing
          });
        }
      } catch (error) {
        console.error('❌ Error extracting message:', error);
      }
    });
    
    return messages;
  }

  function determineMessageRole(element) {
    // Check for role attributes
    const role = element.getAttribute('data-message-author-role');
    if (role) return role;
    
    // Check for class names
    if (element.classList.contains('user-message') || 
        element.querySelector('[data-message-author-role="user"]')) {
      return 'user';
    }
    
    if (element.classList.contains('assistant-message') || 
        element.querySelector('[data-message-author-role="assistant"]')) {
      return 'assistant';
    }
    
    // Fallback logic based on position or content
    const userIndicators = ['You:', 'User:', 'Me:'];
    const assistantIndicators = ['ChatGPT:', 'Assistant:', 'AI:'];
    
    const text = element.textContent || '';
    
    for (const indicator of userIndicators) {
      if (text.startsWith(indicator)) return 'user';
    }
    
    for (const indicator of assistantIndicators) {
      if (text.startsWith(indicator)) return 'assistant';
    }
    
    // Default to user if uncertain
    return 'user';
  }

  function extractMessageContent(element) {
    // Try different content selectors
    const contentSelectors = [
      '.prose',
      '.markdown',
      '.message-content',
      'p',
      '.text-base',
      'div[data-message-content]'
    ];
    
    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        return contentElement.textContent || contentElement.innerText;
      }
    }
    
    // Fallback to element text content
    return element.textContent || element.innerText;
  }

  function extractTags(title) {
    const tags = [];
    
    // Extract common programming languages
    const programmingLanguages = ['javascript', 'python', 'java', 'react', 'node', 'css', 'html', 'typescript', 'sql'];
    const lowerTitle = title.toLowerCase();
    
    programmingLanguages.forEach(lang => {
      if (lowerTitle.includes(lang)) {
        tags.push(lang);
      }
    });
    
    // Extract common topics
    const topics = ['help', 'tutorial', 'debug', 'error', 'code', 'api', 'database', 'design'];
    topics.forEach(topic => {
      if (lowerTitle.includes(topic)) {
        tags.push(topic);
      }
    });
    
    return tags;
  }

  // Enhanced progress tracking
  function updateProgress(current, total) {
    extractionProgress = Math.round((current / total) * 100);
    
    // Send progress update to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_PROGRESS',
        platform: 'chatgpt',
        progress: extractionProgress,
        current: current,
        total: total
      });
    }
  }

  // Listen for extraction requests
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 ChatGPT content script received message:', request);
      
      if (request.type === 'EXTRACT_CONVERSATIONS') {
        if (isExtracting) {
          sendResponse({ success: false, error: 'Extraction already in progress' });
          return;
        }
        
        isExtracting = true;
        extractionProgress = 0;
        
        try {
          // Simulate progressive extraction
          updateProgress(0, 100);
          
          setTimeout(() => {
            updateProgress(25, 100);
            
            setTimeout(() => {
              updateProgress(50, 100);
              
              setTimeout(() => {
                updateProgress(75, 100);
                
                setTimeout(() => {
                  const conversations = extractConversations();
                  updateProgress(100, 100);
                  
                  isExtracting = false;
                  
                  sendResponse({
                    success: true,
                    conversations: conversations,
                    totalCount: totalConversations,
                    platform: 'chatgpt'
                  });
                }, 500);
              }, 500);
            }, 500);
          }, 500);
          
        } catch (error) {
          console.error('❌ ChatGPT extraction failed:', error);
          isExtracting = false;
          sendResponse({
            success: false,
            error: error.message,
            platform: 'chatgpt'
          });
        }
        
        return true; // Keep message channel open for async response
      }
      
      if (request.type === 'GET_STATUS') {
        sendResponse({
          isExtracting: isExtracting,
          progress: extractionProgress,
          totalConversations: totalConversations,
          platform: 'chatgpt',
          connected: true
        });
      }
    });
  }

  // Auto-detect and report connection status
  function reportConnectionStatus() {
    const isConnected = window.location.hostname === 'chat.openai.com';
    
    if (isConnected && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'PLATFORM_CONNECTED',
        platform: 'chatgpt',
        url: window.location.href,
        timestamp: Date.now()
      });
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reportConnectionStatus);
  } else {
    reportConnectionStatus();
  }

  // Monitor for navigation changes (SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(reportConnectionStatus, 1000); // Delay to allow page to load
    }
  }).observe(document, { subtree: true, childList: true });

  console.log('✅ ChatGPT Content Script Initialized');
})();