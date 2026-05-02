'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { StatsCard } from '@/components/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemMetrics } from '@/hooks/use-system-metrics';
import { Clock, Zap, Timer, Target, Server, Brain, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function SystemPage() {
  const { metrics, isLoading } = useSystemMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-safe';
      case 'degraded':
        return 'bg-suspicious';
      case 'down':
        return 'bg-fraud';
      default:
        return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'down':
        return 'Down';
      default:
        return 'Unknown';
    }
  };

  const getStatusCardClass = (status: string) => {
    switch (status) {
      case 'operational':
        return 'border-safe/30 bg-safe/5';
      case 'degraded':
        return 'border-suspicious/30 bg-suspicious/5';
      case 'down':
        return 'border-fraud/30 bg-fraud/5';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <Header title="System Monitoring" subtitle="Backend infrastructure and model health" />
      
      <div className="p-6 space-y-6">
        {/* Performance Metrics */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Performance Metrics</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <>
                <Skeleton className="h-32 rounded-xl" />
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
                    title="System Uptime"
                    value={metrics?.uptime ?? '0%'}
                    icon={Clock}
                    variant="safe"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <StatsCard
                    title="Transactions Processed"
                    value={metrics?.transactions_processed.toLocaleString() ?? '0'}
                    icon={Zap}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <StatsCard
                    title="Avg Processing Time"
                    value={`${metrics?.avg_processing_time.toFixed(1) ?? '0'} ms`}
                    icon={Timer}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <StatsCard
                    title="Fraud Detection Rate"
                    value={`${metrics?.fraud_detection_rate.toFixed(1) ?? '0'}%`}
                    icon={Target}
                    variant="safe"
                  />
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">System Status</h3>
              <p className="text-sm text-muted-foreground">Real-time infrastructure health</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-safe">
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-safe"
                />
              )}
              <span>Monitoring active</span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* API Status */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn('rounded-xl border p-4 transition-all', getStatusCardClass(metrics?.api_status ?? ''))}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary/80 p-3">
                    <Server className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">API Server</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', getStatusColor(metrics?.api_status ?? ''))} />
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(metrics?.api_status ?? '')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time</span>
                    <span>12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requests/min</span>
                    <span>2,847</span>
                  </div>
                </div>
              </motion.div>

              {/* Model Status */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn('rounded-xl border p-4 transition-all', getStatusCardClass(metrics?.model_status ?? ''))}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary/80 p-3">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">ML Model</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', getStatusColor(metrics?.model_status ?? ''))} />
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(metrics?.model_status ?? '')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inference Time</span>
                    <span>8ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model Version</span>
                    <span>v2.4.1</span>
                  </div>
                </div>
              </motion.div>

              {/* Database Status */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn('rounded-xl border p-4 transition-all', getStatusCardClass(metrics?.database_status ?? ''))}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary/80 p-3">
                    <Database className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Database</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', getStatusColor(metrics?.database_status ?? ''))} />
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(metrics?.database_status ?? '')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Query Time</span>
                    <span>3ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connections</span>
                    <span>124/500</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* System Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-lg"
        >
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">Recent System Events</h3>
          
          <div className="space-y-3">
            {[
              { time: '2 min ago', event: 'Model inference completed', type: 'info' },
              { time: '5 min ago', event: 'High-risk transaction blocked automatically', type: 'warning' },
              { time: '12 min ago', event: 'Database connection pool expanded', type: 'info' },
              { time: '18 min ago', event: 'API rate limit adjusted', type: 'info' },
              { time: '25 min ago', event: 'Model retrained with new fraud patterns', type: 'success' },
            ].map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center gap-4 rounded-lg border border-border bg-card/30 p-3 hover:bg-card/50 transition-colors"
              >
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  log.type === 'success' ? 'bg-safe' :
                  log.type === 'warning' ? 'bg-suspicious' : 'bg-chart-4'
                )} />
                <div className="flex-1">
                  <p className="text-sm">{log.event}</p>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
