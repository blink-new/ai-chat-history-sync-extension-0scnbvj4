import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, ExternalLink, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { AuthProviders } from './AuthProviders';
import { blink } from '../lib/blink';

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedPlatforms, setCompletedPlatforms] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [isWebPreview, setIsWebPreview] = useState(false);

  const platforms = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: '🤖',
      url: 'https://chat.openai.com/',
      description: 'OpenAI\'s conversational AI'
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '🧠',
      url: 'https://claude.ai/',
      description: 'Anthropic\'s AI assistant'
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '💎',
      url: 'https://gemini.google.com/',
      description: 'Google\'s AI model'
    },
    {
      id: 'grok',
      name: 'Grok',
      icon: '🚀',
      url: 'https://grok.x.com/',
      description: 'X\'s AI assistant'
    }
  ];

  // Monitor authentication state
  useEffect(() => {
    // Check if we're in web preview mode
    const isPreview = !window.chrome?.runtime?.id;
    setIsWebPreview(isPreview);
    
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setIsAuthenticated(state.isAuthenticated);
      setAuthLoading(state.isLoading);
      
      // In web preview, if already authenticated, mark as signed in
      if (isPreview && state.isAuthenticated && !state.isLoading) {
        setHasSignedIn(true);
      }
      
      // If user was not authenticated before and now is, they must have signed in
      if (!isAuthenticated && state.isAuthenticated && !state.isLoading) {
        setHasSignedIn(true);
        // Auto-advance to next step after successful sign in
        setTimeout(() => {
          if (currentStep === 0) {
            setCurrentStep(1);
          }
        }, 1500);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, currentStep]);

  const steps = [
    {
      title: 'Sign In to Get Started',
      description: 'Secure authentication to sync your conversations',
      content: (
        <div className="space-y-4">
          {authLoading ? (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Initializing...</p>
            </div>
          ) : !isAuthenticated || !hasSignedIn ? (
            <AuthProviders onSignIn={() => {
              setHasSignedIn(true);
            }} />
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Authentication Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  {isWebPreview 
                    ? "Web preview mode - authentication already active"
                    : "Proceeding to setup your AI conversation sync..."
                  }
                </p>
                {!isWebPreview && (
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-xs text-muted-foreground">Setting up...</span>
                  </div>
                )}
                {isWebPreview && (
                  <div className="bg-blue-50 p-3 rounded-lg mt-3">
                    <p className="text-xs text-blue-700">
                      💡 In the actual Chrome extension, you would sign in here first
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Welcome to AI Chat Sync',
      description: 'Create a persistent memory layer across all your AI conversations',
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
            <img src="/logo.jpeg" alt="AI Chat Sync" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Never lose context again</h3>
            <p className="text-sm text-muted-foreground">
              This extension will extract your conversation history from ChatGPT, Claude, Gemini, and Grok, 
              then sync them so each AI has access to your complete conversation history.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <span className="text-lg">{platform.icon}</span>
                <span className="text-xs font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Grant Permissions',
      description: 'Visit each platform to enable conversation extraction',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click on each platform below to open it in a new tab. The extension will automatically 
            detect when you visit these sites and begin extracting your conversation history.
          </p>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <Card key={platform.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{platform.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{platform.name}</div>
                      <div className="text-xs text-muted-foreground">{platform.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {completedPlatforms.includes(platform.id) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(platform.url, '_blank');
                          setCompletedPlatforms(prev => [...prev, platform.id]);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Setup Complete',
      description: 'Your AI Chat Sync is ready to use',
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">All set!</h3>
            <p className="text-sm text-muted-foreground">
              The extension is now monitoring your conversations. When you visit any of the supported 
              AI platforms, your conversations will be automatically extracted and synced.
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">What happens next:</h4>
            <ul className="text-xs text-muted-foreground space-y-1 text-left">
              <li>• Historical conversations will be extracted automatically</li>
              <li>• New conversations will be synced in real-time</li>
              <li>• Context will be shared across all platforms</li>
              <li>• Your data stays private and local</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = 
    (currentStep === 0 && isAuthenticated && !authLoading && hasSignedIn) ||
    (currentStep === 1) ||
    (currentStep === 2 && completedPlatforms.length >= 2);

  return (
    <div className="extension-popup">
      <div className="p-4 border-b gradient-header">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-semibold text-lg">Setup Wizard</h1>
          <Badge variant="secondary" className="text-xs">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <div className="p-4 flex-1">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="font-semibold text-base mb-1">{currentStepData.title}</h2>
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
          </div>
          
          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-muted/20">
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Previous
          </Button>
          
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!canProceed}
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        {currentStep === 0 && (!isAuthenticated || !hasSignedIn) && !authLoading && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please sign in to continue
          </p>
        )}
        {currentStep === 2 && completedPlatforms.length < 2 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Visit at least 2 platforms to continue
          </p>
        )}
      </div>
    </div>
  );
}