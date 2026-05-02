'use client';

import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
  compact?: boolean;
}

export function TransactionTable({ transactions, onRowClick, compact = false }: TransactionTableProps) {
  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'Safe':
        return 'bg-safe/20 text-safe border-safe/30';
      case 'Suspicious':
        return 'bg-suspicious/20 text-suspicious border-suspicious/30';
      case 'Fraud':
        return 'bg-fraud/20 text-fraud border-fraud/30';
      default:
        return '';
    }
  };

  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return 'bg-safe/10 text-safe border-safe/20';
      case 'OTP Required':
        return 'bg-suspicious/10 text-suspicious border-suspicious/20';
      case 'Blocked':
        return 'bg-fraud/10 text-fraud border-fraud/20';
      default:
        return '';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-3 text-xs font-medium text-muted-foreground">Transaction ID</th>
            <th className="pb-3 text-xs font-medium text-muted-foreground">User ID</th>
            <th className="pb-3 text-xs font-medium text-muted-foreground">Amount</th>
            <th className="pb-3 text-xs font-medium text-muted-foreground">Risk Score</th>
            <th className="pb-3 text-xs font-medium text-muted-foreground">Risk Level</th>
            <th className="pb-3 text-xs font-medium text-muted-foreground">Decision</th>
            <th className="pb-3 text-xs font-medium text-muted-foreground">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.transaction_id}
              onClick={() => onRowClick?.(transaction)}
              className={cn(
                'border-b border-border/50 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-secondary/50'
              )}
            >
              <td className={cn('py-3 font-mono text-sm', compact ? 'py-2' : 'py-3')}>
                {transaction.transaction_id}
              </td>
              <td className={cn('font-mono text-sm text-muted-foreground', compact ? 'py-2' : 'py-3')}>
                {transaction.user_id}
              </td>
              <td className={cn('font-medium', compact ? 'py-2' : 'py-3')}>
                {formatAmount(transaction.amount)}
              </td>
              <td className={compact ? 'py-2' : 'py-3'}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        transaction.risk_score >= 80
                          ? 'bg-fraud'
                          : transaction.risk_score >= 50
                          ? 'bg-suspicious'
                          : 'bg-safe'
                      )}
                      style={{ width: `${transaction.risk_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{transaction.risk_score}</span>
                </div>
              </td>
              <td className={compact ? 'py-2' : 'py-3'}>
                <Badge variant="outline" className={getRiskBadgeVariant(transaction.risk_level)}>
                  {transaction.risk_level}
                </Badge>
              </td>
              <td className={compact ? 'py-2' : 'py-3'}>
                <Badge variant="outline" className={getDecisionBadgeVariant(transaction.decision)}>
                  {transaction.decision}
                </Badge>
              </td>
              <td className={cn('text-sm text-muted-foreground', compact ? 'py-2' : 'py-3')}>
                {formatDate(transaction.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
