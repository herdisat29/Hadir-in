import { useState, useEffect, useRef } from 'react';
import { Message, UserStats } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getHadirResponse, getTtsAudio } from '../services/geminiService';

const RECAP_MESSAGES = [
  "Makasih udah cerita hari ini. Gue dengerin kok.",
  "Tadi gue dengerin semua. Makasih ya.",
  "Lo udah berani cerita. Itu gak gampang.",
  "Gue simpen semua yang lo ceritain hari ini.",
  "Udah berani hadir. Itu cukup buat hari ini.",
  "Gue masih di sini. Makasih udah mampir.",
  "Lo gak sendirian hari ini."
];

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useChat = (
  stats: UserStats, 
  onRecapComplete: (recap: string) => void,
  onSessionEnd: () => void
) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const unique: Message[] = [];
          const seen = new Set();
          for (const m of parsed) {
            if (m && m.id && !seen.has(m.id)) {
              seen.add(m.id);
              unique.push(m);
            }
          }
          return unique;
        }
        return [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Count user messages as exchanges
          return parsed.filter(m => m.role === 'user').length;
        }
      } catch (e) {}
    }
    return 0;
  });
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript.trim()) {
          setUserInput(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert("Izin mic ditolak. Cek setelan browser kamu ya biar kita bisa ngobrol lewat suara.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      return recognition;
    }
    return null;
  };

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const toggleListening = () => {
    const recognition = initRecognition();
    if (!recognition) {
      alert("Browser lo gak support rekam suara / Speech Recognition.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      // Stop speech if speaking
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      
      setUserInput('');
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error("Recognition start error:", err);
      }
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
    }

    setIsSpeaking(true);
    
    try {
      await getTtsAudio(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (text: string, sessionStyle: 'cerita' | 'tanya' | 'ngobrol', delay = 0) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${generateId()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    // Stop speaking if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    try {
      // Artificial delay for psychological pacing if requested
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const result = await getHadirResponse(
        apiMessages, 
        stats.currentDay,
        stats.lastMood,
        stats.totalSessions,
        stats.memoryBank,
        sessionStyle
      );

      const { text: cleanResponse, mood } = result;

      const assistantMsg: Message = {
        id: `ai-${generateId()}`,
        role: 'assistant',
        content: cleanResponse || '',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (newCount >= 8) {
        setTimeout(() => {
          const recap = RECAP_MESSAGES[
            Math.floor(Math.random() * RECAP_MESSAGES.length)
          ];
          const recapMsg: Message = {
            id: `recap-${generateId()}`,
            role: 'assistant',
            content: recap,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, recapMsg]);
          onRecapComplete(recap);
          
          setTimeout(() => {
            onSessionEnd();
          }, 3000);
        }, 5000);
      }

      return mood;
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: `error-${generateId()}`,
        role: 'assistant',
        content: "Gue denger, tapi kayaknya ada yang keganjel di koneksi gue. Bisa coba sekali lagi?",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setExchangeCount(0);
  };
  const initChatMessages = (sessionStyle: 'cerita' | 'tanya' | 'ngobrol' = 'cerita') => {
    setExchangeCount(0);
    const opening = sessionStyle === 'tanya' 
      ? 'Ada yang lagi mengganjal?' 
      : sessionStyle === 'ngobrol'
        ? 'Lagi kepikiran apa?'
        : 'Hari ini gimana?';
    
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: opening,
      timestamp: Date.now()
    }]);
  };

  return {
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
    clearMessages,
    initChatMessages,
    setMessages
  };
};
