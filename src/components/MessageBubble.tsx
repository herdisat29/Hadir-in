import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  msg: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
}

export const MessageBubble = ({ msg, onSpeak, isSpeaking }: MessageBubbleProps) => {
  const isAssistant = msg.role === 'assistant';

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} group animate-in fade-in duration-300 slide-in-from-bottom-2`}
    >
      <div className={`relative max-w-[85%] px-5 py-3.5 rounded-[24px] ${
        isAssistant 
          ? 'bg-offwhite/5 border border-offwhite/5 text-offwhite/90 rounded-bl-none' 
          : 'bg-rose text-[#12100f] font-medium rounded-br-none shadow-lg shadow-rose/5'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        
        {isAssistant && (
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onSpeak(msg.content)}
              disabled={isSpeaking}
              className={`p-2 rounded-full border border-offwhite/10 bg-[#12100f]/40 transition-colors ${isSpeaking ? 'text-rose' : 'text-offwhite/40 hover:text-rose'}`}
            >
              {isSpeaking ? (
                <div className="flex items-center gap-0.5 px-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [3, 8, 3] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-0.5 bg-rose rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <Volume2 size={14} />
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
