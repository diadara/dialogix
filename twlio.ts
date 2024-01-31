import { Twilio } from 'twilio';
import dotenv from 'dotenv';
dotenv.config();
// Your Twilio account SID and auth token
const accountSid: string = process.env.TWILIO_ACCOUNT_SID || '';
const authToken: string = process.env.TWILIO_AUTH_TOKEN || '';
const client = new Twilio(accountSid, authToken);

// Twilio number and the number to call
const fromNumber: string = process.env.TWILIO_NUMBER || '';
const toNumber: string =  process.env.TWILIO_TO_NUMBER || '';

// WebSocket URL for streaming
const websocketUrl: string = 'wss://6131-59-89-224-164.ngrok-free.app/ws';

export async function callTestPhone(): Promise<void>{
  // Make the call and start streaming to the WebSocket

  const twiml = `<Response><Start><Stream url="${websocketUrl}"/></Start><Say>Welcome to Dialogix!</Say><Pause length="60"/></Response>`;

// URL-encode the TwiML
const encodedTwiml = encodeURIComponent(twiml);

// Construct the full URL
const url = `http://twimlets.com/echo?Twiml=${encodedTwiml}`;

client.calls
  .create({
    url: url,
    to: toNumber,
    from: fromNumber,
  })
    .then((call: { sid: any; }) => console.log(call.sid))
    .catch((error: any) => console.error(error));
}

callTestPhone();