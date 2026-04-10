import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import app from "../firebase/firebaseConfig";

const ai = getAI(app, { backend: new GoogleAIBackend() });

const measurementSchema = Schema.object({
  properties: {
    thumbMm: Schema.number(),
    indexMm: Schema.number(),
    middleMm: Schema.number(),
    ringMm: Schema.number(),
    pinkyMm: Schema.number(),
    notes: Schema.string(),
  },
});

export const measurementModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: measurementSchema,
  },
});

export async function testGeminiConnection() {
  const prompt = `
Return JSON only.
Estimate a fake nail measurement example with these fields:
thumbMm, indexMm, middleMm, ringMm, pinkyMm, notes
`;

  const result = await measurementModel.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}