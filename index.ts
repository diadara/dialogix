import express, { Express, Request, Response } from 'express';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { createClient, LiveTranscriptionEvents, LiveConnectionState, LiveClient } from "@deepgram/sdk";
import cors from 'cors';
import http from 'http';
import OpenAi from 'openai';
import dotenv from 'dotenv';
import { getNewChatbot } from './assistant';
import { createSpeech } from './tts'
dotenv.config();

const openai = new OpenAi();

const app: Express = express();
app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io: SocketIoServer = new SocketIoServer(server, {
  cors: {
    origin: '*',
  }
});

const deepgramApiKey: string = "81698bbcba50c809ec13b51ed0e42797f926b6eb";
const deepgram = createClient(deepgramApiKey);
let connection: LiveClient | undefined;

function bindDeepgramEvents(connection: LiveClient, socket: Socket, chatbot: any): void {
  connection.on(LiveTranscriptionEvents.Transcript, async (data: any) => {
    // check if the transcript is final and has any words
    // console.log(data)
    if (data.speech_final && data.channel.alternatives[0].transcript.length > 0) {
      socket.emit('transcript', data.channel.alternatives[0].transcript);
      console.log("user:", data.channel.alternatives[0].transcript);
      let response = await chatbot.chat(data.channel.alternatives[0].transcript)
      console.log("agent:", response);
      socket.emit('agent', response)

      // take the response and stream audio to the client
      // const responseAudio = await openai.audio.speech.create({
      //   model: 'tts-1',
      //   voice: 'alloy',
      //   input: response,
      // });



      // const readableStream = responseAudio.body as unknown as NodeJS.ReadableStream;
      const readableStream = await createSpeech(response) as unknown as NodeJS.ReadableStream;
      readableStream.on('data', (chunk) => {
        socket.emit('audio-chunk', chunk);
      });


    }

  });

  // connection.on(LiveTranscriptionEvents.Metadata, (data: any) => {
  // console.log("metadata");
  // console.dir(data, { depth: null });
  // socket.emit('metadata', data);
  // });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('connection closed');
  });
}

io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  let chatBot = getNewChatbot(`You are a helpful assistant that answer telephone for XYZ inc.
   You will answer customer queries and book an appoinment for detailed consultation after asking a few questions.
    you will recieve the questions from the customer and you will answer them with only the response for the question.
     You will speak in short sentences and you will make sure that the customer understands you.`);
    //  TODO: in case there is significant delay in input, we need confirm with the user whether they are following
  if (!connection || connection.getReadyState() !== LiveConnectionState.OPEN) {
    connection = deepgram.listen.live({
      smart_format: true,
      model: 'nova-2',
      language: 'en-US',
      speech_final: true,
    });
    console.log("connecting to deepgram");

    connection.on(LiveTranscriptionEvents.Open, () => {
      if (connection)
        bindDeepgramEvents(connection, socket, chatBot);
    });

    connection.on(LiveTranscriptionEvents.Error, (error: any) => {
      console.error('Deepgram error:', error);
    });
  }

  // stream the recieved audio to deepgram
  socket.on('audio', (audio: any) => {
    console.log('audio received');
    if (connection && connection.getReadyState() === LiveConnectionState.OPEN) {
      connection.send(audio);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

server.listen(3010, () => {
  console.log('listening on *:3010');
});