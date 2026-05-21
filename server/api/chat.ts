import express from 'express';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../../src/constants.js';
import { guestRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const getOpenAIClient = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY or XAI_API_KEY not found in environment variables.");
  }
  const isGroq = apiKey.startsWith('gsk_');
  return new OpenAI({
    apiKey: apiKey,
    baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://api.x.ai/v1",
  });
};

router.post('/chat', guestRateLimiter, async (req, res) => {
  try {
    const { messages, day, lastMood, totalSessions, memoryBank, userStyle } = req.body;

    const systemPrompt = SYSTEM_PROMPT(day, lastMood || 'neutral', totalSessions || 0, memoryBank, userStyle);

    const openai = getOpenAIClient();
    const isGroq = openai.apiKey?.startsWith('gsk_') || false;
    const model = isGroq ? "llama-3.3-70b-versatile" : "grok-4";

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages || []).slice(-6).map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    let text = completion.choices[0]?.message?.content || "Hmm...";

    const moodMatch = text.match(/\[MOOD:(.*?)\]/i);
    const mood = moodMatch ? moodMatch[1].toLowerCase().trim() : 'neutral';
    text = text.replace(/\[MOOD:.*?\]/i, '').trim();

    res.json({ text, mood });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ 
      text: "Maaf, gue lagi agak gangguan. Coba kirim lagi ya?", 
      mood: 'neutral' 
    });
  }
});

export default router;
