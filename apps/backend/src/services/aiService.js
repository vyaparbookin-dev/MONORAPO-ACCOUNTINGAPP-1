import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { searchProductByName, getCustomerHistoryByPhone, createQuotationForAI, getProductStock } from '../controllers/aiGatewayController.js';

const tools = [
  {
    functionDeclarations: [
      {
        name: "searchProductByName",
        description: "Get the price and stock of a product by its name.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "The name of the product to search for." },
          },
          required: ["name"],
        },
      },
      {
        name: "getCustomerHistoryByPhone",
        description: "Get the last purchase details for a customer using their phone number.",
        parameters: {
          type: "OBJECT",
          properties: {
            phone: { type: "STRING", description: "The customer's phone number, including country code." },
          },
          required: ["phone"],
        },
      },
      {
        name: "createQuotationForAI",
        description: "Create a quotation for a customer with a list of items.",
        parameters: {
          type: "OBJECT",
          properties: {
            items: { type: "ARRAY", description: "An array of items, each with a name and quantity.", items: { type: "OBJECT", properties: { name: { type: "STRING" }, quantity: { type: "NUMBER" } } } },
          },
          required: ["items"],
        },
      },
      {
        name: "getProductStock",
        description: "Check the available stock for a specific product.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "The name of the product to check stock for." },
          },
          required: ["name"],
        },
      },
    ],
  },
];

const availableFunctions = {
  searchProductByName,
  getCustomerHistoryByPhone,
  createQuotationForAI,
  getProductStock,
};

// Dual AI Dispatcher: OpenAI (gpt-4o-mini) + Google Gemini (2.5/2.0 Flash)
export const callGeminiAI = async (userMessage, userPhone, options = {}) => {
  const openAiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
  const geminiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;

  // 1. Try OpenAI GPT-4o Mini
  if (openAiKey) {
    try {
      const systemPrompt = "You are a helpful AI assistant for VyaparBook business. Answer customer queries about products, rates, stock, and bills. Always reply in simple and polite Hindi.";
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          max_tokens: 500
        },
        {
          headers: {
            "Authorization": `Bearer ${openAiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );
      return res.data?.choices?.[0]?.message?.content || "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?";
    } catch (openAiErr) {
      console.warn("OpenAI aiService error:", openAiErr.message);
    }
  }

  // 2. Try Google Gemini with modern model cascade
  if (geminiKey) {
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
    const genAI = new GoogleGenerativeAI(geminiKey);

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools,
          systemInstruction: "You are a helpful AI assistant for a business. Your goal is to understand the customer's question and use the available tools to answer it. Always reply in simple Hindi.",
        });

        const chat = model.startChat();
        const result = await chat.sendMessage(userMessage);
        const call = result.response.functionCalls()?.[0];

        if (call) {
          const { name, args } = call;
          const apiFunction = availableFunctions[name];

          if (apiFunction) {
            const mockReq = { 
              query: { ...args, phone: args.phone || userPhone },
              body: { ...args },
              companyId: process.env.DEFAULT_COMPANY_ID
            };
            let apiResult;
            const mockRes = {
              status: () => mockRes,
              json: (data) => { apiResult = data; }
            };

            await apiFunction(mockReq, mockRes);

            const result2 = await chat.sendMessage([
              {
                functionResponse: {
                  name,
                  response: apiResult,
                },
              },
            ]);

            return result2.response.text();
          }
        }

        return result.response.text();
      } catch (err) {
        console.warn(`aiService model ${modelName} error, trying next:`, err.message);
      }
    }
  }

  return "नमस्ते! मैं आपका व्यापार सहायक हूँ। आपकी क्या मदद करूँ?";
};
