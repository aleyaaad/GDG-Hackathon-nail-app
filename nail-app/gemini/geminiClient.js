// gemini ai client - handles all communication with google's gemini 2.5 flash ai model
// uses lazy initialization pattern to prevent blocking the app startup with slow api calls
// analyzes nail photos and extracts measurement data using computer vision

import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "../firebase/firebaseConfig";

// lazy-loaded gemini ai instances - not initialized until actually needed
// this prevents timeout errors on app startup
let ai;
let measurementModel;
let initError = null;

// initializes gemini ai and the measurement model on first use
// subsequent calls do nothing if already initialized or if previous init failed
function initializeGemini() {
  if (ai) return; // already initialized, skip
  if (initError) return; // previous init failed, don't try again
  
  try {
    // create ai instance connected to firebase backend
    ai = getAI(app, { backend: new GoogleAIBackend() });
    // get the gemini 2.5 flash model for fast image analysis
    measurementModel = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",
    });
  } catch (error) {
    console.warn("Gemini initialization failed:", error);
    initError = error;
  }
}

// cleans up json formatting in gemini response by removing markdown code blocks
// gemini sometimes wraps json in ```json ``` markers, this removes them
function cleanGeminiJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

// converts image uri to base64 encoded data for gemini api submission
// fetches image from device storage and encodes as data url
async function uriToInlineData(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  // use filereader to convert blob to base64 string
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        // remove the "data:image/jpeg;base64," prefix, keep only the base64 part
        const base64 = result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    inlineData: {
      data: base64Data,
      mimeType: blob.type || "image/jpeg",
    },
  };
}

// tests gemini connection by asking for sample measurements
// used to verify api is working without needing an actual image
export async function testGeminiConnection() {
  try {
    // initialize gemini only when this function is called
    initializeGemini();
    
    if (!measurementModel) {
      throw new Error("Gemini model failed to initialize");
    }
    
    // prompt gemini to return sample nail measurements as json
    const prompt = `
Return ONLY valid JSON with this exact structure:
{
  "thumbMm": number,
  "indexMm": number,
  "middleMm": number,
  "ringMm": number,
  "pinkyMm": number,
  "notes": string
}

Do not include markdown.
Do not include code fences.
Give sample values only.
`;

    const result = await measurementModel.generateContent(prompt);
    const rawText = result.response.text();
    const cleanedText = cleanGeminiJson(rawText);

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    throw error;
  }
}

// analyzes a hand photo and extracts nail measurements using gemini ai
// returns estimated width in millimeters for each nail bed
export async function extractMeasurementsFromImage(imageUri) {
  try {
    // initialize gemini only when this function is called
    initializeGemini();
    
    if (!measurementModel) {
      throw new Error("Gemini model failed to initialize");
    }
    
    // convert image to base64 for submission to api
    const imagePart = await uriToInlineData(imageUri);

    const prompt = `
You are analyzing a hand photo for press-on nail sizing.

Estimate the nail bed WIDTH in millimeters for each finger:
- thumbMm
- indexMm
- middleMm
- ringMm
- pinkyMm

Return ONLY valid JSON in exactly this format:
{
  "thumbMm": number,
  "indexMm": number,
  "middleMm": number,
  "ringMm": number,
  "pinkyMm": number,
  "notes": string
}

Rules:
- Do not include markdown
- Do not include code fences
- Do not include extra explanation outside the JSON
- Measurements should be best estimates for nail bed width in mm
- notes should briefly explain any uncertainty
`;

    const result = await measurementModel.generateContent([prompt, imagePart]);
    const rawText = result.response.text();
    const cleanedText = cleanGeminiJson(rawText);

    console.log("Raw image Gemini response:", rawText);
    console.log("Cleaned image Gemini response:", cleanedText);

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Image analysis failed:", error);
    throw error;
  }
}