import React from 'react';
import Card from '@/components/common/Card';
import { ActivityLogItem } from '@/types/dashboard';
import { formatDate } from '@/utils/formatters';
import { Activity, HandCoins, CreditCard, Landmark, Users, ShieldAlert } from 'lucide-react';

interface RecentActivityListProps {
  activities?: ActivityLogItem[];
  isLoading?: boolean;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities = [],
  isLoading = false,
}) => {
  const getEntityIcon = (entity: string, action: string) => {
    if (action === 'VOID') return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    switch (entity) {
      case 'loan':
        return <HandCoins className="w-4 h-4 text-indigo-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'capital':
        return <Landmark className="w-4 h-4 text-amber-600" />;
      case 'borrower':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEntityBadge = (_entity: string, action: string) => {
    if (action === 'VOID') {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">VOID</span>;
    }
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">NEW</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">EDIT</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <Card className="p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent System Activity</h3>
            <p className="text-xs text-slate-500">Live operational audit stream</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse p-2">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent activity recorded yet.
          </div>
        ) : (
          activities.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100/80 shadow-xs mt-0.5">
                  {getEntityIcon(a.entity, a.action)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 capitalize">
                      {a.user}
                    </span>
                    {getEntityBadge(a.entity, a.action)}
                  </div>
                  <p className="text-xs text-slate-600">
                    {a.details || `${a.action} on ${a.entity} #${a.entityId}`}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap mt-1">
                {formatDate(a.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentActivityList;
