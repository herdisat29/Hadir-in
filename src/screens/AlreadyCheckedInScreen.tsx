import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { COLORS } from '../constants';

interface AlreadyCheckedInScreenProps {
  onBack: () => void;
}

export const AlreadyCheckedInScreen = ({ onBack }: AlreadyCheckedInScreenProps) => {
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

      <div className="space-y-8 relative z-10">
        <div className="space-y-3">
          <p className="text-rose text-xl tracking-wide font-light italic">Satu hari, satu cerita.</p>
          <p className="text-offwhite/70 font-light text-sm max-w-[240px] mx-auto leading-relaxed">
            Makasih ya hari ini udah mampir. <br/>Gue simpen ceritanya baik-baik.
          </p>
        </div>
        <div className="flex flex-col items-center gap-8">
          <p className="text-offwhite/40 text-[10px] tracking-[0.4em] uppercase opacity-40">hadir. dengerin. jaga.</p>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-12 h-px bg-rose/20" 
          />
          
          <motion.button
            whileHover={{ scale: 1.05, color: COLORS.rose }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 text-offwhite/30 text-[10px] tracking-[0.2em] uppercase font-medium hover:text-rose transition-colors"
          >
            <RotateCcw size={14} />
            Kembali ke Awal
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
