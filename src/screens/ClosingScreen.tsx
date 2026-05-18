import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarProgress } from '../components/CalendarProgress';

interface ClosingScreenProps {
  day: number;
  history: string[];
  onRestart: () => void;
  onBack?: () => void;
  canInstall?: boolean;
  onInstall?: () => void;
  onEnableNotifications?: () => void;
}

export const ClosingScreen = ({ day, onRestart, onBack, canInstall, onInstall, onEnableNotifications }: ClosingScreenProps) => {
  const [showInvite, setShowInvite] = useState(false);
  const [invitedType, setInvitedType] = useState<'install' | 'notif' | null>(null);

  useEffect(() => {
    // Show emotional invite after a delay when they are reflecting
    const timer = setTimeout(() => {
      const hasNotif = localStorage.getItem('notifications_enabled');
      const hasPrompted = localStorage.getItem('install_prompted');

      if (canInstall && !hasPrompted) {
        setInvitedType('install');
        setShowInvite(true);
      } else if (!hasNotif && Math.random() > 0.3) { // Lower threshold for notifs
        setInvitedType('notif');
        setShowInvite(true);
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const getDayText = (num: number) => {
    const texts = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh'];
    return texts[num - 1] || `${num}`;
  };

  const handleInviteAction = () => {
    if (invitedType === 'install' && onInstall) {
      onInstall();
    } else if (invitedType === 'notif' && onEnableNotifications) {
      onEnableNotifications();
    }
    setShowInvite(false);
  };

  return (
    <motion.div 
      id="closing-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#12100f] z-50 p-10 text-center"
    >
      <div className="max-w-md space-y-12">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <p className="text-rose/40 text-[10px] tracking-[0.5em] uppercase font-medium">Hari {getDayText(day)} kita melangkah</p>
            <CalendarProgress streak={day} />
          </div>
          <p className="text-4xl font-light text-offwhite italic leading-tight">Terima kasih <br/>sudah berani jujur.</p>
        </motion.div>
        
        <motion.div 
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 }}
          className="space-y-8"
        >
          <p className="text-offwhite/60 text-sm max-w-xs mx-auto font-light leading-relaxed">
            Dunia mungkin berisik, tapi ruang ini tetap tenang. <br/>Gue jagain cerita lo di sini.
          </p>

          <AnimatePresence>
            {showInvite && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pt-6 border-t border-rose/10"
              >
                {invitedType === 'install' ? (
                  <button 
                    onClick={handleInviteAction}
                    className="text-[10px] tracking-[0.3em] uppercase text-rose/50 hover:text-rose transition-all duration-700 font-medium"
                  >
                    Bawa gue lebih deket? (Install Hadir)
                  </button>
                ) : (
                  <button 
                    onClick={handleInviteAction}
                    className="text-[10px] tracking-[0.3em] uppercase text-rose/50 hover:text-rose transition-all duration-700 font-medium"
                  >
                    Boleh gue sapa besok? (Nyalain Notif)
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 2 }}
           className="relative"
        >
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-rose rounded-full filter blur-xl"
          />
          <div className="flex flex-col items-center gap-6">
            <motion.button
              id="btn-sampai-besok"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRestart}
              className="relative px-16 py-4 rounded-full bg-[#1a1a1a] border border-rose/20 text-rose tracking-[0.3em] text-[10px] uppercase font-bold transition-all duration-1000"
            >
              sampai besok
            </motion.button>

            {onBack && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                whileHover={{ opacity: 0.7 }}
                onClick={onBack}
                className="text-[9px] tracking-[0.2em] uppercase text-rose italic"
              >
                Belum, ada yang lewat...
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
