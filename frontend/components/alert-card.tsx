'use client';

import { AlertTriangle, Check, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Alert } from '@/lib/types';

interface AlertCardProps {
  alert: Alert;
  onMarkReviewed?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function AlertCard({ alert, onMarkReviewed, onEscalate, onDismiss }: AlertCardProps) {
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
    <div className="rounded-lg border border-fraud/30 bg-fraud/5 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-fraud/20 p-2">
            <AlertTriangle className="h-5 w-5 text-fraud" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">{alert.transaction_id}</span>
              <Badge variant="outline" className="bg-fraud/20 text-fraud border-fraud/30">
                {alert.risk_score.toFixed(1)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              User: {alert.user_id} • {formatAmount(alert.amount)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.flagged_rules.map((rule, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {rule}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(alert.timestamp)}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-safe/30 text-safe hover:bg-safe/10"
          onClick={() => onMarkReviewed?.(alert.id)}
        >
          <Check className="mr-1 h-4 w-4" />
          Mark Reviewed
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-suspicious/30 text-suspicious hover:bg-suspicious/10"
          onClick={() => onEscalate?.(alert.id)}
        >
          <ChevronUp className="mr-1 h-4 w-4" />
          Escalate
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-muted-foreground/30 text-muted-foreground hover:bg-muted"
          onClick={() => onDismiss?.(alert.id)}
        >
          <X className="mr-1 h-4 w-4" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
