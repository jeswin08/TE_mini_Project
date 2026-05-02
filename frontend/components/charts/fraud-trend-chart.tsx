'use client';

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import type { FraudTrend } from '@/lib/types';

interface FraudTrendChartProps {
  data: FraudTrend[];
}

export function FraudTrendChart({ data }: FraudTrendChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.6 0.22 25)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.6 0.22 25)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            interval={4}
          />
          <YAxis
            tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.16 0.01 260)',
              border: '1px solid oklch(0.28 0.01 260)',
              borderRadius: '8px',
              color: 'oklch(0.95 0 0)',
            }}
            formatter={(value: number) => [`${value} cases`, 'Fraud Count']}
          />
          <Area
            type="monotone"
            dataKey="fraud_count"
            stroke="oklch(0.6 0.22 25)"
            strokeWidth={2}
            fill="url(#fraudGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
