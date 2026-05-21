// src/utils/nudges.ts
export const getDaysBetween = (d1: string, d2: string): number => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getContextualNudge = (stats: any): string => {
  const today = new Date().toISOString().split('T')[0];
  const lastCheckIn = stats?.lastCheckIn;
  const daysSince = lastCheckIn ? getDaysBetween(lastCheckIn, today) : null;
  const streak = stats?.streak || 0;
  const hour = new Date().getHours();

  // === Kasus Khusus ===
  if (daysSince !== null && daysSince >= 7) {
    return "udah lama banget gak mampir... gak apa-apa kok, sini cerita lagi kalau lo mau 🫂";
  }
  if (daysSince !== null && daysSince >= 4) {
    return "gue kangen denger cerita lo. masih ada kan?";
  }

  if (streak >= 14) {
    return `wow ${streak} hari lo konsisten hadir. makasih udah percaya sama gue.`;
  }
  if (streak >= 7) {
    return `seminggu lebih lo hadir tiap hari. gue bangga banget sama lo.`;
  }

  // === Berdasarkan Jam ===
  if (hour >= 22 || hour < 6) {
    return "malam ini kepala lo lagi rame gak? boleh cerita sebelum tidur ya.";
  }
  if (hour >= 17 && hour < 22) {
    return "hari ini capek ya? mau cerita apa yang terjadi?";
  }

  // === Default yang bagus ===
  const defaults = [
    "hari ini kepala lo lagi rame apa sepi?",
    "lagi pengen cerita apa diem aja hari ini?",
    "gue masih di sini kalau lo butuh temen dengerin",
    "overthinking lagi? sini cerita bentar",
    "lo boleh kok gak selalu kuat",
    "ada yang pengen lo keluarin dari kepala?",
    "gue seneng lo masih buka app ini",
    "pelan-pelan aja, nggak usah buru-buru",
    "makasih udah berani hadir lagi hari ini",
    "lo lagi ngerasa apa sekarang?"
  ];

  return defaults[Math.floor(Math.random() * defaults.length)];
};
