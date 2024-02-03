import dotenv from 'dotenv';
import { PollyClient, SynthesizeSpeechCommand, LanguageCode, OutputFormat, VoiceId, Engine } from "@aws-sdk/client-polly";
import { Transform, Readable, pipeline as pipelineCallback , PassThrough} from 'stream';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';

const pipeline = promisify(pipelineCallback);
dotenv.config();

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1"
};

export async function createSpeech(text: string): Promise<Readable| null> {
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
    Engine: "neural" as Engine,
    // VoiceId: "Raveena" as VoiceId,
    VoiceId: "Kajal" as VoiceId,
    
    LanguageCode: languageCode
  };

  try {
    const data = await pollyClient.send(new SynthesizeSpeechCommand(params));
    const audioStream = data.AudioStream as Readable;
    return audioStream || null;
  } catch (error) {
    console.error("Error synthesizing speech: ", error);
    return null;
  }
}

// Transform stream to convert audio to µ-law and base64 encode
export async function convertToMuLaw(audioStream: Readable): Promise<Readable> {
  return new Promise((resolve, reject) => {

    const passThrough = new PassThrough();

    const convertedStream = ffmpeg(audioStream)
      .audioCodec('pcm_mulaw')
      .audioFrequency(8000)
      .format('wav')
      .on('error', (err: Error) => {
        console.error('An error occurred: ' + err.message);
        reject(err);
      })
      .on('end', () => {
        console.log('Conversion finished.');
      })
      .stream(passThrough);

    resolve(passThrough);
  });
}