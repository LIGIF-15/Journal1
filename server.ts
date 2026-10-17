import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Server-side Gemini reflection endpoint
app.post('/api/diary/reflect', async (req: Request, res: Response) => {
  try {
    const { title, content, mood, date, location, weather, tags } = req.body;

    if (!content && !title) {
      return res.status(400).json({ error: 'Entry content or title is required.' });
    }

    const promptText = `The user has written an intimate digital diary entry.
Context:
- Title: ${title || 'Untitled'}
- Mood: ${mood || 'unspecified'}
- Date & Location: ${date || 'Today'} · ${location || 'Undisclosed'}
- Weather/Atmosphere: ${weather || 'Undisclosed'}
- Tags: ${(tags || []).join(', ')}

User's Diary Content:
"""
${content}
"""

TASK:
Craft an intimate, two-line responsive reflection to the user's entry.

STRICT INSTRUCTIONS:
1. Exactly TWO lines (separated by a single newline).
2. It MUST feel deeply personal to the user, like an intimate, mindful reader holding space for their truth.
3. NEVER be generic or cliché. Absolutely BANNED: "Stay positive", "Every cloud has a silver lining", "Tomorrow is a new day", "You've got this", "It's important to practice self-care", "I hear you", "Keep your chin up".
4. Ground the response in concrete specifics mentioned by the user (specific objects, actions, sensory details, names, or feelings they expressed).
5. Line 1: A warm, deeply attuned observation that mirrors the emotional texture and exact specifics of their experience.
6. Line 2: A quiet, poignant thought or gentle question that lingers without demanding work.
7. Tone: Quiet, poetic, sincere, observant, warm.
8. Output ONLY the two lines, without quotes, bullet points, line numbers, or greetings.`;

    // Try primary model (gemini-3.8-flash), fallback to gemini-flash-latest or gemini-3.1-flash-lite on 503 / high demand
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let reflectionText = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            systemInstruction:
              'You are an intimate, observant reflection companion for a private digital diary. Your words are concise, poetic, and acutely responsive to the user\'s real lived moments without generic advice.',
            temperature: 0.75,
          },
        });

        reflectionText = response.text?.trim() || '';
        if (reflectionText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next fallback:`, err?.message || err);
      }
    }

    if (reflectionText) {
      return res.json({ reflection: reflectionText });
    }

    throw lastError || new Error('Could not generate reflection from available models');
  } catch (error: any) {
    console.error('Error generating diary reflection:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate reflection',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Komorebi Diary server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
