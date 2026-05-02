'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { Loader2, Info, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamically import the 3D scene to avoid SSR issues
const FraudNetworkScene = dynamic(
  () => import('@/components/3d/fraud-network-scene').then((mod) => mod.FraudNetworkScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-8rem)] rounded-xl border border-border bg-card/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading 3D visualization...</p>
        </div>
      </div>
    ),
  }
);

export default function NetworkPage() {
  const [showHelp, setShowHelp] = useState(true);

  return (
    <DashboardLayout>
      <Header title="Fraud Network Visualization" subtitle="Interactive 3D view of transaction relationships" />
      
      <div className="p-6 space-y-4">
        {/* Legend and Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 fill-safe text-safe" />
              <span className="text-sm text-muted-foreground">Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 fill-suspicious text-suspicious" />
              <span className="text-sm text-muted-foreground">Suspicious</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 fill-fraud text-fraud" />
              <span className="text-sm text-muted-foreground">Fraud</span>
            </div>
            <div className="border-l border-border h-4" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Spheres: Users</span>
              <span>Cubes: Merchants</span>
              <span>Diamonds: Transactions</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-4 w-4" />
            {showHelp ? 'Hide' : 'Show'} Controls
          </button>
        </motion.div>

        {/* Help Panel */}
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-foreground">Rotate</p>
                <p className="text-muted-foreground">Left click + drag</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Zoom</p>
                <p className="text-muted-foreground">Scroll wheel</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Pan</p>
                <p className="text-muted-foreground">Right click + drag</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Hover over nodes to see transaction details. Fraud nodes pulse red and are connected by highlighted edges.
            </p>
          </motion.div>
        )}

        {/* 3D Scene */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FraudNetworkScene />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
