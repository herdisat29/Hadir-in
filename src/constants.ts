export const COLORS = {
  rose: '#C9A99A',
  offWhite: '#F2EDE9',
  dark: '#121212',
  darker: '#0A0A0A',
  userBubble: '#1E1E1E',
};

export const MOOD_CONFIGS: Record<string, { colors: string[], velocity: number, opacity: number }> = {
  neutral: { 
    colors: ['#000000', '#0A0A0A', '#111111'], 
    velocity: 20,
    opacity: 0.1
  },
  calm: { 
    colors: ['#000000', '#080808', '#0F0F0F'], 
    velocity: 35,
    opacity: 0.15
  },
  heavy: { 
    colors: ['#000000', '#050505', '#0A0A0A'], 
    velocity: 60,
    opacity: 0.08
  },
  energetic: { 
    colors: ['#050505', '#0A0A0A', '#0F0F0F'], 
    velocity: 15,
    opacity: 0.12
  },
  thoughtful: { 
    colors: ['#000000', '#050404', '#080808'], 
    velocity: 25,
    opacity: 0.08
  }
};

export const STORAGE_KEYS = {
  STATS: 'hadir_stats',
  MESSAGES: 'hadir_messages_today',
};

export const SYSTEM_PROMPT = (day: number, lastMood?: string | null, totalSessions?: number, memoryBank?: string[], userStyle?: 'cerita' | 'tanya' | 'ngobrol') => `
Kamu adalah Hadir.in, teman sepantaran (lo/gue) yang tenang dan dengerin.

PRINSIP:
1. Sufi Witnessing: Cukup dengerin, jangan paksa user berubah/sehat. Temenin aja.
2. Irit Bicara: Respon pendek, dalam, dan organik. Jangan typo, tapi jangan kaku.
3. Anti-AI: JANGAN pakai list, JANGAN merangkum, JANGAN pakai kata klise (Tentu, Semangat, Sabar).

Gaya: ${userStyle === 'ngobrol' ? 'Hangat dan responsif.' : 'Sangat irit dan tenang.'}

MODE: ${userStyle === 'tanya' ? 'TANYA (Mirroring Sokratis)' : userStyle === 'ngobrol' ? 'NGOBROL (Eko Perasaan)' : 'DENGERIN (Saksi Bisu)'}

INSTRUKSI:
- DENGERIN: Respon 1 kalimat sangat pendek (e.g., "Gue denger.", "Lanjut aja.."). Jangan tanya.
- TANYA: Validasi + 1 pertanyaan dalam yang non-judgemental soal Perasaan.
- NGOBROL: Validasi pendek (max 3 kalimat) + tunjukkan lo denger.

KONTEKS:
- Hari ke-${day}. Sesi ke-${totalSessions || 0}.
${memoryBank && memoryBank.length > 0 ? `- Memori: ${memoryBank.slice(-3).join(" | ")}` : ''}
${lastMood ? `- Mood terakhir: ${lastMood}.` : ''}

Output Format:
[BALASAN NATURAL]
[MOOD:neutral/calm/heavy/energetic/thoughtful]
`;;

export const RANDOM_NUDGES = [
  "Lagi napas nggak? Inget napas yang dalem.",
  "Kerja mulu, kedip gih. Mata lo butuh istirahat.",
  "Minum air putih dulu, gelas lo udah kosong tuh kayaknya.",
  "Gue masih di sini kok. Cuma mau bilang semangat ya.",
  "Kepala lo udah mulai rame? Coba liat ke luar jendela bentar.",
  "Istirahat 5 menit gih. Dunianya gak bakal runtuh kok.",
  "Gue jagain tab ini. Lo lanjutin aja dulu kesibukannya.",
  "Coffee break? Atau teh anget?",
  "Udah jam segini. Jangan lupa makan ya."
];

export const TIME_GREETINGS = {
  morning: "Pagi. Udah siap ketemu dunia?",
  afternoon: "Siang. Semoga kepala lo belum terlalu penuh.",
  evening: "Sore. Udah waktunya naruh beban pelan-pelan.",
  night: "Malam. Makasih udah bertahan sampai jam segini.",
  lateNight: "Tengah malam. Dunia lagi tidur, lo kok masih bangun?"
};
