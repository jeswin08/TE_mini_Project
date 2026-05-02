export type RiskLevel = 'Safe' | 'Suspicious' | 'Fraud';
export type Decision = 'Approved' | 'OTP Required' | 'Blocked';

export interface Transaction {
  transaction_id: string;
  user_id: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string;
  device_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  flagged_rules: string[];
  timestamp: string;
  explanation?: string;
}

export interface DashboardStats {
  total_transactions: number;
  fraud_detected: number;
  fraud_rate: number;
  total_amount_protected: number;
  risk_distribution: RiskDistribution;
  alerted_risk_distribution: RiskDistribution;
}
Safe: number;
  Suspicious: number;
  Fafe: number;
  suspicious: number;
  fraud: number;
}

export interface HourlyFraud {
  hour: number;
  count: number;
}

export interface FlaggedRule {
  rule: string;
  count: number;
}

export interface SystemMetrics {
  uptime: string;
  transactions_processed: number;
  avg_processing_time: number;
  fraud_detection_rate: number;
  api_status: 'operational' | 'degraded' | 'down';
  model_status: 'operational' | 'degraded' | 'down';
  database_status: 'operational' | 'degraded' | 'down';
}

export interface TransactionAnalysis {
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  flagged_rules: string[];
  explanation: string;
}

export interface TransactionFormData {
  user_id: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string;
  device_id: string;
  usual_location: string;
  usual_device: string;
  user_avg_amount: number;
  hour_of_day: number;
}

export interface Alert {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  risk_score: number;
  flagged_rules: string[];
  timestamp: string;
  status: 'active' | 'reviewed' | 'escalated' | 'dismissed';
}

export interface AlertStats {
  active_alerts: number;
  blocked_today: number;
  investigations_pending: number;
}

export interface FraudTrend {
  date: string;
  fraud_count: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'analyst' | 'admin' | 'viewer';
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface NetworkNode {
  id: string;
  type: 'user' | 'merchant' | 'transaction';
  riskLevel: RiskLevel;
  position: [number, number, number];
  connections: string[];
  label: string;
  amount?: number;
  riskScore?: number;
}
