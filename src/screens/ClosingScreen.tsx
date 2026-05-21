import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReflectionScreen } from './ReflectionScreen';
import { ReflectionReward } from './ReflectionReward';

interface ClosingScreenProps {
  day: number;
  onRestart: () => void;
  onBack?: () => void;
}

export const ClosingScreen = ({ day, onRestart, onBack }: ClosingScreenProps) => {
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [showReward, setShowReward] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#12100f] z-50 p-8 text-center"
    >
      <motion.div 
        animate={{ opacity: showReward ? 0 : 1 }}
        className="max-w-md space-y-10"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-rose/40 text-xs tracking-widest uppercase">HARI KE-{day}</p>
          <h2 className="text-3xl font-light text-offwhite mt-3 leading-tight">
            Makasih udah berani<br/>hadir hari ini.
          </h2>
        </motion.div>

        <div className="space-y-6 text-offwhite/70">
          <p className="text-[15px] leading-relaxed">
            Cerita lo hari ini udah gue simpen baik-baik.<br/>
            Gak ada yang sia-sia meski cuma diam atau nangis.
          </p>
          
          <p className="text-sm italic text-rose/60">
            "Kadang cukup cuma dengan hadir."
          </p>
        </div>

        <div className="pt-6 flex flex-col items-center gap-4 w-full">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowReflectionPrompt(true)}
            className="w-full py-4 bg-rose text-[#12100f] rounded-2xl font-medium text-base active:scale-95 transition-all shadow-lg shadow-rose/10"
          >
            Refleksi Minggu Ini
          </motion.button>

          {onBack && (
            <button
              onClick={onBack}
              className="text-rose hover:text-rose/80 font-medium text-sm transition-colors py-1"
            >
              ← Lanjut Ngobrol Lebih Dalam
            </button>
          )}

          <button
            onClick={onRestart}
            className="text-rose/50 text-sm tracking-wide hover:text-rose transition-colors py-1"
          >
            Langsung Sampai Besok →
          </button>
        </div>
      </motion.div>

      {/* Reflection Prompt Modal */}
      <AnimatePresence>
        {showReflectionPrompt && (
          <ReflectionScreen 
            onCancel={() => setShowReflectionPrompt(false)}
            onFinish={(answer) => {
              // Simpan reflection result here if needed
              setShowReflectionPrompt(false);
              setShowReward(true);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Wow Moment Reward */}
      <AnimatePresence>
        {showReward && (
          <ReflectionReward onContinue={onRestart} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
