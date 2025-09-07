import { EditDecisionList, SceneImage } from "../types";

/**
 * Client-Side Video Service
 *
 * This service uses browser APIs to create a final trailer by compositing
 * video clips and animated still images with an audio track.
 */

type ProgressCallback = (progress: { percent: number, currentShot?: number, totalShots?: number }) => void;


const loadVideoElement = async (videoUrl: string, apiKey: string): Promise<HTMLVideoElement> => {
    try {
        // Step 1: Fetch the video data with the API key
        const response = await fetch(`${videoUrl}&key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video data. Status: ${response.status}`);
        }
        
        // Step 2: Get the data as an ArrayBuffer and create a Blob with an explicit MIME type.
        // This is crucial for helping the browser's decoder understand the format.
        const videoArrayBuffer = await response.arrayBuffer();
        if (videoArrayBuffer.byteLength === 0) {
             throw new Error("Fetched video data is empty.");
        }
        const videoBlob = new Blob([videoArrayBuffer], { type: 'video/mp4' });

        // Step 3: Create an Object URL from the Blob
        const objectUrl = URL.createObjectURL(videoBlob);

        // Step 4: Load the video element with the Object URL
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.muted = true;
            video.onloadeddata = () => resolve(video);
            video.onerror = () => {
                const error = video.error;
                // Clean up the object URL on error
                URL.revokeObjectURL(objectUrl);
                reject(new Error(`Failed to load video element. Error: ${error?.message} (Code: ${error?.code})`));
            };
            video.src = objectUrl;
            video.load();
        });
    } catch (error) {
        console.error("Error in loadVideoElement:", error);
        throw error; // Re-throw to be caught by the calling function
    }
};

