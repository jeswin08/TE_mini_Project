'use client';

import useSWR from 'swr';
import { getRecentTransactions, getAllTransactions } from '@/services/api';
import type { Transaction, RiskLevel } from '@/lib/types';

export function useRecentTransactions(limit: number = 10, refreshInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR<Transaction[]>(
    ['recent-transactions', limit],
    () => getRecentTransactions(limit),
    { refreshInterval }
  );

  return {
    transactions: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAllTransactions(
  page: number = 1,
  pageSize: number = 20,
  riskFilter?: RiskLevel,
  search?: string,
  refreshInterval: number = 5000
) {
  const { data, error, isLoading, mutate } = useSWR(
    ['all-transactions', page, pageSize, riskFilter, search],
    () => getAllTransactions(page, pageSize, riskFilter, search),
    { refreshInterval }
  );

  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
