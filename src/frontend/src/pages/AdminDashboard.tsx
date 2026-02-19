import { useState, useMemo } from 'react';
import {
  useGetAllRegisteredUsersWithNames,
  useMintCredits,
  useGetTransactionLedger,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Users, Loader2, TrendingUp } from 'lucide-react';
import { Principal } from '@dfinity/principal';

// Skeleton components for loading states
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border/50 p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  // Parallel data fetching - all queries run concurrently
  const { data: users, isLoading: usersLoading, isFetching: usersFetching } = useGetAllRegisteredUsersWithNames();
  const { data: ledger, isLoading: ledgerLoading, isFetching: ledgerFetching } = useGetTransactionLedger();
  const { mutate: mintCredits, isPending: isMinting } = useMintCredits();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // Create a map of principal to user display for quick lookups - memoized
  const principalToUserMap = useMemo(() => {
    if (!users) return new Map<string, { name: string; principal: string }>();
    return new Map(
      users.map((user) => [
        user.principal.toString(),
        { name: user.name, principal: user.principal.toString() },
      ])
    );
  }, [users]);

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && amount) {
      const amountBigInt = BigInt(amount);
      mintCredits(
        {
          recipient: Principal.fromText(selectedUser),
          amount: amountBigInt,
        },
        {
          onSuccess: () => {
            setSelectedUser('');
            setAmount('');
          },
        }
      );
    }
  };

  // Memoized computed values
  const totalMinted = useMemo(() => {
    return ledger?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  }, [ledger]);

  const recentTransactions = useMemo(() => {
    return ledger ? ledger.slice(-5).reverse() : [];
  }, [ledger]);

  const selectedUserDisplay = principalToUserMap.get(selectedUser);

  // Helper function to format user display - memoized
  const formatUserDisplay = useMemo(() => {
    return (principal: string): string => {
      const user = principalToUserMap.get(principal);
      if (user) {
        return `${user.name} — (${user.principal})`;
      }
      return `Unknown — (${principal})`;
    };
  }, [principalToUserMap]);

  // Show initial loading only when there's no cached data
  const showInitialLoading = (usersLoading && !users) || (ledgerLoading && !ledger);

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header with Banner */}
        <div className="relative overflow-hidden rounded-xl">
          <img
            src="/assets/generated/admin-banner.dim_800x200.png"
            alt="Admin Portal"
            className="h-48 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
          <div className="absolute inset-0 flex items-center p-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
              <p className="text-muted-foreground">
                Mint and distribute Work Credits to registered users
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Show cached data while fetching, skeleton only on initial load */}
        <div className="grid gap-6 sm:grid-cols-3">
          {showInitialLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card className={usersFetching ? 'opacity-75 transition-opacity' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered wallets</p>
                </CardContent>
              </Card>

              <Card className={ledgerFetching ? 'opacity-75 transition-opacity' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Minted</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMinted.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Work Credits in circulation</p>
                </CardContent>
              </Card>

              <Card className={ledgerFetching ? 'opacity-75 transition-opacity' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ledger?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Total minting operations</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Minting Form - Show cached data while fetching */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Mint Work Credits
            </CardTitle>
            <CardDescription>
              Select a user and enter the amount of Work Credits to mint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMint} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                {usersLoading && !users ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="relative">
                    <Select 
                      value={selectedUser} 
                      onValueChange={setSelectedUser}
                      disabled={usersFetching && !users}
                    >
                      <SelectTrigger id="user" className={usersFetching ? 'opacity-75' : ''}>
                        <SelectValue placeholder="Choose a user to receive credits" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem
                            key={user.principal.toString()}
                            value={user.principal.toString()}
                          >
                            {user.name} — ({user.principal.toString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {usersFetching && users && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
                {selectedUserDisplay && (
                  <p className="text-sm text-muted-foreground">
                    Selected:{' '}
                    <span className="font-medium text-foreground">
                      {selectedUserDisplay.name} — ({selectedUserDisplay.principal})
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (WC)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount of Work Credits"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isMinting || (usersLoading && !users)}
                  required
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Transaction Summary</p>
                  <p className="text-xs text-muted-foreground">
                    {amount && selectedUser
                      ? `Mint ${amount} WC to ${selectedUserDisplay?.name || 'selected user'}`
                      : 'Complete the form to mint credits'}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isMinting || !selectedUser || !amount || (usersLoading && !users)}
                  className="gap-2"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Mint Credits
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Activity - Show cached data while fetching */}
        <Card className={ledgerFetching ? 'opacity-75 transition-opacity' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Minting Activity</CardTitle>
                <CardDescription>Latest Work Credits transactions</CardDescription>
              </div>
              {ledgerFetching && ledger && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {ledgerLoading && !ledger ? (
              <RecentActivitySkeleton />
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx) => {
                  const recipientDisplay = formatUserDisplay(tx.recipient.toString());
                  return (
                    <div
                      key={tx.id.toString()}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Coins className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Minted {tx.amount.toString()} WC
                          </p>
                          <p className="text-xs text-muted-foreground">
                            To: {recipientDisplay}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {new Date(Number(tx.timestamp) / 1000000).toLocaleDateString()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

