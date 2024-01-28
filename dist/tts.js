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
exports.createSpeech = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const client_polly_1 = require("@aws-sdk/client-polly");
dotenv_1.default.config();
const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1"
};
function createSpeech(text) {
    return __awaiter(this, void 0, void 0, function* () {
        // take the response and stream audio to the client
        // const responseAudio = await openai.audio.speech.create({
        //   model: 'tts-1',
        //   voice: 'alloy',
        //   input: response,
        // });
        const pollyClient = new client_polly_1.PollyClient(awsConfig);
        const languageCode = "en-IN";
        const params = {
            OutputFormat: "mp3",
            Text: text,
            VoiceId: "Raveena",
            LanguageCode: languageCode
        };
        try {
            const data = yield pollyClient.send(new client_polly_1.SynthesizeSpeechCommand(params));
            const audioStream = data.AudioStream;
            return audioStream;
        }
        catch (error) {
            console.error("Error synthesizing speech: ", error);
            return null;
        }
    });
}
exports.createSpeech = createSpeech;
