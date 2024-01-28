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
exports.getNewChatbot = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default();
function getNewChatbot(prompt) {
    // returns a new chatbot object with a chat method that will return responses
    const chatbot = {
        prompt: prompt,
        messageHistory: [],
        chat: function (message) {
            return __awaiter(this, void 0, void 0, function* () {
                this.messageHistory.push({ role: "user", content: message, name: "User" });
                const completion = yield openai.chat.completions.create({
                    messages: [{ role: "system", content: this.prompt }, ...this.messageHistory],
                    model: "gpt-3.5-turbo",
                    // stream: true,
                });
                let response = completion.choices[0].message.content || '';
                // let response: string = "This is the canned static response"
                // store message history
                this.messageHistory.push({ role: "assistant", content: response, name: "Assistant" });
                // console.log("history", JSON.stringify(this.messageHistory, null, 2));
                return response;
            });
        }
    };
    return chatbot;
}
exports.getNewChatbot = getNewChatbot;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let chatBot = getNewChatbot("You are a helpful assistant");
        let response = yield chatBot.chat('Hello, what is 1+4 ?');
        console.log(response);
        response = yield chatBot.chat('can you explain that');
        console.log(response);
    });
}
// main()
