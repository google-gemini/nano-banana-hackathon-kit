/**
 * Client-Side Audio Service
 *
 * This service uses the Web Audio API to mix two audio sources: a voiceover
 * and a background music track.
 */

const MUSIC_VOLUME = 0.25; // Lower the volume of the music track

/**
 * Mixes a voiceover and a background music track into a single audio stream.
 * @param voiceoverUrl URL for the voiceover audio.
 * @param musicUrl URL for the background music audio.
 * @returns A promise that resolves with a blob URL for the mixed audio.
 */
export const mixAudio = async (voiceoverUrl: string, musicUrl: string): Promise<string> => {
    const audioContext = new AudioContext();

    const decode = async (url: string, type: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${type} audio: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) throw new Error(`${type} audio file is empty.`);
        try {
            return await audioContext.decodeAudioData(arrayBuffer);
        } catch (e: any) {
            throw new Error(`Unable to decode ${type} audio data: ${e.message}`);
        }
    };

    const [voiceoverBuffer, musicBuffer] = await Promise.all([
        decode(voiceoverUrl, 'voiceover'),
        decode(musicUrl, 'music'),
    ]);
    
    if (voiceoverBuffer.duration === 0) {
        throw new Error("Decoded voiceover has zero duration, cannot mix.");
    }

    const voiceoverSource = audioContext.createBufferSource();
    voiceoverSource.buffer = voiceoverBuffer;
    
    const musicSource = audioContext.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;

    const musicGainNode = audioContext.createGain();
    musicGainNode.gain.value = MUSIC_VOLUME;

    musicSource.connect(musicGainNode);
    
    const destination = audioContext.createMediaStreamDestination();
    voiceoverSource.connect(destination);
    musicGainNode.connect(destination);

    const recorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm; codecs=opus' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise<string>((resolve, reject) => {
        const closeContext = () => {
            if (audioContext.state !== 'closed') {
                audioContext.close().catch(e => console.error("Error closing audio context", e));
            }
        };

        recorder.onstop = () => {
            const mixedBlob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
            if (mixedBlob.size === 0) {
                reject(new Error("Audio mixing resulted in an empty file, which may be due to a decoding error."));
            } else {
                const mixedUrl = URL.createObjectURL(mixedBlob);
                resolve(mixedUrl);
            }
            closeContext();
        };

        recorder.onerror = (event) => {
            reject(event);
            closeContext();
        };
        
        // When the primary audio track (voiceover) ends, stop recording.
        voiceoverSource.onended = () => {
            // Stop recording immediately when the voiceover ends for reliability.
            if (recorder.state === 'recording') {
                recorder.stop();
            }
            musicSource.stop();
        };
        
        voiceoverSource.start();
        musicSource.start();
        recorder.start();
    });
};