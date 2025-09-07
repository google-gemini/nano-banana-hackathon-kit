import { GoogleGenAI, Type, Operation, GenerateVideosResponse } from "@google/genai";
import type { UserInput, TrailerData, EditDecisionList, CharacterSettings, SceneImage } from "../types";

const getAiClientWithUserKey = (userProvidedKey?: string) => {
    const apiKey = process.env.API_KEY || userProvidedKey;
    if (!apiKey || apiKey === 'DEFAULT_DEMO_KEY') {
        throw new Error("Google AI API key is not available. Please configure it in the settings or environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A compelling, Hollywood-style sequel title for the movie.",
    },
    narrative: {
      type: Type.STRING,
      description: "A short, dramatic voiceover script (3-5 lines) composed of cryptic lines of dialogue from the movie itself, rather than a traditional narrator. This should create a mysterious, 'show, don''t tell' feel.",
    },
    keyScenes: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of exactly 3 exciting, visual 'key scenes' that would be shown in the trailer. Each should be a short, descriptive sentence.",
    },
  },
  required: ["title", "narrative", "keyScenes"],
};

export const generateTrailerScript = async (userInput: UserInput, googleAiApiKey: string): Promise<Omit<TrailerData, 'sceneImages'>> => {
  const ai = getAiClientWithUserKey(googleAiApiKey);
  const prompt = `
      You are an expert movie trailer scriptwriter creating an 'artful' trailer.
      The script's tone and style MUST match the requested genre: ${userInput.genre}.
      The entire response MUST be in ${userInput.language}.

      Original Movie: ${userInput.movieTitle}
      Sequel Concept: ${userInput.sequelConcept}

      Follow these instructions precisely:
      1.  Generate a creative and exciting sequel title that fits the ${userInput.genre} genre.
      2.  Write a short voiceover script composed of 3 to 5 cryptic, dramatic lines of dialogue from the movie itself. Do not use a narrator. This should create a mysterious "show, don't tell" feel.
      3.  Describe exactly 3 distinct, highly visual key scenes.
      4.  Return ONLY a valid JSON object matching the provided schema. Do not include any other text or formatting.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.8,
        },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);

    if (!parsedData.title || !parsedData.narrative || !parsedData.keyScenes || !Array.isArray(parsedData.keyScenes)) {
        throw new Error("Invalid data structure received from API.");
    }
    
    return parsedData;
};

export const generateCharacterPromptFromInput = async (settings: CharacterSettings, googleAiApiKey: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    
    const attributeStrings = [];
    if (settings.age?.trim()) attributeStrings.push(`- Age: ${settings.age}`);
    if (settings.occupation?.trim()) attributeStrings.push(`- Occupation: ${settings.occupation}`);
    if (settings.clothing?.trim()) attributeStrings.push(`- Clothing Style: ${settings.clothing}`);

    const textPart = {
        text: `You are an expert prompt engineer for an AI image generator. Your task is to combine a base character description with optional attributes to create a single, concise, and highly effective prompt for generating a character image. The final prompt should flow naturally as a single sentence.

        Base Description: "${settings.characterPrompt}"
        ${attributeStrings.length > 0 ? 'Additional Attributes:\n' + attributeStrings.join('\n') : ''}
        
        - If the base description is of a real person (e.g., "A photo of Zendaya"), focus on adding the attributes to their role (e.g., "A photo of Zendaya as a futuristic desert warrior in her early 20s, wearing tactical gear").
        - If the base description is a concept, weave the attributes into the description seamlessly.
        - The final output should be a single sentence only.

        Example 1:
        Input: Base Description: "grizzled space marine", Age: "50s", Clothing: "tactical armor"
        Output: A cinematic photo of a grizzled space marine in his 50s, with a five o'clock shadow and a scar over his left eye, wearing detailed tactical armor.

        Example 2:
        Input: Base Description: "a powerful sorceress"
        Output: A cinematic photo of a powerful sorceress.

        Now, generate the prompt for the provided inputs.`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart] },
    });
    
    return response.text.trim();
};

export const generateRandomSuggestion = async (fieldType: 'movie' | 'concept' | 'character', googleAiApiKey?: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    let prompt = '';
    switch (fieldType) {
        case 'movie':
            prompt = "Generate a single, creative sequel title for a famous movie. Avoid simple numbers (e.g., 'Movie 2'). Instead, use subtitles or clever wordplay. For example, 'Blade Runner: The Final Memory' or 'Inception: The Waking Dream'. Return ONLY the title. No extra text or quotation marks.";
            break;
        case 'concept':
            prompt = "Suggest a single, creative, one-sentence sequel concept for a generic movie. Be imaginative and concise. Return ONLY the sentence.";
            break;
        case 'character':
            prompt = `
                Suggest a single, interesting character for a movie.
                Return ONLY a valid JSON object with four keys: "characterPrompt", "age", "occupation", and "clothing".
                Example: {
                    "characterPrompt": "A grizzled private eye haunted by his past",
                    "age": "late 40s",
                    "occupation": "Detective",
                    "clothing": "A worn trench coat and fedora"
                }
            `;
            const charResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 1.0,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            characterPrompt: { type: Type.STRING },
                            age: { type: Type.STRING },
                            occupation: { type: Type.STRING },
                            clothing: { type: Type.STRING },
                        }
                    }
                },
            });
            return charResponse.text.trim();
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 1.0,
        },
    });

    return response.text.trim().replace(/"/g, '');
};

export const sanitizeImagePrompt = async (characterPrompt: string, sceneDescription: string, googleAiApiKey: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `
        You are an AI assistant that rewrites prompts for an image generation model. Your task is to remove all specific intellectual property, character names, actor names, and location names from the user's input and replace them with generic, descriptive archetypes. The goal is to capture the visual essence of the request without violating copyright or safety policies.

        RULES:
        - NEVER use proper nouns, names of people, characters, or places from movies, books, or games.
        - ALWAYS replace them with descriptive, generic terms.
        - Crucially, if a human character is described, their ethnicity should be diverse (e.g., Black, East Asian, South Asian, Hispanic, Middle Eastern, Native American, White) unless the user has specified otherwise. Your output should reflect this diversity.
        - The output MUST be a single, concise sentence describing the final scene.

        Example 1:
        - Character: "A photo of Keanu Reeves as Neo"
        - Scene: "Dodging bullets in a green-tinted hallway."
        - Your Output: "A man of ambiguous mixed-race ethnicity in a long black trench coat dramatically leaning back to dodge bullets in a narrow, green-lit corridor."

        Example 2:
        - Character: "A grizzled space marine with a robotic eye"
        - Scene: "Fighting a horde of aliens on a desolate red planet."
        - Your Output: "A grizzled Black woman space marine with a cybernetic eye firing a plasma rifle at a swarm of monstrous extraterrestrial creatures on a barren, crimson-colored alien world."
        
        Example 3:
        - Character: "Godzilla"
        - Scene: "Fighting King Kong on the Empire State Building."
        - Your Output: "A colossal prehistoric lizard battling a giant ape on top of a tall art-deco skyscraper in a modern city."

        Now, rewrite the following:
        - Character: "${characterPrompt}"
        - Scene: "${sceneDescription}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.5,
        },
    });

    return response.text.trim();
};

