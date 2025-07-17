export interface PremiumFeatures {
  advancedFiltering: boolean;
  conversationTagging: boolean;
  exportFormats: boolean;
  webDashboard: boolean;
}

export interface UserSubscription {
  isPremium: boolean;
  hasInviteCode: boolean;
  inviteCode?: string;
  features: PremiumFeatures;
  expiresAt?: Date;
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  premium: boolean;
}

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  platforms?: string[];
  tags?: string[];
  searchQuery?: string;
  messageCount?: {
    min: number;
    max: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
}