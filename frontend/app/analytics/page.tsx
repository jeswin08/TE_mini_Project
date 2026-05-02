'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { FraudByHourChart } from '@/components/charts/fraud-by-hour-chart';
import { TopRulesChart } from '@/components/charts/top-rules-chart';
import { FraudTrendChart } from '@/components/charts/fraud-trend-chart';
import { useFraudByHour, useTopFlaggedRules, useFraudTrend } from '@/hooks/use-analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, BarChart, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
      <Skeleton className="h-6 w-40 mb-2" />
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </div>
  );
}

export default function AnalyticsPage() {
  const { hourlyData, isLoading: hourlyLoading } = useFraudByHour();
  const { rules, isLoading: rulesLoading } = useTopFlaggedRules();
  const { trends, isLoading: trendsLoading } = useFraudTrend();

  return (
    <DashboardLayout>
      <Header title="Fraud Analytics" subtitle="In-depth fraud pattern analysis" />
      
      <div className="p-6 space-y-6">
        {/* Fraud Trend */}
        {trendsLoading ? (
          <ChartSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Fraud Trend Over Time</h3>
                <p className="text-sm text-muted-foreground">30-day fraud detection analysis</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-safe">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-safe"
                />
                <span>Live data</span>
              </div>
            </div>
            <FraudTrendChart data={trends} />
          </motion.div>
        )}

        {/* Two column charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {hourlyLoading ? (
            <ChartSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-card-foreground">Fraud by Hour</h3>
              <p className="mb-4 text-sm text-muted-foreground">24-hour fraud activity pattern</p>
              <FraudByHourChart data={hourlyData} />
            </motion.div>
          )}

          {rulesLoading ? (
            <ChartSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-card-foreground">Top Triggered Rules</h3>
              <p className="mb-4 text-sm text-muted-foreground">Most frequently flagged fraud rules</p>
              <TopRulesChart data={rules} />
            </motion.div>
          )}
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-card-foreground">Key Insights</h3>
          <p className="mb-4 text-sm text-muted-foreground">AI-generated fraud pattern observations</p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border border-suspicious/30 bg-suspicious/5 p-4"
            >
              <h4 className="font-medium text-suspicious">Peak Fraud Hours</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Fraud attempts peak between 1:00 AM - 5:00 AM when user vigilance is lowest.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border border-fraud/30 bg-fraud/5 p-4"
            >
              <h4 className="font-medium text-fraud">High-Risk Pattern</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Location mismatches combined with new devices account for 45% of blocked transactions.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border border-safe/30 bg-safe/5 p-4"
            >
              <h4 className="font-medium text-safe">Detection Improvement</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                AI model accuracy improved 12% this month with enhanced behavioral analysis.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
