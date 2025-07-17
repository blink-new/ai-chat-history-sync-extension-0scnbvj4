import { useState, useEffect, ReactNode } from 'react';
import { AuthProviders } from './AuthProviders';
import { blink } from '../lib/blink';

interface AuthWrapperProps {
  children: ReactNode;
}

interface AuthState {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setAuthState({
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated
      });
    });

    return unsubscribe;
  }, []);

  if (authState.isLoading) {
    return (
      <div className="extension-popup flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="extension-popup p-4">
        <AuthProviders onSignIn={() => {
          // Auth state will be updated automatically via onAuthStateChanged
        }} />
      </div>
    );
  }

  return <>{children}</>;
}