const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("youtubeLink");
const loadButton = document.getElementById("loadButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const pauseButton = document.getElementById("pauseButton");
const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const muteButton = document.getElementById("muteButton");
const repeatButton = document.getElementById("repeatButton");
const coverWrap = document.querySelector(".cover-wrap");
const coverImage = document.getElementById("coverImage");
const visualizer = document.getElementById("visualizer");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const trackTitle = document.getElementById("trackTitle");
const trackStatus = document.getElementById("trackStatus");
const message = document.getElementById("message");
const audioCard = document.getElementById("audioCard");

let player = null;
let repeatOn = false;
let videoId = null;
let isPlaying = false;
let visualizerFrame = null;
let progressTimer = null;
let bars = [];
let stars = [];
let shootingStars = [];
let lastSpaceTime = 0;

/* ===== SPACE ===== */

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createStars() {
    stars = Array.from({
        length: Math.min(260, Math.floor(window.innerWidth / 5))
    }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + .2,
        a: Math.random() * .75 + .15,
        speed: Math.random() * .45 + .08,
        phase: Math.random() * Math.PI * 2
    }));
}

function shootingStar() {
    if (shootingStars.length >= 5) return;
    shootingStars.push({
        x: Math.random() * window.innerWidth * .9,
        y: Math.random() * window.innerHeight * .55,
        length: Math.random() * 120 + 100,
        speed: Math.random() * 600 + 800,
        life: 0,
        maxLife: Math.random() * 300 + 380,
        angle: Math.PI * .72 + (Math.random() - .5) * .18
    });
}


/* ===== GALAXIES ===== */

let galaxies = [];

function gauss() {
    return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

function makeGalaxy({ x, y, radius, tilt, orient, speed, hue, arms, count }) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        const u = Math.pow(Math.random(), 1.6);
        const r = u * radius;
        const arm = Math.floor(Math.random() * arms);
        const spread = gauss() * (.55 - u * .3);
        const a = arm * (Math.PI * 2 / arms) + u * 4.2 + spread;
        const h = hue + (1 - u) * 30 + gauss() * 18;
        const l = 62 + (1 - u) * 28;
        particles.push({
            r, a,
            size: Math.random() * 1.5 + .35,
            color: `hsla(${h},90%,${l}%,${(Math.random() * .5 + .35).toFixed(2)})`
        });
    }
    return { x, y, radius, tilt, orient, speed, hue, particles, rot: Math.random() * Math.PI * 2 };
}

function createGalaxies() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = Math.max(130, Math.min(w * .17, h * .3, 260));

    galaxies = [
        makeGalaxy({
            x: w * .13, y: h * .30, radius: size,
            tilt: .5, orient: -.45, speed: .00028, hue: 285, arms: 3, count: 900
        }),
        makeGalaxy({
            x: w * .87, y: h * .70, radius: size * 1.05,
            tilt: .42, orient: .5, speed: -.00022, hue: 190, arms: 2, count: 950
        })
    ];
}

function drawGalaxies(dt) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    galaxies.forEach(g => {
        g.rot += g.speed * dt;

        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.orient);
        ctx.scale(1, g.tilt);

        // halo & inti galaksi
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, g.radius * 1.1);
        halo.addColorStop(0, `hsla(${g.hue + 20},90%,70%,.32)`);
        halo.addColorStop(.25, `hsla(${g.hue},90%,55%,.12)`);
        halo.addColorStop(1, `hsla(${g.hue},90%,50%,0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, g.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // bintang-bintang di lengan spiral
        const cos = Math.cos(g.rot);
        const sin = Math.sin(g.rot);
        g.particles.forEach(p => {
            const ca = Math.cos(p.a);
            const sa = Math.sin(p.a);
            const px = p.r * (ca * cos - sa * sin);
            const py = p.r * (sa * cos + ca * sin);
            ctx.fillStyle = p.color;
            ctx.fillRect(px, py, p.size, p.size);
        });

        ctx.restore();
    });

    ctx.restore();
}

function drawSpace(time) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dt = Math.min(48, time - lastSpaceTime || 16);
    ctx.clearRect(0, 0, w, h);

    drawGalaxies(dt);

    stars.forEach(s => {
        const alpha = Math.max(.05, s.a + Math.sin(time * .0015 * s.speed + s.phase) * .18);
        ctx.beginPath();
        ctx.fillStyle = `rgba(220,240,255,${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.speed * .015;
        if (s.y > h) s.y = -2;
    });

    if (Math.random() < .014) shootingStar();

    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life += Math.min(32, time - lastSpaceTime);
        const p = s.life / s.maxLife;
        const x = s.x + Math.cos(s.angle) * s.speed * p;
        const y = s.y + Math.sin(s.angle) * s.speed * p;
        const tx = x - Math.cos(s.angle) * s.length;
        const ty = y - Math.sin(s.angle) * s.length;
        const opacity = Math.sin(p * Math.PI);

        const g = ctx.createLinearGradient(tx, ty, x, y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(.65, `rgba(100,220,255,${opacity * .35})`);
        g.addColorStop(1, `rgba(255,255,255,${opacity})`);

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (s.life >= s.maxLife) shootingStars.splice(i, 1);
    }

    lastSpaceTime = time;
    requestAnimationFrame(drawSpace);
}

