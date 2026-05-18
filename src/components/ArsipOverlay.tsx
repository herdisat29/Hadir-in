import { motion } from 'motion/react';

interface ArsipOverlayProps {
  history: string[];
  onClose: () => void;
}

export const ArsipOverlay = ({ history, onClose }: ArsipOverlayProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-[#12100f]/95 backdrop-blur-2xl p-8 flex flex-col"
    >
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-rose text-sm font-light tracking-[0.4em] uppercase">Arus Cerita</h2>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="text-offwhite/40 text-[10px] tracking-widest uppercase border border-offwhite/10 px-4 py-2 rounded-full"
        >
          Tutup
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none space-y-16 pb-12 pr-2">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-offwhite/20 text-sm italic font-light tracking-wide">Belum ada jejak yang tertinggal.</p>
          </div>
        ) : (
          history.slice().reverse().map((entry, idx) => (
            <motion.div 
              key={`arsip-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className={`space-y-4 relative ${idx % 2 === 1 ? 'pl-8' : 'pl-0'}`}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                  className="w-1 h-8 bg-gradient-to-b from-rose/40 to-transparent rounded-full" 
                />
                <span className="text-[9px] text-rose/40 tracking-[0.4em] font-medium uppercase">
                  Momen {history.length - idx}
                </span>
              </div>
              <p className={`text-offwhite/70 font-light leading-relaxed italic ${entry.length > 50 ? 'text-base' : 'text-xl'}`}>
                "{entry}"
              </p>
            </motion.div>
          ))
        )}
      </div>

      <div className="pt-8 border-t border-offwhite/5 text-center">
        <p className="text-[10px] text-rose/20 tracking-[0.3em] uppercase">Setiap kata lo berharga.</p>
      </div>
    </motion.div>
  );
};
