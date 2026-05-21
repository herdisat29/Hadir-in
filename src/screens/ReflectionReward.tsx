import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export const ReflectionReward = ({ onContinue }: { onContinue: () => void }) => {
  const quotes = [
    "Hadir itu sendiri sudah bentuk keberanian.",
    "Lo sudah melakukan hal yang paling sulit: tidak lari.",
    "Semua cerita lo berharga, meski cuma didengar langit.",
    "Besok masih ada ruang buat lo pulang ke diri sendiri."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#12100f] z-[60] p-8 text-center"
    >
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto rounded-full border border-rose/20 flex items-center justify-center">
          <Heart className="w-10 h-10 text-rose" />
        </div>
      </div>

      <p className="text-xl font-light italic text-offwhite/90 max-w-xs leading-relaxed">
        "{randomQuote}"
      </p>

      <motion.button
        onClick={onContinue}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-16 px-10 py-4 border border-rose/30 text-rose rounded-2xl hover:bg-rose/5 transition-all"
      >
        Sampai Jumpa Besok
      </motion.button>
    </motion.div>
  );
};
