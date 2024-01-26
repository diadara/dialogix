const MicrophoneStream = require('microphone-stream');

// create a new instance of MicrophoneStream
let micStream = new MicrophoneStream();

// start the microphone
micStream.start();

// handle data events, which are emitted with the raw audio data
micStream.on('data', (chunk) => {
    // chunk is a Buffer containing raw audio data
    console.log(chunk);
});

// stop the microphone after 5 seconds
setTimeout(() => {
    micStream.stop();
}, 5000);