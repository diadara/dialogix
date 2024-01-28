import dotenv from 'dotenv';
import { PollyClient, SynthesizeSpeechCommand, LanguageCode, OutputFormat, VoiceId } from "@aws-sdk/client-polly";
import { Readable } from 'stream';

dotenv.config();

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1"
};

export async function createSpeech(text: string): Promise<Readable | ReadableStream | Blob | null | undefined> {
      // take the response and stream audio to the client
      // const responseAudio = await openai.audio.speech.create({
      //   model: 'tts-1',
      //   voice: 'alloy',
      //   input: response,
      // });

  const pollyClient = new PollyClient(awsConfig);
  const languageCode: LanguageCode = "en-IN";

  const params = {
    OutputFormat: "mp3" as OutputFormat,
    Text: text,
    VoiceId: "Raveena" as VoiceId,
    LanguageCode: languageCode
  };

  try {
    const data = await pollyClient.send(new SynthesizeSpeechCommand(params));
    const audioStream = data.AudioStream;
    return audioStream;
  } catch (error) {
    console.error("Error synthesizing speech: ", error);
    return null;
  }
}
