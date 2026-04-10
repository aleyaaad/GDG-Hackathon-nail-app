import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "../firebase/firebaseConfig";

const ai = getAI(app, { backend: new GoogleAIBackend() });

export const measurementModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
});

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

Give sample values only.
`;

  const result = await measurementModel.generateContent(prompt);
  const text = result.response.text();

  console.log("Raw Gemini response:", text);

  return text;
}