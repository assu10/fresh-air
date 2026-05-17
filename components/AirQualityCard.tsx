interface AirQualityCardProps {
  pm25: number | null;
  grade: string;
  color: string;
  canVentilate: boolean;
  dataTime: string;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export default function AirQualityCard({
  pm25,
  grade,
  color,
  canVentilate,
  dataTime,
  loading,
  error,
  onRetry,
}: AirQualityCardProps) {
  if (loading) {
    return (
      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse"
        data-testid="air-quality-skeleton"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 p-5">
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
          데이터를 불러올 수 없어요
        </p>
        <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            aria-label="다시 불러오기"
            className="mt-3 text-xs font-medium text-orange-600 dark:text-orange-400 underline underline-offset-2"
          >
            다시 불러오기
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-5 flex items-center gap-4"
      style={{ borderColor: `${color}44`, background: `${color}11` }}
    >
      <div
        className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
        style={{ background: color }}
      >
        {pm25 ?? '—'}
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{grade}</p>
        <p className="text-xs mt-0.5" style={{ color }}>
          {canVentilate ? '✓ 환기하기 좋아요' : '✗ 환기 주의'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          PM2.5 · {dataTime} 기준
        </p>
      </div>
    </div>
  );
}
