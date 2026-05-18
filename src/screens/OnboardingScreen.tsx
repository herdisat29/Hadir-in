import { motion } from 'motion/react';
import { Heart, Sparkles, HelpCircle } from 'lucide-react';

interface OnboardingScreenProps {
  onFinish: (data: { style: 'cerita' | 'tanya' | 'ngobrol' }) => void;
}

export const OnboardingScreen = ({ onFinish }: OnboardingScreenProps) => {
  const handleStyleSelect = (s: 'cerita' | 'tanya' | 'ngobrol') => {
    onFinish({ style: s });
  };

  return (
    <motion.div 
      id="onboarding-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#12100f] z-50 p-8 text-center"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[50px] w-[300px] h-[300px] bg-rose filter blur-[120px] opacity-5" />
      </div>

      <div className="max-w-xs space-y-12 relative z-10 w-full">
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
            <div className="flex items-center gap-3">
              <Heart size={16} fill="currentColor" />
              <span>Gue mau cerita, lo dengerin aja</span>
            </div>
            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => handleStyleSelect('ngobrol')} 
            className="onboarding-btn group"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={16} />
              <span>Lagi mau ngobrol, lo timpalin ya</span>
            </div>
            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => handleStyleSelect('tanya')} 
            className="onboarding-btn group"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={16} />
              <span>Tanya-tanya gue, biar gue mikir</span>
            </div>
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
      `}</style>
    </motion.div>
  );
};
