'use client';

import useSWR from 'swr';
import { getAlerts, getAlertStats, updateAlertStatus } from '@/services/api';
import { useNotifications } from './use-notifications';
import { useCallback } from 'react';

export function useAlerts(refreshInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR('alerts', getAlerts, {
    refreshInterval,
  });
  const { addNotification } = useNotifications();

  const handleUpdateStatus = useCallback(
    async (alertId: string, status: 'reviewed' | 'escalated' | 'dismissed') => {
      try {
        await updateAlertStatus(alertId, status);
        mutate();
        addNotification({
          type: 'success',
          title: 'Alert Updated',
          message: `Alert has been marked as ${status}`,
        });
      } catch {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update alert status',
        });
      }
    },
    [mutate, addNotification]
  );

  return {
    alerts: data || [],
    isLoading,
    isError: !!error,
    mutate,
    updateStatus: handleUpdateStatus,
  };
}

export function useAlertStats(refreshInterval: number = 5000) {
  const { data, error, isLoading } = useSWR('alert-stats', getAlertStats, {
    refreshInterval,
  });

  return {
    stats: data,
    isLoading,
    isError: !!error,
  };
}
