interface LocationDisplayProps {
  stationName: string | null;
  addr: string | null;
  loading: boolean;
}

export default function LocationDisplay({ stationName, addr, loading }: LocationDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse" data-testid="location-skeleton">
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <span>📍</span>
      <span>{addr ?? stationName}</span>
    </div>
  );
}
