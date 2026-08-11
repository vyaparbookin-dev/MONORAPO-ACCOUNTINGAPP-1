import { callGeminiAI } from '../services/aiService.js'; // यह एक नई सर्विस होगी

export const handleIncomingMessage = async (req, res) => {
  // Twilio से आने वाले मैसेज का फॉर्मेट
  const incomingMsg = req.body.Body; // ग्राहक का मैसेज
  const from = req.body.From; // ग्राहक का व्हाट्सएप नंबर (e.g., whatsapp:+911234567890)

  console.log(`Received WhatsApp message from ${from}: "${incomingMsg}"`);

  try {
    // 1. ग्राहक के मैसेज को AI सर्विस को भेजें
    const aiResponse = await callGeminiAI(incomingMsg, from);

    // 2. AI से मिले जवाब को Twilio को XML फॉर्मेट में वापस भेजें
    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${aiResponse}</Message></Response>`);

  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    // अगर कोई एरर आता है तो ग्राहक को एक सामान्य मैसेज भेजें
    res.status(500).send('<Response><Message>माफ़ कीजिए, अभी कुछ तकनीकी समस्या है।</Message></Response>');
  }
};

// यह फंक्शन Twilio के डैशबोर्ड में Webhook URL को वेरीफाई करने के लिए है
export const verifyWebhook = (req, res) => {
    res.status(200).send('Webhook Verified');
};