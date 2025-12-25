
import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Account, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSpendingInsights = async (
  expenses: Expense[],
  accounts: Account[],
  categories: Category[]
): Promise<string> => {
  if (expenses.length === 0) return "Add some expenses to get AI insights!";

  const summary = expenses.map(e => ({
    amount: e.amount,
    date: e.date,
    category: categories.find(c => c.id === e.categoryId)?.name,
    subCategory: e.subCategory,
    desc: e.description
  }));

  const prompt = `
    Analyze these expenses. Provide:
    1. Anomaly Detection: Flag any unusual spending spikes.
    2. Predictive Spending: Forecast where the user will end the month based on current velocity.
    3. Actionable Advice: 2 specific tips to save money.
    
    Current Month Velocity Context: ${expenses.length} transactions totaling ₹${expenses.reduce((s, e) => s + e.amount, 0)}.
    Data: ${JSON.stringify(summary.slice(0, 40))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an elite financial analyst. Provide data-driven, concise, and professional insights. Focus on anomalies and predictions.",
      }
    });
    return response.text || "I couldn't generate insights at this moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insights.";
  }
};

export const parseNaturalLanguageExpense = async (
  text: string,
  accounts: Account[],
  categories: Category[]
): Promise<Partial<Expense> | null> => {
  const prompt = `
    Extract expense details from this text: "${text}"
    Available Accounts: ${accounts.map(a => `${a.name} (ID: ${a.id})`).join(', ')}
    Available Categories: ${categories.map(c => `${c.name} (ID: ${c.id}) subcategories: ${c.subCategories.join(', ')}`).join(' | ')}
    
    Current Date: ${new Date().toISOString().split('T')[0]}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            accountId: { type: Type.STRING },
            categoryId: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["amount", "categoryId", "accountId"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Parsing error:", error);
    return null;
  }
};
