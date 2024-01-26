const OpenAi = require('openai');
const dotenv = require('dotenv');
const { response } = require('express');
dotenv.config();

const openai = new OpenAi();



export function getNewChatbot(prompt) {
    // returns a new chatbot object with a chat method that will return responses
    const chatbot = {
        prompt: prompt,
        messageHistory: [],
        chat: async function (message) {
            this.messageHistory.push({ role: "user", content: message });

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: this.prompt }, ...this.messageHistory],
                model: "gpt-3.5-turbo",
                stream: true,
            });

            let response = completion.choices[0].message.content

            // store message history
            this.messageHistory.push({ role: "assistant", content: response })
            return response
        }
    }
    return chatbot

}

async function main() {

    let chatBot = getNewChatbot("You are a helpful assistant")

    let response = await chatBot.chat('Hello, what is 1+4 ?')
    console.log(response)


    response = await chatBot.chat('can you explain that')
    console.log(response)
}

// main()