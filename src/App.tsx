/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Heart, Bell, BellOff, Bug, RotateCcw, FastForward, Plus, Wind, History } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppScreen, Message, UserStats } from './types';
import { 
  STORAGE_KEYS, 
  COLORS, 
  SYSTEM_PROMPT,
  RANDOM_NUDGES,
  TIME_GREETINGS,
  MOOD_CONFIGS
} from './constants';
import { getHadirResponse, getRecapMessage } from './services/geminiService';

const isDev = typeof window !== 'undefined' && (
  new URLSearchParams(window.location.search).get('dev') === 'true' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname.includes('ais-dev')
);

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// --- Components ---

const SplashScreen = ({ onStart, hasLongBreak, onOpenArsip, hasHistory }: { onStart: () => void; hasLongBreak?: boolean; onOpenArsip: () => void; hasHistory: boolean; key?: any }) => {
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [greeting, setGreeting] = useState(TIME_GREETINGS.morning);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) setGreeting(TIME_GREETINGS.lateNight);
    else if (hour >= 4 && hour < 12) setGreeting(TIME_GREETINGS.morning);
    else if (hour >= 12 && hour < 17) setGreeting(TIME_GREETINGS.afternoon);
    else if (hour >= 17 && hour < 18) setGreeting(TIME_GREETINGS.evening);
    else setGreeting(TIME_GREETINGS.night);
  }, []);
  
  const requestNotif = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification("Hadir.in", {
        body: "Sip, nanti gue kabarin ya kalau ada apa-apa.",
        icon: "/favicon.ico"
      });
    }
  };
  
  return (
    <motion.div 
      id="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-darker z-50 p-6"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[50px] w-[300px] h-[300px] bg-rose filter blur-[120px] opacity-10" />
      </div>
      
      <div className="text-center space-y-4 relative z-10">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-light text-rose tracking-[0.15em]"
        >
          Hadir.in
        </motion.h1>
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="px-8"
        >
          {hasLongBreak ? (
            <div className="space-y-4">
              <p className="text-offwhite font-light text-xl italic leading-relaxed">
                udah lama gak mampir.
              </p>
              <p className="text-rose/60 font-light text-sm italic tracking-wide">
                semoga kepala lo gak terlalu rame akhir-akhir ini.
              </p>
            </div>
          ) : (
            <p className="text-text-muted font-light tracking-[0.3em] text-xs uppercase">
              {greeting}
            </p>
          )}
        </motion.div>
      </div>

      <motion.button
        id="btn-mulai"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onStart}
        className="mt-24 px-12 py-3 rounded-full border border-rose/30 text-rose hover:bg-rose/5 transition-colors tracking-widest text-sm font-medium"
        whileTap={{ scale: 0.95 }}
      >
        {hasLongBreak ? 'Mulai Lagi' : 'Mulai'}
      </motion.button>

      {hasHistory && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          whileHover={{ opacity: 0.8 }}
          transition={{ delay: 1.2 }}
          onClick={onOpenArsip}
          className="mt-6 text-[10px] text-offwhite uppercase tracking-[0.3em] font-light"
        >
          Lihat Arus Cerita
        </motion.button>
      )}

      {notifPermission === 'default' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          onClick={requestNotif}
          className="mt-6 text-[10px] text-rose/60 uppercase tracking-[0.2em] border-b border-rose/20 pb-0.5"
        >
          Aktifkan Notifikasi
        </motion.button>
      )}
    </motion.div>
  );
};

const ReflectionScreen = ({ onFinish }: { onFinish: (answer: string) => void; key?: any }) => {
  const [answer, setAnswer] = useState('');
  
  return (
    <motion.div 
      id="reflection-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-darker z-40 p-10 text-center"
    >
      <div className="max-w-md space-y-8">
        <h2 className="text-2xl font-light text-rose leading-relaxed">
          Minggu ini, ada gak satu momen yang bikin kamu ngerasa hidup?
        </h2>
        <textarea
          id="reflection-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Tulis di sini..."
          className="w-full bg-rose/[0.02] border-b border-rose/10 py-6 px-4 focus:outline-none focus:border-rose/40 focus:bg-rose/[0.05] text-lg text-offwhite placeholder:text-offwhite/10 resize-none transition-all duration-700 rounded-t-xl"
          rows={3}
        />
        <motion.button
          id="btn-reflection-done"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFinish(answer)}
          className="mt-8 px-12 py-3 rounded-full bg-rose text-[#121212] font-medium text-sm tracking-widest uppercase shadow-xl shadow-rose/10 hover:shadow-rose/20 transition-all"
        >
          Simpan Kehadiran
        </motion.button>
      </div>
    </motion.div>
  );
};

