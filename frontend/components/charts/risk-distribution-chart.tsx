'use client';

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RiskDistribution } from '@/lib/types';

interface RiskDistributionChartProps {
  overallData: RiskDistribution;
  alertedData: RiskDistribution;
}

const COLORS = {
  Safe: 'oklch(0.65 0.2 145)',
  Suspicious: 'oklch(0.75 0.18 85)',
  Fraud: 'oklch(0.6 0.22 25)',
};

export function RiskDistributionChart({ overallData, alertedData }: RiskDistributionChartProps) {
  const overallChartData = [
    { name: 'Safe', value: overallData.Safe, color: COLORS.Safe },
    { name: 'Suspicious', value: overallData.Suspicious, color: COLORS.Suspicious },
    { name: 'Fraud', value: overallData.Fraud, color: COLORS.Fraud },
  ];

  const alertedChartData = [
    { name: 'Safe', value: alertedData.Safe, color: COLORS.Safe },
    { name: 'Suspicious', value: alertedData.Suspicious, color: COLORS.Suspicious },
    { name: 'Fraud', value: alertedData.Fraud, color: COLORS.Fraud },
  ];

  const totalOverall = overallData.Safe + overallData.Suspicious + overallData.Fraud;
  const totalAlerted = alertedData.Safe + alertedData.Suspicious + alertedData.Fraud;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.16 0.01 260)',
              border: '1px solid oklch(0.28 0.01 260)',
              borderRadius: '8px',
              color: 'oklch(0.95 0 0)',
            }}
            formatter={(value: number, name: string, props) => {
              const total = props.payload.name.includes('alerted') ? totalAlerted : totalOverall;
              return `${value.toLocaleString()} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`;
            }}
          />
          {/* Outer ring for overall transactions */}
          <Pie
            data={overallChartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {overallChartData.map((entry, index) => (
              <Cell key={`cell-overall-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          {/* Inner ring for alerted transactions */}
          <Pie
            data={alertedChartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {alertedChartData.map((entry, index) => (
              <Cell key={`cell-alerted-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ color: 'oklch(0.65 0 0)' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
