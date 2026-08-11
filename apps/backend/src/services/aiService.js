import { GoogleGenerativeAI } from "@google/generative-ai";

// .env.local या .env.example से API Key लोड होगी
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are a helpful AI assistant for a business named 'Vyapar Sahayak'.
Your goal is to understand the customer's question and use the available tools to answer it.
You can only use the functions provided to you. Do not make up information.

Available tools:
1. searchProductByName(name: string): To find product price and stock.
2. getCustomerHistoryByPhone(phone: string): To find a customer's last purchase details.

Based on the user's message, decide which tool to use.
If you don't understand, just say "मैं आपका सवाल समझ नहीं पाया, क्या आप कृपया इसे दोबारा पूछ सकते हैं?".
Always reply in simple Hindi.
`;

export const callGeminiAI = async (userMessage, userPhone) => {
    // यह एक बहुत ही सरल उदाहरण है। असली कार्यान्वयन Gemini के "Function Calling" फीचर से होगा।
    // अभी के लिए, हम कीवर्ड के आधार पर काम करेंगे।

    const lowerMessage = userMessage.toLowerCase();

    // क्षमता 1: प्रोडक्ट की जानकारी
    if (lowerMessage.includes('rate') || lowerMessage.includes('price') || lowerMessage.includes('daam') || lowerMessage.includes('bhav')) {
        // उदाहरण: "Parle G का rate क्या है?" -> "Parle G" निकालना होगा
        // अभी के लिए हम मान लेते हैं कि प्रोडक्ट का नाम "Parle G" है
        const productName = "Parle G"; // TODO: मैसेज से प्रोडक्ट का नाम निकालें
        
        // अपने AI गेटवे को कॉल करें
        // नोट: यह एक इंटरनल API कॉल है, इसलिए आपको ऑथेंटिकेशन टोकन भी भेजना होगा
        const response = await fetch(`http://localhost:5001/api/ai-gateway/products/search?name=${encodeURIComponent(productName)}`, {
            headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}` } // आपको एक इंटरनल टोकन बनाना होगा
        });
        const result = await response.json();

        if (result.success) {
            return `हाँ, ${result.data.name} उपलब्ध है। इसकी कीमत ₹${result.data.price} है और हमारे पास ${result.data.stock} ${result.data.unit} स्टॉक में हैं।`;
        } else {
            return `माफ़ कीजिए, मुझे ${productName} नाम का कोई प्रोडक्ट नहीं मिला।`;
        }
    }

    // क्षमता 2: ग्राहक का इतिहास
    if (lowerMessage.includes('history') || lowerMessage.includes(' पिछला बिल') || lowerMessage.includes('last purchase')) {
        // यहाँ getCustomerHistoryByPhone API को कॉल करने का लॉजिक आएगा
    }

    return "मैं अभी सीख रहा हूँ। जल्द ही आपके सभी सवालों का जवाब दूँगा।";
};