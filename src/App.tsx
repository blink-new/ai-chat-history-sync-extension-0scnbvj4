import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Checkbox } from './components/ui/checkbox';
import { toast } from './hooks/use-toast';
import { 
  MessageSquare, 
  Settings, 
  Download, 
  Upload, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Database,
  Crown,
  Filter,
  Tag,
  Globe,
  BarChart3,
  Zap,
  Wifi,
  WifiOff,
  Users
} from 'lucide-react';
import { ExtensionStorage } from './lib/storage';
import { Conversation, SyncStatus, ExtensionSettings } from './types/conversation';
import { FilterOptions } from './types/premium';
import { blink } from './lib/blink';
import { SetupWizard } from './components/SetupWizard';
import { AdvancedFilters } from './components/AdvancedFilters';
import { ConversationTagger } from './components/ConversationTagger';
import { ConversationViewer } from './components/ConversationViewer';
import { ExportManager } from './components/ExportManager';
import { WebDashboard } from './components/WebDashboard';
import { TeamManagement } from './components/TeamManagement';
import { SyncIndicator } from './components/SyncIndicator';

import { UserProfile } from './components/UserProfile';
import { PremiumManager } from './lib/premium';
import { Toaster } from './components/ui/toaster';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isPremium, setIsPremium] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize services with proper error handling
  const storage = ExtensionStorage.getInstance();
  const premiumManager = PremiumManager.getInstance();

  const loadData = useCallback(async () => {
    try {
      const [convs, status, setts] = await Promise.all([
        storage.getConversations(),
        storage.getSyncStatus(),
        storage.getSettings()
      ]);
      
      // Add sample data if no conversations exist (for demo purposes)
      if (convs.length === 0) {
        const sampleConversations = [
          {
            id: 'conv_1',
            title: 'Building a React App',
            platform: 'chatgpt',
            createdAt: Date.now() - 86400000, // 1 day ago
            updatedAt: Date.now() - 86400000,
            messages: [
              { id: 'msg_1', role: 'user', content: 'How do I create a React app?', timestamp: Date.now() - 86400000 },
              { id: 'msg_2', role: 'assistant', content: 'You can create a React app using Create React App...', timestamp: Date.now() - 86400000 }
            ],
            tags: ['react', 'development']
          },
          {
            id: 'conv_2',
            title: 'TypeScript Best Practices',
            platform: 'claude',
            createdAt: Date.now() - 172800000, // 2 days ago
            updatedAt: Date.now() - 172800000,
            messages: [
              { id: 'msg_3', role: 'user', content: 'What are TypeScript best practices?', timestamp: Date.now() - 172800000 },
              { id: 'msg_4', role: 'assistant', content: 'Here are some TypeScript best practices...', timestamp: Date.now() - 172800000 }
            ],
            tags: ['typescript', 'best-practices']
          },
          {
            id: 'conv_3',
            title: 'AI Model Comparison',
            platform: 'gemini',
            createdAt: Date.now() - 259200000, // 3 days ago
            updatedAt: Date.now() - 259200000,
            messages: [
              { id: 'msg_5', role: 'user', content: 'Compare different AI models', timestamp: Date.now() - 259200000 },
              { id: 'msg_6', role: 'assistant', content: 'Here\'s a comparison of different AI models...', timestamp: Date.now() - 259200000 }
            ],
            tags: ['ai', 'comparison']
          }
        ];
        await storage.saveConversations(sampleConversations);
        setConversations(sampleConversations);
      } else {
        setConversations(convs);
      }
      
      setSyncStatus(status);
      setSettings(setts);
      
      // Check if this is the first time using the extension
      const isFirstTime = await storage.isFirstTime();
      setShowSetupWizard(isFirstTime);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  const applyFilters = useCallback(() => {
    let filtered = [...conversations];

    // Basic search
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Advanced filters (premium)
    if (isPremium && Object.keys(filters).length > 0) {
      if (filters.dateRange?.start) {
        filtered = filtered.filter(conv => new Date(conv.createdAt) >= filters.dateRange!.start);
      }
      if (filters.dateRange?.end) {
        filtered = filtered.filter(conv => new Date(conv.createdAt) <= filters.dateRange!.end);
      }
      if (filters.platforms?.length) {
        filtered = filtered.filter(conv => filters.platforms!.includes(conv.platform));
      }
      if (filters.tags?.length) {
        filtered = filtered.filter(conv => 
          conv.tags?.some(tag => filters.tags!.includes(tag))
        );
      }
      if (filters.messageCount?.min) {
        filtered = filtered.filter(conv => conv.messages.length >= filters.messageCount!.min);
      }
      if (filters.messageCount?.max) {
        filtered = filtered.filter(conv => conv.messages.length <= filters.messageCount!.max);
      }
    }

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, filters, isPremium]);

  useEffect(() => {
    // Monitor authentication state
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setIsAuthenticated(state.isAuthenticated);
      setAuthLoading(state.isLoading);
      
      // Only load data when authenticated
      if (state.isAuthenticated && !state.isLoading) {
        loadData();
      }
    });

    try {
      setIsPremium(premiumManager.isPremiumUser());
    } catch (error) {
      console.warn('Premium manager initialization error:', error);
      setIsPremium(false);
    }

    return unsubscribe;
  }, [loadData, premiumManager]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSync = async (platform: string) => {
    try {
      toast({
        title: "Sync Started",
        description: `Starting conversation extraction from ${getPlatformName(platform)}...`,
      });

      await storage.updateSyncStatus(platform, { isExtracting: true, extractionProgress: 0 });
      setSyncStatus(await storage.getSyncStatus());
      
      // Check if we're in extension environment
      if (storage.isExtensionEnvironment()) {
        // Send message to background script to start extraction
        try {
          chrome.runtime.sendMessage({
            type: 'START_EXTRACTION',
            platform: platform
          });
          
          // Monitor progress for up to 30 seconds
          const progressInterval = setInterval(async () => {
            const currentStatus = await storage.getSyncStatus();
            const platformStatus = currentStatus.find(s => s.platform === platform);
            
            if (platformStatus && !platformStatus.isExtracting) {
              clearInterval(progressInterval);
              setSyncStatus(currentStatus);
              
              toast({
                title: "Sync Complete",
                description: `Successfully extracted ${platformStatus.totalConversations} conversations from ${getPlatformName(platform)}`,
              });
            } else {
              setSyncStatus(currentStatus);
            }
          }, 1000);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            clearInterval(progressInterval);
          }, 30000);
          
        } catch (chromeError) {
          console.warn('Chrome extension API not available, falling back to demo mode');
          // Fall back to demo simulation
          await simulateExtraction(platform);
        }
      } else {
        // Demo mode simulation
        await simulateExtraction(platform);
      }
      
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: `Failed to sync conversations from ${getPlatformName(platform)}. Please try again.`,
        variant: "destructive",
      });
      
      await storage.updateSyncStatus(platform, { isExtracting: false });
      setSyncStatus(await storage.getSyncStatus());
    }
  };

  const simulateExtraction = async (platform: string) => {
    // Simulate extraction progress with more realistic timing and sample data
    const steps = [0, 15, 35, 50, 70, 85, 95, 100];
    for (const progress of steps) {
      await new Promise(resolve => setTimeout(resolve, progress === 0 ? 100 : 400));
      await storage.updateSyncStatus(platform, { extractionProgress: progress });
      setSyncStatus(await storage.getSyncStatus());
    }
    
    const newConversations = Math.floor(Math.random() * 20) + 5;
    
    // Generate sample conversations for the platform
    const sampleConversations: Conversation[] = [];
    for (let i = 0; i < Math.min(newConversations, 5); i++) {
      const topics = [
        'Code Review Best Practices',
        'Machine Learning Fundamentals',
        'React Performance Optimization',
        'Database Design Patterns',
        'API Security Guidelines',
        'Cloud Architecture Decisions',
        'Testing Strategies',
        'DevOps Automation',
        'UI/UX Design Principles',
        'Data Analysis Techniques'
      ];
      
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const conversation: Conversation = {
        id: `${platform}_conv_${Date.now()}_${i}`,
        title: randomTopic,
        platform: platform,
        createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last week
        updatedAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000, // Random time in last day
        messages: [
          {
            id: `msg_${Date.now()}_${i}_1`,
            role: 'user',
            content: `Can you help me understand ${randomTopic.toLowerCase()}?`,
            timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000
          },
          {
            id: `msg_${Date.now()}_${i}_2`,
            role: 'assistant',
            content: `I'd be happy to help you with ${randomTopic.toLowerCase()}. Let me break this down into key concepts...`,
            timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000
          }
        ],
        tags: [platform, 'development', 'learning']
      };
      sampleConversations.push(conversation);
    }
    
    // Add the new conversations to storage
    const existingConversations = await storage.getConversations();
    const updatedConversations = [...existingConversations, ...sampleConversations];
    await storage.saveConversations(updatedConversations);
    setConversations(updatedConversations);
    
    await storage.updateSyncStatus(platform, { 
      isExtracting: false, 
      lastSync: Date.now(),
      isConnected: true,
      totalConversations: newConversations
    });
    
    setSyncStatus(await storage.getSyncStatus());
    
    toast({
      title: "Sync Complete",
      description: `Successfully extracted ${newConversations} conversations from ${getPlatformName(platform)}`,
    });
  };

  const handleSettingsChange = async (key: keyof ExtensionSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storage.saveSettings(newSettings);
  };

  const handleConversationTagsChange = (conversationId: string, tags: string[]) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, tags }
          : conv
      )
    );
  };

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const selectAllConversations = () => {
    setSelectedConversations(
      selectedConversations.length === filteredConversations.length
        ? []
        : filteredConversations.map(conv => conv.id)
    );
  };

  const exportData = async () => {
    try {
      const data = await storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-chat-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      await storage.importData(text);
      await loadData();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      chatgpt: '🤖',
      claude: '🧠',
      gemini: '💎',
      grok: '🚀'
    };
    return icons[platform as keyof typeof icons] || '💬';
  };

  const getPlatformName = (platform: string) => {
    const names = {
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      grok: 'Grok'
    };
    return names[platform as keyof typeof names] || platform;
  };

  if (authLoading || isLoading) {
    return (
      <div className="extension-popup flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || showSetupWizard) {
    return (
      <SetupWizard 
        onComplete={() => {
          setShowSetupWizard(false);
          storage.markSetupComplete();
        }} 
      />
    );
  }

  return (
    <div className="extension-popup">
        <div className="p-4 border-b gradient-header">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <h1 className="font-semibold text-lg">AI Chat Sync</h1>
              {isPremium && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <UserProfile compact />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-balance">
            Sync conversations across AI platforms for persistent memory
          </p>
        </div>

      <Tabs defaultValue="dashboard" className="h-full">
        <TabsList className="grid w-full grid-cols-6 mx-4 mt-2">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          <TabsTrigger value="premium" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="p-4 space-y-3">
          <SyncIndicator
            syncStatus={syncStatus}
            onSync={handleSync}
            isAutoSyncEnabled={settings?.autoSync || false}
            onToggleAutoSync={() => handleSettingsChange('autoSync', !settings?.autoSync)}
          />
        </TabsContent>

        <TabsContent value="history" className="p-4 space-y-3">
          <ConversationViewer
            conversations={conversations}
            onConversationSelect={(conversation) => {
              // Handle conversation selection if needed
              console.log('Selected conversation:', conversation);
            }}
          />
        </TabsContent>

        <TabsContent value="premium" className="p-4 space-y-4">
          <ScrollArea className="h-64">
            <div className="space-y-4">
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Crown className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-purple-900">
                    {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
                  </CardTitle>
                  <CardDescription>
                    {isPremium 
                      ? 'You have access to all premium features'
                      : 'Unlock advanced features for power users'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Advanced Filtering & Search</span>
                      {isPremium && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Conversation Tagging</span>
                      {isPremium && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Export to PDF, Markdown, etc.</span>
                      {isPremium && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Web Dashboard</span>
                      {isPremium && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                  
                  {!isPremium && (
                    <div className="space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-3 border rounded-lg">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 mb-2">
                            $9.99/month
                          </Badge>
                          <p className="text-xs font-medium mb-1">Pro</p>
                          <p className="text-xs text-gray-600 mb-2">
                            Individual power user
                          </p>
                          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                            <Crown className="h-3 w-3 mr-1" />
                            Upgrade
                          </Button>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 mb-2">
                            $29.99/month
                          </Badge>
                          <p className="text-xs font-medium mb-1">Team</p>
                          <p className="text-xs text-gray-600 mb-2">
                            Team collaboration
                          </p>
                          <Button size="sm" variant="outline" className="w-full">
                            <Users className="h-3 w-3 mr-1" />
                            Team Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="teams" className="p-4 space-y-3">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="analytics" className="p-4 space-y-3">
          <WebDashboard conversations={conversations} />
        </TabsContent>

        <TabsContent value="settings" className="p-4 space-y-4">
          <ScrollArea className="h-64">
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Sync Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-sync" className="text-xs">Auto Sync</Label>
                  <Switch
                    id="auto-sync"
                    checked={settings?.autoSync || false}
                    onCheckedChange={(checked) => handleSettingsChange('autoSync', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="context-injection" className="text-xs">Context Injection</Label>
                  <Switch
                    id="context-injection"
                    checked={settings?.enableContextInjection || false}
                    onCheckedChange={(checked) => handleSettingsChange('enableContextInjection', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Data Management</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={exportData} className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  
                  <div className="relative">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Import
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">About</h3>
                <p className="text-xs text-muted-foreground">
                  AI Chat History Sync v1.0.0
                </p>
                <p className="text-xs text-muted-foreground">
                  Synchronize conversations across ChatGPT, Claude, Gemini, and Grok
                </p>
                <div className="mt-3 p-2 bg-gray-50 rounded border">
                  <p className="text-xs font-medium text-gray-700">Environment</p>
                  <p className="text-xs text-gray-600">
                    {storage.isExtensionEnvironment() ? 'Chrome Extension' : 'Web Demo'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Storage: {storage.getEnvironmentInfo().storageType}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
}

export default App;