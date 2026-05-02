'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { TransactionTable } from '@/components/transaction-table';
import { TransactionDetailPanel } from '@/components/transaction-detail-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllTransactions } from '@/hooks/use-transactions';
import type { Transaction, RiskLevel } from '@/lib/types';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const PAGE_SIZE = 15;

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | undefined>();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { transactions, total, isLoading } = useAllTransactions(
    page,
    PAGE_SIZE,
    riskFilter,
    search
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const riskFilters: { label: string; value: RiskLevel | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'Safe', value: 'Safe' },
    { label: 'Suspicious', value: 'Suspicious' },
    { label: 'Fraud', value: 'Fraud' },
  ];

  const getFilterClass = (value: RiskLevel | undefined) => {
    if (value === riskFilter) {
      if (value === 'Safe') return 'bg-safe/20 text-safe border-safe/30';
      if (value === 'Suspicious') return 'bg-suspicious/20 text-suspicious border-suspicious/30';
      if (value === 'Fraud') return 'bg-fraud/20 text-fraud border-fraud/30';
      return 'bg-primary text-primary-foreground';
    }
    return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
  };

  return (
    <DashboardLayout>
      <Header title="Transactions Monitor" subtitle="Search and investigate transactions" />
      
      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, user, or merchant..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-80 pl-9 bg-input/50"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {riskFilters.map((filter) => (
              <Button
                key={filter.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setRiskFilter(filter.value);
                  setPage(1);
                }}
                className={cn('border', getFilterClass(filter.value))}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-lg"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Transaction Records</h3>
                <p className="text-sm text-muted-foreground">
                  {total.toLocaleString()} transactions found
                </p>
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
                <span>Live updates</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <TransactionTable
                transactions={transactions}
                onRowClick={setSelectedTransaction}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Transaction Detail Panel */}
      {selectedTransaction && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedTransaction(null)}
          />
          <TransactionDetailPanel
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        </>
      )}
    </DashboardLayout>
  );
}
