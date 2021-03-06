"use strict";
const audioFiles = [
    "count_in.mp3",
    "metronome_00.mp3",
    "choke_11.mp3",
    "choke_31.mp3",
    "choke_32.mp3",
    "choke_33.mp3",
    "crash_11.mp3",
    "crash_21.mp3",
    "crash_22.mp3",
    "crash_41.mp3",
    "crash_42.mp3",
    "crash_43.mp3",
    "crash_44.mp3",
    "hihat_11.mp3",
    "hihat_21.mp3",
    "hihat_22.mp3",
    "hihat_41.mp3",
    "hihat_42.mp3",
    "hihat_43.mp3",
    "hihat_44.mp3",
    "pang_11.mp3",
    "sizz_21.mp3",
    "sizz_22.mp3",
    "slushie_1_22.mp3",
    "slushie_05_31.mp3",
    "slushie_05_33.mp3",
    "slushie_15_21.mp3",
    "slushie_15_22.mp3",
    "twang_11.mp3",
    "twang_31.mp3",
    "twang_32.mp3",
    "twang_33.mp3",
    "twang_41.mp3",
    "twang_42.mp3",
    "twang_43.mp3",
    "twang_44.mp3"
];
let trackGroups = {
    "00": [false, []],
    "11": [true, []],
    "21": [false, []],
    "22": [false, []],
    "31": [false, []],
    "32": [false, []],
    "33": [false, []],
    "41": [false, []],
    "42": [false, []],
    "43": [false, []],
    "44": [false, []]
};
const loadButton = document.getElementById("load-button");
const loadProgress = document.getElementById("load-progress");
const postLoadContainer = document.getElementById("post-load-container");
const playMarkers = Array.from(document.getElementById("play-marker-container").children);
const audioControls = document.getElementById("audio-controls");
postLoadContainer.style.visibility = "hidden";
loadProgress.style.visibility = "hidden";
loadProgress.max = audioFiles.length;
for (let i = 0; i < audioFiles.length; i++) {
    let file = audioFiles[i];
    for (const trackGroup in trackGroups) {
        if (file.includes(trackGroup))
            trackGroups[trackGroup][1].push(i);
    }
}
let audioContext;
let cachedBuffers = [];
let fileRequestsRemaining = audioFiles.length;
let audioSources = [];
let gainNode;
let isControlsPlaying;
let isCountingIn = false;
function cacheBuffers() {
    loadButton.remove();
    audioContext = new AudioContext();
    gainNode = new GainNode(audioContext);
    gainNode.connect(audioContext.destination);
    loadProgress.style.visibility = "visible";
    for (let i = 0; i < audioFiles.length; i++) {
        cachedBuffers.push(null);
        const request = new XMLHttpRequest();
        request.open("GET", "media/" + audioFiles[i], true);
        request.responseType = "arraybuffer";
        let previousPercent = 0;
        request.onprogress = (e) => {
            if (e.lengthComputable) {
                let newPercent = e.loaded / e.total;
                loadProgress.value += newPercent - previousPercent;
                previousPercent = newPercent;
            }
        };
        request.onload = () => {
            loadProgress.value += 1 - previousPercent;
            audioContext.decodeAudioData(request.response, (buffer) => { cachedBuffers[i] = buffer; }, (e) => { console.log("Error with decoding audio data: " + e.message); });
            if (--fileRequestsRemaining == 0) {
                postLoadContainer.style.visibility = "visible";
                loadProgress.remove();
            }
        };
        request.send();
        //console.log("requested file " + audioFiles[i]);
    }
}
function shouldPlayTrack(track) {
    for (const trackGroup in trackGroups) {
        let state = trackGroups[trackGroup][0];
        let tracks = trackGroups[trackGroup][1];
        if (tracks.includes(track)) {
            return state;
        }
    }
    return false;
}
function startPlayback(countIn = false) {
    if (audioContext.state === "suspended")
        audioContext.resume();
    if (countIn) {
        if (isControlsPlaying) {
            audioControls.pause();
            stopPlayback();
        }
        isCountingIn = true;
        postLoadContainer.style.visibility = 'hidden';
        setTimeout(() => {
            postLoadContainer.style.visibility = 'visible';
            audioControls.play();
        }, 6000 / audioControls.playbackRate);
    }
    audioSources = [];
    let startTime = audioContext.currentTime;
    let offset = audioControls.currentTime;
    for (let i = 0; i < cachedBuffers.length; i++) {
        if (shouldPlayTrack(i) || (countIn && i == 0)) {
            let delay = (countIn && i != 0) ? 5.95 / audioControls.playbackRate : 0;
            //console.log("playing back " + audioFiles[i] + " at " + (offset + delay));
            let audioSource = new AudioBufferSourceNode(audioContext, { buffer: cachedBuffers[i] });
            audioSource.playbackRate.value = audioControls.playbackRate;
            audioSource.connect(gainNode);
            audioSource.start(startTime + delay, i != 0 ? offset : 0);
            audioSources.push(audioSource);
        }
        else {
            //console.log("skipping " + audioFiles[i]);
            audioSources.push(null);
        }
    }
}
function stopPlayback() {
    var _a, _b;
    if (isCountingIn)
        return;
    let stopTime = audioContext.currentTime;
    for (let i = 0; i < audioSources.length; i++) {
        (_a = audioSources[i]) === null || _a === void 0 ? void 0 : _a.stop(stopTime);
        (_b = audioSources[i]) === null || _b === void 0 ? void 0 : _b.disconnect();
        audioSources[i] = null;
    }
}
loadButton.onclick = () => cacheBuffers();
audioControls.onplay = () => {
    isControlsPlaying = true;
    if (isCountingIn) {
        isCountingIn = false;
        return;
    }
    startPlayback();
};
audioControls.onpause = () => {
    isControlsPlaying = false;
    stopPlayback();
};
audioControls.ontimeupdate = () => {
    let currentTime = audioControls.currentTime;
    for (let i = 0; i < playMarkers.length; i++) {
        let thisMarkerTime = parseInt(playMarkers[i].name);
        let nextMarkerTime = i + 1 != playMarkers.length ? parseInt(playMarkers[i + 1].name) : 99999;
        let isCurrent = currentTime >= thisMarkerTime && currentTime < nextMarkerTime;
        playMarkers[i].style.backgroundColor = isCurrent ? (currentTime == thisMarkerTime ? "#2D2" : "#DD2") : "#DDD";
    }
};
audioControls.onvolumechange = () => {
    gainNode.gain.value = audioControls.muted ? 0 : audioControls.volume;
};
audioControls.onratechange = () => {
    for (let audioSource of audioSources) {
        if (audioSource != null)
            audioSource.playbackRate.value = audioControls.playbackRate;
    }
};
let inputs = document.getElementsByTagName("input");
for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].type == "checkbox") {
        inputs[i].onchange = (e) => {
            let button = e.currentTarget;
            trackGroups[button.name][0] = button.checked;
            if (isControlsPlaying) {
                stopPlayback();
                startPlayback();
            }
        };
    }
}
for (let i = 0; i < playMarkers.length; i++) {
    playMarkers[i].onclick = () => {
        audioControls.currentTime = parseInt(playMarkers[i].name);
        if (isControlsPlaying) {
            stopPlayback();
            startPlayback();
        }
    };
}
