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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const responseText = useMemo(() => 
    REFLECTION_RESPONSES[Math.floor(Math.random() * REFLECTION_RESPONSES.length)], 
  []);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onFinish(answer);
    }, 2500);
  };
  
  return (
    <motion.div 
      id="reflection-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#12100f] z-40 p-10 text-center"
    >
      <div className="max-w-md space-y-8 w-full">
        <h2 className="text-2xl font-light text-rose leading-relaxed">
          Minggu ini, ada gak satu momen yang bikin kamu ngerasa hidup?
        </h2>
        <textarea
          id="reflection-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={isSubmitting}
          placeholder="Tulis aja, gue dengerin."
          className={`w-full bg-rose/[0.02] border-b border-rose/10 py-6 px-4 focus:outline-none focus:border-rose/40 focus:bg-rose/[0.05] text-lg text-offwhite placeholder:text-offwhite/10 resize-none transition-all duration-700 rounded-t-xl ${isSubmitting ? 'opacity-50' : ''}`}
          rows={3}
        />
        
        <div className="h-32 flex flex-col items-center justify-center space-y-6">
          <AnimatePresence mode="wait">
            {!isSubmitting ? (
              <div key="actions" className="flex flex-col items-center gap-6">
                <motion.button
                  id="btn-reflection-done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="px-12 py-3 rounded-full bg-rose text-[#12100f] font-medium text-sm shadow-xl shadow-rose/10 hover:shadow-rose/20 transition-all disabled:opacity-30"
                >
                  Kirim ke Hadir
                </motion.button>

                {onCancel && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    whileHover={{ opacity: 1 }}
                    onClick={onCancel}
                    className="text-[10px] tracking-[0.3em] uppercase text-rose/80 font-medium"
                  >
                    Belum, lanjut ngobrol aja
                  </motion.button>
                )}
              </div>
            ) : (
              <motion.p
                key="response-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-rose text-lg font-light italic"
              >
                {responseText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
