import webPush from "web-push";

type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function hasWebPushConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT,
  );
}

export function configureWebPush() {
  if (!hasWebPushConfig()) {
    return false;
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  return true;
}

export async function sendPushNotification(
  subscription: StoredPushSubscription,
  payload: Record<string, unknown>,
) {
  if (!configureWebPush()) {
    throw new Error("Web Push VAPID keys are not configured");
  }

  return webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
  );
}
