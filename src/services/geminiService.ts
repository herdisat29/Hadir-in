import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function getHadirResponse(
  messages: { role: 'user' | 'assistant', content: string }[], 
  day: number,
  lastMood?: string | null,
  totalSessions?: number,
  memoryBank?: string[],
  userStyle?: 'cerita' | 'tanya',
  userAge?: string
) {
  console.log("AI Request started", { day, lastMood, totalSessions, userStyle, userAge });
  
  if (!apiKey) {
    console.error("AI Request failed: API Key missing");
    return "Eh sorry, gue lagi ada kendala teknis (API key gak ada). Coba hubungi admin ya?";
  }

  // Check online status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return "Duh, HP lo lagi offline nih kayaknya. Coba cek sinyal atau wifi bentar yuk?";
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn("AI Request timed out after 45s");
    controller.abort();
  }, 45000);

  try {
    // Filter history for Gemini (ensure starts with user and limited to recent context)
    const MAX_HISTORY = 12; // Keep last 12 messages (~6 rounds)
    const recentMessages = messages.length > MAX_HISTORY ? messages.slice(-MAX_HISTORY) : messages;
    
    // Ensure history starts with 'user' role
    const firstUserIdx = recentMessages.findIndex(m => m.role === 'user');
    const filteredMessages = firstUserIdx !== -1 ? recentMessages.slice(firstUserIdx) : recentMessages;

    // Retry logic
    let lastError = null;
    for (let i = 0; i < 2; i++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: filteredMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          config: {
            systemInstruction: SYSTEM_PROMPT(day, lastMood, totalSessions, memoryBank, userStyle, userAge),
            temperature: 0.7,
            topP: 0.95,
          },
        });

        clearTimeout(timeoutId);
        if (!response.text) throw new Error("Empty response from AI");
        
        console.log("AI Request success");
        return response.text;
      } catch (err: any) {
        lastError = err;
        const errMessage = (err?.message || "").toLowerCase();
        
        // Handle safety filters specifically
        if (errMessage.includes("safety") || errMessage.includes("blocked")) {
          return "Sori, gue gak bisa ngebahas itu. Coba cerita hal lain yuk?";
        }

        // Only retry on network issues or rate limits
        if (errMessage.includes("network") || errMessage.includes("fetch") || err.status === 429 || errMessage.includes("timeout")) {
          console.warn(`AI Retry ${i+1} due to: ${errMessage}`);
          await new Promise(r => setTimeout(r, 1500 * (i + 1))); // Wait 1.5s then 3s
          continue;
        }
        throw err; 
      }
    }
    throw lastError;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Gemini Error:", error);
    
    if (error.name === 'AbortError') {
      return "Sori, request-nya kelamaan. Sinyal lo lagi oke? Coba kirim ulang deh.";
    }
    
    return "Maaf, kayaknya koneksi gue lagi nggak stabil. Tapi gue masih di sini nungguin lo. Coba kirim lagi?";
  }
}

export async function getRecapMessage(
  messages: { role: 'user' | 'assistant', content: string }[]
) {
  if (!apiKey) return "Btw, makasih ya udah cerita hari ini. Gue dengerin kok.";

  try {
    const firstUserIdx = messages.findIndex(m => m.role === 'user');
    const filteredMessages = firstUserIdx !== -1 ? messages.slice(firstUserIdx) : messages;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: filteredMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: "Berdasarkan percakapan tadi, buat SATU kalimat singkat yang menunjukkan kamu dengerin. Format: 'Btw, hari ini kamu cerita soal [tema]. Gue dengerin kok.' Satu kalimat. Hangat. Natural. Bahasa Indonesia Gen Z santai (lo/gue).",
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text || "Btw, makasih ya udah cerita hari ini. Gue dengerin kok.";
  } catch (error) {
    console.error("Recap Error:", error);
    return "Btw, makasih ya udah cerita hari ini. Gue dengerin kok.";
  }
}
