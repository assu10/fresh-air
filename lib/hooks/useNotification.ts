'use client';

import { useState, useEffect } from 'react';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const media = window.matchMedia('(display-mode: standalone)').matches;
  const iosNative = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return media || iosNative;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function useNotification(
  stationName: string | null,
  addr: string | null,
): {
  isSubscribed: boolean;
  isSupported: boolean;
  requiresInstall: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [requiresInstall, setRequiresInstall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    if (isIOS() && !isStandalone()) {
      setRequiresInstall(true);
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg);
        setIsSupported(true);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(!!sub);
      })
      .catch(() => {
        // SW 등록 실패 시 무시
      });
  }, []);

  const toggle = async () => {
    if (!registration || !stationName) return;
    setLoading(true);
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        await fetch('/api/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        setIsSubscribed(false);
      } else {
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
          ),
        });
        const subJson = sub.toJSON();
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: {
              endpoint: subJson.endpoint,
              keys: subJson.keys,
              expirationTime: sub.expirationTime,
            },
            stationName,
            regionName: addr,
          }),
        });
        setIsSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return { isSubscribed, isSupported, requiresInstall, loading, toggle };
}
