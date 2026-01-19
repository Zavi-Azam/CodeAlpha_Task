let musicList = [];
let filteredList = [];
let trackIndex = 0;
let isPlaying = false;
let playMode = 'shuffle';

const audio = new Audio();
let audioCtx, analyser, dataArray;

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const toast = document.getElementById('status-toast');

// 1. KEYBOARD CONTROLS
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch(e.code) {
        case 'Space': e.preventDefault(); document.getElementById('play-pause').click(); break;
        case 'ArrowRight': document.getElementById('next').click(); break;
        case 'ArrowLeft': document.getElementById('prev').click(); break;
        case 'ArrowUp': 
            e.preventDefault(); 
            let vUp = Math.min(parseInt(document.getElementById('volume_slider').value) + 5, 100);
            updateVolume(vUp); 
            break;
        case 'ArrowDown': 
            e.preventDefault(); 
            let vDown = Math.max(parseInt(document.getElementById('volume_slider').value) - 5, 0);
            updateVolume(vDown); 
            break;
        case 'KeyS': document.getElementById('mode-btn').click(); break;
    }
});

function updateVolume(val) {
    const slider = document.getElementById('volume_slider');
    slider.value = val;
    audio.volume = val / 100;
    document.getElementById('vol-value').innerText = val;
}

// 2. VISUALIZER (BARS)
function initVisuals() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 128;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    draw();
}

function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 1.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        // Dynamic color based on volume/intensity
        ctx.fillStyle = `rgba(0, 242, 254, ${0.3 + (dataArray[i]/255)})`;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 4, barHeight);
        x += barWidth;
    }
}

// 3. SYNC & LIBRARY
document.getElementById('sync-folder').onclick = async () => {
    try {
        const dir = await window.showDirectoryPicker();
        musicList = [];
        for await (const entry of dir.values()) {
            if (entry.name.toLowerCase().endsWith('.mp3')) {
                const file = await entry.getFile();
                musicList.push({ name: entry.name.replace('.mp3', ''), path: URL.createObjectURL(file), file });
            }
        }
        filteredList = [...musicList];
        renderPlaylist(filteredList);
        if (musicList.length > 0) loadTrack(0);
    } catch (e) { console.warn("Access denied"); }
};

document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    filteredList = musicList.filter(s => s.name.toLowerCase().includes(term));
    renderPlaylist(filteredList);
};

function renderPlaylist(list) {
    const ui = document.getElementById('playlist');
    ui.innerHTML = list.map((s, i) => `
        <li class="song-item ${musicList.indexOf(s) === trackIndex ? 'active' : ''}">${s.name}</li>
    `).join('');
    ui.querySelectorAll('.song-item').forEach((li, i) => {
        li.onclick = () => { loadTrack(musicList.indexOf(list[i])); playTrack(); };
    });
}

// 4. PLAYER ENGINE
function loadTrack(idx) {
    trackIndex = idx;
    const song = musicList[idx];
    audio.src = song.path;
    document.getElementById('track-name').innerText = song.name;

    window.jsmediatags.read(song.file, {
        onSuccess: (tag) => {
            document.getElementById('track-artist').innerText = tag.tags.artist || "Unknown Session";
        }
    });
    renderPlaylist(filteredList);
}

const playPauseBtn = document.getElementById('play-pause');
playPauseBtn.onclick = () => {
    initVisuals();
    if (isPlaying) { audio.pause(); isPlaying = false; }
    else { audio.play(); isPlaying = true; }
    playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
};

document.getElementById('mode-btn').onclick = () => {
    if (playMode === 'shuffle') {
        playMode = 'repeat-one';
        document.getElementById('mode-btn').className = 'fas fa-arrows-rotate active';
        showToast("Mode: Repeat One");
    } else if (playMode === 'repeat-one') {
        playMode = 'repeat-all';
        document.getElementById('mode-btn').className = 'fas fa-repeat active';
        showToast("Mode: Repeat Playlist");
    } else {
        playMode = 'shuffle';
        document.getElementById('mode-btn').className = 'fas fa-shuffle active';
        showToast("Mode: Shuffle");
    }
};

function showToast(msg) {
    toast.innerText = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

audio.onended = () => {
    if (playMode === 'repeat-one') loadTrack(trackIndex);
    else if (playMode === 'shuffle') trackIndex = Math.floor(Math.random() * musicList.length);
    else trackIndex = (trackIndex + 1) % musicList.length;
    loadTrack(trackIndex);
    playTrack();
};

function playTrack() { audio.play(); isPlaying = true; playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
document.getElementById('next').onclick = () => { trackIndex = (trackIndex + 1) % musicList.length; loadTrack(trackIndex); playTrack(); };
document.getElementById('prev').onclick = () => { trackIndex = (trackIndex - 1 + musicList.length) % musicList.length; loadTrack(trackIndex); playTrack(); };

// UPDATES
audio.ontimeupdate = () => {
    const scrub = document.getElementById('seek_slider');
    scrub.value = (audio.currentTime / audio.duration) * 100 || 0;
    document.getElementById('current-time').innerText = fmt(audio.currentTime);
    document.getElementById('total-duration').innerText = fmt(audio.duration);
};

document.getElementById('seek_slider').oninput = (e) => audio.currentTime = (e.target.value / 100) * audio.duration;
document.getElementById('volume_slider').oninput = (e) => updateVolume(e.target.value);

const fmt = (s) => { if (isNaN(s)) return "0:00"; let m = Math.floor(s/60), sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; };

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.onresize = resize;
window.onload = resize;