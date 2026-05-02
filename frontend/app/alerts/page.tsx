'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { StatsCard } from '@/components/stats-card';
import { AlertCard } from '@/components/alert-card';
import { useAlerts, useAlertStats } from '@/hooks/use-alerts';
import { Bell, ShieldOff, Search as SearchIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsPage() {
  const { alerts, isLoading: alertsLoading, updateStatus } = useAlerts();
  const { stats, isLoading: statsLoading } = useAlertStats();

  const handleMarkReviewed = (id: string) => {
    updateStatus(id, 'reviewed');
  };

  const handleEscalate = (id: string) => {
    updateStatus(id, 'escalated');
  };

  const handleDismiss = (id: string) => {
    updateStatus(id, 'dismissed');
  };

  return (
    <DashboardLayout>
      <Header title="Alerts" subtitle="High-risk transaction alerts requiring attention" />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <StatsCard
                  title="Active Alerts"
                  value={stats?.active_alerts ?? 0}
                  icon={Bell}
                  variant="fraud"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StatsCard
                  title="Blocked Today"
                  value={stats?.blocked_today ?? 0}
                  icon={ShieldOff}
                  variant="suspicious"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StatsCard
                  title="Investigations Pending"
                  value={stats?.investigations_pending ?? 0}
                  icon={SearchIcon}
                />
              </motion.div>
            </>
          )}
        </div>

        {/* Alerts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">High-Risk Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Transactions with risk score &gt;= 80 requiring review
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-safe">
              {alertsLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-safe"
                />
              )}
              <span>Auto-refreshing</span>
            </div>
          </div>

          {alertsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No active alerts</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AlertCard
                    alert={alert}
                    onMarkReviewed={handleMarkReviewed}
                    onEscalate={handleEscalate}
                    onDismiss={handleDismiss}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
