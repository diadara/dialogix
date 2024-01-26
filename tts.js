import * as PlayHT from 'playht';
import dotenv from 'dotenv';
import OpenAi from 'openai-api';

dotenv.load_dotenv();

// gets API Key from environment variable OPENAI_API_KEY
const openai = new OpenAI();


const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: 'the quick brown fox jumped over the lazy dogs',
  });

  const stream = response.body;

  

// try {
//     PlayHT.init({
//       apiKey:
//         process.env.PLAYHT_API_KEY,
//       userId:
//         process.env.PLAYHT_USER_ID,
//     });
//   } catch (error) {
//     console.log('Failed to initialise PlayHT SDK', error.message);
//   }