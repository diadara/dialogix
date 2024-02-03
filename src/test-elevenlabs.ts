import WebSocket, { MessageEvent, CloseEvent, ErrorEvent } from 'ws';

const socket = new WebSocket('ws://localhost:8080');

// Define the message type
interface Message {
    text: string;
    audio?: string;
    isFinal?: boolean;
    normalizedAlignment?: any;
}

// Send a message to the server
socket.on('open', () => {
    const textMessage = {
        text: 'Hello, world!'
    };

    socket.send(JSON.stringify(textMessage));

    // Send the EOS message with an empty string
    const eosMessage = {
        text: ''
    };

    socket.send(JSON.stringify(eosMessage));
});

// Handle server responses
socket.on('message', (event: MessageEvent) => {
    const response: Message = JSON.parse(event.data.toString());

    console.log('Server response:', response);

    if (response.audio) {
        // decode and handle the audio data (e.g., play it)
        const audioChunk = atob(response.audio);  // decode base64
        console.log('Received audio chunk');
    } else {
        console.log('No audio data in the response');
    }

    if (response.isFinal) {
        // the generation is complete
    }

    if (response.normalizedAlignment) {
        // use the alignment info if needed
    }
});

// Handle errors
socket.onerror = (error: ErrorEvent) => {
    console.error(`WebSocket Error: ${error.message}`);
};

// Handle socket closing
socket.on('close', (event: CloseEvent) => {
    if (event.wasClean) {
        console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
    } else {
        console.warn('Connection died');
    }
});