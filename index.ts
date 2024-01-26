import express, { Express, Request, Response } from 'express';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { createClient, LiveTranscriptionEvents, LiveConnectionState, LiveClient } from "@deepgram/sdk";
import cors from 'cors';
import http from 'http';
import OpenAi from 'openai';
import dotenv from 'dotenv';
import { getNewChatbot } from './assistant';

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
    if (data.is_final && data.channel.alternatives[0].transcript.length > 0) {
      socket.emit('transcript', data);
      console.log("user:", data.channel.alternatives[0].transcript);
      let response = await chatbot.chat(data.channel.alternatives[0].transcript)
      console.log("agent:", response);
      socket.emit('agent', response)
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
    you will recieve the questions from the customer and you will answer them with only the response for the question.`);
  if (!connection || connection.getReadyState() !== LiveConnectionState.OPEN) {
    connection = deepgram.listen.live({
      smart_format: true,
      model: 'nova-2',
      language: 'en-US',
      speech_final: true,
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      if (connection)
        bindDeepgramEvents(connection, socket, chatBot);
    });

    connection.on(LiveTranscriptionEvents.Error, (error: any) => {
      console.error('Deepgram error:', error);
    });

    console.log("connection to deepgram");
  }

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