export const assembleTrailer = async (
    sceneAssets: SceneImage[],
    audioUrl: string,
    edl: EditDecisionList,
    onProgress: ProgressCallback,
    googleAiKey: string,
): Promise<string> => {
    if (!googleAiKey) {
        throw new Error("Cannot assemble trailer: Google AI API key is not available.");
    }

    const audioContext = new AudioContext();
    const audioResponse = await fetch(audioUrl);
    const audioData = await audioResponse.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(audioData);
    const audioDuration = edl.totalDuration > 0 ? edl.totalDuration : audioBuffer.duration;

    const audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    
    const audioDestination = audioContext.createMediaStreamDestination();
    audioSource.connect(audioDestination);

    const imageElements: HTMLImageElement[] = await Promise.all(
        sceneAssets.map(asset => new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = `data:image/jpeg;base64,${asset.imageBase64}`;
        }))
    );

    // Pre-load all available video assets
    const videoElements: (HTMLVideoElement | null)[] = await Promise.all(
        sceneAssets.map(asset => asset.videoUrl ? loadVideoElement(asset.videoUrl, googleAiKey).catch(e => {
            console.warn(`Could not load video for a scene, will fall back to image.`, e);
            return null;
        }) : Promise.resolve(null))
    );


    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9,opus' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve, reject) => {
        let animationFrameId: number;

        recorder.onstop = () => {
            cancelAnimationFrame(animationFrameId);
            // Clean up all created object URLs from video elements
            videoElements.forEach(video => {
                if (video && video.src.startsWith('blob:')) {
                    URL.revokeObjectURL(video.src);
                }
            });
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const finalVideoUrl = URL.createObjectURL(videoBlob);
            onProgress({ percent: 100 });
            resolve(finalVideoUrl);
        };
        recorder.onerror = reject;

        recorder.start();
        audioSource.start();
        
        const startTime = performance.now();
        const totalVisualShots = edl.shots.filter(s => s.type === 'image' || s.type === 'video').length;
        let visualShotCounter = 0;
        let lastReportedShot = 0;


        const drawFrame = (currentTime: number) => {
            const elapsedTime = (currentTime - startTime) / 1000;
            
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let currentShot = null;
            let shotStartTime = 0;
            let cumulativeTime = 0;
            visualShotCounter = 0;

            for (const shot of edl.shots) {
                if(shot.type === 'image' || shot.type === 'video') visualShotCounter++;
                if (elapsedTime < cumulativeTime + shot.duration) {
                    currentShot = shot;
                    shotStartTime = cumulativeTime;
                    break;
                }
                cumulativeTime += shot.duration;
            }
            
            const currentShotForDisplay = currentShot?.type === 'image' || currentShot?.type === 'video' ? visualShotCounter : lastReportedShot;
            if (currentShotForDisplay !== lastReportedShot) {
                lastReportedShot = currentShotForDisplay;
            }


            if (currentShot) {
                const sceneIndex = currentShot.sceneIndex;
                const videoEl = (sceneIndex !== undefined) ? videoElements[sceneIndex] : null;

                if (currentShot.type === 'intertitle') {
                    ctx.font = 'bold 64px "Press Start 2P", "Inter", sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Cinematic drop shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 4;
                    ctx.shadowOffsetY = 4;

                    const text = currentShot.text || '';
                    const words = text.split(' ');
                    let line = '';
                    let y = canvas.height / 2;
                    if (words.length > 4) y -= 40; // Basic centering for multi-line
                    
                    for(let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        if (ctx.measureText(testLine).width > canvas.width * 0.9 && n > 0) {
                            ctx.fillText(line, canvas.width/2, y);
                            line = words[n] + ' ';
                            y += 80;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line.trim(), canvas.width/2, y);
                    
                    // Reset shadow for subsequent frames
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                } else if (sceneIndex !== undefined && (videoEl || imageElements[sceneIndex])) {
                    // Decide whether to use video or fallback to image
                    if (currentShot.type === 'video' && videoEl) {
                        const clipTime = elapsedTime - shotStartTime;
                        videoEl.currentTime = Math.min(clipTime, videoEl.duration);
                        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                    } else { // Fallback to Ken Burns on image
                        const img = imageElements[sceneIndex];
                        const shotProgress = Math.max(0, Math.min(1, (elapsedTime - shotStartTime) / currentShot.duration));
                        
                        const zoomAmount = 0.15;
                        let scale = 1.0, dx = 0, dy = 0;

                        const canvasAspect = canvas.width / canvas.height;
                        const imgAspect = img.width / img.height;
                        let initialW, initialH, initialX, initialY;

                        if (canvasAspect > imgAspect) {
                            initialW = canvas.width;
                            initialH = canvas.width / imgAspect;
                            initialX = 0;
                            initialY = (canvas.height - initialH) / 2;
                        } else {
                            initialH = canvas.height;
                            initialW = canvas.height * imgAspect;
                            initialY = 0;
                            initialX = (canvas.width - initialW) / 2;
                        }
                        
                        const baseScale = 1 + zoomAmount;
                        
                        switch (currentShot.kenBurns) {
                            case 'zoom-in': scale = 1 + shotProgress * zoomAmount; break;
                            case 'zoom-out': scale = baseScale - shotProgress * zoomAmount; break;
                            case 'pan-right': dx = - (shotProgress * (initialW * baseScale - canvas.width)); break;
                            case 'pan-left': dx = - ((1 - shotProgress) * (initialW * baseScale - canvas.width)); break;
                            case 'pan-down': dy = - (shotProgress * (initialH * baseScale - canvas.height)); break;
                            case 'pan-up': dy = - ((1 - shotProgress) * (initialH * baseScale - canvas.height)); break;
                            default: scale = 1 + shotProgress * zoomAmount; 
                        }
                        
                        if (currentShot.kenBurns && currentShot.kenBurns.startsWith('pan')) {
                            scale = baseScale;
                        } else {
                            dx = (initialW - initialW * scale) / 2;
                            dy = (initialH - initialH * scale) / 2;
                        }

                        ctx.drawImage(img, initialX + dx, initialY + dy, initialW * scale, initialH * scale);
                    }
                }
            }
            
            onProgress({
                percent: Math.min(99, (elapsedTime / audioDuration) * 100),
                currentShot: lastReportedShot > 0 ? lastReportedShot : undefined,
                totalShots: totalVisualShots,
            });

            if (elapsedTime >= audioDuration) {
                if (recorder.state === 'recording') recorder.stop();
                return;
            }

            animationFrameId = requestAnimationFrame(drawFrame);
        };
        
        animationFrameId = requestAnimationFrame(drawFrame);
    });
};