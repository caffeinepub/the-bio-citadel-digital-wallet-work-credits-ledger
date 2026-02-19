import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserProfile, Transaction, UserRole, AdminUserDisplay } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useGetWalletBalance() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWalletBalance(null);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTransactionHistory(null);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGetTransactionLedger() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactionLedger'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTransactionLedger();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 1 * 60 * 1000, // 1 minute - increased for better caching
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache longer
  });
}

export function useGetAllRegisteredUsersWithNames() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AdminUserDisplay[]>({
    queryKey: ['allRegisteredUsersWithNames'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllRegisteredUsersWithNames();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 3 * 60 * 1000, // 3 minutes - increased for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });
}

export function useGetUserProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserProfile(user);
    },
  });
}

export function useMintCredits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      amount,
    }: {
      recipient: Principal;
      amount: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.mintCredits(recipient, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactionLedger'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allRegisteredUsersWithNames'] });
      toast.success('Work Credits minted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mint credits: ${error.message}`);
    },
  });
}

export function useTransferCredits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      amount,
    }: {
      recipient: Principal;
      amount: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.transferCredits(recipient, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactionLedger'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Work Credits transferred successfully');
    },
    onError: (error: Error) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });
}

// Prefetch function for admin dashboard data - parallel fetching
export function usePrefetchAdminData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return () => {
    if (!actor) return;

    // Prefetch all admin data in parallel for instant dashboard load
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['allRegisteredUsersWithNames'],
        queryFn: () => actor.getAllRegisteredUsersWithNames(),
        staleTime: 3 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['transactionLedger'],
        queryFn: () => actor.getTransactionLedger(),
        staleTime: 1 * 60 * 1000,
      }),
    ]);
  };
}

