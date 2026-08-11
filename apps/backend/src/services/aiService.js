import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { searchProductByName, getCustomerHistoryByPhone, createQuotationForAI, getProductStock } from '../controllers/aiGatewayController.js';

// .env.local या .env.example से API Key लोड होगी
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the functions that the AI can call
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

// Map function names to actual controller functions
const availableFunctions = {
  searchProductByName,
  getCustomerHistoryByPhone,
  createQuotationForAI,
  getProductStock,
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools,
  systemInstruction: "You are a helpful AI assistant for a business. Your goal is to understand the customer's question and use the available tools to answer it. You can only use the functions provided to you. Do not make up information. Always reply in simple Hindi.",
});

export const callGeminiAI = async (userMessage, userPhone) => {
  const chat = model.startChat();
  const result = await chat.sendMessage(userMessage);
  const call = result.response.functionCalls()?.[0];

  if (call) {
    const { name, args } = call;
    const apiFunction = availableFunctions[name];

    if (apiFunction) {
      // Mock request and response objects for the controller
      const mockReq = { 
        query: { ...args, phone: args.phone || userPhone },
        body: { ...args }, // For POST requests like createQuotation
        companyId: process.env.DEFAULT_COMPANY_ID // Assuming a default company for AI operations
      };
      let apiResult;
      const mockRes = {
        status: () => mockRes,
        json: (data) => { apiResult = data; }
      };

      await apiFunction(mockReq, mockRes);

      // Send the API result back to the model
      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name,
            response: apiResult,
          },
        },
      ]);

      // Get the model's final natural language response
      return result2.response.text();
    } else {
      return "माफ़ कीजिए, मैं यह जानकारी नहीं ढूंढ पा रहा हूँ।";
    }
  }

  // If no function call was triggered, return the model's direct text response
  return result.response.text();
};