export const generateSceneImage = async (trailerData: TrailerData, characterPrompt: string, originalMovie: string, googleAiApiKey: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    
    const sanitizedPrompt = await sanitizeImagePrompt(characterPrompt, trailerData.keyScenes[0], googleAiApiKey);

    const prompt = `
        ${sanitizedPrompt}
        Style: epic, dramatic, cinematic lighting, highly detailed, 4K, realistic, photorealistic movie still.
        Do NOT include any text, titles, logos, gore, or nudity in the image.
    `;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image || !response.generatedImages[0].image.imageBytes) {
        throw new Error("Image generation failed. The model did not return an image, which may be due to a safety policy violation.");
    }

    return response.generatedImages[0].image.imageBytes;
};

export const editSceneImage = async (imageBase64: string, editPrompt: string, googleAiApiKey: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg',
            },
          },
          { text: editPrompt },
        ],
      },
      config: {
          responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    // Extract the edited image from the response
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }

    throw new Error("Image editing failed. The model did not return an edited image.");
};


export const generateVideoFromImage = async (imageBase64: string, sceneDescription: string, googleAiApiKey: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `Animate this scene: ${sceneDescription}. The motion should be cinematic and dramatic, suitable for a movie trailer. Keep the duration short, around 3-4 seconds.`;

    let operation: Operation<GenerateVideosResponse> = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: 'image/jpeg',
        },
        config: {
            numberOfVideos: 1,
        }
    });

    // Poll for the result
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed with an error: ${JSON.stringify(operation.error)}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation operation completed, but no video URI was found.");
    }
    
    return downloadLink;
}

