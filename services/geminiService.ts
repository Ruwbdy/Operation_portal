
import { GoogleGenAI, Type } from "@google/genai";
import { ResolvedIssue } from "../types";

export const analyzeOperationalHistory = async (history: ResolvedIssue[]) => {
  const apiKey = "AIzaSyCr1R8ANaU4GFi_RyRy6QFXJ0qW9YFS7dU";
  if (!apiKey) {
    return { summary: "AI Analysis offline: Missing operational API key.", suggestions: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const logSummary = history.slice(0, 10).map(h => 
    `[${h.timestamp}] ${h.label} for ${h.identifier}: ${h.status}`
  ).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Lead MTN Intelligent Network (IN) Architect. Review these latest operational logs:
      ${logSummary}

      Provide a JSON analysis of current network health and 3 technical suggestions for optimization based on these patterns.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "suggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI engine");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Heuristics Error:", error);
    return { 
      summary: "Autonomous analysis standby. Reviewing network logs manually recommended.", 
      suggestions: [
        "Check signaling node latencies", 
        "Verify SOAP API authentication project credentials", 
        "Audit latest batch job ZIP outputs"
      ] 
    };
  }
};
