
import { GoogleGenAI, Type } from "@google/genai";
import { BabyData, FeedingLog, DiaperLog, SleepLog } from "./types";

// Safety check for browser environments without process.env
const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function parsePdfImport(base64Data: string) {
  if (!ai) {
    throw new Error("AI functionality is unavailable (Missing API Key). Manual sync is still available in Settings.");
  }
  
  try {
    const prompt = `
      I am uploading a PDF report from a baby tracking app. 
      Please extract all feeding, diaper, and sleep records you can find.
      
      CRITICAL Rules:
      1. Convert all volumes to milliliters (ml). If you see ounces (oz), multiply by 29.57.
      2. Dates and Times: Convert ALL dates and times to Unix Timestamps in MILLISECONDS (e.g., 1700000000000).
      3. If a record is from "Yesterday", calculate the timestamp based on the current date provided in the PDF header or today's context.
      4. Return a JSON object with three arrays: "feedings", "diapers", and "sleep".
      
      Data structure:
      - Feedings: type (bottle/nursing), timestamp (number, ms), amountMl (number, for bottles), leftMinutes/rightMinutes (number, for nursing).
      - Diapers: type (wet/dirty/mixed), timestamp (number, ms).
      - Sleep: startTime (number, ms), endTime (number, ms, if available).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  timestamp: { type: Type.NUMBER },
                  amountMl: { type: Type.NUMBER },
                  leftMinutes: { type: Type.NUMBER },
                  rightMinutes: { type: Type.NUMBER }
                }
              }
            },
            diapers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  timestamp: { type: Type.NUMBER }
                }
              }
            },
            sleep: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("PDF Parse Error:", error);
    throw new Error("Failed to parse PDF. Please ensure it's a valid tracking report.");
  }
}

export async function getBabyInsights(data: BabyData) {
  // Legacy function - insights removed from UI but kept for API compatibility if needed elsewhere
  return "";
}
