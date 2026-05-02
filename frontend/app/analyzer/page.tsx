'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Header } from '@/components/header';
import { RiskMeter } from '@/components/risk-meter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { analyzeTransaction } from '@/services/api';
import { useNotifications } from '@/hooks/use-notifications';
import { motion } from 'framer-motion';
import type { TransactionFormData, TransactionAnalysis } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Shield, Loader2 } from 'lucide-react';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
const merchants = [
  'Amazon', 'Walmart', 'Target', 'Best Buy', 'Apple Store',
  'Steam', 'Netflix', 'Uber', 'DoorDash', 'Starbucks',
  'Shell Gas', 'Unknown Merchant', 'Foreign ATM', 'Wire Transfer'
];
const locations = [
  'New York, US', 'Los Angeles, US', 'Chicago, US', 'Houston, US',
  'London, UK', 'Paris, FR', 'Tokyo, JP', 'Sydney, AU',
  'Unknown Location', 'VPN Detected'
];

export default function AnalyzerPage() {
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState<TransactionFormData>({
    user_id: 'USR-ABC123',
    amount: 250,
    currency: 'USD',
    merchant: 'Amazon',
    location: 'New York, US',
    device_id: 'DEV-XYZ789',
    usual_location: 'New York, US',
    usual_device: 'DEV-XYZ789',
    user_avg_amount: 150,
    hour_of_day: new Date().getHours(),
  });
  const [result, setResult] = useState<TransactionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const analysis = await analyzeTransaction(formData);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      addNotification({
        type: 'error',
        title: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unable to analyze transaction right now.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TransactionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getDecisionIcon = () => {
    if (!result) return null;
    switch (result.decision) {
      case 'Approved':
        return <CheckCircle className="h-6 w-6 text-safe" />;
      case 'OTP Required':
        return <Shield className="h-6 w-6 text-suspicious" />;
      case 'Blocked':
        return <AlertTriangle className="h-6 w-6 text-fraud" />;
    }
  };

  const getDecisionClass = () => {
    if (!result) return '';
    switch (result.decision) {
      case 'Approved':
        return 'border-safe/30 bg-safe/10 text-safe';
      case 'OTP Required':
        return 'border-suspicious/30 bg-suspicious/10 text-suspicious';
      case 'Blocked':
        return 'border-fraud/30 bg-fraud/10 text-fraud';
    }
  };

  return (
    <DashboardLayout>
      <Header title="Transaction Analyzer" subtitle="Simulate and analyze transaction risk" />
      
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-card-foreground">Transaction Details</h3>
            <p className="mb-6 text-sm text-muted-foreground">Enter transaction parameters to analyze</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    value={formData.user_id}
                    onChange={(e) => handleInputChange('user_id', e.target.value)}
                    placeholder="USR-XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c} className="bg-card">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant</Label>
                  <select
                    id="merchant"
                    value={formData.merchant}
                    onChange={(e) => handleInputChange('merchant', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {merchants.map((m) => (
                      <option key={m} value={m} className="bg-card">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <select
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {locations.map((l) => (
                      <option key={l} value={l} className="bg-card">{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device_id">Device ID</Label>
                  <Input
                    id="device_id"
                    value={formData.device_id}
                    onChange={(e) => handleInputChange('device_id', e.target.value)}
                    placeholder="DEV-XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usual_location">Usual Location</Label>
                  <select
                    id="usual_location"
                    value={formData.usual_location}
                    onChange={(e) => handleInputChange('usual_location', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {locations.map((l) => (
                      <option key={l} value={l} className="bg-card">{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usual_device">Usual Device</Label>
                  <Input
                    id="usual_device"
                    value={formData.usual_device}
                    onChange={(e) => handleInputChange('usual_device', e.target.value)}
                    placeholder="DEV-XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_avg_amount">User Avg Amount</Label>
                  <Input
                    id="user_avg_amount"
                    type="number"
                    value={formData.user_avg_amount}
                    onChange={(e) => handleInputChange('user_avg_amount', parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hour_of_day">Hour of Day (0-23)</Label>
                  <Input
                    id="hour_of_day"
                    type="number"
                    value={formData.hour_of_day}
                    onChange={(e) => handleInputChange('hour_of_day', parseInt(e.target.value) || 0)}
                    min={0}
                    max={23}
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Transaction
              </Button>
            </form>
          </div>

          {/* Results */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-card-foreground">Analysis Results</h3>
            <p className="mb-6 text-sm text-muted-foreground">AI-powered risk assessment</p>
            
            {!result && !loading && (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <p>Submit a transaction to see analysis results</p>
              </div>
            )}

            {loading && (
              <div className="flex h-[400px] flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Analyzing transaction...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6">
                {/* Risk Meter */}
                <div className="flex justify-center py-4">
                  <RiskMeter score={result.risk_score} />
                </div>

                {/* Decision Card */}
                <div className={cn('rounded-lg border p-4', getDecisionClass())}>
                  <div className="flex items-center gap-3">
                    {getDecisionIcon()}
                    <div>
                      <p className="font-semibold">{result.decision}</p>
                      <p className="text-sm opacity-80">Risk Level: {result.risk_level}</p>
                    </div>
                  </div>
                </div>

                {/* Flagged Rules */}
                {result.flagged_rules.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Flagged Rules</p>
                    <div className="flex flex-wrap gap-2">
                      {result.flagged_rules.map((rule, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-fraud/30 bg-fraud/10 text-fraud"
                        >
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Explanation</p>
                  <p className="text-sm text-card-foreground leading-relaxed">{result.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
