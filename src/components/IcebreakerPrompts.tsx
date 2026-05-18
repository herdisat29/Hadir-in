import { motion } from 'motion/react';

interface IcebreakerPromptsProps {
  onSelect: (text: string) => void;
  day: number;
}

export const IcebreakerPrompts = ({ 
  onSelect, 
  day
}: IcebreakerPromptsProps) => {
  if (day >= 8) return null;

  const prompts = day <= 3 
    ? [
        "Ada yang ngeganjel dikit", 
        "Lagi tenang aja sih", 
        "Kepala gue agak berisik",
        "Gue bingung mau cerita apa"
      ]
    : [
        "Lagi capek banget hari ini",
        "Ada hal kecil yang bikin senyum",
        "Gue bingung mau rasa apa",
        "Lagi pengen diem aja sebenernya"
      ];

  return (
    <div className="px-6 mt-4">
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, idx) => (
          <motion.button
            key={`icebreaker-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + (idx * 0.1) }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(201, 169, 154, 0.15)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(prompt)}
            className="px-4 py-2 rounded-full border border-rose/10 bg-rose/5 text-rose/70 text-[11px] font-medium tracking-wide transition-all"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
