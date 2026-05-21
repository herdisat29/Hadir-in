import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const REFLECTION_RESPONSES = [
  "Gue simpen ini baik-baik.",
  "Makasih udah mau jujur sama diri sendiri.",
  "Itu bukan hal kecil. Gue dengerin.",
  "Lo masih mau nulis. Itu udah banyak.",
  "Gue di sini. Makasih udah cerita."
];

interface ReflectionScreenProps {
  onFinish: (answer: string) => void;
  onCancel?: () => void;
}

export const ReflectionScreen = ({ onFinish, onCancel }: ReflectionScreenProps) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setIsSubmitted(true);
    
    setTimeout(() => {
      onFinish(answer);
    }, 2200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#12100f]/95 flex items-center justify-center p-8 z-50"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2 className="text-2xl font-light text-offwhite leading-tight mb-8">
            Sebelum lo pergi...<br/>
            Ada satu momen minggu ini yang bikin lo ngerasa <span className="text-rose">hidup</span>?
          </h2>
        </motion.div>

        <motion.textarea
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isSubmitted}
          placeholder="Boleh satu kalimat, boleh panjang..."
          className="w-full h-40 bg-transparent border border-rose/20 rounded-2xl p-5 text-offwhite placeholder:text-offwhite/30 focus:outline-none focus:border-rose/40 resize-none transition-all"
        />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 mt-8"
        >
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSubmitted}
              className="flex-1 py-3.5 text-rose/60 border border-rose/20 rounded-2xl active:scale-95 transition-all"
            >
              Lewati
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitted}
            className="flex-1 py-3.5 bg-rose text-[#12100f] rounded-2xl font-medium disabled:opacity-40 active:scale-95 transition-all"
          >
            {isSubmitted ? 'Menyimpan...' : 'Simpan & Tutup Hari Ini'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
