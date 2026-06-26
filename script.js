const visualizer = document.getElementById("visualizer");
const bassSlider = document.getElementById("bass-slider");
const nostalgiaSlider = document.getElementById("nostalgia-slider");
const fileInput = document.getElementById("file-input");
const fileSelection = document.getElementById("fileSelection");

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

