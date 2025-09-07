export enum AppStep {
  LOGIN,
  INPUT,
  SCRIPT_GENERATION,
  SCRIPT_REVIEW,
  CHARACTER_INPUT,
  IMAGE_REVIEW,
  SOUND_DESIGN,
  VIDEO_GENERATION,
  ASSEMBLING,
  RESULT,
  GALLERY,
}

export interface UserInput {
  movieTitle: string;
  sequelConcept: string;
  genre: string;
  language: 'English' | 'Chinese';
  creatorName: string;
}

export interface CharacterSettings {
  characterPrompt: string;
  age?: string;
  occupation?: string;
  clothing?: string;
}

export interface SceneImage {
    scene: string; // The description of the scene
    imageBase64: string; // The generated image
    status: 'pending' | 'generating' | 'done' | 'error';
    videoUrl?: string; // URL for the generated VEO clip
    videoStatus?: 'pending' | 'generating' | 'done' | 'error'; // Status for VEO generation
}

export interface TrailerData {
  title: string;
  narrative: string;
  keyScenes: string[];
  sceneImages: SceneImage[];
  audioUrl?: string;
  videoUrl?: string;
  musicUrl?: string;
  productionTime?: string; // The total time taken to generate the trailer
}

export interface GalleryItem {
    id: number;
    title: string;
    movieTitle: string;
    thumbnailUrl: string;
}

export interface SavedTrailer {
    id: string; // unique id, e.g., timestamp
    userInput: UserInput;
    trailerData: TrailerData;
    characterSettings: CharacterSettings;
    videoBlob?: Blob; // The generated video file
}

export interface AssemblyTaskInfo {
    type: 'vfx' | 'audio' | 'edit' | 'init' | 'finalizing';
    prompt?: string;
    imageBase64?: string;
    voiceName?: string;
    sceneCount?: number;
    audioDuration?: number;
    currentSceneIndex?: number;
}


export interface AssemblyStatus {
    stage: string;
    progress: number;
    logs: { message: string, timestamp: string }[];
    shotProgress?: {
        currentShot: number;
        totalShots: number;
    };
    currentTaskInfo?: AssemblyTaskInfo;
}

export interface EDLShot {
    type: 'image' | 'intertitle' | 'video'; // Added 'video' type
    duration: number; // in seconds
    sceneIndex?: number;
    kenBurns?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down';
    text?: string;
}

export interface EditDecisionList {
    totalDuration: number;
    shots: EDLShot[];
}

export interface ApiKeys {
  elevenLabs: string;
  googleAI: string;
}