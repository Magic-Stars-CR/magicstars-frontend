import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: typeof LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  iconWrapperClassName?: string;
  iconClassName?: string;
  accentDotClassName?: string;
  compact?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  titleClassName,
  valueClassName,
  descriptionClassName,
  iconWrapperClassName,
  iconClassName,
  accentDotClassName,
  compact = false,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-transparent text-slate-900 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md',
        compact ? 'rounded-xl p-3' : 'rounded-2xl p-4',
        className,
      )}
    >
      <span
        className={cn(
          'absolute right-4 top-4 h-2 w-2 rounded-full bg-white/40',
          accentDotClassName,
        )}
      />
      <CardHeader
        className={cn(
          'flex flex-row items-start justify-between space-y-0 pb-4',
          compact && 'pb-3',
        )}
      >
        <div className={cn('flex flex-col gap-2', compact && 'gap-1')}>
          <CardTitle
            className={cn(
              compact
                ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(15,23,42,0.65)]'
                : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(15,23,42,0.65)]',
              titleClassName,
            )}
          >
            {title}
          </CardTitle>
          <div
            className={cn(
              compact ? 'text-2xl font-semibold text-slate-900' : 'text-3xl font-semibold tracking-tight text-slate-900',
              valueClassName,
            )}
          >
            {value}
          </div>
          {description && (
            <p
              className={cn(
                compact ? 'text-[10px] text-[rgba(15,23,42,0.65)]' : 'text-xs text-[rgba(15,23,42,0.65)]',
                descriptionClassName,
              )}
            >
              {description}
            </p>
          )}
        </div>
        <div
          className={cn(
            compact
              ? 'rounded-xl border border-white/40 bg-white/30 p-2 text-slate-600 shadow-inner backdrop-blur-sm'
              : 'rounded-2xl border border-white/40 bg-white/30 p-2.5 text-slate-600 shadow-inner backdrop-blur-sm',
            iconWrapperClassName,
          )}
        >
          <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4', iconClassName)} />
        </div>
      </CardHeader>
      <CardContent>
        {trend && (
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs',
              trend.isPositive ? 'text-green-600' : 'text-red-600',
            )}
          >
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{trend.value}% vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}