export const generateCinematicVideoPrompt = async (sceneDescription: string, narrativeContext: string, googleAiApiKey: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `
        You are a master cinematographer translating a static storyboard scene into a dynamic video prompt for an AI video generator. Your goal is to create a short, cinematic camera instruction that brings the scene to life and reflects the narrative's tone.

        Narrative Context: "${narrativeContext}"
        Static Scene Description: "${sceneDescription}"

        Instructions:
        1. Based on the narrative context and scene, describe a 3-5 second video clip.
        2. Focus on camera movement, character action, or environmental effects.
        3. The output must be a single, concise sentence.
        4. Return ONLY the new video prompt sentence.

        Example 1:
        - Narrative: "The city held its breath, waiting for a hero."
        - Scene: "A lone figure in a long coat stands on a rooftop overlooking a rain-slicked neon city."
        - Your Output: "A slow dramatic push-in on a lone figure standing on a rooftop, their long coat billowing in the wind as rain streaks across the neon-lit city below."

        Example 2:
        - Narrative: "There was no escape from the machine's fury."
        - Scene: "A cybernetic assassin faces the hero in a derelict factory."
        - Your Output: "The cybernetic assassin's red optic lens flares to life as it takes a menacing step forward through the dimly lit, sparking machinery of a derelict factory."

        Now, generate the video prompt for the provided inputs.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.8 }
    });
    return response.text.trim();
};

export const generateVideoPromptVariation = async (originalScene: string, googleAiApiKey?: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `
        You are an expert AI video prompt engineer. Your task is to creatively rewrite a scene description for a movie trailer. The goal is to keep the core idea but change the wording to be safer for generation policies that might have blocked the original prompt.

        Original Scene: "${originalScene}"

        Instructions:
        1.  Analyze the original prompt for potentially sensitive keywords (e.g., specific actions, intense conflict).
        2.  Rewrite the prompt to be more abstract or conceptual, focusing on the mood and visual elements rather than explicit actions.
        3.  The output must be a single, concise sentence ready to be used as a video generation prompt.
        4.  Return ONLY the new sentence. No preamble or extra text.

        Example:
        - Original Scene: "A soldier firing a machine gun at an enemy."
        - Your Output: "A lone figure stands against a backdrop of flashing lights and chaos, a sense of intense conflict in the air."

        Now, generate a variation for the provided scene.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.7 }
    });
    return response.text.trim();
};


