import express, { Express, Request, Response } from 'express';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { createClient, LiveTranscriptionEvents, LiveConnectionState, Connection } from "@deepgram/sdk";
import cors from 'cors';
import http from 'http';
import OpenAi from 'openai-api';
import dotenv from 'dotenv';

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
let connection: Connection | undefined;

function bindDeepgramEvents(connection: Connection, socket: Socket): void {
  connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    console.log("transcript");
    console.dir(data, { depth: null });
    socket.emit('transcript', data);
  });

  connection.on(LiveTranscriptionEvents.Metadata, (data: any) => {
    console.log("metadata");
    console.dir(data, { depth: null });
    // socket.emit('metadata', data);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('connection closed');
  });
}

io.on('connection', (socket: Socket) => {
  console.log('a user connected');

  if (!connection || connection.getReadyState() !== LiveConnectionState.OPEN) {
    connection = deepgram.listen.live({
      smart_format: true,
      model: 'nova-2',
      language: 'en-US',
      speech_final: true,
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      bindDeepgramEvents(connection, socket);
    });

    connection.on(LiveTranscriptionEvents.Error, (error: any) => {
      console.error('Deepgram error:', error);
    });

    console.log("connection to deepgram");
  }

  socket.on('audio', (audio: any) => {
    console.log('audio received');

    if (!connection || connection.getReadyState() !== LiveConnectionState.OPEN) {
      connection = deepgram.listen.live({
        smart_format: true,
        model: 'nova-2',
        language: 'en-US',
        speech_final: true,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        bindDeepgramEvents(connection, socket);
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error);
      });

      console.log("connection to deepgram");
    }

    connection.send(audio);
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