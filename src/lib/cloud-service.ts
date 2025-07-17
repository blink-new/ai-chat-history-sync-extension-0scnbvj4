import blink from './blink';
import { Conversation, SyncStatus, ExtensionSettings } from '../types/conversation';
import { UserSubscription } from '../types/premium';

export interface CloudUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  subscriptionTier: 'free' | 'pro' | 'team';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscriptionExpiresAt?: Date;
  stripeCustomerId?: string;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  subscriptionTier: 'team';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscriptionExpiresAt?: Date;
  stripeCustomerId?: string;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export class CloudService {
  private static instance: CloudService;
  private user: CloudUser | null = null;
  private isAuthenticated = false;

  private constructor() {}

  static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Blink auth state listener with error handling
      if (typeof blink !== 'undefined' && blink.auth) {
        blink.auth.onAuthStateChanged((state) => {
          this.isAuthenticated = state.isAuthenticated;
          if (state.user) {
            this.user = {
              id: state.user.id,
              email: state.user.email,
              displayName: state.user.displayName,
              avatarUrl: state.user.avatarUrl,
              subscriptionTier: 'free', // Default, will be updated from database
              subscriptionStatus: 'active',
              createdAt: new Date(state.user.createdAt),
              updatedAt: new Date(state.user.updatedAt)
            };
            this.syncUserData();
          } else {
            this.user = null;
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize cloud service:', error);
    }
  }

  private async syncUserData(): Promise<void> {
    if (!this.user) return;

    try {
      // In a real implementation, this would sync with the database
      // For now, we'll use local storage as fallback
      const storedUser = localStorage.getItem('ai-sync-cloud-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        this.user = { ...this.user, ...userData };
      }
    } catch (error) {
      console.error('Failed to sync user data:', error);
    }
  }

  async login(): Promise<void> {
    try {
      await blink.auth.login();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await blink.auth.logout();
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('ai-sync-cloud-user');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  getCurrentUser(): CloudUser | null {
    return this.user;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated && this.user !== null;
  }

  async syncConversations(conversations: Conversation[]): Promise<void> {
    if (!this.isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      // In a real implementation, this would sync to the cloud database
      // For now, we'll enhance local storage with cloud-ready structure
      const cloudConversations = conversations.map(conv => ({
        ...conv,
        userId: this.user!.id,
        syncedAt: Date.now()
      }));

      localStorage.setItem('ai-sync-cloud-conversations', JSON.stringify(cloudConversations));
    } catch (error) {
      console.error('Failed to sync conversations:', error);
      throw error;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    if (!this.isUserAuthenticated()) {
      return [];
    }

    try {
      // In a real implementation, this would fetch from the cloud database
      const stored = localStorage.getItem('ai-sync-cloud-conversations');
      if (stored) {
        const conversations = JSON.parse(stored);
        return conversations.filter((conv: any) => conv.userId === this.user!.id);
      }
      return [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  async updateSubscription(tier: 'free' | 'pro' | 'team', stripeCustomerId?: string): Promise<void> {
    if (!this.user) return;

    this.user.subscriptionTier = tier;
    this.user.stripeCustomerId = stripeCustomerId;
    this.user.updatedAt = new Date();

    // Store updated user data
    localStorage.setItem('ai-sync-cloud-user', JSON.stringify({
      subscriptionTier: tier,
      stripeCustomerId,
      updatedAt: this.user.updatedAt
    }));
  }

  async createCheckoutSession(priceId: string): Promise<string> {
    if (!this.isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      // In a real implementation, this would call a backend endpoint
      // For demo purposes, we'll simulate the checkout URL
      const checkoutUrl = `https://checkout.stripe.com/pay/${priceId}?client_reference_id=${this.user!.id}`;
      return checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  async createTeam(name: string): Promise<Team> {
    if (!this.isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const team: Team = {
      id: `team_${Date.now()}`,
      name,
      ownerId: this.user!.id,
      subscriptionTier: 'team',
      subscriptionStatus: 'active',
      maxMembers: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store team data
    const teams = this.getStoredTeams();
    teams.push(team);
    localStorage.setItem('ai-sync-teams', JSON.stringify(teams));

    return team;
  }

  async getUserTeams(): Promise<Team[]> {
    if (!this.isUserAuthenticated()) {
      return [];
    }

    const teams = this.getStoredTeams();
    return teams.filter(team => team.ownerId === this.user!.id);
  }

  private getStoredTeams(): Team[] {
    try {
      const stored = localStorage.getItem('ai-sync-teams');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async inviteTeamMember(teamId: string, email: string): Promise<void> {
    if (!this.isUserAuthenticated()) {
      throw new Error('User not authenticated');
    }

    // In a real implementation, this would send an invitation email
    console.log(`Inviting ${email} to team ${teamId}`);
  }

  getSubscriptionFeatures(): UserSubscription['features'] {
    if (!this.user) {
      return {
        advancedFiltering: false,
        conversationTagging: false,
        exportFormats: false,
        webDashboard: false
      };
    }

    const isPremium = this.user.subscriptionTier === 'pro' || this.user.subscriptionTier === 'team';
    
    return {
      advancedFiltering: isPremium,
      conversationTagging: isPremium,
      exportFormats: isPremium,
      webDashboard: isPremium
    };
  }
}

export default CloudService;