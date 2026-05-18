import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BreathOverlayProps {
  onClose: () => void;
}

export const BreathOverlay = ({ onClose }: BreathOverlayProps) => {
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
      className="absolute inset-0 z-[110] bg-[#12100f]/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8"
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
