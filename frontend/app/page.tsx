'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { StatsCard } from '@/components/stats-card';
import { TransactionTable } from '@/components/transaction-table';
import { RiskDistributionChart } from '@/components/charts/risk-distribution-chart';
import { FraudByHourChart } from '@/components/charts/fraud-by-hour-chart';
import { useDashboardStats, useRiskDistribution, useFraudByHour } from '@/hooks/use-analytics';
import { useRecentTransactions } from '@/hooks/use-transactions';
import { Activity, AlertTriangle, Shield, DollarSign, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
      <Skeleton className="h-6 w-40 mb-2" />
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  );
}

export default function DashboardPage() {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { transactions, isLoading: transactionsLoading } = useRecentTransactions(8);
  const { hourlyData, isLoading: hourlyLoading } = useFraudByHour();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout>
      <Header title="Dashboard" subtitle="Real-time fraud monitoring overview" />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <StatsCard
                  title="Total Transactions"
                  value={stats?.total_transactions.toLocaleString() ?? '0'}
                  icon={Activity}
                  trend={{ value: 12, isPositive: true }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StatsCard
                  title="Fraud Detected"
                  value={stats?.fraud_detected.toLocaleString() ?? '0'}
                  icon={AlertTriangle}
                  variant="fraud"
                  trend={{ value: 3, isPositive: false }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StatsCard
                  title="Fraud Rate"
                  value={`${(stats?.fraud_rate ?? 0).toFixed(2)}%`}
                  icon={Shield}
                  variant="suspicious"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <StatsCard
                  title="Amount Protected"
                  value={formatCurrency(stats?.total_amount_protected ?? 0)}
                  icon={DollarSign}
                  variant="safe"
                  trend={{ value: 8, isPositive: true }}
                />
              </motion.div>
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {statsLoading ? (
            <ChartSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-card-foreground">Risk Distribution</h3>
              <p className="text-sm text-muted-foreground">
                Outer: All Transactions, Inner: Alerted Transactions
              </p>
              {stats && (
                <RiskDistributionChart
                  overallData={stats.risk_distribution}
                  alertedData={stats.alerted_risk_distribution}
                />
              )}
            </motion.div>
          )}

          {hourlyLoading ? (
            <ChartSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-card-foreground">Fraud by Hour</h3>
              <p className="text-sm text-muted-foreground">24-hour fraud pattern analysis</p>
              <FraudByHourChart data={hourlyData} />
            </motion.div>
          )}
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground">Latest transaction activity</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-safe">
              {transactionsLoading ? (
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
          {transactionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <TransactionTable transactions={transactions} compact />
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
