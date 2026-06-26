const visualizer = document.getElementById("visualizer");
const bassSlider = document.getElementById("bass-slider");
const nostalgiaSlider = document.getElementById("nostalgia-slider");
const fileInput = document.getElementById("file-input");
const fileSelection = document.getElementById("fileSelection");
let audioCtx = null;
let audioBuffer = null;
// i mainly used this as documentation for tjis code  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API 
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

fileSelection.addEventListener('dragover', (e) => {
    e.preventDefault();
});

fileSelection.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if(file && file.type === "audio/mpeg"){ // just to be sure its mp3
        handleFile(file);
    } else {
        alert("only mp3 files allowed, be good!!");
    }
});

function handleFile(file) {
    // we creage the audio context if it doesnt exist yet
    if(!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function(e) {
        const rawData = e.target.result;

        audioCtx.decodeAudioData(rawData)
            .then((decodedBuffer) => {
                audioBuffer = decodedBuffer;
                console.log("Audio successfully decoded! Ready to play.");
                
                // For testing, let's trigger a test play function immediately
                playAudio();
            })
            .catch((err) => {
                console.error("Error decoding audio data:", err);
            });
    };
}

function playAudio() {
if (!audioCtx || !audioBuffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    // connects it to the speakers
    source.connect(audioCtx.destination);
    source.start(0);
}
    




