import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Chrome, 
  Github, 
  Apple, 
  Facebook, 
  Linkedin, 
  Twitter,
  Mail,
  Shield,
  Zap
} from 'lucide-react';
import { blink } from '../lib/blink';

interface AuthProvidersProps {
  onSignIn?: () => void;
}

export function AuthProviders({ onSignIn }: AuthProvidersProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async (provider?: string) => {
    setIsSigningIn(true);
    try {
      // Blink SDK handles the authentication flow automatically
      // The provider parameter is for display purposes - Blink auth page will show all options
      await blink.auth.login();
      onSignIn?.();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Sign in with your Google account'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: 'bg-gray-900 hover:bg-gray-800',
      description: 'Sign in with your GitHub account'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: Apple,
      color: 'bg-black hover:bg-gray-900',
      description: 'Sign in with your Apple ID'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Sign in with your Facebook account'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      description: 'Sign in with your LinkedIn account'
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-900',
      description: 'Sign in with your X account'
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Welcome to AI Chat Sync</CardTitle>
          <CardDescription>
            Sign in to sync your conversations across all AI platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Secure • Private • Encrypted</span>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm font-medium text-center">Choose your preferred sign-in method:</p>
            
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider) => {
                const IconComponent = provider.icon;
                return (
                  <Button
                    key={provider.id}
                    variant="outline"
                    size="sm"
                    className={`h-12 flex flex-col items-center justify-center space-y-1 hover:scale-105 transition-all duration-200 ${
                      isSigningIn ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => handleSignIn(provider.id)}
                    disabled={isSigningIn}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs font-medium">{provider.name}</span>
                  </Button>
                );
              })}
            </div>
            
            <Separator className="my-4" />
            
            <Button
              variant="default"
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              onClick={() => handleSignIn()}
              disabled={isSigningIn}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSigningIn ? 'Signing in...' : 'Continue with Email'}
            </Button>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                SOC 2 Compliant
              </Badge>
              <Badge variant="secondary" className="text-xs">
                GDPR Ready
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-medium text-sm">What you get:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Sync conversations across ChatGPT, Claude, Gemini & Grok</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Persistent memory layer for all AI interactions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Private, secure, and encrypted data storage</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Cross-platform context sharing</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}