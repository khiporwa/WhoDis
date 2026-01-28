import { GoogleGenAI } from "@google/genai";

export async function getIcebreakerPrompt(interests: string[]): Promise<string> {
  const interestsStr = interests.length > 0 ? `Interests: ${interests.join(', ')}` : 'No specific interests.';
  
  try {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure up-to-date configuration.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a fun, short, and non-intrusive icebreaker question for two strangers meeting online. 
                 Context: ${interestsStr}.
                 Keep it under 15 words. Just the question, no intro.`,
      config: {
        temperature: 0.9,
        topP: 0.8,
        // Fix: When setting maxOutputTokens, a thinkingBudget must be specified to reserve tokens for output.
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 50 }
      }
    });

    // Fix: Access the text directly via the .text property (getter).
    return response.text || "What's the best thing that happened to you today?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "What's your favorite hobby?";
  }
}