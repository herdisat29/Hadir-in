import { motion } from 'motion/react';

interface CalendarProgressProps {
  streak: number;
}

export const CalendarProgress = ({ streak }: CalendarProgressProps) => {
  // Show 7 dots for a week cycle. Day 1 is the first dot on the LEFT.
  const weekDay = streak % 7 === 0 && streak > 0 ? 7 : streak % 7;
  const dots = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-row gap-2.5 justify-center mt-3" dir="ltr">
      {dots.map((dotNum) => {
        const isActive = dotNum <= weekDay;
        return (
          <motion.div
            key={`cal-dot-${dotNum}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: dotNum * 0.1 }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
              isActive 
                ? 'bg-rose shadow-[0_0_10px_rgba(201,169,154,0.7)]' 
                : 'bg-rose/10 border border-rose/5'
            }`}
          />
        );
      })}
    </div>
  );
};