resizeCanvas();
createStars();
createGalaxies();
requestAnimationFrame(drawSpace);
window.addEventListener("resize", () => {
    resizeCanvas();
    createStars();
    createGalaxies();
    buildVisualizer();
});

/* ===== VISUALIZER ===== */

function buildVisualizer() {
    visualizer.innerHTML = "";
    bars = [];
    const count = window.innerWidth < 600 ? 38 : 64;

    for (let i = 0; i < count; i++) {
        const b = document.createElement("div");
        b.className = "bar";
        visualizer.appendChild(b);
        bars.push(b);
    }
}

function animateVisualizer(time) {
    if (!isPlaying) {
        bars.forEach((b, i) => b.style.height = `${4 + Math.sin(i * .5) * 2}%`);
        visualizerFrame = null;
        return;
    }

    const t = time * .006;
    const playback = player ? player.getCurrentTime() : 0;

    bars.forEach((b, i) => {
        const center = Math.abs(i - bars.length / 2);
        const envelope = Math.max(.15, 1 - center / (bars.length / 2));
        const wave1 = Math.sin(t * 1.7 + i * .37);
        const wave2 = Math.sin(t * 3.1 + i * .13);
        const beat = Math.pow(Math.max(0, Math.sin(t * 2.8 + playback * .15)), 7);
        const height = 5 + (wave1 + 1) * 10 * envelope + (wave2 + 1) * 5 + beat * 28;

        b.style.height = `${Math.min(82, height)}%`;
        b.style.filter = `hue-rotate(${Math.sin(t + i * .08) * 35}deg)`;
    });

    visualizerFrame = requestAnimationFrame(animateVisualizer);
}

buildVisualizer();

/* ===== YOUTUBE ===== */

