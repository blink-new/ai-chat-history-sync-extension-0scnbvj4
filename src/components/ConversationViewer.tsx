import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Search, 
  MessageSquare, 
  Calendar,
  Filter,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Tag,
  Clock,
  Eye,
  User,
  Bot
} from 'lucide-react';
import { Conversation } from '../types/conversation';
import { PremiumGate } from './PremiumGate';
import { toast } from '../hooks/use-toast';

interface ConversationViewerProps {
  conversations: Conversation[];
  onConversationSelect?: (conversation: Conversation) => void;
}

export const ConversationViewer: React.FC<ConversationViewerProps> = ({
  conversations,
  onConversationSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const platforms = [
    { id: 'all', name: 'All Platforms', icon: '🌐' },
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
    { id: 'claude', name: 'Claude', icon: '🧠' },
    { id: 'gemini', name: 'Gemini', icon: '💎' },
    { id: 'grok', name: 'Grok', icon: '🚀' }
  ];

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(conv => conv.platform === selectedPlatform);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some(msg => 
          msg.content.toLowerCase().includes(query)
        )
      );
    }

    // Sort by most recent
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations, selectedPlatform, searchQuery]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.id === platform);
    return platformData?.icon || '💬';
  };

  const getPlatformName = (platform: string) => {
    const platformData = platforms.find(p => p.id === platform);
    return platformData?.name || platform;
  };

  const copyConversation = (conversation: Conversation) => {
    const text = conversation.messages
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Conversation has been copied to your clipboard",
    });
  };

  const viewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    onConversationSelect?.(conversation);
  };

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-500 text-sm">
            Start syncing your AI conversations to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>
        
        <div className="flex gap-1 overflow-x-auto pb-1">
          {platforms.map((platform) => (
            <Button
              key={platform.id}
              variant={selectedPlatform === platform.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPlatform(platform.id)}
              className="h-6 px-2 text-xs whitespace-nowrap"
            >
              <span className="mr-1">{platform.icon}</span>
              {platform.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          {selectedPlatform !== 'all' && ` from ${getPlatformName(selectedPlatform)}`}
        </span>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="h-4 px-1 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className="conversation-item transition-all duration-200 hover:shadow-sm"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm">{getPlatformIcon(conversation.platform)}</span>
                    <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewConversation(conversation)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span>{getPlatformIcon(conversation.platform)}</span>
                            {conversation.title}
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] pr-4">
                          <div className="space-y-4">
                            {conversation.messages.map((message, index) => (
                              <div key={message.id} className="space-y-2">
                                <div className={`flex items-start gap-3 ${
                                  message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}>
                                  {message.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Bot className="h-3 w-3 text-primary" />
                                    </div>
                                  )}
                                  <div className={`max-w-[80%] rounded-lg p-3 ${
                                    message.role === 'user' 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted'
                                  }`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-xs mt-2 ${
                                      message.role === 'user' 
                                        ? 'text-primary-foreground/70' 
                                        : 'text-muted-foreground'
                                    }`}>
                                      {formatDate(message.timestamp)}
                                    </p>
                                  </div>
                                  {message.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                      <User className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyConversation(conversation);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {conversation.messages[0]?.content || 'No messages'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {conversation.messages.length}
                      </Badge>
                      
                      {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {conversation.tags.slice(0, 2).join(', ')}
                            {conversation.tags.length > 2 && '...'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(conversation.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredConversations.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-6">
            <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              No conversations found for "{searchQuery}"
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};