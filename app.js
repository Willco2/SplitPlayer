let audioContext;
const audioControls = document.getElementById('audio-controls');
const audioFiles = ["101.mp3"];

let cachedBuffers;
let audioSources;

function cacheBuffers() {
	for (let i = 0; i < audioFiles.length; i++) {
		const request = new XMLHttpRequest();
		request.open('GET', 'media/' + audioFiles[i], true);
		request.responseType = 'arraybuffer';

		cachedBuffers = [];
		request.onload = () => {
			audioContext.decodeAudioData(request.response,
				(buffer) => { cachedBuffers.push(buffer); },
				(e) => { console.log("Error with decoding audio data" + e.error) });
		}
		console.log('requesting ' + audioFiles[i]);
		request.send();
	}
}

function startPlayback() {
	if (audioContext == null) audioContext = new AudioContext();
	if (audioContext.state === 'suspended') audioContext.resume();
	if (cachedBuffers == null) cacheBuffers();

	audioSources = [];
	var startTime = audioContext.currentTime;
	var offset = audioControls.currentTime;
	for (let i = 0; i < cachedBuffers.length; i++) {
		console.log('playing back ' + i);
		audioSources.push(new AudioBufferSourceNode(audioContext, { buffer: cachedBuffers[i] }));
		audioSources[i].connect(audioContext.destination);
		audioSources[i].start(startTime, offset);
	}
}

function stopPlayback() {
	var stopTime = audioContext.currentTime;
	for (let i = 0; i < audioSources.length; i++) {
		audioSources[i].stop(stopTime);
		audioSources[i].disconnect();
	}
}

audioControls.onplay = () => startPlayback();
audioControls.onseeked = () => startPlayback();
audioControls.onpause = () => stopPlayback();
audioControls.onseeking = () => stopPlayback();

