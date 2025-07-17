import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Globe, 
  BarChart3, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react';
import { PremiumGate } from './PremiumGate';
import { Conversation } from '../types/conversation';

interface WebDashboardProps {
  conversations: Conversation[];
}

interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  platformBreakdown: Record<string, number>;
  monthlyActivity: Array<{ month: string; count: number }>;
  averageLength: number;
  mostActiveDay: string;
}

export const WebDashboard: React.FC<WebDashboardProps> = ({ conversations }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashboardUrl, setDashboardUrl] = useState<string>('');

  const calculateStats = useCallback(() => {
    if (conversations.length === 0) {
      setStats(null);
      return;
    }

    const platformBreakdown: Record<string, number> = {};
    const monthlyActivity: Record<string, number> = {};
    let totalMessages = 0;

    conversations.forEach(conv => {
      // Platform breakdown
      platformBreakdown[conv.platform] = (platformBreakdown[conv.platform] || 0) + 1;
      
      // Monthly activity
      const month = new Date(conv.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
      
      // Total messages
      totalMessages += conv.messages.length;
    });

    const monthlyActivityArray = Object.entries(monthlyActivity)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const averageLength = Math.round(totalMessages / conversations.length);
    
    // Find most active day (simplified - just use most recent)
    const mostActiveDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    setStats({
      totalConversations: conversations.length,
      totalMessages,
      platformBreakdown,
      monthlyActivity: monthlyActivityArray,
      averageLength,
      mostActiveDay
    });
  }, [conversations]);

  const generateDashboardUrl = useCallback(() => {
    // In a real implementation, this would generate a secure, temporary URL
    // For demo purposes, we'll create a mock URL
    const baseUrl = 'https://dashboard.ai-sync.app';
    const token = btoa(JSON.stringify({ 
      userId: 'demo-user', 
      timestamp: Date.now(),
      conversations: conversations.length 
    }));
    setDashboardUrl(`${baseUrl}/view?token=${token}`);
  }, [conversations]);

  useEffect(() => {
    calculateStats();
    generateDashboardUrl();
  }, [conversations, calculateStats, generateDashboardUrl]);

  const openWebDashboard = () => {
    // In a real app, this would open the actual web dashboard
    window.open(dashboardUrl, '_blank');
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'ChatGPT': '#10a37f',
      'Claude': '#ff6b35',
      'Gemini': '#4285f4',
      'Grok': '#1da1f2'
    };
    return colors[platform] || '#6b7280';
  };

  if (!stats) {
    return (
      <PremiumGate feature="Web Dashboard">
        <Card>
          <CardContent className="text-center py-8">
            <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No conversation data available for dashboard</p>
          </CardContent>
        </Card>
      </PremiumGate>
    );
  }

  return (
    <PremiumGate feature="Web Dashboard">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Web Dashboard
            </div>
            <Button onClick={openWebDashboard} size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Full Dashboard
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{stats.totalConversations}</p>
                        <p className="text-sm text-gray-600">Total Conversations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{stats.totalMessages}</p>
                        <p className="text-sm text-gray-600">Total Messages</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">{stats.averageLength}</p>
                        <p className="text-sm text-gray-600">Avg. Messages/Chat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-lg font-bold">{stats.mostActiveDay}</p>
                        <p className="text-sm text-gray-600">Most Active Day</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="platforms" className="space-y-4">
              <div className="space-y-3">
                {Object.entries(stats.platformBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([platform, count]) => {
                    const percentage = Math.round((count / stats.totalConversations) * 100);
                    return (
                      <div key={platform} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPlatformColor(platform) }}
                            />
                            <span className="font-medium">{platform}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{count} chats</span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: getPlatformColor(platform)
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Monthly Activity
                </h4>
                {stats.monthlyActivity.map(({ month, count }) => {
                  const maxCount = Math.max(...stats.monthlyActivity.map(m => m.count));
                  const percentage = Math.round((count / maxCount) * 100);
                  return (
                    <div key={month} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{month}</span>
                        <span className="text-sm text-gray-600">{count} conversations</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Full Web Dashboard</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Access advanced analytics, conversation search, and detailed insights in the full web dashboard.
                </p>
                <Button 
                  onClick={openWebDashboard}
                  size="sm" 
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  Open Dashboard
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PremiumGate>
  );
};