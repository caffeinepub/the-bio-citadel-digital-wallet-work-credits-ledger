import { lazy, Suspense, useEffect } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InternetIdentityProvider, useInternetIdentity } from './hooks/useInternetIdentity';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useGetCallerUserProfile, useGetCallerUserRole, usePrefetchAdminData } from './hooks/useQueries';
import { UserRole } from './backend';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const UserWallet = lazy(() => import('./pages/UserWallet'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PublicLedger = lazy(() => import('./pages/PublicLedger'));

// Preload assets
const preloadAssets = () => {
  const assets = [
    '/assets/generated/wallet-icon-transparent.dim_200x200.png',
    '/assets/generated/work-credits-coin-transparent.dim_150x150.png'
  ];
  assets.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function Layout() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const prefetchAdminData = usePrefetchAdminData();

  const isAuthenticated = !!identity;
  const isAdmin = userRole === UserRole.admin;

  // Prefetch admin data when admin logs in
  useEffect(() => {
    if (isAuthenticated && isAdmin && userProfile) {
      prefetchAdminData();
    }
  }, [isAuthenticated, isAdmin, userProfile, prefetchAdminData]);

  // Preload assets on mount
  useEffect(() => {
    preloadAssets();
  }, []);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}

// Define routes
const rootRoute = createRootRoute({
  component: Layout
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    const { identity } = useInternetIdentity();
    const { data: userRole } = useGetCallerUserRole();

    if (!identity) {
      return <LandingPage />;
    }

    if (userRole === UserRole.admin) {
      return <AdminDashboard />;
    }

    return <UserWallet />;
  }
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet',
  component: UserWallet
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard
});

const ledgerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ledger',
  component: PublicLedger
});

const routeTree = rootRoute.addChildren([indexRoute, walletRoute, adminRoute, ledgerRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <RouterProvider router={router} />
          <Toaster />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
