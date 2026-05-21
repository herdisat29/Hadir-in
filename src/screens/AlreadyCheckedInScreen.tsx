import { motion } from 'motion/react';
import { COLORS } from '../constants';

interface AlreadyCheckedInScreenProps {
  onContinue?: () => void;
}

export const AlreadyCheckedInScreen = ({ onContinue }: AlreadyCheckedInScreenProps) => {
  return (
    <motion.div 
      id="already-checked-in-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#12100f] z-50 p-6 text-center"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[250px] h-[250px] bg-rose filter blur-[100px] opacity-[0.03]" />
      </div>

      <div className="space-y-8 relative z-10 w-full max-w-xs">
        <div className="space-y-3">
          <p className="text-rose text-xl tracking-wide font-light italic">Satu hari, satu cerita.</p>
          <p className="text-offwhite/70 font-light text-sm max-w-[240px] mx-auto leading-relaxed">
            Makasih ya hari ini udah mampir. <br/>Gue simpen ceritanya baik-baik.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {onContinue && (
            <button 
              onClick={onContinue}
              className="w-full py-3.5 rounded-2xl bg-rose text-[#12100f] text-sm font-semibold hover:bg-rose/90 transition-all shadow-lg shadow-rose/10"
            >
              Tetap Masuk & Lanjut Ngobrol
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-8">
          <p className="text-offwhite/40 text-[10px] tracking-[0.4em] uppercase opacity-40">hadir. dengerin. jaga.</p>
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
