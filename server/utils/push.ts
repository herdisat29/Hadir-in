import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:hadirin@example.com',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const sendPushNotification = async (
  subscription: any, 
  payload: { title: string; body: string; icon?: string }
) => {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        data: {
          url: '/' // buka app ketika diklik
        }
      })
    );
    return true;
  } catch (error: any) {
    console.error('Push notification failed:', error);
    
    // Kalau error 410 (subscription expired), hapus dari database
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription expired or not found');
      return { expired: true };
    }
    
    return false;
  }
};
