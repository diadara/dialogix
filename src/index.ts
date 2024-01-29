import express, { Express, Request, Response } from 'express';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { createClient, LiveTranscriptionEvents, LiveConnectionState, LiveClient } from "@deepgram/sdk";
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { getNewChatbot } from './assistant';
import { createSpeech } from './tts'
dotenv.config();

const app: Express = express();
app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io: SocketIoServer = new SocketIoServer(server, {
  cors: {
    origin: '*',
  }
});

const deepgramApiKey: string = process.env.DEEPGRAM_API || "";
console.log(deepgramApiKey)
const deepgram = createClient(deepgramApiKey);

function bindDeepgramEvents(connection: LiveClient | null, socket: Socket, chatbot: any): void {
  if (!connection) {
    console.log('connection not available');
    return;
  }
  let pendingTranscript: string = '';
  let emptyTranscriptCount: number = 0;

  connection.on(LiveTranscriptionEvents.Transcript, async (data: any) => {
    // check if the transcript is final and has any words
    console.log(`is_final: ${data.is_final} ,  speech_final: ${data.speech_final} , wordlength ${data.channel.alternatives[0].words.length},  transcript:  ${data.channel.alternatives[0].transcript} , pending tr: ${pendingTranscript}, count: ${emptyTranscriptCount}`);

    if (data.channel.alternatives[0].words.length === 0) {
      emptyTranscriptCount++;
    } else {
      pendingTranscript += data.channel.alternatives[0].transcript;
    }

    let isFinal = data.speech_final || emptyTranscriptCount > 2;

    if (isFinal && pendingTranscript.length > 0) {
      // the transcript is final, send it to client and append to pending transcript
      // console.log(data.channel.alternatives[0].transcript);
      socket.emit('transcript', pendingTranscript);
      let query = pendingTranscript;
      pendingTranscript = '';
      emptyTranscriptCount = 0;
      // clearing the que before calling chatbot
      // if there is  another transcript that comes in  we don't want it to pick up the pending transcript
      let response = await chatbot.chat(query)
      console.log(`agent response:\n  query ${query} \n response ${response}`)
      socket.emit('agent', response)

      const readableStream = await createSpeech(response) as unknown as NodeJS.ReadableStream;
      readableStream.on('data', (chunk) => {
        socket.emit('audio-chunk', chunk);
      });
    }
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('connection closed');
    // we are going to clear the reference to the connection so that we can create a new one
    // when new audio is recieved
    connection = null;
  });
}

function getNewDeepGramConnection(): LiveClient {
  let connection = deepgram.listen.live({
    smart_format: true,
    // model: 'nova-2',
    model: 'nova-2-conversationalai',
    language: 'en-US',
    speech_final: true,
    endpointing: 300,
  });
  connection.on(LiveTranscriptionEvents.Error, (error: any) => {
    console.log('Deepgram error:', error);
  });
  return connection;
}

io.on('connection', (socket: Socket) => {
  console.log('a user connected');

  // create a new chat bot for each user
  let chatBot = getNewChatbot(`You are a helpful assistant that answer telephone for XYZ inc.
   You will answer customer queries and book an appoinment for detailed consultation after asking a few questions.
    you will recieve the questions from the customer and you will answer them with only the response for the question.
     You will speak in short sentences and you will make sure that the customer understands you. Avoid
     creating responses that are diffiult to convert to audio. use ssml tags to control the audio output.
     The user might spell out the words. You will need to handle that. If you think the user is still speaking,
      use words like "anything else" , ok ? , "is that all" to confirm that the user is done speaking.
     `);
  //  TODO: in case there is significant delay in input, we need confirm with the user whether they are following
  let connection = getNewDeepGramConnection();
  // always create a new deepgram connection when the socket reconnects
  connection.on(LiveTranscriptionEvents.Open, () => {
    bindDeepgramEvents(connection, socket, chatBot);
  });

  console.log("connecting to deepgram");

  // stream the recieved audio to deepgram
  socket.on('audio', (audio: any) => {

    if (connection && connection.getReadyState() === LiveConnectionState.OPEN) {
      connection.send(audio);
    } else {
      console.log('connection expired, creating new connection');
      connection = getNewDeepGramConnection();
      connection.on(LiveTranscriptionEvents.Open, () => {
        bindDeepgramEvents(connection, socket, chatBot);
      })
    }

  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    // connection.finish();
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

server.listen(3010, '0.0.0.0', () => {
  console.log('listening on *:3010');
});