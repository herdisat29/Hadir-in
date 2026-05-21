import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, History, Wind, Bell, BellOff, Volume2, Send, Mic, Square, Loader2, Heart, Sparkles, HelpCircle } from 'lucide-react';
import { Message, UserStats } from '../types';
import { MOOD_CONFIGS, COLORS, STORAGE_KEYS } from '../constants';
import { MessageBubble } from '../components/MessageBubble';
import { requestNotificationPermission, subscribeToPushNotifications } from '../services/notificationService';
import { SessionStyleToggle } from '../components/SessionStyleToggle';
import { IcebreakerPrompts } from '../components/IcebreakerPrompts';
import { CalendarProgress } from '../components/CalendarProgress';
import { TypingText } from '../components/TypingText';

interface ChatScreenProps {
  stats: UserStats;
  messages: Message[];
  userInput: string;
  setUserInput: (s: string) => void;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentMood: string;
  sessionStyle: 'cerita' | 'tanya' | 'ngobrol';
  exchangeCount: number;
  companionMode: boolean;
  isKeyboardOpen: boolean;
  notifPermission: NotificationPermission;
  onSendMessage: (text: string) => void;
  onToggleListening: () => void;
  onSpeak: (text: string) => void;
  onToggleCompanion: () => void;
  onShowSettings: () => void;
  onShowArsip: () => void;
  onShowBreath: () => void;
  onSessionEnd: () => void;
  onSetSessionStyle: (s: 'cerita' | 'tanya' | 'ngobrol') => void;
}

