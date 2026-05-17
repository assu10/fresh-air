'use client';

import { useState } from 'react';
import LocationDisplay from '@/components/LocationDisplay';
import AirQualityCard from '@/components/AirQualityCard';
import NotificationToggle from '@/components/NotificationToggle';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useAirQuality } from '@/lib/hooks/useAirQuality';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { useNotification } from '@/lib/hooks/useNotification';
import { useReverseGeocode } from '@/lib/hooks/useReverseGeocode';

export default function Home() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data, loading, error, retry } = useAirQuality(coords);
  const { locationName, loading: geocodeLoading } = useReverseGeocode(coords);
  const installPrompt = useInstallPrompt();
  const { isSubscribed, isSupported, requiresInstall, loading: notifLoading, toggle } = useNotification(
    data?.stationName ?? null,
    data?.addr ?? null,
  );

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('위치 기능을 지원하지 않는 브라우저입니다');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError('위치 권한이 거부됐습니다. 브라우저 설정에서 허용해주세요');
        setGeoLoading(false);
      },
    );
  };

  if (!coords) {
    return (
      <>
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 bg-white dark:bg-slate-900">
          <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">
            <span className="text-6xl">🌿</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Fresh Air</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                내 위치의 미세먼지를 확인하고
                <br />
                환기 알림을 받아보세요
              </p>
            </div>
            {geoError && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                {geoError}
              </p>
            )}
            <button
              onClick={handleGetLocation}
              disabled={geoLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
            >
              {geoLoading ? '위치 확인 중...' : '📍 내 위치 확인하기'}
            </button>
          </div>
        </main>
        <InstallPrompt {...installPrompt} />
      </>
    );
  }

  return (
    <>
      <main className="flex min-h-dvh flex-col items-center px-6 py-12 bg-white dark:bg-slate-900">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <LocationDisplay
            locationName={locationName}
            loading={geocodeLoading}
          />
          <AirQualityCard
            pm25={data?.pm25 ?? null}
            grade={data?.grade ?? ''}
            color={data?.color ?? '#9CA3AF'}
            canVentilate={data?.canVentilate ?? false}
            dataTime={data?.dataTime ?? ''}
            loading={loading}
            error={error}
            onRetry={retry}
          />
          <NotificationToggle
            isSubscribed={isSubscribed}
            isSupported={isSupported}
            requiresInstall={requiresInstall}
            loading={notifLoading}
            onToggle={toggle}
          />
        </div>
      </main>
      <InstallPrompt {...installPrompt} />
    </>
  );
}