export const generateImagePromptVariation = async (originalScene: string, characterPrompt: string, googleAiApiKey?: string): Promise<string> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `
        You are an expert AI art prompt engineer. Your task is to creatively rewrite a scene description for a movie trailer, keeping the core idea but changing the perspective, composition, or details to get a fresh visual. This is often used to get around safety filters that may have blocked the original prompt.

        Original Character: "${characterPrompt}"
        Original Scene: "${originalScene}"

        Instructions:
        1.  Do not just add adjectives. Fundamentally change the camera angle, action, or environment.
        2.  The new prompt must feature the same character archetype.
        3.  The output must be a single, concise sentence ready to be used as an image generation prompt.
        4.  Return ONLY the new sentence. No preamble or extra text.

        Example:
        - Original Scene: "A starship crashing into a neon-lit city."
        - Your Output: "From a low-angle street view, looking up as a colossal, damaged starship scrapes between skyscrapers, raining sparks and debris onto the wet asphalt below."

        Now, generate a variation for the provided scene.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.9 }
    });
    return response.text.trim();
};

const edlSchema = {
    type: Type.OBJECT,
    properties: {
        totalDuration: { type: Type.NUMBER, description: "The total duration of the trailer in seconds. Must exactly match the provided audio duration."},
        shots: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "Either 'image', 'video', or 'intertitle'." },
                    duration: { type: Type.NUMBER, description: "Duration of this shot in seconds." },
                    sceneIndex: { type: Type.NUMBER, description: "The index of the scene asset to show (0-based). Required for 'image' or 'video' type." },
                    kenBurns: { type: Type.STRING, description: "The camera effect for fallback images: 'zoom-in', 'zoom-out', 'pan-left', 'pan-right'. Only for 'image' type." },
                    text: { type: Type.STRING, description: "The text to display. For 'intertitle' type. This can be the main title or a review." }
                }
            }
        }
    },
    required: ["totalDuration", "shots"]
};

export const generateEditDecisionList = async (sceneAssets: SceneImage[], narrative: string, audioDuration: number, trailerTitle: string, reviews: string[], googleAiApiKey: string): Promise<EditDecisionList> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    
    const scenesWithVideo = sceneAssets.map((asset, index) => ({
        index,
        description: asset.scene,
        hasVideo: asset.videoStatus === 'done'
    }));
    
    const prompt = `
        You are an expert film trailer editor. Your task is to create a professional "Edit Decision List" (EDL) for a movie trailer.

        Trailer Title: "${trailerTitle}"
        Available Reviews: ${reviews.join(' | ')}
        Audio Duration: ${audioDuration} seconds.

        Available Visual Assets:
        ${scenesWithVideo.map(s => `- Scene Index ${s.index}: ${s.description} (Video Available: ${s.hasVideo})`).join('\n')}

        Rules:
        1.  The total duration of all shots combined MUST exactly match the provided audio duration: ${audioDuration} seconds. THIS IS THE MOST IMPORTANT RULE.
        2.  For each visual asset, you MUST specify the shot type. Prioritize using 'video' for scenes where a video is available. If a video is NOT available (hasVideo: false), you MUST use the 'image' type.
        3.  Create a professional trailer structure:
            - Start with a main title card ('intertitle').
            - Intercut the main action scenes with marketing reviews ('intertitle').
            - Build pace and excitement.
            - End with the main title card again.
        4.  You MUST use ALL main action scenes (0 to ${sceneAssets.length - 1}) exactly once.
        5.  For every shot of type 'image', you MUST suggest a 'kenBurns' effect ('zoom-in', 'pan-left', etc.). Vary the effects. 'kenBurns' is not needed for 'video' shots.
        6.  The sequence of shots should logically follow the provided narrative.

        Narrative: "${narrative}"

        Return ONLY a valid JSON object matching the provided schema. The sum of all shot durations must be exactly ${audioDuration}.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: edlSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateCinematicScorePrompt = async (genre: string, concept: string, googleAiApiKey: string): Promise<string> => {
  const ai = getAiClientWithUserKey(googleAiApiKey);
  const prompt = `
    You are an expert sound designer and composer. Based on a movie's genre and concept, create a short, evocative prompt for an AI music/sound generator. The prompt should describe an impactful, cinematic score suitable for a movie trailer.

    Genre: "${genre}"
    Concept: "${concept}"

    Instructions:
    - The prompt should be a single, concise phrase or sentence.
    - Focus on instrumental, atmospheric, and powerful sounds. Use words like "epic, orchestral, hybrid, synth, powerful drums, suspenseful strings, soaring brass".
    - Do NOT ask for lyrics or specific licensed songs.
    - Return ONLY the text prompt. No extra text or quotation marks.

    Example 1:
    - Genre: "Sci-Fi"
    - Concept: "A lone survivor on a derelict starship."
    - Output: "A suspenseful and atmospheric sci-fi score with deep drones, tense string arrangements, and glitchy electronic elements."

    Example 2:
    - Genre: "Action"
    - Concept: "A high-speed chase through a futuristic city."
    - Output: "An epic, high-energy hybrid-orchestral track with powerful, driving percussion, aggressive synth basslines, and soaring brass melodies."
    
    Example 3:
    - Genre: "Fantasy"
    - Concept: "An ancient prophecy foretells the return of a dragon."
    - Output: "A sweeping, epic orchestral score with powerful choirs, thunderous drums, and a majestic, heroic brass theme."
  `;

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
      },
  });
  return response.text.trim();
};

