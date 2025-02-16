import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function getGeminiResponse(prompt: string) {
  if (!prompt?.trim()) {
    return "I didn't receive any message. Please try again.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(prompt);
    if (!result?.response) {
      throw new Error("No response from Gemini");
    }
    
    const response = await result.response;
    const text = response.text();
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    
    return text;
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
}
