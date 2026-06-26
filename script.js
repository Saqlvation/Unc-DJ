const visualizer = document.getElementById("visualizer");
const bassSlider = document.getElementById("bass-slider");
const nostalgiaSlider = document.getElementById("nostalgia-slider");
const fileInput = document.getElementById("file-input");
const fileSelection = document.getElementById("fileSelection");
let audioCtx = null;
let audioBuffer = null;
let bassNode = null;
let nostalgiaFilter = null; 

const mySongs = document.querySelectorAll(".songItem") // gets all the songs we need the dot sicne its  a class
// i mainly used this as documentation for tjis code  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API 

mySongs.forEach(item => {
    item.addEventListener('click', (e) => {
        //gets the file path
        const songSRC = e.target.getAttribute('data-src');
        loadPresetSong(songSRC); // we call the preset function
    });
});

function loadPresetSong(src){
        if(!audioCtx) {
        audioCtx = new(window.AudioContext|| window.webkitAudioContext)();
    }
// we use fetch and then just like my recent project where i used NASA's api
    fetch(src)
    .then(response => response.arrayBuffer())
    .then(rawData => {
            return audioCtx.decodeAudioData(rawData);
        })
        // decodes the preset song and plays it
    .then(decodedBuffer => {
            audioBuffer = decodedBuffer;
            playAudio();
        })

}
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
    // bass booster
    bassNode = audioCtx.createBiquadFilter();
    bassNode.type = "lowshelf";// targets only frequenscies below a given lim
    bassNode.frequency.value = 200; // only below 200 hz
    bassNode.gain.value = bassSlider.value; // the boost gets based off the slider
    // old filter
    nostalgiaFilter = audioCtx.createBiquadFilter();
    nostalgiaFilter.type = "bandpass";
    nostalgiaFilter.frequency.value = 1500; // voice frequencies
    // we then use the Q which is the quality fasctor of the audio and control itif the slider is at 0 its low if its at 1 we set it to 2 so it "ruins " the sound
    nostalgiaFilter.Q.value = nostalgiaSlider.value == "1" ? 2.0 : 0.0001;

    source.connect(bassNode);
    bassNode.connect(nostalgiaFilter);
    nostalgiaFilter.connect(audioCtx.destination);

    source.start(0);
}

bassSlider.addEventListener("input", (e) => {
    if (bassNode) { 
        bassNode.gain.value = e.target.value;
    }
});

nostalgiaSlider.addEventListener("input", (e) => {
    if(nostalgiaFilter){
        nostalgiaFilter.Q.value = e.target.value == '1' ? 2.0 : 0.0001;
    }
})




