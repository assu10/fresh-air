'use client';

import { useState, useEffect } from 'react';

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
} {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lat = coords?.lat;
  const lng = coords?.lng;

  useEffect(() => {
    if (lat == null || lng == null) return;

    setLoading(true);
    setError(null);

    fetch(`/api/air-quality?lat=${lat}&lng=${lng}`)
      .then((res) => {
        if (!res.ok) throw new Error('데이터를 불러올 수 없어요');
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
  }, [lat, lng]);

  return { data, loading, error };
}
