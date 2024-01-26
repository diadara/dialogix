import dotenv from 'dotenv';
import OpenAi from 'openai';

dotenv.config();

// gets API Key from environment variable OPENAI_API_KEY
const openai = new OpenAi();

async function createSpeech(): Promise<void> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: 'the quick brown fox jumped over the lazy dogs',
  });

  const stream = response.body;
  // You can now use the stream for further processing
}

createSpeech().catch(console.error);
