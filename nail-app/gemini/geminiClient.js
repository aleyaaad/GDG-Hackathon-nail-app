import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "../firebase/firebaseConfig";

const ai = getAI(app, { backend: new GoogleAIBackend() });

export const measurementModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
});

function cleanGeminiJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
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

`;

  const result = await measurementModel.generateContent(prompt);
  const rawText = result.response.text();
  const cleanedText = cleanGeminiJson(rawText);

  console.log("Raw Gemini response:", rawText);
  console.log("Cleaned Gemini response:", cleanedText);

  return JSON.parse(cleanedText);
}
