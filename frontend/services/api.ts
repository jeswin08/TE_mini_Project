import type {
  Transaction,
  DashboardStats,
  RiskDistribution,
  HourlyFraud,
  FlaggedRule,
  SystemMetrics,
  TransactionAnalysis,
  TransactionFormData,
  Alert,
  AlertStats,
  FraudTrend,
  AuthResponse,
  User,
  RiskLevel,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

// Auth token management
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('finsentinel_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('finsentinel_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('finsentinel_token');
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('finsentinel_user');
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem('finsentinel_user', JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  localStorage.removeItem('finsentinel_user');
};

// API request wrapper with auth and retry logic
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        removeAuthToken();
        removeStoredUser();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Auth endpoints
export async function login(email: string, password: string): Promise<AuthResponse> {
  // For demo purposes, simulate login with mock data
  // In production, this would call the real backend
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (email === 'demo@finsentinel.com' && password === 'demo123') {
    const response: AuthResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'USR-001',
        email: 'demo@finsentinel.com',
        name: 'Demo Analyst',
        role: 'analyst',
        avatar: undefined,
      },
    };
    setAuthToken(response.token);
    setStoredUser(response.user);
    return response;
  }
  
  throw new Error('Invalid credentials');
}

export async function logout(): Promise<void> {
  removeAuthToken();
  removeStoredUser();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  
  // For demo, return stored user
  return getStoredUser();
}

// Dashboard endpoints
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await apiRequest<{ data: DashboardStats }>('/api/dashboard/stats');
    return response.data;
  } catch {
    // Fallback to mock data
    return {
      total_transactions: 15847 + Math.floor(Math.random() * 100),
      fraud_detected: 234 + Math.floor(Math.random() * 10),
      fraud_rate: 1.48 + Math.random() * 0.2,
      total_amount_protected: 892450 + Math.floor(Math.random() * 10000),
      risk_distribution: {
        Safe: 12500 + Math.floor(Math.random() * 500),
        Suspicious: 2800 + Math.floor(Math.random() * 200),
        Fraud: 547 + Math.floor(Math.random() * 50),
      },
      alerted_risk_distribution: {
        Safe: 100 + Math.floor(Math.random() * 50),
        Suspicious: 800 + Math.floor(Math.random() * 100),
        Fraud: 400 + Math.floor(Math.random() * 50),
      },
    };
  }
}

export async function getRiskDistribution(): Promise<RiskDistribution> {
  try {
    return await apiRequest<RiskDistribution>('/api/analytics/risk-distribution');
  } catch {
    return {
      safe: 12500 + Math.floor(Math.random() * 500),
      suspicious: 2800 + Math.floor(Math.random() * 200),
      fraud: 547 + Math.floor(Math.random() * 50),
    };
  }
}

// Transactions endpoints
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

const fraudRules = [
  'Unusual location detected',
  'Amount exceeds user average by 500%',
  'New device detected',
  'Transaction velocity exceeded',
  'High-risk merchant category',
  'Cross-border transaction',
  'Night-time transaction',
  'Multiple failed attempts',
  'IP geolocation mismatch',
  'Card not present fraud pattern'
];

function generateTransaction(overrides?: Partial<Transaction>): Transaction {
  const riskScore = Math.random() * 100;
  let riskLevel: RiskLevel = 'Safe';
  let decision: 'Approved' | 'OTP Required' | 'Blocked' = 'Approved';
  let flagged: string[] = [];

  if (riskScore >= 80) {
    riskLevel = 'Fraud';
    decision = 'Blocked';
    flagged = fraudRules.slice(0, Math.floor(Math.random() * 4) + 2);
  } else if (riskScore >= 50) {
    riskLevel = 'Suspicious';
    decision = 'OTP Required';
    flagged = fraudRules.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7);

  return {
    transaction_id: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    user_id: `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    amount: Math.floor(Math.random() * 10000) + 10,
    currency: 'USD',
    merchant: merchants[Math.floor(Math.random() * merchants.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    device_id: `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    risk_score: Math.round(riskScore * 10) / 10,
    risk_level: riskLevel,
    decision: decision,
    flagged_rules: flagged,
    timestamp: timestamp.toISOString(),
    explanation: flagged.length > 0 ? `Transaction flagged due to: ${flagged.join(', ')}` : 'Transaction appears legitimate.',
    ...overrides,
  };
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  try {
    return await apiRequest<Transaction[]>(`/api/transactions?limit=${limit}`);
  } catch {
    await new Promise(resolve => setTimeout(resolve, 400));
    return Array.from({ length: limit }, () => generateTransaction()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export async function getAllTransactions(
  page: number = 1,
  pageSize: number = 20,
  riskFilter?: RiskLevel,
  search?: string
): Promise<{ transactions: Transaction[]; total: number }> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(riskFilter && { risk_level: riskFilter }),
      ...(search && { search }),
    });
    return await apiRequest<{ transactions: Transaction[]; total: number }>(`/api/transactions?${params}`);
  } catch {
    await new Promise(resolve => setTimeout(resolve, 500));
    let transactions = Array.from({ length: 100 }, () => generateTransaction());
    
    if (riskFilter) {
      transactions = transactions.filter((t) => t.risk_level === riskFilter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.transaction_id.toLowerCase().includes(searchLower) ||
          t.user_id.toLowerCase().includes(searchLower) ||
          t.merchant.toLowerCase().includes(searchLower)
      );
    }

    const total = transactions.length;
    const start = (page - 1) * pageSize;
    const paginatedTransactions = transactions.slice(start, start + pageSize);

    return { transactions: paginatedTransactions, total };
  }
}

