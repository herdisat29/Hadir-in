import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../constants';

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    // Check multiple locations where the key might be stored (favoring GROQ)
    const apiKey = 
      import.meta.env.VITE_GROQ_API_KEY || 
      import.meta.env.VITE_XAI_API_KEY || 
      (typeof process !== 'undefined' ? (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY) : null) ||
      (typeof process !== 'undefined' ? (process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY) : null);
    
    if (!apiKey || apiKey === '' || apiKey.includes('your_xai_api_key')) {
      throw new Error("GROQ_API_KEY belum diset. Klik 'Settings' > 'Environment Variables' terus tambah VITE_GROQ_API_KEY dengan key dari Groq (gsk_...).");
    }

    // Identify if it's a Groq key (typically starts with gsk_)
    const isGroq = apiKey.startsWith('gsk_');

    openaiClient = new OpenAI({
      apiKey: apiKey,
      baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://api.x.ai/v1",
      dangerouslyAllowBrowser: true 
    });
  }
  return openaiClient;
}

export async function getHadirResponse(
  messages: { role: 'user' | 'assistant', content: string }[],
  day: number,
  lastMood?: string | null,
  totalSessions?: number,
  memoryBank?: string[],
  userStyle?: 'cerita' | 'tanya' | 'ngobrol'
) {
  const MAX_HISTORY = 6;
  const history = messages.slice(-MAX_HISTORY).map(m => ({
    role: m.role,
    content: m.content.length > 400 ? m.content.slice(0, 400) + '...' : m.content
  }));

  const systemInstruction = SYSTEM_PROMPT(day, lastMood || 'neutral', totalSessions || 0, memoryBank, userStyle);

  try {
    const openai = getOpenAIClient();
    
    // Use appropriate model based on detection
    const isGroq = openai.apiKey.startsWith('gsk_');
    const model = isGroq ? "llama-3.3-70b-versatile" : "grok-4.3";

    const completion = await openai.chat.completions.create({
      model: model, 
      messages: [
        { role: "system", content: systemInstruction },
        ...history.map(m => ({
          role: m.role as 'assistant' | 'user',
          content: m.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.9,
    });

    let responseText = completion.choices[0]?.message?.content || "Hmm...";

    // Parse mood tag [MOOD:xxx]
    let mood = 'neutral';
    const moodMatch = responseText.match(/\[MOOD:(.*?)\]/i);
    if (moodMatch) {
      mood = moodMatch[1].toLowerCase().trim();
      responseText = responseText.replace(/\[MOOD:.*?\]/i, '').trim();
    }

    return { text: responseText, mood };

  } catch (error: any) {
    console.error("AI API Error:", error);

    if (error?.status === 429) {
      return {
        text: "Hadir lagi penuh bentar — terlalu banyak yang ngobrol sekarang. Tunggu semenit terus coba lagi ya, gue masih nungguin lo.",
        mood: 'neutral'
      };
    }

    if (error?.status === 403) {
      return {
        text: "Waduh, saldo API lo abis atau ada masalah akses. Coba cek console provider lo (Groq/xAI) ya biar gue bisa nemenin lo lagi.",
        mood: 'neutral'
      };
    }

    return {
      text: "Maaf, gue lagi agak gangguan. Coba kirim lagi ya?",
      mood: 'neutral'
    };
  }
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
