/**
 * ElevenLabs Service
 *
 * This service handles the integration with the ElevenLabs API for text-to-speech conversion.
 */

const BASE_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Generates a voiceover from the given text using the ElevenLabs API.
 * @param text The narrative text to convert to speech.
 * @param apiKey The ElevenLabs API key.
 * @param voiceId The ID of the voice to use for the generation.
 * @returns A promise that resolves with a blob URL for the generated audio.
 */
export const generateVoiceover = async (text: string, apiKey: string, voiceId: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("ElevenLabs API key is not configured. Please add it in the settings.");
  }
  if (!voiceId) {
    throw new Error("A voice ID must be provided to generate a voiceover.");
  }

  const apiUrl = `${BASE_API_URL}/text-to-speech/${voiceId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs API Error (${response.status}): ${errorBody}`);
    }

    const audioBlob = await response.blob();
    if (audioBlob.size === 0) {
      throw new Error("ElevenLabs API returned an empty voiceover file. This can be caused by very short narrative text, an invalid API key, or a problem with the selected voice model. Please review the script and your API settings.");
    }
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;

  } catch (error) {
    console.error("Failed to generate voiceover:", error);
    throw error;
  }
};

/**
 * Generates a background sound effect from a text prompt using the ElevenLabs API.
 * @param text The descriptive prompt for the sound.
 * @param apiKey The ElevenLabs API key.
 * @param duration The desired duration of the sound in seconds. Max 22.
 * @returns A promise that resolves with a blob URL for the generated audio.
 */
export const generateBackgroundSound = async (text: string, apiKey: string, duration: number = 20): Promise<string> => {
  if (!apiKey) {
    throw new Error("ElevenLabs API key is not configured. Please add it in the settings.");
  }

  const soundGenApiUrl = `${BASE_API_URL}/sound-generation`;

  try {
    const response = await fetch(soundGenApiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        duration_seconds: Math.min(duration, 22), // API has a max of 22 seconds
        prompt_influence: 0.6,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs Sound Gen API Error (${response.status}): ${errorBody}`);
    }

    const audioBlob = await response.blob();
    if (audioBlob.size === 0) {
      throw new Error("ElevenLabs Sound Gen returned an empty audio file.");
    }
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;

  } catch (error) {
    console.error("Failed to generate background sound:", error);
    throw error;
  }
};