const ClosingScreen = ({ day, history, onRestart }: { day: number; history: string[]; onRestart: () => void; key?: string }) => {
  const getDayText = (num: number) => {
    const texts = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh'];
    return texts[num - 1] || `${num}`;
  };

  return (
    <motion.div 
      id="closing-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-darker/95 backdrop-blur-xl z-50 p-6 text-center"
    >
      <div className="space-y-12 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <p className="text-rose/40 text-[10px] tracking-[0.5em] uppercase font-medium">Hari {getDayText(day)} kamu hadir</p>
          <CalendarProgress streak={day} />
          <p className="text-3xl font-light text-offwhite italic leading-tight mt-4">Kamu masih di sini. <br/>Itu penting.</p>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8 }}
          className="text-offwhite text-sm max-w-xs mx-auto font-light leading-relaxed"
        >
          Makasih udah mau berbagi ruang malam ini. Gue di sini kalau lo butuh lagi besok.
        </motion.p>

        <motion.button
          id="btn-sampai-besok"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(231, 151, 151, 0.08)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="px-14 py-4 rounded-full border border-rose/20 text-rose tracking-[0.2em] text-[11px] uppercase font-medium transition-all duration-700"
        >
          istirahat ya
        </motion.button>
      </div>
    </motion.div>
  );
};

const AlreadyCheckedInScreen = (props: { key?: string }) => {
  return (
    <motion.div 
      id="already-checked-in-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-darker z-50 p-6 text-center"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[250px] h-[250px] bg-rose filter blur-[100px] opacity-[0.03]" />
      </div>

      <div className="space-y-8 relative z-10">
        <div className="space-y-3">
          <p className="text-rose text-xl tracking-wide font-light italic">Satu hari, satu cerita.</p>
          <p className="text-offwhite/70 font-light text-sm max-w-[240px] mx-auto leading-relaxed">
            Makasih ya hari ini udah mampir. <br/>Gue simpen ceritanya baik-baik.
          </p>
        </div>
        <div className="flex flex-col items-center gap-6">
          <p className="text-text-muted text-[10px] tracking-[0.4em] uppercase opacity-40">hadir. dengerin. jaga.</p>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-12 h-px bg-rose/20" 
          />
        </div>
      </div>
    </motion.div>
  );
};

