'use client';

import { X, AlertTriangle, MapPin, Smartphone, Clock, DollarSign, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TransactionDetailPanelProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetailPanel({ transaction, onClose }: TransactionDetailPanelProps) {
  const getRiskBadgeClass = () => {
    switch (transaction.risk_level) {
      case 'Safe':
        return 'bg-safe/20 text-safe border-safe/30';
      case 'Suspicious':
        return 'bg-suspicious/20 text-suspicious border-suspicious/30';
      case 'Fraud':
        return 'bg-fraud/20 text-fraud border-fraud/30';
    }
  };

  const getDecisionBadgeClass = () => {
    switch (transaction.decision) {
      case 'Approved':
        return 'bg-safe/10 text-safe border-safe/20';
      case 'OTP Required':
        return 'bg-suspicious/10 text-suspicious border-suspicious/20';
      case 'Blocked':
        return 'bg-fraud/10 text-fraud border-fraud/20';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getRiskBarColor = () => {
    if (transaction.risk_score >= 80) return 'bg-fraud';
    if (transaction.risk_score >= 50) return 'bg-suspicious';
    return 'bg-safe';
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold">Transaction Investigation</h2>
            <p className="font-mono text-sm text-muted-foreground">{transaction.transaction_id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Risk Score */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Risk Score</span>
              <span className={cn('text-2xl font-bold', 
                transaction.risk_score >= 80 ? 'text-fraud' :
                transaction.risk_score >= 50 ? 'text-suspicious' : 'text-safe'
              )}>
                {transaction.risk_score}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full rounded-full transition-all animate-risk-fill', getRiskBarColor())}
                style={{ width: `${transaction.risk_score}%` }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className={getRiskBadgeClass()}>
                {transaction.risk_level}
              </Badge>
              <Badge variant="outline" className={getDecisionBadgeClass()}>
                {transaction.decision}
              </Badge>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Transaction Details</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-secondary p-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">{formatAmount(transaction.amount, transaction.currency)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-secondary p-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{transaction.user_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Merchant</p>
                  <p className="font-medium">{transaction.merchant}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-secondary p-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{transaction.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Device ID</p>
                  <p className="font-mono text-sm">{transaction.device_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{formatDate(transaction.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flagged Rules */}
          {transaction.flagged_rules.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-fraud" />
                Flagged Rules
              </h3>
              <div className="space-y-2">
                {transaction.flagged_rules.map((rule, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-fraud/30 bg-fraud/5 p-3 text-sm"
                  >
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {transaction.explanation && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">AI Analysis</h3>
              <p className="text-sm leading-relaxed text-card-foreground">{transaction.explanation}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1">
              Take Action
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
