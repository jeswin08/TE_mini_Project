'use client';

import { Sidebar } from './sidebar';
import { AuthGuard } from './auth-guard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-64 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
