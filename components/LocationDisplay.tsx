interface LocationDisplayProps {
  locationName: string | null;
  loading: boolean;
}

export default function LocationDisplay({ locationName, loading }: LocationDisplayProps) {
  if (loading) {
    return (
      <div
        className="flex items-center gap-2 animate-pulse"
        data-testid="location-skeleton"
        aria-label="위치 로딩 중"
      >
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
      </div>
    );
  }

  if (!locationName) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <span aria-hidden="true">📍</span>
      <span>{locationName}</span>
    </div>
  );
}