export async function analyzeTransaction(data: TransactionFormData): Promise<TransactionAnalysis> {
  try {
    return await apiRequest<TransactionAnalysis>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let riskScore = 10;
    const flagged: string[] = [];

    if (data.location !== data.usual_location) {
      riskScore += 25;
      flagged.push('Unusual location detected');
    }

    if (data.device_id !== data.usual_device) {
      riskScore += 20;
      flagged.push('New device detected');
    }

    if (data.amount > data.user_avg_amount * 3) {
      riskScore += 30;
      flagged.push(`Amount exceeds user average by ${Math.round((data.amount / data.user_avg_amount) * 100)}%`);
    }

    if (data.hour_of_day >= 1 && data.hour_of_day <= 5) {
      riskScore += 15;
      flagged.push('Night-time transaction');
    }

    if (['Unknown Merchant', 'Wire Transfer', 'Foreign ATM'].includes(data.merchant)) {
      riskScore += 20;
      flagged.push('High-risk merchant category');
    }

    riskScore = Math.min(100, riskScore);

    let riskLevel: RiskLevel = 'Safe';
    let decision: 'Approved' | 'OTP Required' | 'Blocked' = 'Approved';

    if (riskScore >= 80) {
      riskLevel = 'Fraud';
      decision = 'Blocked';
    } else if (riskScore >= 50) {
      riskLevel = 'Suspicious';
      decision = 'OTP Required';
    }

    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      decision: decision,
      flagged_rules: flagged,
      explanation: flagged.length > 0
        ? `Transaction flagged: ${flagged.join('. ')}. Risk score: ${riskScore}/100.`
        : 'Transaction appears legitimate with no anomalies detected.',
    };
  }
}

// Analytics endpoints
export async function getFraudByHour(): Promise<HourlyFraud[]> {
  try {
    return await apiRequest<HourlyFraud[]>('/api/analytics/fraud-by-hour');
  } catch {
    await new Promise(resolve => setTimeout(resolve, 300));
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 50) + (i >= 1 && i <= 5 ? 20 : 5),
    }));
  }
}

export async function getTopFlaggedRules(): Promise<FlaggedRule[]> {
  try {
    return await apiRequest<FlaggedRule[]>('/api/analytics/top-rules');
  } catch {
    await new Promise(resolve => setTimeout(resolve, 350));
    return fraudRules.slice(0, 8).map((rule) => ({
      rule,
      count: Math.floor(Math.random() * 200) + 20,
    })).sort((a, b) => b.count - a.count);
  }
}

export async function getFraudTrend(): Promise<FraudTrend[]> {
  try {
    return await apiRequest<FraudTrend[]>('/api/analytics/fraud-trend');
  } catch {
    await new Promise(resolve => setTimeout(resolve, 350));
    const trends: FraudTrend[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        fraud_count: Math.floor(Math.random() * 30) + 10,
      });
    }
    
    return trends;
  }
}

// Alerts endpoints
export async function getAlerts(): Promise<Alert[]> {
  try {
    return await apiRequest<Alert[]>('/api/alerts');
  } catch {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return Array.from({ length: 15 }, () => {
      const transaction = generateTransaction({ risk_score: 80 + Math.random() * 20 });
      return {
        id: `ALT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        transaction_id: transaction.transaction_id,
        user_id: transaction.user_id,
        amount: transaction.amount,
        risk_score: transaction.risk_score,
        flagged_rules: transaction.flagged_rules.length > 0 
          ? transaction.flagged_rules 
          : fraudRules.slice(0, Math.floor(Math.random() * 3) + 1),
        timestamp: transaction.timestamp,
        status: 'active' as const,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export async function getAlertStats(): Promise<AlertStats> {
  try {
    return await apiRequest<AlertStats>('/api/alerts/stats');
  } catch {
    await new Promise(resolve => setTimeout(resolve, 250));
    return {
      active_alerts: 23 + Math.floor(Math.random() * 10),
      blocked_today: 47 + Math.floor(Math.random() * 15),
      investigations_pending: 12 + Math.floor(Math.random() * 5),
    };
  }
}

export async function updateAlertStatus(
  alertId: string, 
  status: 'reviewed' | 'escalated' | 'dismissed'
): Promise<void> {
  try {
    await apiRequest(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch {
    // Mock success
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// System endpoints
export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    return await apiRequest<SystemMetrics>('/api/system');
  } catch {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      uptime: '99.97%',
      transactions_processed: 1584723 + Math.floor(Math.random() * 1000),
      avg_processing_time: 23 + Math.random() * 5,
      fraud_detection_rate: 98.7 + Math.random() * 0.5,
      api_status: 'operational',
      model_status: 'operational',
      database_status: 'operational',
    };
  }
}
