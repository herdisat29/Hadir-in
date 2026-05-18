/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bug, X, ChevronRight, Sparkles, BellRing, Send, Plus, Trash2, Bell, Zap, Volume2, Heart, HelpCircle } from 'lucide-react';
import { AppScreen } from './types';
import { 
  STORAGE_KEYS, 
  COLORS, 
} from './constants';
import { 
  scheduleNotifications, 
  testNotification, 
  getNotificationPermission, 
  requestNotificationPermission, 
  STORAGE_KEYS as NOTIF_KEYS, 
  subscribeToPushNotifications, 
  testServerPush 
} from './services/notificationService';
import { getTodayKey } from './utils';

// Components & Screens
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ReflectionScreen } from './screens/ReflectionScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ClosingScreen } from './screens/ClosingScreen';
import { AlreadyCheckedInScreen } from './screens/AlreadyCheckedInScreen';
import { ArsipOverlay } from './components/ArsipOverlay';
import { BreathOverlay } from './components/BreathOverlay';

// Hooks
import { useStats } from './hooks/useStats';
import { useChat } from './hooks/useChat';

const isDev = typeof window !== 'undefined' && (
  new URLSearchParams(window.location.search).get('dev') === 'true' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname.includes('ais-dev')
);

export default function App() {
  const { 
    stats, 
    updateStats, 
    hasLongBreak, 
    addDay, 
    resetToday, 
    fullReset 
  } = useStats();

  const [screen, setScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [currentMood, setCurrentMood] = useState<string>(stats.visualMood || 'neutral');
  const [showArsip, setShowArsip] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBreath, setShowBreath] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [sessionStyle, setSessionStyle] = useState<'cerita' | 'tanya' | 'ngobrol'>(stats.userStyle || 'cerita');
  const [companionMode, setCompanionMode] = useState(() => localStorage.getItem('companion_mode') === 'true');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const installPromptRef = useRef<any>(null);

  const handleSetSessionStyle = async (s: 'cerita' | 'tanya' | 'ngobrol') => {
    setSessionStyle(s);
    updateStats({ userStyle: s });
    
    // Trigger acknowledgement if in chat and not currently loading
    if (screen === AppScreen.CHAT && messages.length > 1 && !isLoading) {
      const messages: Record<string, string> = {
        tanya: "Oke, sekarang gue coba bantu lo explorasi lewat pertanyaan ya. Apa yang lagi ngeganjel?",
        cerita: "Oke, gue dengerin semua cerita lo sekarang. Keluarin aja semuanya.",
        ngobrol: "Siapp! Gue bakal lebih responsif nemenin lo ngobrol sekarang. Cerita apa aja, gue dengerin dan timpalin."
      };
      
      const assistantMsg = {
        id: `mode-change-${Date.now()}`,
        role: 'assistant' as const,
        content: messages[s] || messages.cerita,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    }
  };

  const handleRecapComplete = (recap: string) => {
    // Recap metadata or analytics can go here if needed
  };

  const {
    messages,
    userInput,
    setUserInput,
    isLoading,
    isListening,
    isSpeaking,
    exchangeCount,
    toggleListening,
    handleSpeak,
    handleSendMessage,
    initChatMessages,
    clearMessages,
    setMessages
  } = useChat(stats, handleRecapComplete, () => prepareClosing());

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!installPromptRef.current) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      localStorage.setItem('install_prompted', 'true');
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptRef.current) return;
    try {
      installPromptRef.current.prompt();
      const { outcome } = await installPromptRef.current.userChoice;
      console.log('User choice outcome:', outcome);
      
      // Save preference once they've interacted with it
      localStorage.setItem('install_prompted', 'true');
    } catch (err) {
      console.error('Install prompt error:', err);
    }
    installPromptRef.current = null;
  };

  const handleNotificationRequest = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('notifications_enabled', 'true');
        alert('Makasih ya. Nanti gue colek kalau lo butuh ditemenin.');
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  // Viewport & Keyboard Logic
  useEffect(() => {
    let ticking = false;
    const updateVH = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const visualViewport = window.visualViewport;
          const vh = (visualViewport ? visualViewport.height : window.innerHeight) * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
          if (visualViewport) {
            setIsKeyboardOpen(visualViewport.height < window.innerHeight * 0.85);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    updateVH();
    window.addEventListener('resize', updateVH);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVH);
    }
    return () => {
      window.removeEventListener('resize', updateVH);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', updateVH);
    };
  }, []);

  // Notifications
  useEffect(() => {
    localStorage.setItem(NOTIF_KEYS.LAST_APP_OPEN, new Date().toISOString());
    if (getNotificationPermission() === 'granted') {
      scheduleNotifications(stats.currentDay, stats.checkInHistory[stats.checkInHistory.length - 1]);
    }
  }, []);

  const startSession = () => {
    const today = getTodayKey();
    if (stats.lastCheckIn === today && !isDev) {
      setScreen(AppScreen.ALREADY_CHECKED_IN);
      return;
    }
    if (!stats.userStyle) {
      setScreen(AppScreen.ONBOARDING);
      return;
    }
    if (stats.currentDay >= 7 && stats.currentDay % 7 === 0) {
      setScreen(AppScreen.REFLECTION);
    } else {
      setScreen(AppScreen.CHAT);
      initChat(sessionStyle);
    }
  };

  const initChat = (style: 'cerita' | 'tanya' | 'ngobrol') => {
    if (getNotificationPermission() === 'granted') {
      subscribeToPushNotifications().catch(console.error);
    }
    initChatMessages(style);
  };

  const prepareClosing = () => {
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const alreadyCheckedInToday = stats.lastCheckIn === today;
    const isConsecutive = stats.lastCheckIn === yesterday;
    
    let newStreak = stats.streak;
    if (isConsecutive) {
      newStreak = stats.streak + 1;
    } else if (!alreadyCheckedInToday) {
      newStreak = 1;
    }
    
    const history = [...stats.checkInHistory];
    if (!history.includes(today)) history.push(today);

    const firstUserMsg = messages.find(m => m.role === 'user');
    const moodSummary = firstUserMsg ? firstUserMsg.content.slice(0, 100) : null;
    
    let memory = [...(stats.memoryBank || [])];
    if (moodSummary && memory[0] !== moodSummary) {
      memory = [moodSummary, ...memory].slice(0, 5);
    }

    const newStats = {
      streak: newStreak,
      currentDay: newStreak, 
      lastCheckIn: today,
      checkInHistory: history,
      lastMood: moodSummary,
      memoryBank: memory
    };
    
    updateStats(newStats);
    setScreen(AppScreen.CLOSING);

    if (getNotificationPermission() === 'default') {
      setTimeout(() => setShowNotifPrompt(true), 1500);
    } else if (getNotificationPermission() === 'granted') {
      scheduleNotifications(newStats.currentDay, today);
    }
  };

  const onSendMessage = async (text: string) => {
    // Artificial "Listening" delay - psychological pacing
    const delay = Math.min(1000, 500 + text.length * 10); 
    
    // We update stats immediately to show loading on next render cycle
    // but the actual API call is delayed slightly to feel more human
    const mood = await handleSendMessage(text, sessionStyle, delay);
    if (mood) {
      setCurrentMood(mood);
      updateStats({ visualMood: mood });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden font-sans selection:bg-rose/30">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] opacity-20"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, #C9A99A05 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, #C9A99A03 0%, transparent 50%)
          `,
          filter: 'blur(80px)'
        }}
      />
      
      {/* Floating Quote Desktop */}
      <div className="hidden lg:block fixed left-[calc(50%+280px)] top-[40%] max-w-[320px] pointer-events-none select-none z-0">
        <motion.h2 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.35, x: 0 }}
          className="text-6xl font-light text-rose mb-8 tracking-tight"
        >
          Hadir.in
        </motion.h2>
        <div className="space-y-6">
          <motion.p className="text-xl font-light italic leading-[1.8] text-rose/30">
            "kadang yang lo butuhin bukan solusi <br/> — tapi ada yang beneran dengerin."
          </motion.p>
        </div>
      </div>

      <div className="w-full sm:max-w-md h-[100svh] flex flex-col bg-[#0A0A0A]/40 backdrop-blur-3xl sm:border sm:border-offwhite/5 sm:rounded-[40px] sm:my-8 sm:h-[92dvh] sm:shadow-[0_0_100px_-20px_rgba(201,169,154,0.05)] relative z-10 overflow-hidden">
        
        <AnimatePresence>
          {showArsip && (
            <ArsipOverlay 
              history={stats.memoryBank} 
              onClose={() => setShowArsip(false)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && (
            <div id="settings-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-[#1a1a1a] border border-offwhite/5 rounded-3xl p-8 overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-offwhite font-medium tracking-tight text-lg">Pengaturan</h2>
                  <button onClick={() => setShowSettings(false)} className="text-offwhite/20 hover:text-rose">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Mode Percakapan */}
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-offwhite/30 font-medium">MODE PERCAKAPAN</p>
                    <div className="flex bg-[#12100f]/40 p-1 rounded-2xl border border-offwhite/5 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => handleSetSessionStyle('cerita')}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap flex flex-col items-center gap-1.5 ${sessionStyle === 'cerita' ? 'bg-rose/10 text-rose' : 'text-offwhite/30'}`}
                      >
                        <Heart size={14} fill={sessionStyle === 'cerita' ? "currentColor" : "none"} />
                        Dengerin
                      </button>
                      <button
                        onClick={() => handleSetSessionStyle('ngobrol')}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap flex flex-col items-center gap-1.5 ${sessionStyle === 'ngobrol' ? 'bg-rose/10 text-rose' : 'text-offwhite/30'}`}
                      >
                        <Sparkles size={14} />
                        Ngobrol
                      </button>
                      <button
                        onClick={() => handleSetSessionStyle('tanya')}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap flex flex-col items-center gap-1.5 ${sessionStyle === 'tanya' ? 'bg-rose/10 text-rose' : 'text-offwhite/30'}`}
                      >
                        <HelpCircle size={14} />
                        Tanya
                      </button>
                    </div>
                  </div>

                  {/* Companion Mode Toggle */}
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-offwhite/30 font-medium">Fitur</p>
                    <button
                      onClick={() => {
                        const newVal = !companionMode;
                        setCompanionMode(newVal);
                        localStorage.setItem('companion_mode', String(newVal));
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#12100f]/40 border border-offwhite/5 text-offwhite hover:border-rose/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${companionMode ? 'bg-rose/20 text-rose' : 'bg-offwhite/5 text-offwhite/20'}`}>
                          <Volume2 size={16} />
                        </div>
                        <div className="text-left">
                          <p className="text-[13px] font-medium">Mode Nemenin</p>
                          <p className="text-[10px] text-offwhite/40">AI bakal bacain responnya</p>
                        </div>
                      </div>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${companionMode ? 'bg-rose' : 'bg-offwhite/10'}`}>
                        <motion.div 
                          animate={{ x: companionMode ? 16 : 2 }}
                          className="absolute top-1 left-0 w-2 h-2 rounded-full bg-white shadow-sm"
                        />
                      </div>
                    </button>
                  </div>

                  {/* Experimental Section */}
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-offwhite/30 font-medium">Experimental (Labs)</p>
                    <div className="grid grid-cols-2 gap-2">
                       {installPromptRef.current && (
                         <button
                           onClick={handleInstallClick}
                           className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose/10 border border-rose/30 text-rose transition-all group"
                         >
                           <Plus size={16} className="group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-medium">Install App</span>
                         </button>
                       )}
                       <button
                        onClick={() => testNotification()}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#12100f]/40 border border-offwhite/5 text-offwhite/60 hover:text-rose hover:border-rose/20 transition-all group"
                      >
                        <Bell size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Tes Notif</span>
                      </button>
                      <button
                        onClick={() => testServerPush()}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#12100f]/40 border border-offwhite/5 text-offwhite/60 hover:text-rose hover:border-rose/20 transition-all group"
                      >
                        <Zap size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Server Push</span>
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-rose/30 font-medium">Bahaya</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (confirm('Beneran mau hapus semua data hadir lu? Gak bisa dibalikin lho.')) {
                            fullReset();
                            window.location.reload();
                          }
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-rose/5 border border-rose/10 text-rose/60 hover:bg-rose/10 transition-all"
                      >
                        <Trash2 size={16} />
                        <span className="text-[13px] font-medium">Hapus Semua Data</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          prepareClosing();
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose text-[#12100f] font-bold shadow-lg shadow-rose/10 active:scale-[0.98] transition-all"
                      >
                        <span className="text-[13px]">Akhiri Sesi</span>
                        <Sparkles size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNotifPrompt && (
            <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-6 bg-[#12100f]/60 backdrop-blur-sm">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="w-full max-w-sm bg-[#12100f] border border-offwhite/5 rounded-3xl p-8 shadow-2xl relative"
              >
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-rose/10 flex items-center justify-center text-rose">
                    <BellRing size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-offwhite font-medium text-lg">Boleh gue kabarin kamu besok?</h3>
                  </div>
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={async () => {
                        const granted = await requestNotificationPermission();
                        if (granted) scheduleNotifications(stats.currentDay, getTodayKey());
                        setShowNotifPrompt(false);
                      }}
                      className="w-full py-4 bg-rose text-[#12100f] font-bold rounded-2xl"
                    >
                      Boleh
                    </button>
                    <button onClick={() => setShowNotifPrompt(false)} className="w-full py-4 text-offwhite/40">
                      Nanti aja
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBreath && (
            <BreathOverlay onClose={() => setShowBreath(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {screen === AppScreen.SPLASH ? (
            <SplashScreen 
              onStart={startSession} 
              hasLongBreak={hasLongBreak} 
              onOpenArsip={() => setShowArsip(true)}
              hasHistory={stats.memoryBank.length > 0}
            />
          ) : screen === AppScreen.ONBOARDING ? (
            <OnboardingScreen onFinish={(data) => {
              updateStats({ userStyle: data.style });
              setSessionStyle(data.style);
              setScreen(AppScreen.CHAT);
              initChat(data.style);
            }} />
          ) : screen === AppScreen.REFLECTION ? (
            <ReflectionScreen 
              onFinish={async (answer) => {
                // If we are already in a state where we should close, go to closing
                // But let's simplify: Reflection always leads to closing now 
                // for a better "ritual" feel.
                prepareClosing();
              }} 
              onCancel={() => setScreen(AppScreen.CHAT)}
            />
          ) : screen === AppScreen.CHAT ? (
            <ChatScreen 
              stats={stats}
              messages={messages}
              userInput={userInput}
              setUserInput={setUserInput}
              isLoading={isLoading}
              isListening={isListening}
              isSpeaking={isSpeaking}
              currentMood={currentMood}
              sessionStyle={sessionStyle}
              exchangeCount={exchangeCount}
              companionMode={companionMode}
              isKeyboardOpen={isKeyboardOpen}
              onSendMessage={onSendMessage}
              onToggleListening={toggleListening}
              onSpeak={handleSpeak}
              onToggleCompanion={() => {
                const ns = !companionMode;
                setCompanionMode(ns);
                localStorage.setItem('companion_mode', String(ns));
              }}
              onShowSettings={() => setShowSettings(true)}
              onShowArsip={() => setShowArsip(true)}
              onShowBreath={() => setShowBreath(true)}
              onEndSession={() => setScreen(AppScreen.REFLECTION)}
              onSetSessionStyle={handleSetSessionStyle}
            />
          ) : screen === AppScreen.CLOSING ? (
            <ClosingScreen 
              day={stats.streak} 
              history={stats.checkInHistory} 
              onRestart={() => {
                clearMessages();
                setScreen(AppScreen.ALREADY_CHECKED_IN);
              }} 
              onBack={() => setScreen(AppScreen.CHAT)}
              canInstall={!!installPromptRef.current}
              onInstall={handleInstallClick}
              onEnableNotifications={handleNotificationRequest}
            />
          ) : screen === AppScreen.ALREADY_CHECKED_IN ? (
            <AlreadyCheckedInScreen 
              onBack={() => {
                resetToday();
                clearMessages();
                setScreen(AppScreen.SPLASH);
              }}
            />
          ) : null}
        </AnimatePresence>

        {isDev && (
          <div className="fixed top-2 left-2 z-[9999]">
             <button onClick={() => setShowDebug(!showDebug)} className="p-2 bg-darker border border-offwhite/10 rounded-full text-rose"><Bug size={16}/></button>
             {showDebug && (
               <div className="absolute top-12 left-0 bg-[#1a1a1a] p-4 rounded-xl border border-offwhite/10 flex flex-col gap-2 min-w-[150px]">
                 <button onClick={() => {
                   updateStats({ 
                     currentDay: (stats.currentDay || 0) + 1,
                     streak: (stats.streak || 0) + 1,
                     lastCheckIn: new Date().toISOString().split('T')[0]
                   });
                 }} className="text-xs text-offwhite text-left">Loncati Hari (+Day & Streak)</button>
                 <button onClick={() => updateStats({ streak: (stats.streak || 0) + 1 })} className="text-xs text-offwhite text-left">Tambah Streak (+1)</button>
                 <button onClick={() => { resetToday(); setScreen(AppScreen.SPLASH); }} className="text-xs text-offwhite text-left">Reset Today</button>
                 <button onClick={fullReset} className="text-xs text-rose text-left">Full Reset</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
