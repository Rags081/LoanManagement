import React from 'react';
import Card from '@/components/common/Card';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  bg?: string;
  trendBadge?: {
    text: string;
    type?: 'success' | 'danger' | 'warning' | 'neutral';
  };
  isLoading?: boolean;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  bg = 'bg-white border-slate-200',
  trendBadge,
  isLoading = false,
}) => {
  const getBadgeClass = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'danger':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card className={`p-4 border ${bg} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {isLoading ? (
              <span className="inline-block w-28 h-7 bg-slate-200 animate-pulse rounded" />
            ) : (
              value
            )}
          </h3>

          <div className="flex items-center gap-2 mt-1.5">
            {trendBadge && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getBadgeClass(trendBadge.type)}`}>
                {trendBadge.text}
              </span>
            )}
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100/80">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default MetricsCard;