function extractVideoId(value) {
    const text = value.trim();
    if (!text) return null;

    const short = text.match(/youtu\.be\/([^?&#/]+)/i);
    if (short) return short[1];

    try {
        const url = new URL(text);
        const v = url.searchParams.get("v");
        if (v) return v;

        const path = url.pathname.match(/\/(?:embed|shorts|live)\/([^/?&#]+)/i);
        if (path) return path[1];
    } catch (_) {}

    return null;
}

function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(seconds / 60);
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
}

function setMessage(text = "") {
    message.textContent = text;
}

function setControls(enabled) {
    [pauseButton, backButton, forwardButton, muteButton, repeatButton, progressBar]
        .forEach(el => el.disabled = !enabled);
}

function loadTrack() {
    videoId = extractVideoId(input.value);
    setMessage("");

    if (!videoId || videoId.length !== 11) {
        setMessage("Link YouTube tidak valid. Pastikan URL video yang dimasukkan benar.");
        return;
    }

    if (location.protocol === "file:") {
        setMessage("Jalankan melalui http://localhost/ menggunakan XAMPP, bukan file://.");
        return;
    }

    if (player) {
        player.destroy();
        player = null;
    }

    isPlaying = false;
    audioCard.classList.remove("playing");
    coverWrap.classList.remove("playing");
    coverWrap.classList.add("loaded");

    // Thumbnail YouTube langsung berdasarkan Video ID.
    const currentId = videoId;
    coverImage.onerror = () => {
        if (currentId === videoId) {
            coverImage.onerror = null;
            coverImage.src = `https://i.ytimg.com/vi/${currentId}/hqdefault.jpg`;
        }
    };
    coverImage.onload = () => {
        // maxresdefault yang tidak tersedia kadang mengembalikan gambar placeholder kecil
        if (coverImage.naturalWidth <= 120 && coverImage.src.includes("maxresdefault")) {
            coverImage.onerror();
        }
    };
    coverImage.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    trackTitle.textContent = "Memuat informasi...";
    trackStatus.textContent = "Preparing audio...";
    setControls(false);

    const host = document.getElementById("youtubePlayerHost");
    host.innerHTML = '<div id="youtubePlayer"></div>';

    player = new YT.Player("youtubePlayer", {
        width: "200",
        height: "200",
        videoId,
        playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
}

function onPlayerReady(event) {
    const data = event.target.getVideoData();
    trackTitle.textContent = data.title || "YouTube Audio";
    trackStatus.textContent = "Ready — tekan play untuk memulai";
    setControls(true);
    progressBar.value = 0;
    duration.textContent = formatTime(event.target.getDuration());
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        audioCard.classList.add("playing");
        coverWrap.classList.add("playing");
        pauseButton.textContent = "❚❚";
        trackStatus.textContent = "Now playing";
        startProgress();
        startVisualizer();
    }

    if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        audioCard.classList.remove("playing");
        coverWrap.classList.remove("playing");
        pauseButton.textContent = "▶";
        trackStatus.textContent = "Paused";
        stopProgress();
    }

    if (event.data === YT.PlayerState.ENDED && repeatOn) {
        player.seekTo(0, true);
        player.playVideo();
        return;
    }

    if (event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        audioCard.classList.remove("playing");
        coverWrap.classList.remove("playing");
        pauseButton.textContent = "▶";
        trackStatus.textContent = "Playback finished";
        progressBar.value = 100;
        stopProgress();
    }

    if (event.data === YT.PlayerState.BUFFERING) {
        trackStatus.textContent = "Buffering...";
    }
}

function onPlayerError() {
    isPlaying = false;
    setControls(false);
    trackTitle.textContent = "Video tidak dapat diputar";
    trackStatus.textContent = "YouTube menolak playback video ini.";
    setMessage("Coba gunakan video YouTube lain.");
}

function togglePlay() {
    if (!player) return;

    if (isPlaying) player.pauseVideo();
    else player.playVideo();
}

function startVisualizer() {
    if (visualizerFrame === null) {
        visualizerFrame = requestAnimationFrame(animateVisualizer);
    }
}

function startProgress() {
    stopProgress();

    progressTimer = setInterval(() => {
        if (!player || !isPlaying) return;

        const current = player.getCurrentTime();
        const total = player.getDuration();

        currentTime.textContent = formatTime(current);
        duration.textContent = formatTime(total);

        if (total > 0) {
            progressBar.value = (current / total) * 100;
        }
    }, 500);
}

function stopProgress() {
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
}

loadButton.addEventListener("click", loadTrack);
pauseButton.addEventListener("click", togglePlay);

backButton.addEventListener("click", () => {
    if (player) player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
});

forwardButton.addEventListener("click", () => {
    if (player) player.seekTo(player.getCurrentTime() + 10, true);
});

muteButton.addEventListener("click", () => {
    if (!player) return;

    if (player.isMuted()) {
        player.unMute();
        muteButton.textContent = "🔊";
        muteButton.title = "Mute";
    } else {
        player.mute();
        muteButton.textContent = "🔇";
        muteButton.title = "Unmute";
    }
});

function toggleRepeat() {
    repeatOn = !repeatOn;
    repeatButton.classList.toggle("active", repeatOn);
    repeatButton.title = repeatOn ? "Repeat: ON (R)" : "Repeat: OFF (R)";
}

repeatButton.addEventListener("click", toggleRepeat);

progressBar.addEventListener("input", () => {
    if (!player) return;
    const total = player.getDuration();
    player.seekTo((progressBar.value / 100) * total, true);
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter") loadTrack();
});

window.onYouTubeIframeAPIReady = function () {
    // API siap; player dibuat setelah user menekan LOAD.
};

/* ===== FULLSCREEN ===== */

function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function toggleFullscreen() {
    const el = document.documentElement;
    if (isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el).catch(() => {});
    }
}

function updateFullscreenButton() {
    const on = isFullscreen();
    fullscreenButton.textContent = on ? "✕" : "⛶";
    fullscreenButton.title = on ? "Keluar layar penuh (F / Esc)" : "Layar penuh (F)";
    document.body.classList.toggle("is-fullscreen", on);
}

fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

document.addEventListener("keydown", event => {
    if (event.target === input) return;
    if (event.key === "f" || event.key === "F") toggleFullscreen();
    if ((event.key === "r" || event.key === "R") && !repeatButton.disabled) toggleRepeat();
    if (event.key === " " && player && !pauseButton.disabled) {
        event.preventDefault();
        togglePlay();
    }
});
