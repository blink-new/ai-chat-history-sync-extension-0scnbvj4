import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Crown, Gift, Sparkles } from 'lucide-react';
import { PremiumManager } from '../lib/premium';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ feature, children }) => {
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const premiumManager = PremiumManager.getInstance();

  if (premiumManager.isPremiumUser()) {
    return <>{children}</>;
  }

  const handleInviteSubmit = () => {
    if (premiumManager.activateInviteCode(inviteCode)) {
      setError('');
      window.location.reload(); // Refresh to show premium features
    } else {
      setError('Invalid invitation code');
    }
  };

  const handleUpgrade = async () => {
    try {
      const checkoutUrl = await premiumManager.createCheckoutSession('pro');
      window.open(checkoutUrl, '_blank');
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      // Fallback to demo mode
      alert('Redirecting to payment... (Demo mode)');
      premiumManager.activatePremium();
      window.location.reload();
    }
  };

  return (
    <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Crown className="h-8 w-8 text-purple-600" />
        </div>
        <CardTitle className="text-purple-900">Premium Feature</CardTitle>
        <CardDescription>
          {feature} is available with AI Sync Premium
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <div className="w-3 h-3 mr-1 rounded-sm overflow-hidden">
              <img src="/logo.jpeg" alt="AI Chat Sync" className="w-full h-full object-cover" />
            </div>
            $9.99/month
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Button onClick={handleUpgrade} className="w-full bg-purple-600 hover:bg-purple-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowInviteInput(!showInviteInput)}
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Gift className="h-4 w-4 mr-2" />
            Have an invitation code?
          </Button>
        </div>

        {showInviteInput && (
          <div className="space-y-2">
            <Input
              placeholder="Enter invitation code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="border-purple-200 focus:border-purple-400"
            />
            <Button onClick={handleInviteSubmit} variant="outline" className="w-full">
              Activate Code
            </Button>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          Premium includes: Advanced filtering, conversation tagging, export formats, and web dashboard
        </div>
      </CardContent>
    </Card>
  );
};