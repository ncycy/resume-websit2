import { GoogleGenAI } from "@google/genai";
import { ProfileData } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates an abstract background image suitable for an academic header.
 * Uses the user provided prompt or a default technical theme.
 */
export const generateThemeImage = async (userPrompt?: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const prompt = userPrompt || 'Abstract high-tech background for an academic website about Human-Computer Interaction and AI. Visuals: Digital neural networks connecting to a human silhouette, glowing data streams, futuristic blue and cyan neon lines, circuit board patterns merging with organic shapes. Style: Professional, clean, deep depth of field, panoramic, suitable for a website banner, 4k resolution.';

    // Using Nano Banana (gemini-2.5-flash-image) for image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    });

    // Check for inline data in parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Failed to generate image:", error);
    throw error;
  }
};

/**
 * Translates the profile data structure from Chinese to English.
 */
export const translateProfileData = async (data: ProfileData): Promise<ProfileData> => {
  try {
    const ai = getClient();
    const prompt = `
      You are a professional academic translator. Translate the following Academic Profile JSON data from Chinese to Professional Academic English.
      
      Rules:
      1. Keep the JSON structure EXACTLY the same. Do not add or remove keys.
      2. Only translate the values (strings).
      3. For 'id' and URLs (like 'avatarUrl', 'qrCodeUrl'), DO NOT translate.
      4. For specific Chinese academic terms (e.g., "双千计划", "主持"), use standard English academic equivalents (e.g., "Double Thousand Plan", "Principal Investigator").
      5. Return ONLY the raw JSON string, no markdown formatting.

      Input JSON:
      ${JSON.stringify(data)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No translation returned");
    
    return JSON.parse(text) as ProfileData;
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
};
