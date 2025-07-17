import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Clock,
  Database,
  Zap,
  Activity,
  TrendingUp,
  Pause,
  Play
} from 'lucide-react';
import { SyncStatus } from '../types/conversation';
import { toast } from '../hooks/use-toast';

interface SyncIndicatorProps {
  syncStatus: SyncStatus[];
  onSync: (platform: string) => void;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  syncStatus,
  onSync,
  isAutoSyncEnabled = true,
  onToggleAutoSync
}) => {
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [syncAnimation, setSyncAnimation] = useState<string>('');

  const platforms = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', color: 'bg-green-500' },
    { id: 'claude', name: 'Claude', icon: '🧠', color: 'bg-orange-500' },
    { id: 'gemini', name: 'Gemini', icon: '💎', color: 'bg-blue-500' },
    { id: 'grok', name: 'Grok', icon: '🚀', color: 'bg-purple-500' }
  ];

  useEffect(() => {
    // Update last sync time when any platform completes sync
    const hasRecentSync = syncStatus.some(status => 
      status.lastSync && status.lastSync > lastSyncTime - 5000
    );
    
    if (hasRecentSync) {
      setLastSyncTime(Date.now());
      setSyncAnimation('animate-pulse');
      setTimeout(() => setSyncAnimation(''), 2000);
    }
  }, [syncStatus, lastSyncTime]);

  const getTotalConversations = () => {
    return syncStatus.reduce((total, status) => total + status.totalConversations, 0);
  };

  const getActiveSyncs = () => {
    return syncStatus.filter(status => status.isExtracting).length;
  };

  const getConnectedPlatforms = () => {
    return syncStatus.filter(status => status.isConnected).length;
  };

  const getOverallSyncProgress = () => {
    const extractingStatuses = syncStatus.filter(status => status.isExtracting);
    if (extractingStatuses.length === 0) return 0;
    
    const totalProgress = extractingStatuses.reduce((sum, status) => sum + status.extractionProgress, 0);
    return Math.round(totalProgress / extractingStatuses.length);
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSyncAll = () => {
    const connectedPlatforms = syncStatus.filter(status => status.isConnected && !status.isExtracting);
    
    if (connectedPlatforms.length === 0) {
      toast({
        title: "No platforms available",
        description: "Please connect to at least one platform first",
        variant: "destructive",
      });
      return;
    }

    connectedPlatforms.forEach(status => {
      onSync(status.platform);
    });

    toast({
      title: "Sync started",
      description: `Starting sync for ${connectedPlatforms.length} platforms`,
    });
  };

  const activeSyncs = getActiveSyncs();
  const connectedPlatforms = getConnectedPlatforms();
  const totalConversations = getTotalConversations();
  const overallProgress = getOverallSyncProgress();

  return (
    <div className="space-y-3">
      {/* Overall Status Card */}
      <Card className={`transition-all duration-300 ${syncAnimation}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                activeSyncs > 0 ? 'bg-blue-500 animate-pulse' : 
                connectedPlatforms > 0 ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium">
                {activeSyncs > 0 ? 'Syncing...' : 
                 connectedPlatforms > 0 ? 'Connected' : 'Disconnected'}
              </span>
              {isAutoSyncEnabled && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Auto
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onToggleAutoSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleAutoSync}
                  className="h-6 px-2"
                >
                  {isAutoSyncEnabled ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncAll}
                disabled={activeSyncs > 0 || connectedPlatforms === 0}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${activeSyncs > 0 ? 'animate-spin' : ''}`} />
                Sync All
              </Button>
            </div>
          </div>

          {/* Progress Bar for Active Syncs */}
          {activeSyncs > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Syncing {activeSyncs} platform{activeSyncs > 1 ? 's' : ''}...</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-1" />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Database className="h-3 w-3 text-muted-foreground" />
                <span className="text-lg font-semibold">{totalConversations}</span>
              </div>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Wifi className="h-3 w-3 text-muted-foreground" />
                <span className="text-lg font-semibold">{connectedPlatforms}</span>
              </div>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-lg font-semibold">{activeSyncs}</span>
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Status Grid */}
      <div className="grid grid-cols-2 gap-2">
        {syncStatus.map((status) => {
          const platform = platforms.find(p => p.id === status.platform);
          if (!platform) return null;

          return (
            <Card key={status.platform} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="text-sm">{platform.icon}</span>
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        status.isConnected ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <span className="text-xs font-medium">{platform.name}</span>
                  </div>
                  
                  {status.isConnected ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-gray-400" />
                  )}
                </div>

                {status.isExtracting ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Extracting...</span>
                      <span className="font-medium">{status.extractionProgress}%</span>
                    </div>
                    <Progress value={status.extractionProgress} className="h-1" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {status.totalConversations} conversations
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSync(status.lastSync)}</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-6 text-xs"
                      onClick={() => onSync(status.platform)}
                      disabled={status.isExtracting || !status.isConnected}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Activity */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Last activity: {formatLastSync(lastSyncTime)}</span>
        </div>
      </div>
    </div>
  );
};