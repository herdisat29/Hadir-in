import rateLimit from 'express-rate-limit';

// Rate Limit untuk Chat API
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 menit
  max: 15,                       // Maksimal 15 request per menit
  message: {
    text: "Kamu terlalu cepat. Hadir lagi istirahat dulu ya, kita ngobrol pelan-pelan.",
    mood: 'neutral'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    res.status(429).json({
      text: "Kamu terlalu cepat. Hadir lagi istirahat dulu ya, kita ngobrol pelan-pelan.",
      mood: 'neutral'
    });
  }
});

// Rate Limit lebih ketat untuk guest / rute chat umum
export const guestRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,                        // Hanya 8 request/menit untuk guest
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    res.status(429).json({
      text: "Kamu terlalu cepat. Hadir lagi istirahat dulu ya, kita ngobrol pelan-pelan.",
      mood: 'neutral'
    });
  }
});

// Global limiter (semua route)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak request. Coba lagi nanti." }
});
