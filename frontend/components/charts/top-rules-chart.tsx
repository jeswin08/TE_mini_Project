'use client';

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { FlaggedRule } from '@/lib/types';

interface TopRulesChartProps {
  data: FlaggedRule[];
}

export function TopRulesChart({ data }: TopRulesChartProps) {
  const colors = [
    'oklch(0.6 0.22 25)',
    'oklch(0.65 0.2 35)',
    'oklch(0.7 0.18 45)',
    'oklch(0.72 0.16 55)',
    'oklch(0.74 0.14 65)',
    'oklch(0.75 0.12 75)',
    'oklch(0.76 0.1 85)',
    'oklch(0.77 0.08 95)',
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
          />
          <YAxis
            type="category"
            dataKey="rule"
            tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.16 0.01 260)',
              border: '1px solid oklch(0.28 0.01 260)',
              borderRadius: '8px',
              color: 'oklch(0.95 0 0)',
            }}
            formatter={(value: number) => [`${value} triggers`, 'Count']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