export const ChatScreen = ({
  stats,
  messages,
  userInput,
  setUserInput,
  isLoading,
  isListening,
  isSpeaking,
  currentMood,
  sessionStyle,
  exchangeCount,
  companionMode,
  isKeyboardOpen,
  notifPermission,
  onSendMessage,
  onToggleListening,
  onSpeak,
  onToggleCompanion,
  onShowSettings,
  onShowArsip,
  onShowBreath,
  onSessionEnd,
  onSetSessionStyle
}: ChatScreenProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  // Focus input after AI responds or when loaded
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Handle auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [userInput]);

  const handleNotificationClick = async () => {
    if (notifPermission === 'granted') {
      alert("Notifikasi sudah aktif ✅\n\nLo akan dapet pengingat tiap malam.");
      return;
    }

    // Minta izin dulu
    const permission = await requestNotificationPermission();
    
    if (permission) {
      // Langsung subscribe ke server
      const success = await subscribeToPushNotifications();
      
      if (success) {
        alert("✅ Notifikasi berhasil diaktifkan!\n\nMulai sekarang lo akan dapet nudge contextual tiap malam.");
      } else {
        alert("Izin dikasih, tapi gagal nyambung ke server. Coba refresh dan klik lagi ya.");
      }
    } else {
      alert("Notifikasi ditolak. Kalau mau nyalain lagi, buka pengaturan browser.");
    }
  };

  return (
    <motion.div 
      id="chat-interface"
      key="chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full relative overflow-hidden"
    >
      {/* Mood Landscape Background */}
      <motion.div 
        initial={false}
        animate={{ 
          backgroundColor: MOOD_CONFIGS[currentMood]?.colors[0] || MOOD_CONFIGS.neutral.colors[0],
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Ambient Glow */}
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.15, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: MOOD_CONFIGS[currentMood]?.velocity || 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 filter blur-[120px]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${MOOD_CONFIGS[currentMood]?.colors[2] || MOOD_CONFIGS.neutral.colors[2]} 0%, transparent 70%)`
          }}
        />
        
        {/* Subtle Dust/Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: currentMood === 'heavy' ? [0, 100, 0] : [-20, 20, -20],
                x: i % 2 === 0 ? [-10, 10, -10] : [10, -10, 10],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: (MOOD_CONFIGS[currentMood]?.velocity || 20) * (1 + (i * 0.2)),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
              className="absolute w-1 h-1 bg-offwhite/10 rounded-full blur-[1px]"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Soft Day Indicator */}
      <div className="absolute top-6 left-0 right-0 text-center pointer-events-none z-20">
        <div className="space-y-1">
          <span className="text-[10px] tracking-[0.2em] text-rose/30 uppercase font-medium">
            Day {stats.currentDay} • Hadir.in
          </span>
          <CalendarProgress streak={stats.currentDay} />
        </div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShowSettings}
          className="relative p-2.5 rounded-full transition-all border bg-black/40 border-white/5 text-white/40 hover:text-rose"
          title="Pengaturan"
        >
          <Settings size={16} />
          <AnimatePresence mode="wait">
            <motion.div
              key={sessionStyle}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose flex items-center justify-center border-2 border-[#12100f]"
            >
              {sessionStyle === 'cerita' ? (
                <Heart size={6} fill="currentColor" className="text-[#12100f]" />
              ) : sessionStyle === 'ngobrol' ? (
                <Sparkles size={6} className="text-[#12100f]" />
              ) : (
                <HelpCircle size={6} className="text-[#12100f]" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShowArsip}
          className="p-2.5 rounded-full transition-all border bg-[#12100f]/40 border-offwhite/5 text-offwhite/40 hover:text-rose"
          title="Arsip Cerita"
        >
          <History size={16} />
        </motion.button>
      </div>

      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShowBreath}
          className="p-2.5 rounded-full transition-all border bg-[#12100f]/40 border-offwhite/5 text-offwhite/40 hover:text-rose"
          title="Latihan Napas"
        >
          <Wind size={16} />
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleNotificationClick}
          className={`p-2.5 rounded-full transition-all border ${
            notifPermission === 'granted'
              ? 'bg-rose/10 border-rose/30 text-rose shadow-[0_0_15px_rgba(201,169,154,0.2)]' 
              : 'bg-black/40 border-white/5 text-white/40 hover:text-rose hover:border-rose/30'
          }`}
          title={notifPermission === 'granted' ? "Notifikasi Aktif" : "Aktifkan Notifikasi Harian"}
        >
          {notifPermission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />}
        </motion.button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none pt-2 overscroll-contain"
      >
        <div className="flex flex-col justify-end min-h-full px-4 pb-1 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onSpeak={onSpeak} isSpeaking={isSpeaking} />
          ))}
          
          {messages.length === 1 && !isLoading && (
            <div className="space-y-2 pt-2">
              <IcebreakerPrompts 
                onSelect={onSendMessage} 
                day={stats.currentDay || 1} 
              />
            </div>
          )}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start gap-2 pl-2"
            >
              <div className="flex items-center gap-3 px-4 py-2 bg-rose/[0.03] rounded-full border border-rose/5 backdrop-blur-sm">
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="w-1.5 h-1.5 rounded-full bg-rose/40 shadow-[0_0_8px_rgba(201,169,154,0.3)]" 
                 />
                 <span className="text-[10px] tracking-[0.2em] uppercase text-rose/40 font-medium whitespace-nowrap">
                   {sessionStyle === 'cerita' ? 'Hadir dengerin...' : sessionStyle === 'tanya' ? 'Hadir lagi mikir...' : 'Hadir di sini...'}
                 </span>
              </div>
            </motion.div>
          )}

          {exchangeCount >= 3 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-center pt-12 pb-8"
            >
              <button 
                onClick={onSessionEnd}
                className="group flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-all duration-1000"
              >
                <div className="w-px h-16 bg-gradient-to-b from-transparent via-rose/30 to-transparent group-hover:via-rose/60 transition-all duration-1000" />
                <span className="text-[10px] tracking-[0.4em] uppercase text-rose/60 font-medium">Sudah merasa lega?</span>
                <span className="text-[8px] tracking-[0.1em] text-rose/20 group-hover:text-rose/40 transition-all italic">(Klik untuk simpan kehadiran)</span>
              </button>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-1 w-full shrink-0" />
        </div>
      </div>

      {/* Input Area */}
      <div 
        className={`w-full px-4 pt-1 pb-4 bg-black/95 backdrop-blur-md border-t border-white/5 sticky bottom-0 z-40 ${
          isKeyboardOpen ? 'pb-2' : 'pb-[max(20px,env(safe-area-inset-bottom))]'
        }`}
      >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSendMessage(userInput);
            }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex items-end gap-2 bg-[#0d0d0d] border border-white/5 rounded-[28px] px-4 py-1.5 transition-all focus-within:border-rose/20 shadow-lg">
              {/* Text Input */}
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading && userInput.trim()) {
                    e.preventDefault();
                    onSendMessage(userInput);
                  }
                }}
                placeholder={isListening ? "Mendengarkan..." : "Cerita ke Hadir..."}
                className="flex-1 bg-transparent border-none py-2 px-1 focus:outline-none text-offwhite placeholder:text-offwhite/20 text-[15px] resize-none max-h-32 scrollbar-none"
                autoComplete="off"
              />

              {/* Mic Icon */}
              <div className="pb-1.5">
                <button
                  type="button"
                  onClick={onToggleListening}
                  className={`p-2 transition-all active:scale-90 ${isListening ? 'text-rose' : 'text-offwhite/30 hover:text-rose'}`}
                  title="Bicara"
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Mic size={20} strokeWidth={1.5} />
                    </motion.div>
                  ) : (
                    <Mic size={20} strokeWidth={1.5} />
                  )}
                </button>
              </div>

              {/* Send / Listening Button */}
              <div className="relative flex items-center justify-center pb-1.5">
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative flex items-center justify-center"
                    >
                      {/* Waves */}
                      <motion.div
                        animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute w-10 h-10 bg-rose rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 2.2], opacity: [0.2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="absolute w-10 h-10 bg-rose rounded-full"
                      />
                      
                      <button
                        type="button"
                        onClick={onToggleListening}
                        className="relative w-10 h-10 rounded-xl bg-rose text-[#12100f] flex items-center justify-center shadow-[0_0_15px_rgba(201,169,154,0.4)] active:scale-90"
                      >
                        <Square size={16} fill="currentColor" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="idle"
                      id="btn-send"
                      type="submit"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      disabled={(!userInput.trim() && !isListening) || isLoading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 shadow-lg active:scale-90 disabled:opacity-30 ${
                        isSpeaking || userInput.trim() ? 'bg-rose text-[#12100f]' : 'bg-rose/10 text-rose'
                      }`}
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 size={18} />
                        </motion.div>
                      ) : isSpeaking ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 12, 4] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              className="w-1 bg-[#12100f] rounded-full"
                            />
                          ))}
                        </div>
                      ) : (
                        <Send size={18} />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </form>
      </div>
    </motion.div>
  );
};
