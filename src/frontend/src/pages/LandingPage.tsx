import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { classifyError, getUserFriendlyErrorMessage } from '../utils/errorHandling';

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    console.log('[LandingPage] Login button clicked');
    console.log('[LandingPage] Current login status:', loginStatus);
    
    try {
      await login();
      console.log('[LandingPage] Login completed successfully');
    } catch (error: any) {
      console.error('[LandingPage] Login error:', error);
      console.error('[LandingPage] Error details:', {
        message: error?.message,
        name: error?.name,
        type: typeof error,
        keys: error ? Object.keys(error) : 'null',
      });

      const errorType = classifyError(error);
      const errorInfo = getUserFriendlyErrorMessage(errorType);
      
      console.error('[LandingPage] Classified error type:', errorType);
      console.error('[LandingPage] User-friendly message:', errorInfo.message);
      console.error('[LandingPage] Guidance:', errorInfo.guidance);

      toast.error(errorInfo.message, {
        description: errorInfo.guidance,
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <img
            src="/assets/generated/wallet-icon-transparent.dim_200x200.png"
            alt="Bio Citadel Logo"
            className="h-32 w-32"
            loading="eager"
          />
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              Welcome to Bio Citadel
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              A secure, transparent platform for managing Work Credits on the Internet Computer blockchain
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleLogin}
            disabled={loginStatus === 'logging-in'}
            className="text-lg px-8 py-6"
          >
            {loginStatus === 'logging-in' ? 'Connecting...' : 'Login with Internet Identity'}
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Decentralized</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built on the Internet Computer blockchain with Internet Identity authentication for maximum security
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Work Credits System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage and transfer Work Credits seamlessly with full transaction history and transparency
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Admin Dashboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive admin tools for minting credits, managing users, and monitoring all transactions
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Banner */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <img
            src="/assets/generated/admin-banner.dim_800x200.png"
            alt="Admin Dashboard Preview"
            className="w-full rounded-lg shadow-lg"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}
