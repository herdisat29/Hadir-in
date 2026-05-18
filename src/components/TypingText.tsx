import { useState, useEffect } from 'react';

export const TypingText = () => {
  const [text, setText] = useState('hadir lagi dengerin');
  const phrases = [
    'hadir lagi dengerin',
    'hmm...',
    'gue masih di sini',
    'lagi ngerasain ceritanya',
    'sebentar ya',
    'masih di sini kok'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setText(prev => {
        const idx = phrases.indexOf(prev);
        return phrases[(idx + 1) % phrases.length];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return <span>{text}</span>;
};