const ArsipOverlay = ({ history, onClose }: { history: string[]; onClose: () => void; key?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-darker/95 backdrop-blur-2xl p-8 flex flex-col"
    >
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-rose text-sm font-light tracking-[0.4em] uppercase">Arus Cerita</h2>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="text-offwhite/40 text-[10px] tracking-widest uppercase border border-offwhite/10 px-4 py-2 rounded-full"
        >
          Tutup
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none space-y-12 pb-12">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-offwhite/20 text-sm italic font-light">Belum ada cerita yang tersimpan.</p>
          </div>
        ) : (
          history.slice().reverse().map((entry, idx) => (
            <motion.div 
              key={`arsip-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-3 relative active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose/40" />
                <span className="text-[10px] text-rose/30 tracking-[0.2em] font-medium uppercase">
                  Momen {history.length - idx}
                </span>
              </div>
              <p className="text-offwhite/80 font-light leading-relaxed italic text-lg pl-4 border-l border-rose/10">
                "{entry}"
              </p>
            </motion.div>
          ))
        )}
      </div>

      <div className="pt-8 border-t border-offwhite/5 text-center">
        <p className="text-[10px] text-rose/20 tracking-[0.3em] uppercase">Setiap kata lo berharga.</p>
      </div>
    </motion.div>
  );
};

const BreathOverlay = ({ onClose }: { onClose: () => void; key?: string }) => {
  const [phase, setPhase] = useState<'Tarik' | 'Tahan' | 'Buang'>('Tarik');

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhase(p => {
        if (p === 'Tarik') return 'Tahan';
        if (p === 'Tahan') return 'Buang';
        return 'Tarik';
      });
    }, 4000); // 4 detik per fase
    return () => clearInterval(cycle);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[110] bg-darker/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8"
    >
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Glow Layer */}
        <motion.div 
          animate={{ 
            scale: phase === 'Tarik' ? 1.8 : (phase === 'Tahan' ? 1.8 : 1),
            opacity: phase === 'Tarik' ? 0.3 : (phase === 'Tahan' ? 0.3 : 0.1)
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="absolute w-full h-full rounded-full bg-rose filter blur-3xl"
        />

        {/* Circle Guide */}
        <motion.div 
          animate={{ 
            scale: phase === 'Tarik' ? 1.3 : (phase === 'Tahan' ? 1.3 : 0.8),
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full border border-rose/30 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.p 
              key={phase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="text-rose text-[10px] tracking-[0.4em] uppercase font-light translate-x-0.5 text-center px-2"
            >
              {phase === 'Tarik' ? 'Tarik Napas' : (phase === 'Tahan' ? 'Tahan Dulu' : 'Buang Pelan')}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-2">
        <p className="text-offwhite/40 text-sm font-light italic text-center max-w-[200px] leading-relaxed">
          Rasain udara yang masuk dan keluar. Gak ada beban di sini.
        </p>
        <div className="flex gap-1 mt-4">
          {['Tarik', 'Tahan', 'Buang'].map(s => (
            <div 
              key={s} 
              className={`w-1 h-1 rounded-full transition-all duration-500 ${phase === s ? 'bg-rose w-4' : 'bg-rose/10'}`} 
            />
          ))}
        </div>
      </div>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="mt-12 text-rose/60 text-[10px] tracking-[0.3em] uppercase border-b border-rose/20 pb-1"
      >
        Selesai
      </motion.button>
    </motion.div>
  );
};

const MessageBubble = ({ msg }: { msg: Message; key?: any }) => {
  const isAssistant = msg.role === 'assistant';

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} group animate-in fade-in duration-300 slide-in-from-bottom-2`}
    >
      <div className={`relative max-w-[85%] px-5 py-3.5 rounded-[24px] ${
        isAssistant 
          ? 'bg-offwhite/5 border border-offwhite/5 text-offwhite/90 rounded-bl-none' 
          : 'bg-rose text-darker font-medium rounded-br-none shadow-lg shadow-rose/5'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
};

const IcebreakerPrompts = ({ 
  onSelect, 
  day
}: { 
  onSelect: (text: string) => void; 
  day: number; 
  key?: any 
}) => {
  if (day >= 8) return null;

  const prompts = day <= 3 
    ? [
        "Ada yang ngeganjel dikit", 
        "Lagi tenang aja sih", 
        "Kepala gue agak berisik",
        "Gue bingung mau cerita apa"
      ]
    : [
        "Lagi capek banget hari ini",
        "Ada hal kecil yang bikin senyum",
        "Gue bingung mau rasa apa",
        "Lagi pengen diem aja sebenernya"
      ];

  return (
    <div className="px-6 mt-4">
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, idx) => (
          <motion.button
            key={`icebreaker-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + (idx * 0.1) }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(201, 169, 154, 0.15)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(prompt)}
            className="px-4 py-2 rounded-full border border-rose/10 bg-rose/5 text-rose/70 text-[11px] font-medium tracking-wide transition-all"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const OnboardingScreen = ({ onFinish }: { onFinish: (data: { style: 'cerita' | 'tanya' }) => void; key?: any }) => {
  const handleStyleSelect = (s: 'cerita' | 'tanya') => {
    onFinish({ style: s });
  };

  return (
    <motion.div 
      id="onboarding-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-darker z-50 p-8 text-center"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[50px] w-[300px] h-[300px] bg-rose filter blur-[120px] opacity-5" />
      </div>

      <div className="max-w-xs space-y-12 relative z-10">
        <div className="space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose font-light tracking-wide"
          >
            Hadir mau kenalan dulu.
          </motion.p>
          <h2 className="text-2xl font-light text-offwhite leading-relaxed">
            Kamu lebih suka digimanain kalo lagi butuh ngeluarin sesuatu?
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => handleStyleSelect('cerita')} 
            className="onboarding-btn group"
          >
            <span>Gue mau cerita dulu, lu dengerin aja</span>
            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => handleStyleSelect('tanya')} 
            className="onboarding-btn-secondary group"
          >
            <span>Tanya-tanya gue, biar gue mikir</span>
            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
          </motion.button>
        </div>
      </div>
      <style>{`
        .onboarding-btn {
          width: 100%;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          background: rgba(201, 169, 154, 0.05);
          border: 1px solid rgba(201, 169, 154, 0.2);
          color: #C9A99A;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s;
          text-align: left;
        }
        .onboarding-btn:hover { background: rgba(201, 169, 154, 0.1); scale: 1.02; border-color: rgba(201, 169, 154, 0.4); }
        .onboarding-btn-secondary {
          width: 100%;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          background: rgba(242, 237, 233, 0.03);
          border: 1px solid rgba(242, 237, 233, 0.1);
          color: rgba(242, 237, 233, 0.7);
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s;
          text-align: left;
        }
        .onboarding-btn-secondary:hover { background: rgba(242, 237, 233, 0.08); scale: 1.02; border-color: rgba(242, 237, 233, 0.2); }
      `}</style>
    </motion.div>
  );
};

const CalendarProgress = ({ streak }: { streak: number }) => {
  // Show 7 dots for a week cycle. Day 1 is the first dot on the LEFT.
  const weekDay = streak % 7 === 0 && streak > 0 ? 7 : streak % 7;
  const dots = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-row gap-2.5 justify-center mt-3" dir="ltr">
      {dots.map((dotNum) => {
        const isActive = dotNum <= weekDay;
        return (
          <motion.div
            key={`cal-dot-${dotNum}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: dotNum * 0.1 }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
              isActive 
                ? 'bg-rose shadow-[0_0_10px_rgba(231,151,151,0.7)]' 
                : 'bg-rose/10 border border-rose/5'
            }`}
          />
        );
      })}
    </div>
  );
};

