'use client';

import { useState, useEffect } from 'react';

export function useReverseGeocode(coords: { lat: number; lng: number } | null): {
  locationName: string | null;
  loading: boolean;
} {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) return;

    let cancelled = false;
    setLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&accept-language=ko`,
    )
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const a = json?.address ?? {};
        const name = a.suburb ?? a.quarter ?? a.borough ?? null;
        setLocationName(name);
      })
      .catch(() => {
        if (!cancelled) setLocationName(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng]);

  return { locationName, loading };
}
