import { useMemo } from 'react';
import { useGetTransactionLedger, useGetAllRegisteredUsersWithNames } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Loader2 } from 'lucide-react';
import { TransactionType } from '../backend';

export default function PublicLedger() {
  const { data: ledger, isLoading: ledgerLoading } = useGetTransactionLedger();
  const { data: users, isLoading: usersLoading } = useGetAllRegisteredUsersWithNames();

  // Create a map of principal to user display for quick lookups
  const principalToUserMap = useMemo(() => {
    if (!users) return new Map<string, { name: string; principal: string }>();
    return new Map(
      users.map((user) => [
        user.principal.toString(),
        { name: user.name, principal: user.principal.toString() },
      ])
    );
  }, [users]);

  // Helper function to format user display
  const formatUserDisplay = (principal: string): string => {
    const user = principalToUserMap.get(principal);
    if (user) {
      return `${user.name} — (${user.principal})`;
    }
    return `Unknown — (${principal})`;
  };

  const isLoading = ledgerLoading || usersLoading;

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Public Transaction Ledger
            </CardTitle>
            <CardDescription>
              Complete transparency: All Work Credits transactions (minting and transfers)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ledger && ledger.length > 0 ? (
              <ScrollArea className="h-[500px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((tx) => {
                      const isMint = tx.transactionType === TransactionType.mint;
                      const fromDisplay = isMint
                        ? formatUserDisplay(tx.admin.toString())
                        : formatUserDisplay(tx.sender.toString());
                      const toDisplay = formatUserDisplay(tx.recipient.toString());

                      return (
                        <TableRow key={tx.id.toString()}>
                          <TableCell className="font-mono text-xs">
                            #{tx.id.toString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(Number(tx.timestamp) / 1000000).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isMint ? 'outline' : 'secondary'}
                              className="text-xs"
                            >
                              {isMint ? 'Mint' : 'Transfer'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {isMint ? `Admin: ${fromDisplay}` : fromDisplay}
                          </TableCell>
                          <TableCell className="text-xs">{toDisplay}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {tx.amount.toString()} WC
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-medium">No transactions recorded</p>
                <p className="text-xs text-muted-foreground">
                  The ledger will display all transactions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
