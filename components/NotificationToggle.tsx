interface NotificationToggleProps {
  isSubscribed: boolean;
  isSupported: boolean;
  requiresInstall: boolean;
  loading: boolean;
  onToggle: () => void;
}

export default function NotificationToggle({
  isSubscribed,
  isSupported,
  requiresInstall,
  loading,
  onToggle,
}: NotificationToggleProps) {
  const disabled = !isSupported || loading || requiresInstall;

  const subText = () => {
    if (requiresInstall) return '홈 화면에 추가 후 알림을 켤 수 있어요';
    if (!isSupported) return 'HTTPS 환경에서만 지원됩니다';
    if (isSubscribed) return '알림이 켜져 있어요';
    return 'PM2.5 ≤ 35 되면 알림';
  };

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          환기 알림 받기
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subText()}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        aria-label={isSubscribed ? '알림 끄기' : '알림 켜기'}
        className={[
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          isSubscribed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            isSubscribed ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
