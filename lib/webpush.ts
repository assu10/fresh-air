import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
}

// Redis subscriptions Hash에 저장되는 구독 데이터 형태
export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
  stationName: string;
  regionName: string;
}

export async function sendPushNotification(
  subscription: Pick<StoredSubscription, 'endpoint' | 'keys' | 'expirationTime'>,
  payload: PushPayload,
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime ?? undefined,
    },
    JSON.stringify(payload),
  );
}
