import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, LogOut, LogIn, Shield, AlertCircle } from 'lucide-react';
import { UserRole } from '../backend';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { classifyAndFormatError } from '../utils/errorHandling';

export default function Header() {
  const { login, clear, loginStatus, identity, loginError } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in' || loginStatus === 'initializing';

  // Display error toast when login fails
  useEffect(() => {
    if (loginStatus === 'loginError' && loginError) {
      console.error('[Header] Login error detected:', {
        error: loginError,
        message: loginError.message,
        stack: loginError.stack
      });
      
      const classified = classifyAndFormatError(loginError);
      
      toast.error(classified.userMessage, {
        description: classified.actionableGuidance,
        duration: 6000,
        icon: <AlertCircle className="h-4 w-4" />
      });
    }
  }, [loginStatus, loginError]);

  const handleAuth = async () => {
    console.log('[Header] Auth button clicked', {
      isAuthenticated,
      loginStatus,
      disabled
    });
    
    if (isAuthenticated) {
      try {
        console.log('[Header] Initiating logout...');
        await clear();
        queryClient.clear();
        console.log('[Header] Logout successful');
        toast.success('Logged out successfully');
      } catch (error) {
        console.error('[Header] Logout error:', {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        const classified = classifyAndFormatError(error);
        toast.error('Logout failed', {
          description: classified.actionableGuidance
        });
      }
    } else {
      try {
        console.log('[Header] Initiating login...');
        login();
      } catch (error: any) {
        console.error('[Header] Login error:', {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        const classified = classifyAndFormatError(error);
        toast.error(classified.userMessage, {
          description: classified.actionableGuidance
        });
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/wallet-icon-transparent.dim_200x200.png"
            alt="Bio Citadel"
            className="h-10 w-10"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Bio Citadel</h1>
            <p className="text-xs text-muted-foreground">Work Credits Ledger</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-3">
              {userRole === UserRole.admin && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              )}
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
                {userProfile.name}
              </span>
            </div>
          )}

          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            className="gap-2"
          >
            {disabled ? (
              <>
                <Wallet className="h-4 w-4 animate-pulse" />
                {loginStatus === 'initializing' ? 'Initializing...' : 'Connecting...'}
              </>
            ) : isAuthenticated ? (
              <>
                <LogOut className="h-4 w-4" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Login
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
