import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "../firebase/firebaseConfig";

const ai = getAI(app, { backend: new GoogleAIBackend() });

const measurementModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
});

function cleanGeminiJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

async function uriToInlineData(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
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

export async function testGeminiConnection() {
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
}

export async function extractMeasurementsFromImage(imageUri) {
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
}