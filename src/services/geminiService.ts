export async function getHadirResponse(
  messages: { role: 'user' | 'assistant', content: string }[],
  day: number,
  lastMood?: string | null,
  totalSessions?: number,
  memoryBank?: string[],
  userStyle?: 'cerita' | 'tanya' | 'ngobrol'
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      day,
      lastMood,
      totalSessions,
      memoryBank,
      userStyle
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.text || 'Gagal terhubung ke asisten');
  }

  return response.json(); // Returns { text, mood }
}

// ==================== TTS BROWSER (Gratis) ====================
export async function getTtsAudio(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn("Browser lo gak support TTS.");
    return;
  }

  // Stop previous speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Pengaturan suara Indonesia yang natural
  utterance.lang = 'id-ID';
  utterance.rate = 0.92;      // agak pelan biar enak didengar
  utterance.pitch = 1.05;
  utterance.volume = 0.95;

  // Coba pilih suara Indonesia terbaik
  const voices = window.speechSynthesis.getVoices();
  const indonesianVoice = voices.find(voice => 
    voice.lang.includes('id') || 
    voice.name.toLowerCase().includes('indonesia')
  );

  if (indonesianVoice) {
    utterance.voice = indonesianVoice;
  }

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
