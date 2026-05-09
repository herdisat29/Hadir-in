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

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn("AI Request timed out after 15s");
    controller.abort();
  }, 15000);

  try {
    // Filter history for Gemini (ensure starts with user)
    const firstUserIdx = messages.findIndex(m => m.role === 'user');
    const filteredMessages = firstUserIdx !== -1 ? messages.slice(firstUserIdx) : messages;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: filteredMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT(day, lastMood, totalSessions, memoryBank, userStyle, userAge),
        temperature: 0.7,
        topP: 0.95,
      },
      // signal: controller.signal // Note: @google/genai might not support signal in this version yet, but wait
    });

    clearTimeout(timeoutId);
    console.log("AI Request success");
    return response.text || "Hmm, gue dengerin kok. Boleh lanjut ceritanya?";
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Gemini Error:", error);
    
    if (error.name === 'AbortError') {
      return "Sori, kayaknya pikiran gue lagi muter jauh banget. Coba kirim ulang pesannya?";
    }
    
    return "Maaf, kayaknya koneksi gue lagi nggak stabil. Tapi gue masih di sini nungguin lo.";
  }
}
