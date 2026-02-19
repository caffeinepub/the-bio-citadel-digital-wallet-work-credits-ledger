import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classifyError, getUserFriendlyErrorMessage } from '../utils/errorHandling';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      console.log('[Header] Logging out...');
      await clear();
      queryClient.clear();
      console.log('[Header] Logout complete, cache cleared');
    } else {
      console.log('[Header] Starting login...');
      console.log('[Header] Current login status:', loginStatus);
      
      try {
        await login();
        console.log('[Header] Login completed successfully');
      } catch (error: any) {
        console.error('[Header] Login error:', error);
        console.error('[Header] Error type:', typeof error);
        console.error('[Header] Error keys:', error ? Object.keys(error) : 'null');
        console.error('[Header] Error message:', error?.message);
        console.error('[Header] Error name:', error?.name);
        console.error('[Header] Full error object:', JSON.stringify(error, null, 2));

        const errorType = classifyError(error);
        const errorInfo = getUserFriendlyErrorMessage(errorType);
        
        console.error('[Header] Classified error type:', errorType);
        console.error('[Header] User-friendly message:', errorInfo.message);
        console.error('[Header] Guidance:', errorInfo.guidance);

        toast.error(errorInfo.message, {
          description: errorInfo.guidance,
          duration: 5000,
        });

        if (error.message === 'User is already authenticated') {
          console.log('[Header] Clearing stale auth state and retrying...');
          await clear();
          setTimeout(() => login(), 300);
        }
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
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/wallet-icon-transparent.dim_200x200.png"
            alt="Bio Citadel"
            className="h-10 w-10"
          />
          <h1 className="text-2xl font-bold text-foreground">Bio Citadel</h1>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{userProfile.name}</span>
                <Badge variant="secondary" className="text-xs">
                  User
                </Badge>
              </div>
            </div>
          )}

          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? 'outline' : 'default'}
            size="default"
          >
            {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
          </Button>
        </div>
      </div>
    </header>
  );
}