const voiceSelectionSchema = {
    type: Type.OBJECT,
    properties: {
        voiceId: { type: Type.STRING, description: "The chosen voice ID." },
        voiceName: { type: Type.STRING, description: "The name of the chosen voice." },
        reason: { type: Type.STRING, description: "A brief, one-sentence justification for the choice."}
    },
    required: ["voiceId", "voiceName", "reason"]
};

const availableVoices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm, American, female. Good for neutral, professional narration.' },
    { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew', description: 'Deep, American, male. Good for epic, dramatic, or action trailers.' },
    { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde', description: 'Authoritative, deep, British, male. Excellent for historical or fantasy epics.'},
    { id: '5Q0t7uMcjvnagumLfvZi', name: 'Paul', description: 'Raspy, deep, American, male. Perfect for gritty, noir, or horror genres.' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Youthful, American, female. Suitable for comedy, drama, or YA adaptations.' },
    { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave', description: 'Conversational, American, male. Good for a more modern, grounded feel.' },
    { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Sarah', description: 'Warm, engaging, British, female. Good for dramas and emotional stories.' },
];

export const selectVoice = async (genre: string, concept: string, googleAiApiKey: string): Promise<{ voiceId: string; voiceName: string; reason: string }> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `
        You are a casting director for a movie trailer. Your task is to select the perfect voiceover artist from a provided list based on the movie's genre and concept.

        Genre: "${genre}"
        Concept: "${concept}"

        Available Voices:
        ${availableVoices.map(v => `- ID: ${v.id}, Name: ${v.name}, Description: ${v.description}`).join('\n')}

        Instructions:
        1. Analyze the genre and concept to determine the ideal vocal tone (e.g., deep and epic for action, calm and professional for sci-fi, raspy for horror).
        2. Choose the single best voice from the list.
        3. Provide its 'voiceId' and 'voiceName'.
        4. Provide a brief, one-sentence justification for your choice.
        5. Return ONLY a valid JSON object matching the provided schema. The 'voiceId' MUST be one of the IDs from the list.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: voiceSelectionSchema
        },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    console.log(`Casting decision: ${parsed.reason} (Voice: ${parsed.voiceName}, ID: ${parsed.voiceId})`);
    return parsed;
};

export const generateFakeReviews = async (genre: string, title: string, googleAiApiKey: string): Promise<string[]> => {
    const ai = getAiClientWithUserKey(googleAiApiKey);
    const prompt = `
      You are a movie marketing expert. Your task is to generate 2 short, punchy, fake reviews for a movie trailer.

      Movie Title: "${title}"
      Genre: "${genre}"

      Instructions:
      1. Create two distinct reviews.
      2. Each review should be a short, exciting phrase (2-5 words).
      3. CRITICAL: The TONE of the review MUST match the movie's genre. For 'Horror', use words like 'terrifying' or 'chilling'. For 'Sci-Fi', use 'mind-bending' or 'spectacular'. For 'Action', use 'explosive' or 'non-stop thrills'. For 'Comedy', use 'hilarious' or 'side-splitting'.
      4. Assign each review to a plausible but fake publication name, like "The Digital Spectator" or "Galaxy Gazette".
      5. Format each review as: "Review Quote - *Publication Name*"
      6. Return ONLY a valid JSON array of the two review strings. Do not include any other text or formatting.

      Example Response for a 'Horror' film:
      [
        "Absolutely terrifying! - *The Midnight Herald*",
        "You won't sleep for weeks. - *ScreamScene Magazine*"
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
