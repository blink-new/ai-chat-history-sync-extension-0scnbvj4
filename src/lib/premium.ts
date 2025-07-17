import { UserSubscription, PremiumFeatures } from '../types/premium';

const VALID_INVITE_CODES = [
  'FAMILY2025',
  'FRIENDS2025',
  'BETA2025'
];

export class PremiumManager {
  private static instance: PremiumManager;
  private subscription: UserSubscription;

  private constructor() {
    this.subscription = this.loadSubscription();
    this.initializeCloudSync();
  }

  private async initializeCloudSync() {
    // Cloud sync initialization will be handled separately to avoid circular imports
    // This prevents the "Cannot access 'Z' before initialization" error
  }

  static getInstance(): PremiumManager {
    if (!PremiumManager.instance) {
      PremiumManager.instance = new PremiumManager();
    }
    return PremiumManager.instance;
  }

  private loadSubscription(): UserSubscription {
    const stored = localStorage.getItem('ai-sync-subscription');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined
      };
    }

    return {
      isPremium: false,
      hasInviteCode: false,
      features: {
        advancedFiltering: false,
        conversationTagging: false,
        exportFormats: false,
        webDashboard: false
      }
    };
  }

  private saveSubscription(): void {
    localStorage.setItem('ai-sync-subscription', JSON.stringify(this.subscription));
  }

  validateInviteCode(code: string): boolean {
    return VALID_INVITE_CODES.includes(code.toUpperCase());
  }

  activateInviteCode(code: string): boolean {
    if (this.validateInviteCode(code)) {
      this.subscription = {
        isPremium: true,
        hasInviteCode: true,
        inviteCode: code.toUpperCase(),
        features: {
          advancedFiltering: true,
          conversationTagging: true,
          exportFormats: true,
          webDashboard: true
        }
      };
      this.saveSubscription();
      return true;
    }
    return false;
  }

  activatePremium(): void {
    this.subscription = {
      isPremium: true,
      hasInviteCode: false,
      features: {
        advancedFiltering: true,
        conversationTagging: true,
        exportFormats: true,
        webDashboard: true
      },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
    this.saveSubscription();
  }

  getSubscription(): UserSubscription {
    return { ...this.subscription };
  }

  hasFeature(feature: keyof PremiumFeatures): boolean {
    return this.subscription.features[feature];
  }

  isPremiumUser(): boolean {
    // Check local subscription first to avoid circular imports
    if (this.subscription.hasInviteCode) return true;
    if (!this.subscription.isPremium) return false;
    if (this.subscription.expiresAt && this.subscription.expiresAt < new Date()) {
      this.subscription.isPremium = false;
      this.saveSubscription();
      return false;
    }
    return true;
  }

  async createCheckoutSession(tier: 'pro' | 'team'): Promise<string> {
    // For demo purposes, simulate checkout URL creation
    const priceId = tier === 'pro' ? 'price_1RlplfGKVCSWi11Iwnmsb2TJ' : 'price_1Rlpm6GKVCSWi11I3WQyHIE6';
    return `https://checkout.stripe.com/pay/${priceId}?demo=true`;
  }
}