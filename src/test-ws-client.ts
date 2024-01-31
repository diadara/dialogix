import WebSocket from 'ws';

const websocketUrl = 'wss://6131-59-89-224-164.ngrok-free.app/ws';

const ws = new WebSocket(websocketUrl);

ws.on('open', function open() {
    console.log('connected');
    ws.send(Date.now().toString());
});

ws.on('close', function close() {
    console.log('disconnected');
});

ws.on('message', function incoming(data: WebSocket.Data) {
    console.log(`Roundtrip time: ${Date.now() - Number(data)} ms`);
});