import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function getHadirResponse(
  messages: { role: 'user' | 'assistant', content: string }[], 
  day: number,
  lastMood?: string | null,
  totalSessions?: number,
  memoryBank?: string[],
  userStyle?: 'cerita' | 'tanya'
) {
  console.log("AI Request started", { day, lastMood, totalSessions, userStyle });
  
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
    const MAX_HISTORY = 10; 
    const recentMessages = messages.length > MAX_HISTORY ? messages.slice(-MAX_HISTORY) : messages;
    const firstUserIdx = recentMessages.findIndex(m => m.role === 'user');
    const filteredMessages = firstUserIdx !== -1 ? recentMessages.slice(firstUserIdx) : recentMessages;

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    // Retry logic
    let lastError = null;
    for (let i = 0; i < 2; i++) {
      try {
        const responsePromise = ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: filteredMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          config: {
            systemInstruction: SYSTEM_PROMPT(day, lastMood, totalSessions, memoryBank, userStyle),
            temperature: 0.7,
            topP: 0.95,
            safetySettings,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          },
        });

        // The SDK handles timeout via AbortController if passed, 
        // but here we wait for the promise from ai.models.generateContent
        const response: any = await responsePromise;

        clearTimeout(timeoutId);
        
        // Safety block check
        const candidate = response.candidates?.[0];
        if (!candidate || candidate.finishReason === 'SAFETY' || candidate.finishReason === 'OTHER') {
          return "Sori, gue gak bisa ngebahas itu. Coba cerita hal lain yuk?";
        }

        const text = response.text;
        if (!text) throw new Error("Empty response");
        
        console.log("AI Request success");
        return text;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err).toLowerCase();
        
        if (errStr.includes("safety") || errStr.includes("blocked") || errStr.includes("finishreason") || errStr.includes("candidate")) {
          return "Sori, gue gak bisa ngebahas itu. Coba cerita hal lain yuk?";
        }

        if (errStr.includes("timeout") || errStr.includes("network") || errStr.includes("fetch") || err.status === 429) {
          console.warn(`Retry ${i+1} due to network/timeout: ${errStr}`);
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        throw err;
      }
    }
    throw lastError;

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Gemini Error:", error);
    return "Maaf, kayaknya koneksi gue lagi nggak stabil. Tapi gue masih di sini nungguin lo. Coba kirim lagi?";
  }
}

export async function getRecapMessage(
  messages: { role: 'user' | 'assistant', content: string }[]
) {
  const defaultRecap = "Btw, makasih ya udah mampir hari ini. Gue dengerin kok.";
  if (!apiKey) return defaultRecap;

  try {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      return defaultRecap;
    }

    const firstUserIdx = messages.findIndex(m => m.role === 'user');
    const filteredMessages = messages.slice(firstUserIdx);

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    const response: any = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: filteredMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: "Berdasarkan percakapan singkat tadi, buat SATU kalimat hangat yang menunjukkan kamu dengerin apa yang diceritain user. Format: 'Btw, tadi kamu sempat cerita soal [tema]. Gue dengerin kok.' Pastikan natural, santai (lo/gue), dan JANGAN mengulang instruksi atau menyertakan teks di dalam kurung. Satu kalimat saja.",
        temperature: 0.8,
        topP: 0.95,
        safetySettings,
      }
    });

    const text = response.text?.trim();
    if (response.candidates?.[0]?.finishReason === 'SAFETY' || !text) {
      return defaultRecap;
    }

    return text;
  } catch (error) {
    console.error("Recap Error:", error);
    return defaultRecap;
  }
}


