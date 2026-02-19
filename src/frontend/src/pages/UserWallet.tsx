import { useState, useMemo } from 'react';
import {
  useGetWalletBalance,
  useGetTransactionHistory,
  useTransferCredits,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, TrendingUp, Clock, Coins, Send, ArrowDownLeft, ArrowUpRight, Loader2, Copy, Check } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { TransactionType } from '../backend';
import { toast } from 'sonner';

export default function UserWallet() {
  const { data: balance, isLoading: balanceLoading } = useGetWalletBalance();
  const { data: transactions, isLoading: transactionsLoading } = useGetTransactionHistory();
  const { data: userProfile } = useGetCallerUserProfile();
  const { mutate: transferCredits, isPending: isTransferring } = useTransferCredits();
  const { identity } = useInternetIdentity();

  const [recipientPrincipalId, setRecipientPrincipalId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [principalError, setPrincipalError] = useState<string>('');

  const currentUserPrincipal = identity?.getPrincipal().toString();

  // Validate Principal ID format
  const validatePrincipalId = (value: string): boolean => {
    if (!value.trim()) {
      setPrincipalError('');
      return false;
    }
    
    try {
      Principal.fromText(value);
      setPrincipalError('');
      return true;
    } catch {
      setPrincipalError('Invalid Principal ID format');
      return false;
    }
  };

  // Check if trying to send to self
  const isSendingToSelf = useMemo(() => {
    if (!recipientPrincipalId || !currentUserPrincipal) return false;
    try {
      return Principal.fromText(recipientPrincipalId).toString() === currentUserPrincipal;
    } catch {
      return false;
    }
  }, [recipientPrincipalId, currentUserPrincipal]);

  // Check if transfer amount exceeds balance
  const hasInsufficientBalance = useMemo(() => {
    if (!balance || !transferAmount) return false;
    try {
      return BigInt(transferAmount) > balance;
    } catch {
      return false;
    }
  }, [balance, transferAmount]);

  const handlePrincipalIdChange = (value: string) => {
    setRecipientPrincipalId(value);
    if (value.trim()) {
      validatePrincipalId(value);
    } else {
      setPrincipalError('');
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePrincipalId(recipientPrincipalId)) {
      toast.error('Please enter a valid Principal ID');
      return;
    }

    if (isSendingToSelf) {
      toast.error('Cannot transfer credits to yourself');
      return;
    }

    if (recipientPrincipalId && transferAmount) {
      const amountBigInt = BigInt(transferAmount);
      transferCredits(
        {
          recipient: Principal.fromText(recipientPrincipalId),
          amount: amountBigInt,
        },
        {
          onSuccess: () => {
            setRecipientPrincipalId('');
            setTransferAmount('');
            setPrincipalError('');
          },
        }
      );
    }
  };

  const handleCopyPrincipal = async () => {
    if (currentUserPrincipal) {
      try {
        await navigator.clipboard.writeText(currentUserPrincipal);
        setCopied(true);
        toast.success('Principal ID copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy Principal ID');
      }
    }
  };

  // Helper function to format user display for transaction history
  const formatUserDisplay = (principal: string, name?: string): string => {
    if (name) {
      return `${name} — (${principal})`;
    }
    return principal;
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Wallet Balance Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Wallet className="h-6 w-6 text-primary" />
              Your Wallet
            </CardTitle>
            <CardDescription>Current Work Credits balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src="/assets/generated/work-credits-coin-transparent.dim_150x150.png"
                alt="Work Credits"
                className="h-20 w-20"
              />
              <div className="flex-1">
                {balanceLoading ? (
                  <div className="h-12 w-32 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-foreground">
                      {balance?.toString() || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Work Credits (WC)</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* User Name and Principal ID Display */}
            <div className="space-y-4">
              {userProfile && (
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{userProfile.name}</h3>
                  {currentUserPrincipal && (
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-mono text-sm text-muted-foreground">
                          {currentUserPrincipal}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPrincipal}
                        className="shrink-0 gap-1.5 border-primary/30 text-primary hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-primary/40 dark:hover:border-primary dark:hover:bg-primary/20"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Copy ID</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Share your Principal ID with others to receive Work Credits
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Work Credits Section */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-accent" />
              Send Work Credits
            </CardTitle>
            <CardDescription>Transfer Work Credits to another user</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipient-principal">Recipient Principal ID</Label>
                <Input
                  id="recipient-principal"
                  type="text"
                  placeholder="Enter recipient's Principal ID"
                  value={recipientPrincipalId}
                  onChange={(e) => handlePrincipalIdChange(e.target.value)}
                  disabled={isTransferring}
                  className={principalError || isSendingToSelf ? 'border-destructive' : ''}
                  required
                />
                {principalError && (
                  <p className="text-sm text-destructive">{principalError}</p>
                )}
                {isSendingToSelf && !principalError && (
                  <p className="text-sm text-destructive">
                    Cannot transfer credits to yourself
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the Principal ID of the user you want to send credits to
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Amount (WC)</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount to send"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  disabled={isTransferring}
                  required
                />
                {hasInsufficientBalance && (
                  <p className="text-sm text-destructive">
                    Insufficient balance. You have {balance?.toString() || '0'} WC available.
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Transfer Summary</p>
                  <p className="text-xs text-muted-foreground">
                    {transferAmount && recipientPrincipalId && !principalError && !isSendingToSelf
                      ? `Send ${transferAmount} WC to the specified recipient`
                      : 'Complete the form to send credits'}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={
                    isTransferring ||
                    !recipientPrincipalId ||
                    !transferAmount ||
                    hasInsufficientBalance ||
                    !!principalError ||
                    isSendingToSelf
                  }
                  className="gap-2"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Credits
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>Your Work Credits transaction log</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const isSender = tx.sender.toString() === currentUserPrincipal;
                  const isReceiver = tx.recipient.toString() === currentUserPrincipal;
                  const isMint = tx.transactionType === TransactionType.mint;
                  const isTransfer = tx.transactionType === TransactionType.transfer;

                  let transactionLabel = '';
                  let transactionDetail = '';
                  let icon = <Coins className="h-5 w-5 text-primary" />;
                  let amountDisplay = `+${tx.amount.toString()} WC`;
                  let amountColor = 'bg-primary/10 text-primary hover:bg-primary/20';

                  if (isMint) {
                    transactionLabel = 'Received Work Credits (Minted)';
                    transactionDetail = `From Admin: ${tx.admin.toString()}`;
                  } else if (isTransfer && isSender) {
                    transactionLabel = 'Sent Work Credits';
                    transactionDetail = `To: ${tx.recipient.toString()}`;
                    icon = <ArrowUpRight className="h-5 w-5 text-destructive" />;
                    amountDisplay = `-${tx.amount.toString()} WC`;
                    amountColor = 'bg-destructive/10 text-destructive hover:bg-destructive/20';
                  } else if (isTransfer && isReceiver) {
                    transactionLabel = 'Received Work Credits (Transfer)';
                    transactionDetail = `From: ${tx.sender.toString()}`;
                    icon = <ArrowDownLeft className="h-5 w-5 text-success" />;
                    amountDisplay = `+${tx.amount.toString()} WC`;
                    amountColor = 'bg-success/10 text-success hover:bg-success/20';
                  }

                  return (
                    <div key={tx.id.toString()}>
                      <div className="flex items-start justify-between gap-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {icon}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">{transactionLabel}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(Number(tx.timestamp) / 1000000).toLocaleString()}
                            </div>
                            <p className="break-all font-mono text-xs text-muted-foreground">
                              {transactionDetail}
                            </p>
                          </div>
                        </div>
                        <Badge className={amountColor}>{amountDisplay}</Badge>
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-medium">No transactions yet</p>
                <p className="text-xs text-muted-foreground">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
