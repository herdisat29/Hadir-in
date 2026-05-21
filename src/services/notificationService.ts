
import { getContextualNudge } from '../utils/nudges';

export const STORAGE_KEYS = {
  NOTIF_PERMISSION: 'hadir_notif_permission',
  NOTIF_SCHEDULED_TIME: 'hadir_notif_scheduled_time',
  LAST_APP_OPEN: 'hadir_last_app_open',
};


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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert("Browser lo belum support push notification.");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID_PUBLIC_KEY tidak ditemukan");
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) throw new Error("Gagal simpan ke server");

    console.log("✅ Push subscription berhasil disimpan");
    return true;

  } catch (err) {
    console.error("Subscribe push gagal:", err);
    return false;
  }
};

export const testServerPush = async () => {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      if (data.count > 0) {
        alert(`Berhasil! Server ngirim push ke ${data.count} subscriber. Cek notif HP lo ya!`);
      } else {
        // Double check DB status
        const dbRes = await fetch('/api/db-status');
        const dbData = await dbRes.json();
        
        if (!dbRes.ok) {
           alert(`DEBUG: ${dbData.status}\nError: ${dbData.error}\n\nHint: Cek apakah tabel 'push_subscriptions' udah ada di Supabase. \n\nSQL to Run in Supabase SQL Editor:\nCREATE TABLE push_subscriptions (\n  endpoint TEXT PRIMARY KEY,\n  keys JSONB,\n  updated_at TIMESTAMPTZ\n);`);
        } else {
           const countMsg = dbData.count !== undefined ? `Jumlah subscriber di DB: ${dbData.count}` : "Gak bisa baca count dari DB.";
           alert(`Server jalan, tapi subscriber masih 0 di database.\n${countMsg}\n\nPastikan lo udah Klik icon Lonceng/Bel di layar chat, kasih izin (Allow), terus coba lagi.\n\nKalau masih 0, coba REFRESH halaman ini dulu ya.`);
        }
      }
    } else {
      alert("Gagal kirim push: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    alert("Gak bisa konek ke server push. Coba refresh browser deh.");
  }
};

export const scheduleNotifications = (stats: any) => {
  // Client-side scheduler tetap bisa dipakai sebagai cadangan
  console.log("Contextual nudge system active. Main scheduler di server.");
  if (stats) {
    localStorage.setItem(STORAGE_KEYS.LAST_APP_OPEN, new Date().toISOString());
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
