import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TIME_GREETINGS } from '../constants';

interface SplashScreenProps {
  onStart: () => void;
  hasLongBreak?: boolean;
  onOpenArsip: () => void;
  hasHistory: boolean;
}

export const SplashScreen = ({ onStart, hasLongBreak, onOpenArsip, hasHistory }: SplashScreenProps) => {
  const [greeting, setGreeting] = useState(TIME_GREETINGS.morning);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) setGreeting(TIME_GREETINGS.lateNight);
    else if (hour >= 4 && hour < 11) setGreeting(TIME_GREETINGS.morning);
    else if (hour >= 11 && hour < 15) setGreeting(TIME_GREETINGS.afternoon);
    else if (hour >= 15 && hour < 19) setGreeting(TIME_GREETINGS.evening);
    else setGreeting(TIME_GREETINGS.night);
  }, []);
  
  return (
    <motion.div 
      id="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-between bg-[#12100f] z-50 px-6 py-12"
    >
      {/* Background Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(230,196,180,0.08)_0%,rgba(18,16,15,0)_75%)] animate-breathe" />
      </div>
      
      {/* Background Image Asset (Abstract & Mood-setting) */}
      <div className="absolute -z-10 opacity-20 inset-0 w-full h-[200%] overflow-hidden animate-river">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBM2evcIiIA6SZ8PwFA42DcItzvS2GPfw0fMWb76RK3ivlXCVD8SHpGbQdlnNkyrRsC_XjQMHMuuN9Cb49xyZ9ONUOh1gEq0QIRXOyHmaJEZMKTNtEGtSK6s01JsneGB6Fkqyabwr0_MFtYj30n7lzSZ4xI8zDmaNBE06m4oHYxTndSHMemv3kN0167xXGhk3fOsa3LLPb3ICA8GmjWyWFEA6NAwq_WzD9T4C6BciuSYBX-l0eewlpnwYhGYOS8gnNhUe6AoQYYZE"
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Top Spacer for alignment */}
      <div className="h-16" />
      
      {/* Central Content Area */}
      <main className="flex flex-col items-center justify-center text-center space-y-4 z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-2"
        >
          <h1 className="text-[40px] font-semibold text-rose tracking-tight leading-[1.2]">
            Hadir.in
          </h1>
        </motion.div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="max-w-[280px]"
        >
          {hasLongBreak ? (
            <div className="space-y-4">
              <p className="text-offwhite/80 font-light text-lg italic leading-relaxed">
                udah lama gak mampir.
              </p>
              <p className="text-rose/60 font-light text-sm italic tracking-wide">
                semoga kepala lo gak terlalu rame akhir-akhir ini.
              </p>
            </div>
          ) : (
            <p className="text-lg font-normal text-offwhite/80 tracking-wide leading-[1.6]">
              {greeting}
            </p>
          )}
        </motion.div>

        {/* Decorative element */}
        {!hasLongBreak && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.6 }}
            className="pt-12"
          >
            <div className="w-16 h-[1px] bg-offwhite/40 mx-auto" />
          </motion.div>
        )}
      </main>

      {/* Bottom Action Area */}
      <footer className="w-full max-w-[320px] flex flex-col items-center space-y-8 z-10">
        <motion.button
          id="btn-mulai"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onStart}
          className="w-full bg-rose text-[#12100f] text-lg h-14 rounded-full flex items-center justify-center font-medium hover:opacity-90 active:scale-95 transition-all duration-300"
          whileTap={{ scale: 0.95 }}
        >
          {hasLongBreak ? 'Mulai Lagi' : 'Mulai'}
        </motion.button>

        <div className="flex flex-col items-center gap-4">
          <span className="text-[12px] font-medium text-offwhite/40 tracking-[0.05em] uppercase leading-[1.4]">
            Ruang Refleksi Digital
          </span>

          {hasHistory && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              whileHover={{ opacity: 0.8 }}
              transition={{ delay: 1.2 }}
              onClick={onOpenArsip}
              className="text-[10px] text-offwhite/60 uppercase tracking-[0.3em] font-light hover:text-rose transition-colors"
            >
              Lihat Arus Cerita
            </motion.button>
          )}
        </div>
      </footer>
    </motion.div>
  );
};
