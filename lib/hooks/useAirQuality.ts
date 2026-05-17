'use client';

import { useState, useEffect, useCallback } from 'react';

interface AirQualityData {
  pm25: number | null;
  grade: string;
  color: string;
  canVentilate: boolean;
  stationName: string;
  addr: string;
  dataTime: string;
}

export function useAirQuality(coords: { lat: number; lng: number } | null): {
  data: AirQualityData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
} {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  const lat = coords?.lat;
  const lng = coords?.lng;

  useEffect(() => {
    if (lat == null || lng == null) return;

    setLoading(true);
    setError(null);

    fetch(`/api/air-quality?lat=${lat}&lng=${lng}`)
      .then(async (res) => {
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error((errJson as { error?: string }).error ?? '데이터를 불러올 수 없어요');
        }
        return res.json();
      })
      .then((json: AirQualityData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '데이터를 불러올 수 없어요');
        setLoading(false);
      });
  }, [lat, lng, retryCount]);

  return { data, loading, error, retry };
}
