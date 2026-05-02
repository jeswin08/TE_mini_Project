'use client';

import { useNotifications, type NotificationType } from '@/hooks/use-notifications';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const iconMap: Record<NotificationType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<NotificationType, string> = {
  success: 'border-safe/50 bg-safe/10 text-safe',
  error: 'border-fraud/50 bg-fraud/10 text-fraud',
  warning: 'border-suspicious/50 bg-suspicious/10 text-suspicious',
  info: 'border-primary/50 bg-primary/10 text-primary',
};

export function NotificationsToast() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type];
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm',
                'bg-card/95 min-w-[320px] max-w-[420px]',
                colorMap[notification.type]
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{notification.title}</p>
                {notification.message && (
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="shrink-0 rounded-md p-1 hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
