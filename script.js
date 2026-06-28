const visualizer = document.getElementById("visualizer");
const bassSlider = document.getElementById("bass-slider");
const nostalgiaSlider = document.getElementById("nostalgia-slider");
const fileInput = document.getElementById("file-input");
const fileSelection = document.getElementById("fileSelection");
const currentSongLabel = document.getElementById("currentSong"); // gets the song title h3 element
let audioCtx = null;
let audioBuffer = null;
let bassNode = null;
let nostalgiaFilter = null; 
let analyser = null;

const mySongs = document.querySelectorAll(".songItem") // gets all the songs we need the dot sicne its  a class


// adding all the control related stuff
const playPauseBtn = document.getElementById("play-pause");
const currentTimeLabel = document.getElementById("time");
const progressBar = document.getElementById("progress");
const totalDurationLabel = document.getElementById("totalDuration");
let sourceNode = null;       
let isPlaying = false; // Tracks the current state
let startTime = 0;          
let pausedAt = 0;           
let progressInterval = null;



// i mainly used this as documentation for tjis code  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API 
function formatTime(seconds){ // helps change seconds to look like normal 0:00 time
    const mins = Math.floor(seconds/60);
    const secs = Math.floor(seconds%60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

mySongs.forEach(item => {
    item.addEventListener('click', (e) => {
        //gets the file path
        const songSRC = e.target.getAttribute('data-src');
        // updates the header
        currentSongLabel.innerText = "Current Song : " + e.target.innerText; 
        
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

function togglePlay(){ // master function to switch between play and pause
    if(!audioBuffer) return alert("select a track first D:");

    if(isPlaying) {
        // PAUSES MUSIC
        isPlaying = false;
        playPauseBtn.innerText = "Play";
        pausedAt += audioCtx.currentTime - startTime; // saves the timestamp where we stopped

        if(sourceNode){
            sourceNode.stop(); // stops the music stream completely
            sourceNode = null;
        }
        clearInterval(progressInterval); // stops the slider loop from moving

    }else {
        // resumes or plays the muscic
        isPlaying = true;
        playPauseBtn.innerText = "Pause";

        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;

        // we configure everything again..
        bassNode = audioCtx.createBiquadFilter();
        bassNode.type = "lowshelf";
        bassNode.frequency.value = 200;
        bassNode.gain.value = bassSlider.value;

        nostalgiaFilter = audioCtx.createBiquadFilter();
        nostalgiaFilter.type = "bandpass";
        nostalgiaFilter.frequency.value = 1500;
        nostalgiaFilter.Q.value = nostalgiaSlider.value == "1" ? 2.0 : 0.0001;

        // SSETTUING  UP  ANALYSER FOR OUR VISUALIZER
        if (!analyser) {
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256; // Defines how detailed our  chart will be
        }
        // Connect everything down the stream 
        sourceNode.connect(bassNode);
        bassNode.connect(nostalgiaFilter);
        nostalgiaFilter.connect(analyser); // sends audio to analyser before speakers
        analyser.connect(audioCtx.destination);

        progressBar.max = audioBuffer.duration; // makes the slider max length match the song duration
        totalDurationLabel.innerText = formatTime(audioBuffer.duration);

        startTime = audioCtx.currentTime;
        sourceNode.start(0, pausedAt); // starts the track right from where it was paused
        // Start animating
        drawVisualizer(); // triggers the canvas loops
        // we update our timeline 
        progressInterval = setInterval(() => { // loop to move the slider handle every 250ms
            const elapsedTime = pausedAt + (audioCtx.currentTime - startTime);
            if (elapsedTime >= audioBuffer.duration) { // checks if song ended naturally
                clearInterval(progressInterval);
                isPlaying = false;
                playPauseBtn.innerText = "Play";
                pausedAt = 0;
                progressBar.value = 0;
                currentTimeLabel.innerText = "0:00";
            } else {
                progressBar.value = elapsedTime;
                currentTimeLabel.innerText = formatTime(elapsedTime);
            }
        }, 250);
    }
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
    // updatws header
    currentSongLabel.innerText = "Current Song : " + file.name;
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
    if (sourceNode) {
        sourceNode.stop();
        sourceNode = null;
    }
    clearInterval(progressInterval); // resets everything back to 0 when loading new song
    isPlaying = false;
    pausedAt = 0;
    progressBar.value = 0;
    currentTimeLabel.innerText = "0:00";
    togglePlay();
}

playPauseBtn.addEventListener("click", togglePlay);

progressBar.addEventListener("input", (e) => { // checks if user is clicking/dragging the progress line
    if (!audioBuffer) return;
    const wasPlaying = isPlaying;
    if (isPlaying) togglePlay(); // pauses first so it doesn't glitch 
    pausedAt = parseFloat(e.target.value); // updates position to wherever user clicked
    currentTimeLabel.innerText = formatTime(pausedAt);
    if (wasPlaying) togglePlay(); // resumes if it was already playing before
});

bassSlider.addEventListener("input", (e) => {
    if (bassNode) bassNode.gain.value = e.target.value;
});

nostalgiaSlider.addEventListener("input", (e) => {
    if(nostalgiaFilter) nostalgiaFilter.Q.value = e.target.value == '1' ? 2.0 : 0.0001;
});

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
// visualizer section (canvas)
function drawVisualizer() {
    if (!analyser) return;

    const ctx = visualizer.getContext("2d");
    const bufferLength = analyser.frequencyBinCount; // half of the fft size
    const dataArray = new Uint8Array(bufferLength); // array full of audio byte values

    function renderFrame() {
        if (!isPlaying) return; // stops loop if paused

        requestAnimationFrame(renderFrame); // handles standard animation loop timing

        analyser.getByteFrequencyData(dataArray); // copies fresh audio frequency data into our array

        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, visualizer.width, visualizer.height); // clears the old frame

        const barWidth = (visualizer.width / bufferLength) * 2.5;
        let x = 0;

        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i]; // gets value of current bar frequency

    
            ctx.fillStyle = `rgb(${barHeight + 100}, 50, 250)`; // purple-neon color mix based on volume/pitch
            ctx.fillRect(x, visualizer.height - barHeight / 1.5, barWidth - 2, barHeight / 1.5); // draws bar from bottom up

            x += barWidth;
        }
    }

    renderFrame();
}