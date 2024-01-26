const express = require('express');
const socketIo = require('socket.io');
const { createClient, LiveTranscriptionEvents, LiveConnectionState } = require("@deepgram/sdk");
const cors = require('cors');
const app = express();
const http = require('http');
const OpenAi = require('openai-api');
const dotenv = require('dotenv');

dotenv.config();

openai = new OpenAi(process.env.OPENAI_API_KEY);


app.use(cors({ origin: '*' }));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

const deepgramApiKey = "81698bbcba50c809ec13b51ed0e42797f926b6eb";
const deepgram = createClient(deepgramApiKey);
let connection;


function bindDeepgramEvents(connecrtion, socket) {
  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    console.log("transcript");
    console.dir(data, { depth: null });
    socket.emit('transcript', data);
  });

  connection.on(LiveTranscriptionEvents.Metadata, (data) => {
    console.log("metadata");
    console.dir(data, { depth: null });
    // socket.emit('metadata', data);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('connection closed');
  });
}



io.on('connection', (socket) => {
  console.log('a user connected');
  // check if connection is active

  if (!connection || connection.getReadyState() !== LiveConnectionState.OPEN) {
    // initialize deepgram connection
    connection = deepgram.listen.live({
      smart_format: true,
      model: 'nova-2',
      language: 'en-US',
      speach_final: true,
    });
    connection.on(LiveTranscriptionEvents.Open, () => {
      bindDeepgramEvents(connection, socket);
    });
    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error:', error);
    });
    console.log("connecrtion to deepgram");
  }

  //register envent listeners on deepgram connection to send data to the socket

  //register event listener on socket to send audio to deepgram
  socket.on('audio', (audio) => {
    console.log('audio received');
    // reintaialize connection if it is closed
    if (!connection || connection.getReadyState() !== LiveConnectionState.OPEN) {
      // initialize deepgram connection
      connection = deepgram.listen.live({
        smart_format: true,
        model: 'nova-2',
        language: 'en-US',
        speach_final: true,
      });
      connection.on(LiveTranscriptionEvents.Open, () => {
        bindDeepgramEvents(connection, socket);
      });
      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
      });
      console.log("connecrtion to deepgram");
    }
    connection.send(audio);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
})


server.listen(3010, () => {
  console.log('listening on *:3010');
});