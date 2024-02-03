import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI();

async function main() {
    const stream = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Say this is a test" }],
        stream: true,
    });
    for await (const chunk of stream) {
        console.log(chunk.choices[0]?.delta?.content || "");
    }
}

main();