const TypingText = () => {
  const [text, setText] = useState('hadir lagi dengerin');
  const phrases = [
    'hadir lagi dengerin',
    'hmm...',
    'gue masih di sini',
    'lagi ngerasain ceritanya',
    'sebentar ya',
    'masih di sini kok'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setText(prev => {
        const idx = phrases.indexOf(prev);
        return phrases[(idx + 1) % phrases.length];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return <span>{text}</span>;
};

// --- Main App Logic ---

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const unique: Message[] = [];
          const seen = new Set();
          for (const m of parsed) {
            if (m && m.id && !seen.has(m.id)) {
              seen.add(m.id);
              unique.push(m);
            }
          }
          return unique;
        }
        return [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<string>(() => {
    if (typeof window === 'undefined') return 'neutral';
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.visualMood || 'neutral';
      } catch (e) {
        return 'neutral';
      }
    }
    return 'neutral';
  });
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window === 'undefined') return {
      streak: 0,
      currentDay: 1,
      lastCheckIn: null,
      checkInHistory: [],
      lastOpen: null,
      lastMood: null,
      totalSessions: 0,
      memoryBank: []
    };
    
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          memoryBank: parsed.memoryBank || [],
          checkInHistory: parsed.checkInHistory || [],
          totalSessions: parsed.totalSessions || 0,
          userAge: parsed.userAge,
        };
      } catch (e) {
        console.error("Failed to parse initial stats", e);
      }
    }
    return {
      streak: 0,
      currentDay: 1,
      lastCheckIn: null,
      checkInHistory: [],
      lastOpen: null,
      lastMood: null,
      totalSessions: 0,
      memoryBank: [],
      userAge: undefined
    };
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [sessionStyle, setSessionStyle] = useState<'cerita' | 'tanya'>(() => {
    if (typeof window === 'undefined') return 'cerita';
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.userStyle || 'cerita';
      } catch (e) {
        return 'cerita';
      }
    }
    return 'cerita';
  });

  const [hasLongBreak, setHasLongBreak] = useState(false);
  const [companionMode, setCompanionMode] = useState(() => {
    return localStorage.getItem('companion_mode') === 'true';
  });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const installPromptRef = useRef<any>(null);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
      
      const hasBeenPrompted = localStorage.getItem('install_prompted') === 'true';
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isMatureUser = stats.streak >= 3;

      if (!hasBeenPrompted && !isStandalone && isMatureUser) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptRef.current) return;
    
    installPromptRef.current.prompt();
    const { outcome } = await installPromptRef.current.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      localStorage.setItem('install_prompted', 'true');
    }
    installPromptRef.current = null;
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install_prompted', 'true');
  };

  // Persist messages (de-prioritize to avoid blocking render)
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Random Nudge Logic
  useEffect(() => {
    if (!companionMode || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const scheduleNextNudge = () => {
      // Random time between 30 to 60 minutes
      const delay = (Math.random() * 30 + 30) * 60 * 1000;
      
      return setTimeout(() => {
        const message = RANDOM_NUDGES[Math.floor(Math.random() * RANDOM_NUDGES.length)];
        new Notification("Hadir", {
          body: message,
          icon: "/favicon.ico",
          silent: false
        });
        // Schedule next
        timerId = scheduleNextNudge();
      }, delay);
    };

    let timerId = scheduleNextNudge();
    return () => clearTimeout(timerId);
  }, [companionMode]);

  const toggleCompanion = () => {
    const newState = !companionMode;
    setCompanionMode(newState);
    localStorage.setItem('companion_mode', String(newState));
  };
  const [showDebug, setShowDebug] = useState(false);
  const [showArsip, setShowArsip] = useState(false);
  const [showBreath, setShowBreath] = useState(false);

  const debugConclude = () => {
    triggerRecapAndClose();
  };

  const debugAddDay = () => {
    if (stats) {
      // Set lastCheckIn to yesterday so prepareClosing treats it as consecutive
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStats = { 
        ...stats, 
        currentDay: (stats.currentDay || 1) + 1, 
        streak: (stats.streak || 1) + 1,
        lastCheckIn: yesterday 
      };
      setStats(newStats);
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
    }
  };

  const debugForgetToday = () => {
    if (stats) {
      const newStats = { ...stats, lastCheckIn: null };
      setStats(newStats);
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      setMessages([]);
      setIsLoading(false);
      setScreen(AppScreen.SPLASH);
    }
  };

  const debugReset = () => {
    localStorage.clear();
    setMessages([]);
    setStats({
      streak: 0,
       lastCheckIn: null,
       totalSessions: 0,
       currentDay: 1,
       lastMood: 'neutral',
       memoryBank: [],
       userStyle: 'neutral',
       userAge: 'unknown',
       lastOpen: new Date().toISOString()
    });
    setScreen(AppScreen.SPLASH);
    setIsLoading(false);
    
    // Hard reload
    setTimeout(() => {
      window.location.href = window.location.origin + window.location.pathname;
    }, 100);
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Update session count and last open ONLY ONCE on mount
    const newStats = {
      ...stats,
      totalSessions: (stats.totalSessions || 0) + 1,
      lastOpen: new Date().toISOString()
    };

    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));

    // Check for long break (>= 5 days)
    if (stats.lastCheckIn) {
      const last = new Date(stats.lastCheckIn);
      const now = new Date(today);
      const diffTime = now.getTime() - last.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 5) {
        setHasLongBreak(true);
      }
    }
  }, []);

  // Handle viewport height for mobile browsers (throttled)
  useEffect(() => {
    let ticking = false;
    const updateVH = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const visualViewport = window.visualViewport;
          const vh = (visualViewport ? visualViewport.height : window.innerHeight) * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
          
          if (visualViewport) {
            setIsKeyboardOpen(visualViewport.height < window.innerHeight * 0.85);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVH);
      window.visualViewport.addEventListener('scroll', updateVH);
    }
    return () => {
      window.removeEventListener('resize', updateVH);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVH);
        window.visualViewport.removeEventListener('scroll', updateVH);
      }
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  // Handle mobile keyboard resize lag
  useEffect(() => {
    const handleResize = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus input after AI responds or when screen changes to CHAT
  useEffect(() => {
    if (screen === AppScreen.CHAT && !isLoading) {
      // Small timeout to ensure DOM is ready and avoid layout thrashing
      const timer = setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [screen, isLoading]);

  const startSession = () => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastCheckIn === today && !isDev) {
      setScreen(AppScreen.ALREADY_CHECKED_IN);
      return;
    }

    if (!stats.userStyle) {
      setScreen(AppScreen.ONBOARDING);
      return;
    }

    // Weekly reflection check (Day 7, 14, 21...)
    if (stats.currentDay >= 7 && stats.currentDay % 7 === 0) {
      setScreen(AppScreen.REFLECTION);
    } else {
      setScreen(AppScreen.CHAT);
      initChat();
    }
  };

  const initChat = () => {
    setExchangeCount(0);
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: 'Gimana mood kamu hari ini?',
      timestamp: Date.now()
    }]);
  };

  const prepareClosing = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Fix: Don't reset streak if they already checked in today (e.g. debugging or multiple sessions)
    const alreadyCheckedInToday = stats.lastCheckIn === today;
    const isConsecutive = stats.lastCheckIn === yesterday;
    
    let newStreak = stats.streak;
    if (isConsecutive) {
      newStreak = stats.streak + 1;
    } else if (!alreadyCheckedInToday) {
      newStreak = 1;
    }
    
    const history = [...stats.checkInHistory];
    if (!history.includes(today)) history.push(today);

    // Extract last mood: find first user message in current session
    const firstUserMsg = messages.find(m => m.role === 'user');
    const moodSummary = firstUserMsg ? firstUserMsg.content.slice(0, 100) : null;
    
    // Manage memory bank (store last 5 themes)
    let memory = [...(stats.memoryBank || [])];
    if (moodSummary) {
      // Don't duplicate if it's the same mood recently
      if (memory[0] !== moodSummary) {
        memory = [moodSummary, ...memory].slice(0, 5);
      }
    }

    // Also update currentDay if it's a new check-in
    const newCurrentDay = !alreadyCheckedInToday ? stats.currentDay + 1 : stats.currentDay;

    const newStats = {
      ...stats,
      streak: newStreak,
      currentDay: newStreak, // Synchronize currentDay with streak for clarity in UI
      lastCheckIn: today,
      checkInHistory: history,
      lastMood: moodSummary,
      memoryBank: memory
    };
    
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
    setScreen(AppScreen.CLOSING);
  };

  const triggerRecapAndClose = async () => {
    setIsLoading(true);
    try {
      const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
      const recap = await getRecapMessage(apiMessages);
      
      const recapMsg: Message = {
        id: `recap-${generateId()}`,
        role: 'assistant',
        content: recap,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, recapMsg]);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([...messages, recapMsg]));
    } catch (error) {
      console.error("Recap Error:", error);
    } finally {
      setIsLoading(false);
    }

    // Wait 3 seconds then show closing
    setTimeout(() => {
      prepareClosing();
    }, 3000);
  };

  const concludeSession = () => {
    // currentDay is now already updated in prepareClosing or startSession
    setScreen(AppScreen.ALREADY_CHECKED_IN);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${generateId()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    
    // Explicitly keep focus for mobile
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Core Feature: Only trigger ending after 15 user messages
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    try {
      // Call Gemini
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const rawResponse = await getHadirResponse(
        apiMessages, 
        stats.currentDay,
        stats.lastMood,
        stats.totalSessions,
        stats.memoryBank,
        sessionStyle
      );

      // Parse Mood
      let mood = 'neutral';
      let cleanResponse = rawResponse;
      const moodMatch = rawResponse.match(/\[MOOD:(.*?)\]/);
      if (moodMatch) {
        mood = moodMatch[1].toLowerCase().trim();
        cleanResponse = rawResponse.replace(/\[MOOD:(.*?)\]/, '').trim();
        setCurrentMood(mood);
        
        // Update stats with new mood
        const updatedStats = { ...stats, visualMood: mood };
        setStats(updatedStats);
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updatedStats));
      }

      const assistantMsg: Message = {
        id: `ai-${generateId()}`,
        role: 'assistant',
        content: cleanResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: `error-${generateId()}`,
        role: 'assistant',
        content: "Eh sorry, gue lagi gak bisa dengerin dengan baik sekarang. Coba lagi ya?",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }

    if (newCount >= 15) {
      setTimeout(() => {
        triggerRecapAndClose();
      }, 5000);
    }
  };

  const handleOnboardingFinish = (data: { style: 'cerita' | 'tanya' }) => {
    const newStats = {
      ...stats,
      userStyle: data.style,
      userAge: undefined
    };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
    setScreen(AppScreen.CHAT);
    initChat();
  };

  const handleQuickReply = (mood: string) => {
    handleSendMessage(mood);
  };

  const handleReflectionFinish = async (answer: string) => {
    // Just a warm acknowledgment for reflection
    setScreen(AppScreen.CHAT);
    setMessages([{
      id: `refl-user-${generateId()}`,
      role: 'user',
      content: answer,
      timestamp: Date.now()
    }]);
    
    setIsLoading(true);
    try {
      const response = await getHadirResponse(
        [{ role: 'user', content: answer }], 
        stats.currentDay,
        stats.lastMood,
        stats.totalSessions,
        stats.memoryBank,
        sessionStyle
      );
      setMessages(prev => [...prev, {
        id: `refl-ai-${generateId()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("AI Error (Reflection):", error);
      setMessages(prev => [...prev, {
        id: `refl-error-${generateId()}`,
        role: 'assistant',
        content: "Eh sorry, gue lagi gak bisa dengerin dengan baik sekarang. Coba lagi ya?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
    
    // Auto-end after reflection acknowledgment
    setTimeout(() => triggerRecapAndClose(), 5000);
  };

  return (
    <div className="min-h-[100dvh] bg-dark flex items-center justify-center relative overflow-hidden font-sans selection:bg-rose/30">
      {/* Background Atmosphere (Static on mobile to save GPU) */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] opacity-40 bg-darker"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, ${COLORS.rose}10 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, ${COLORS.rose}08 0%, transparent 50%)
          `,
          filter: 'blur(80px)'
        }}
      />
      
      {/* Animated blob only for large screens or very subtle */}
      <div className="hidden lg:block">
        <motion.div 
          className="fixed top-[10%] -left-[50px] w-[300px] h-[300px] bg-rose filter blur-[100px] opacity-[0.02] pointer-events-none z-[-1]"
          animate={{ 
            x: [0, 15, 0],
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>

      {/* Floating Quote for Desktop/Wide Screens */}
      <div className="hidden lg:block fixed left-[calc(50%+280px)] top-[40%] max-w-[320px] pointer-events-none select-none z-0">
        <motion.h2 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.35, x: 0 }}
          whileHover={{ opacity: 0.5 }}
          className="text-6xl font-light text-rose mb-8 cursor-default transition-opacity tracking-tight"
        >
          Hadir.in
        </motion.h2>
        <div className="space-y-6">
          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.3, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-light italic leading-[1.8] text-rose"
          >
            "kadang yang lo butuhin bukan solusi <br/> — tapi ada yang beneran dengerin."
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.2, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] tracking-[0.5em] text-rose uppercase font-medium mt-4"
          >
            KAMU MASIH DI SINI. ITU PENTING.
          </motion.p>
        </div>
      </div>

      {/* Main App Container */}
      <div 
        className="w-full max-w-md h-[100svh] flex flex-col bg-darker/80 backdrop-blur-xl lg:border lg:border-offwhite/5 lg:rounded-[40px] lg:my-8 lg:h-[92dvh] lg:shadow-[0_0_100px_-20px_rgba(231,151,151,0.05)] relative z-10 overflow-hidden"
      >
        {/* Background Texture (Universal) */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center p-12 text-center overflow-hidden z-0 opacity-[0.03]">
          <div className="space-y-8">
            <p className="text-2xl font-light italic leading-relaxed text-rose">
              "kadang yang lo butuhin bukan solusi <br/> — tapi ada yang beneran dengerin."
            </p>
            <p className="text-[10px] tracking-[0.4em] text-rose uppercase font-medium">
              KAMU MASIH DI SINI. ITU PENTING.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showArsip && (
            <ArsipOverlay 
              key="arsip-overlay"
              history={stats.memoryBank} 
              onClose={() => setShowArsip(false)} 
            />
          )}

          {showBreath && (
            <BreathOverlay 
              key="breath-overlay"
              onClose={() => setShowBreath(false)} 
            />
          )}

          {screen === AppScreen.SPLASH && (
            <SplashScreen 
              key="splash" 
              onStart={startSession} 
              hasLongBreak={hasLongBreak} 
              onOpenArsip={() => setShowArsip(true)}
              hasHistory={stats.memoryBank.length > 0}
            />
          )}

          {screen === AppScreen.ONBOARDING && (
            <OnboardingScreen key="onboarding" onFinish={handleOnboardingFinish} />
          )}

          {screen === AppScreen.REFLECTION && (
            <ReflectionScreen key="reflection" onFinish={handleReflectionFinish} />
          )}

          {screen === AppScreen.CHAT && (
            <motion.div 
              id="chat-interface"
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full relative overflow-hidden"
            >
              {/* Mood Landscape Background */}
              <motion.div 
                initial={false}
                animate={{ 
                  backgroundColor: MOOD_CONFIGS[currentMood]?.colors[0] || MOOD_CONFIGS.neutral.colors[0],
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="absolute inset-0 -z-10 overflow-hidden"
              >
                {/* Ambient Glow */}
                <motion.div 
                  animate={{ 
                    opacity: [0.1, 0.15, 0.1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: MOOD_CONFIGS[currentMood]?.velocity || 20, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 filter blur-[120px]"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${MOOD_CONFIGS[currentMood]?.colors[2] || MOOD_CONFIGS.neutral.colors[2]} 0%, transparent 70%)`
                  }}
                />
                
                {/* Subtle Dust/Particles */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: currentMood === 'heavy' ? [0, 100, 0] : [-20, 20, -20],
                        x: i % 2 === 0 ? [-10, 10, -10] : [10, -10, 10],
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: (MOOD_CONFIGS[currentMood]?.velocity || 20) * (1 + (i * 0.2)),
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5
                      }}
                      className="absolute w-1 h-1 bg-offwhite/10 rounded-full blur-[1px]"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Soft Day Indicator */}
            <div className="absolute top-6 left-0 right-0 text-center pointer-events-none z-20">
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.2em] text-rose/30 uppercase font-medium">
                  Day {stats.currentDay} • Hadir.in
                </span>
                <CalendarProgress streak={stats.currentDay} />
              </div>
            </div>

            {/* Top Controls */}
            <div className="absolute top-6 left-6 z-30">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowArsip(true)}
                className="p-2.5 rounded-full transition-all border bg-darker/40 border-offwhite/5 text-text-muted hover:text-rose"
                title="Arsip Cerita"
              >
                <History size={16} />
              </motion.button>
            </div>

            <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowBreath(true)}
                className="p-2.5 rounded-full transition-all border bg-darker/40 border-offwhite/5 text-text-muted hover:text-rose"
                title="Latihan Napas"
              >
                <Wind size={16} />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleCompanion}
                className={`p-2.5 rounded-full transition-all border ${
                  companionMode 
                    ? 'bg-rose/10 border-rose/30 text-rose shadow-[0_0_15px_rgba(201,169,154,0.1)]' 
                    : 'bg-darker/40 border-offwhite/5 text-text-muted hover:text-rose'
                }`}
                title={companionMode ? "Mode Nemenin Aktif" : "Aktifkan Mode Nemenin"}
              >
                {companionMode ? <Bell size={16} /> : <BellOff size={16} />}
              </motion.button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto scrollbar-none pt-16 overscroll-contain"
            >
              <div className="flex flex-col justify-end min-h-full px-4 pb-4 space-y-6">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                
                {messages.length === 1 && !isLoading && (
                  <IcebreakerPrompts 
                    onSelect={handleSendMessage} 
                    day={stats.currentDay || 1} 
                  />
                )}

                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-rose/[0.03] border border-rose/10 text-rose/40 px-6 py-4 rounded-[20px] text-[10px] tracking-[0.4em] uppercase flex items-center gap-3 backdrop-blur-sm">
                       <motion.div 
                         animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="w-1.5 h-1.5 rounded-full bg-rose/60 shadow-[0_0_8px_rgba(231,151,151,0.5)]" 
                       />
                       <TypingText />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
              </div>
            </div>

            {/* Input Area */}
            <div 
              className={`w-full px-4 pt-2 bg-dark/95 backdrop-blur-md border-t border-offwhite/5 sticky bottom-0 z-40 ${
                isKeyboardOpen ? 'pb-2' : 'pb-[max(24px,env(safe-area-inset-bottom))]'
              }`}
            >
                {/* Text Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(userInput);
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="relative flex-1">
                    <input
                      id="chat-input"
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading && userInput.trim()) {
                          handleSendMessage(userInput);
                        }
                      }}
                      placeholder="Ketik sesuatu..."
                      className="w-full bg-bubble-user border border-offwhite/5 rounded-[24px] py-3.5 px-5 focus:outline-none focus:border-rose/20 text-offwhite placeholder:text-text-muted text-[15px] transition-colors duration-200"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    id="btn-send"
                    type="submit"
                    disabled={!userInput.trim() || isLoading}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-rose text-[#121212] disabled:opacity-50 transition-all duration-200 shrink-0 shadow-lg active:scale-95 disabled:scale-100"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RotateCcw size={18} />
                      </motion.div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </form>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showInstallBanner && screen === AppScreen.CHAT && !isKeyboardOpen && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-[max(80px,env(safe-area-inset-bottom)+60px)] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-50 px-5 py-4 bg-[#121212]/95 backdrop-blur-xl border border-offwhite/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <p className="text-[13px] text-rose font-medium leading-relaxed">
                  Biar Hadir selalu ada — install ke homescreen kamu.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleDismissInstall}
                  className="text-[12px] font-medium text-offwhite/40 hover:text-offwhite/60 transition-colors"
                >
                  Nanti aja
                </button>
                <button
                  onClick={handleInstallClick}
                  className="px-5 py-2 text-[12px] font-semibold bg-rose text-darker rounded-full active:scale-95 transition-transform shadow-lg shadow-rose/10"
                >
                  Install
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {screen === AppScreen.CLOSING && (
          <ClosingScreen 
            key="closing" 
            day={stats.streak} 
            history={stats.checkInHistory} 
            onRestart={concludeSession} 
          />
        )}

        {screen === AppScreen.ALREADY_CHECKED_IN && (
          <AlreadyCheckedInScreen 
            key="already-checked-in"
          />
        )}
      </AnimatePresence>

      {/* Dev Tools Button */}
      {isDev && (
        <div className="fixed top-2 left-2 z-[9999] flex flex-col items-start gap-2 lg:bottom-4 lg:right-4 lg:left-auto lg:top-auto lg:items-end">
          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-offwhite/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[180px]"
              >
                <div className="text-[10px] font-bold text-rose uppercase tracking-widest mb-2 border-b border-rose/10 pb-2">
                  Dev Tools
                </div>
                
                <button 
                  onClick={debugConclude}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose/10 text-offwhite text-xs transition-colors"
                >
                  <FastForward size={14} className="text-rose" />
                  <span>Akhiri Sesi</span>
                </button>

                <button 
                  onClick={debugAddDay}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose/10 text-offwhite text-xs transition-colors"
                >
                  <Plus size={14} className="text-rose" />
                  <span>+1 Hari Streak</span>
                </button>

                <button 
                  onClick={debugForgetToday}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose/10 text-offwhite text-xs transition-colors"
                  title="Biar bisa chat lagi hari ini"
                >
                  <Plus size={14} className="text-rose rotate-45" />
                  <span>Lupa Hari Ini</span>
                </button>

                <button 
                  onClick={debugReset}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose/10 text-rose text-xs transition-colors"
                  title="Hapus storage & reload"
                >
                  <RotateCcw size={14} />
                  <span>Reset Semua</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg border ${
              showDebug ? 'bg-rose text-dark border-rose' : 'bg-darker/80 text-rose/40 border-offwhite/5 hover:text-rose'
            }`}
          >
            <Bug size={18} />
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
