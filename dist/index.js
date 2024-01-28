"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const sdk_1 = require("@deepgram/sdk");
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const assistant_1 = require("./assistant");
const tts_1 = require("./tts");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    }
});
const deepgramApiKey = process.env.DEEPGRAM_API || "";
console.log(deepgramApiKey);
const deepgram = (0, sdk_1.createClient)(deepgramApiKey);
function bindDeepgramEvents(connection, socket, chatbot) {
    if (!connection) {
        console.log('connection not available');
        return;
    }
    let pendingTranscript = '';
    let emptyTranscriptCount = 0;
    connection.on(sdk_1.LiveTranscriptionEvents.Transcript, (data) => __awaiter(this, void 0, void 0, function* () {
        // check if the transcript is final and has any words
        console.log(`is_final: ${data.is_final} ,  speech_final: ${data.speech_final} ,   ${data.channel.alternatives[0].transcript} `);
        if (data.channel.alternatives[0].words.length === 0) {
            emptyTranscriptCount++;
        }
        else {
            pendingTranscript += data.channel.alternatives[0].transcript;
        }
        let isFinal = data.speach_final || emptyTranscriptCount > 2;
        if (isFinal && pendingTranscript.length > 0) {
            // the transcript is final, send it to client and append to pending transcript
            // console.log(data.channel.alternatives[0].transcript);
            socket.emit('transcript', pendingTranscript);
            console.log(`pending transcript: ${pendingTranscript}`);
            let response = yield chatbot.chat(pendingTranscript);
            pendingTranscript = '';
            emptyTranscriptCount = 0;
            socket.emit('agent', response);
            const readableStream = yield (0, tts_1.createSpeech)(response);
            readableStream.on('data', (chunk) => {
                socket.emit('audio-chunk', chunk);
            });
        }
    }));
    connection.on(sdk_1.LiveTranscriptionEvents.Close, () => {
        console.log('connection closed');
        // we are going to clear the reference to the connection so that we can create a new one
        // when new audio is recieved
        connection = null;
    });
}
function getNewDeepGramConnection() {
    let connection = deepgram.listen.live({
        smart_format: true,
        // model: 'nova-2',
        model: 'nova-2-conversationalai',
        language: 'en-US',
        speech_final: true,
        endpointing: 300,
    });
    connection.on(sdk_1.LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
    });
    return connection;
}
io.on('connection', (socket) => {
    console.log('a user connected');
    // create a new chat bot for each user
    let chatBot = (0, assistant_1.getNewChatbot)(`You are a helpful assistant that answer telephone for XYZ inc.
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
    connection.on(sdk_1.LiveTranscriptionEvents.Open, () => {
        bindDeepgramEvents(connection, socket, chatBot);
    });
    console.log("connecting to deepgram");
    // stream the recieved audio to deepgram
    socket.on('audio', (audio) => {
        if (connection && connection.getReadyState() === sdk_1.LiveConnectionState.OPEN) {
            connection.send(audio);
        }
        else {
            console.log('connection expired, creating new connection');
            connection = getNewDeepGramConnection();
            connection.on(sdk_1.LiveTranscriptionEvents.Open, () => {
                bindDeepgramEvents(connection, socket, chatBot);
            });
        }
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        connection.finish();
    });
});
app.get('/', (req, res) => {
    res.send('Hello World!');
});
server.listen(3010, () => {
    console.log('listening on *:3010');
});
