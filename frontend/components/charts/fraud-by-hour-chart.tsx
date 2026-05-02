'use client';

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import type { HourlyFraud } from '@/lib/types';

interface FraudByHourChartProps {
  data: HourlyFraud[];
}

export function FraudByHourChart({ data }: FraudByHourChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: `${item.hour.toString().padStart(2, '0')}:00`,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            interval={2}
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
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value: number) => [`${value} fraud cases`, 'Fraud Count']}
          />
          <Bar
            dataKey="count"
            fill="oklch(0.6 0.22 25)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
