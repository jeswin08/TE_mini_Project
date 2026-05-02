'use client';

import useSWR from 'swr';
import {
  getDashboardStats,
  getRiskDistribution,
  getFraudByHour,
  getTopFlaggedRules,
  getFraudTrend,
} from '@/services/api';

export function useDashboardStats(refreshInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR(
    'dashboard-stats',
    getDashboardStats,
    { refreshInterval }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useRiskDistribution(refreshInterval: number = 10000) {
  const { data, error, isLoading } = useSWR(
    'risk-distribution',
    getRiskDistribution,
    { refreshInterval }
  );

  return {
    distribution: data,
    isLoading,
    isError: !!error,
  };
}

export function useFraudByHour(refreshInterval: number = 30000) {
  const { data, error, isLoading } = useSWR(
    'fraud-by-hour',
    getFraudByHour,
    { refreshInterval }
  );

  return {
    hourlyData: data || [],
    isLoading,
    isError: !!error,
  };
}

export function useTopFlaggedRules(refreshInterval: number = 30000) {
  const { data, error, isLoading } = useSWR(
    'top-flagged-rules',
    getTopFlaggedRules,
    { refreshInterval }
  );

  return {
    rules: data || [],
    isLoading,
    isError: !!error,
  };
}

export function useFraudTrend(refreshInterval: number = 30000) {
  const { data, error, isLoading } = useSWR(
    'fraud-trend',
    getFraudTrend,
    { refreshInterval }
  );

  return {
    trends: data || [],
    isLoading,
    isError: !!error,
  };
}
