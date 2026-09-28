import webPush from "web-push";

type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return false;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);

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
