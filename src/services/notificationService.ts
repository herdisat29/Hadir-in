
export const STORAGE_KEYS = {
  NOTIF_PERMISSION: 'hadir_notif_permission',
  NOTIF_SCHEDULED_TIME: 'hadir_notif_scheduled_time',
  LAST_APP_OPEN: 'hadir_last_app_open',
};

const RANDOM_NUDGES = [
  "gimana hari ini? mau cerita?",
  "istirahat bentar, narik napas dulu.",
  "apa yang paling bikin kamu senyum tadi?",
  "gue di sini kalau kamu butuh temen ngobrol.",
  "capek ya? gapapa, besok kita coba lagi.",
  "lagi mikirin apa malam ini?",
];

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  localStorage.setItem(STORAGE_KEYS.NOTIF_PERMISSION, permission);
  return permission === 'granted';
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get VAPID public key from server
    const res = await fetch('/api/push/key');
    const { publicKey } = await res.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Push subscription successful');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
};

export const testServerPush = async () => {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`Berhasil kirim push ke ${data.count} subscriber! Tungguin ya.`);
    } else {
      alert("Gagal kirim push. Mungkin belom ada subscriber-nya.");
    }
  } catch (err) {
    alert("Koneksi server bermasalah pas nyoba push.");
  }
};

let notificationTimer: number | null = null;

export const scheduleNotifications = (streak: number, lastCheckIn?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Clear existing timer if any
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  const now = new Date();
  const lastOpen = localStorage.getItem(STORAGE_KEYS.LAST_APP_OPEN);
  const baseTime = lastOpen ? new Date(lastOpen) : now;
  
  // For first-time nudges or checking, let's schedule one sooner (e.g., 2 hours)
  const isFirstNudge = !localStorage.getItem(STORAGE_KEYS.NOTIF_SCHEDULED_TIME);
  
  const nextNotify = new Date(now);
  if (isFirstNudge) {
    nextNotify.setHours(now.getHours() + 2);
  } else {
    nextNotify.setDate(now.getDate() + 1);
    nextNotify.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
  }

  // Determine message
  let title = "Hadir.in";
  let body = RANDOM_NUDGES[Math.floor(Math.random() * RANDOM_NUDGES.length)];

  // Check days since last check-in
  if (lastCheckIn) {
    const lastDate = new Date(lastCheckIn);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 5) {
      body = "udah lama gak mampir. gak harus cerita kok. mampir bentar juga gapapa.";
    } else if (diffDays >= 2) {
      body = "lagi pengen sendiri ya? gue masih di sini kok.";
    }
  }

  // Streak special
  if (streak === 7) {
    body = "seminggu kamu hadir. makasih masih nyempetin.";
  }

  const delay = nextNotify.getTime() - now.getTime();
  
  if (delay > 0) {
    localStorage.setItem(STORAGE_KEYS.NOTIF_SCHEDULED_TIME, nextNotify.toISOString());
    notificationTimer = window.setTimeout(() => {
      showNotification(title, body);
      // Reschedule for next day after showing
      scheduleNotifications(streak, lastCheckIn);
    }, delay);
  }
};

export const showNotification = (title: string, body: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        icon: '/favicon.ico', // Adjust if you have a real icon
        badge: '/favicon.ico',
        ...( { vibrate: [200, 100, 200] } as any )
      });
    });
  } catch (err) {
    new Notification(title, { body });
  }
};

export const testNotification = async () => {
  const permission = await requestNotificationPermission();
  if (permission) {
    // Try to subscribe too if they just granted
    await subscribeToPushNotifications().catch(console.error);
    showNotification("Hadir.in", "ini test notif dari Hadir. kalau keliatan, berarti jalan 😌");
    alert("Test notif dikirim! Kalau gak muncul, cek pengaturan notifikasi browser/HP lu ya.");
  } else {
    alert("Duh, permission notif lu ditolak/gak didukung. Cek setting browser deh.");
  }
};
