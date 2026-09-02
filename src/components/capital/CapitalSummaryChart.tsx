import React from 'react';
import Card from '@/components/common/Card';
import { CapitalSummary } from '@/types/capital';
import { formatCurrency } from '@/utils/currency';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface CapitalSummaryChartProps {
  data?: CapitalSummary[];
  isLoading?: boolean;
}

export const CapitalSummaryChart: React.FC<CapitalSummaryChartProps> = ({
  data = [],
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Loading monthly capital metrics...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Capital Flow Analysis</h3>
            <p className="text-xs text-slate-500">Monthly capital given vs returned</p>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
          No monthly capital transactions recorded for this period.
        </div>
      ) : (
        <div className="h-64 w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="period" tickLine={false} stroke="#64748b" fontSize={12} />
              <YAxis
                tickLine={false}
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="given" name="Capital Given" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" name="Capital Returned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default CapitalSummaryChart;
