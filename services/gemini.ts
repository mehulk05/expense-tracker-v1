
import { GoogleGenAI } from "@google/genai";
import { Expense, Account, Category } from "../types";

export const getSpendingInsights = async (
  expenses: Expense[],
  accounts: Account[],
  categories: Category[]
): Promise<string> => {
  if (expenses.length === 0) return "Add some expenses to get AI insights!";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a summary for Gemini
  const summary = expenses.map(e => ({
    amount: e.amount,
    date: e.date,
    category: categories.find(c => c.id === e.categoryId)?.name,
    subCategory: e.subCategory,
    account: accounts.find(a => a.id === e.accountId)?.name,
    desc: e.description
  }));

  const prompt = `
    Analyze these expenses for me and provide 3 actionable pieces of advice to save money or manage better.
    Keep it concise and professional.
    
    Data: ${JSON.stringify(summary.slice(0, 50))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional financial advisor. Analyze the given spending data and provide short, impactful, actionable financial advice. Focus on patterns and potential savings.",
      }
    });
    return response.text || "I couldn't generate insights at this moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble analyzing your data right now. Please try again in a moment.";
  }
};
