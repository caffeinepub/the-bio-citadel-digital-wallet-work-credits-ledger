import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Shield, TrendingUp, Lock, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { classifyAndFormatError } from '../utils/errorHandling';

export default function LandingPage() {
  const { login, loginStatus, loginError } = useInternetIdentity();

  // Preload admin banner for faster transition after login
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/generated/admin-banner.dim_800x200.png';
  }, []);

  // Display error toast when login fails
  useEffect(() => {
    if (loginStatus === 'loginError' && loginError) {
      console.error('[LandingPage] Login error detected:', {
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

  const handleLogin = () => {
    try {
      console.log('[LandingPage] Login button clicked');
      login();
    } catch (error: any) {
      console.error('[LandingPage] Login error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const classified = classifyAndFormatError(error);
      toast.error(classified.userMessage, {
        description: classified.actionableGuidance
      });
    }
  };

  const features = [
    {
      icon: Wallet,
      title: 'Digital Wallet',
      description: 'Secure personal wallet for managing your Work Credits balance',
    },
    {
      icon: Shield,
      title: 'Admin Control',
      description: 'Authorized admins can mint and distribute Work Credits',
    },
    {
      icon: TrendingUp,
      title: 'Transaction History',
      description: 'Complete transparency with public ledger of all transactions',
    },
    {
      icon: Lock,
      title: 'Secure & Decentralized',
      description: 'Built on Internet Computer for maximum security and reliability',
    },
  ];

  const isLoading = loginStatus === 'logging-in' || loginStatus === 'initializing';

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/20 blur-3xl" />
            <img
              src="/assets/generated/wallet-icon-transparent.dim_200x200.png"
              alt="Bio Citadel Wallet"
              className="h-32 w-32"
              loading="eager"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              The Bio Citadel
              <span className="block text-primary">Work Credits Ledger</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A transparent, decentralized system for managing and tracking Work Credits.
              Secure authentication, instant transfers, and complete transaction history.
            </p>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            size="lg"
            className="gap-2 px-8 text-base"
          >
            {isLoading ? (
              <>
                <Wallet className="h-5 w-5 animate-pulse" />
                {loginStatus === 'initializing' ? 'Initializing...' : 'Connecting...'}
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Login with Internet Identity
              </>
            )}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 transition-colors hover:border-primary/50">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="space-y-6 rounded-lg border border-border/50 bg-card p-8">
          <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Login Securely</h3>
                <p className="text-sm text-muted-foreground">
                  Connect using Internet Identity for secure, passwordless authentication
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Receive Credits</h3>
                <p className="text-sm text-muted-foreground">
                  Admins can mint and distribute Work Credits to your wallet
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Transfer & Track</h3>
                <p className="text-sm text-muted-foreground">
                  Send credits to other users and view complete transaction history
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
