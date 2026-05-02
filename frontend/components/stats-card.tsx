'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'safe' | 'suspicious' | 'fraud';
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  const variantStyles = {
    default: 'border-border bg-card/50 hover:bg-card/80',
    safe: 'border-safe/20 bg-safe/5 hover:bg-safe/10',
    suspicious: 'border-suspicious/20 bg-suspicious/5 hover:bg-suspicious/10',
    fraud: 'border-fraud/20 bg-fraud/5 hover:bg-fraud/10',
  };

  const iconStyles = {
    default: 'bg-secondary/80 text-foreground shadow-lg',
    safe: 'bg-safe/20 text-safe shadow-safe/20',
    suspicious: 'bg-suspicious/20 text-suspicious shadow-suspicious/20',
    fraud: 'bg-fraud/20 text-fraud shadow-fraud/20',
  };

  const glowStyles = {
    default: '',
    safe: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    suspicious: 'shadow-[0_0_20px_rgba(234,179,8,0.1)]',
    fraud: 'shadow-[0_0_20px_rgba(239,68,68,0.1)]',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'rounded-xl border backdrop-blur-sm p-6 transition-all duration-300',
        variantStyles[variant],
        glowStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={String(value)}
            className="text-3xl font-bold tracking-tight text-card-foreground"
          >
            {value}
          </motion.p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-safe' : 'text-fraud'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}% from last hour</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3 shadow-lg', iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
