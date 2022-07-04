const container = document.getElementById('post-load-container');
container.style.visibility = 'hidden';
const audioControls = document.getElementById('audio-controls');
const loadButton = document.getElementById('load-button');

const audioFiles = [
	'crash_11.mp3',
	'crash_21.mp3',
	'crash_22.mp3',
	'crash_41.mp3',
	'crash_42.mp3',
	'crash_43.mp3',
	'crash_44.mp3',
	'hihat_11.mp3',
	'hihat_21.mp3',
	'hihat_22.mp3',
	'hihat_41.mp3',
	'hihat_42.mp3',
	'hihat_43.mp3',
	'hihat_44.mp3',
	'pang_11.mp3',
	'slushie_05_21.mp3',
	'slushie_05_22.mp3',
	'slushie_15_21.mp3',
	'slushie_15_22.mp3',
	'slushie_1_21.mp3',
	'slushie_1_22.mp3',
	'twang_11.mp3'
];
let trackGroups = {
	'11': [true, []],
	'21': [false, []],
	'22': [false, []],
	'41': [false, []],
	'42': [false, []],
	'43': [false, []],
	'44': [false, []]
};
for (let i = 0; i < audioFiles.length; i++) {
	var file = audioFiles[i];
	for (const trackGroup in trackGroups) {
		if (file.includes(trackGroup)) trackGroups[trackGroup][1].push(i);
	}
}

let audioContext;
let cachedBuffers = new Array(audioFiles.length).fill(null);
let fileRequestsRemaining = audioFiles.length;
let audioSources;
let isAudioPlaying;

function cacheBuffers() {
	loadButton.remove();

	audioContext = new AudioContext();
	for (let i = 0; i < audioFiles.length; i++) {
		const request = new XMLHttpRequest();
		request.open('GET', 'media/' + audioFiles[i], true);
		request.responseType = 'arraybuffer';

		request.onload = () => {
			audioContext.decodeAudioData(request.response,
				(buffer) => { cachedBuffers[i] = buffer; },
				(e) => { console.log("Error with decoding audio data" + e.error) });
			if (--fileRequestsRemaining == 0) container.style.visibility = 'visible';
		}
		request.send();
		//console.log('requested file ' + audioFiles[i]);
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

function startPlayback() {
	if (audioContext.state === 'suspended') audioContext.resume();

	audioSources = [];
	var startTime = audioContext.currentTime;
	var offset = audioControls.currentTime;
	for (let i = 0; i < cachedBuffers.length; i++) {
		if (shouldPlayTrack(i)) {
			//console.log('playing back ' + audioFiles[i] + ' at ' + offset);
			audioSources.push(new AudioBufferSourceNode(audioContext, { buffer: cachedBuffers[i] }));
			audioSources[i].connect(audioContext.destination);
			audioSources[i].start(startTime, offset);
		} else {
			//console.log('skipping ' + audioFiles[i]);
			audioSources.push(null);
		}
	}
}

function stopPlayback() {
	var stopTime = audioContext.currentTime;
	for (let i = 0; i < audioSources.length; i++) {
		if (audioSources[i] == null) continue;
		audioSources[i].stop(stopTime);
		audioSources[i].disconnect();
	}
}

function refreshTrackStates() {
	stopPlayback();
	startPlayback();
}

loadButton.onclick = () => cacheBuffers();

audioControls.onplay = () => {
	isAudioPlaying = true;
	startPlayback();
};
audioControls.onpause = () => {
	isAudioPlaying = false;
	stopPlayback();
};
audioControls.onseeked = () => {
	if (isAudioPlaying) startPlayback();
};
audioControls.onseeking = () => {
	if (isAudioPlaying) stopPlayback();
};

var inputs = document.getElementsByTagName("input");
for (var i = 0; i < inputs.length; i++) {
	if (inputs[i].type == "checkbox") {
		inputs[i].onchange = (e) => {
			trackGroups[e.currentTarget.name][0] = e.currentTarget.checked;
			refreshTrackStates();
		};
	}
}