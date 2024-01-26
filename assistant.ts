import OpenAi from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAi();

interface Message {
  role: string;
  content: string;
}

interface Chatbot {
  prompt: string;
  messageHistory: Message[];
  chat: (message: string) => Promise<string>;
}

export function getNewChatbot(prompt: string): Chatbot {
    // returns a new chatbot object with a chat method that will return responses
    const chatbot: Chatbot = {
        prompt: prompt,
        messageHistory: [],
        chat: async function (message: string): Promise<string> {
            this.messageHistory.push({ role: "user", content: message });

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: this.prompt }, ...this.messageHistory],
                model: "gpt-3.5-turbo",
                // stream: true,
            });

            let response: string = completion.choices[0].message.content || '';

            // store message history
            this.messageHistory.push({ role: "assistant", content: response });
            return response;
        }
    };
    return chatbot;
}

async function main(): Promise<void> {
    let chatBot: Chatbot = getNewChatbot("You are a helpful assistant");

    let response: string = await chatBot.chat('Hello, what is 1+4 ?');
    console.log(response);

    response = await chatBot.chat('can you explain that');
    console.log(response);
}

// main()