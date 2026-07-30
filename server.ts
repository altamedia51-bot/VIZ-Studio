import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini AI lazily when needed
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'VIZ Studio' });
  });

  // AI Palette Generator API
  app.post('/api/ai/palette', async (req, res) => {
    try {
      const { genre, mood, style } = req.body;
      const ai = getAI();
      const prompt = `Generate a modern 5-color aesthetic hex palette for a music video/audio visualizer. Genre/Mood: ${genre || 'Cyberpunk Electronic'}, Style: ${style || 'Dark Modern'}. Respond ONLY with a valid JSON array of 5 hex color strings, e.g. ["#0f172a", "#3b82f6", "#06b6d4", "#ec4899", "#f8fafc"]. Do not include markdown code block syntax.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim().replace(/```json/g, '').replace(/```/g, '').trim() : '';
      const colors = JSON.parse(text);
      res.json({ success: true, colors });
    } catch (error: any) {
      console.error('AI Palette error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate palette' });
    }
  });

  // AI Subtitle / Lyrics Sync API
  app.post('/api/ai/subtitles', async (req, res) => {
    try {
      const { text, durationSeconds } = req.body;
      const ai = getAI();
      const prompt = `Format the following song lyrics or speech text into synced subtitles with timestamps across a total duration of ${durationSeconds || 60} seconds. Text: "${text}". Output MUST be a valid JSON array of objects with fields: { "start": number (seconds), "end": number (seconds), "text": string }. Do not include markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text ? response.text.trim().replace(/```json/g, '').replace(/```/g, '').trim() : '';
      const subtitles = JSON.parse(rawText);
      res.json({ success: true, subtitles });
    } catch (error: any) {
      console.error('AI Subtitle error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate subtitles' });
    }
  });

  // Serve Vite in development mode or Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIZ Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
