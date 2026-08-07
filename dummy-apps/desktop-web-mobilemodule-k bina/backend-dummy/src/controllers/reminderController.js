export const sendReminder = async (req, res) => {
  try {
    const { partyId, message, mobileNumber } = req.body;
    
    // यहाँ आप WhatsApp API, SMS (Twilio) या Email का कोड डाल सकते हैं
    console.log(`Reminder Sent to ${mobileNumber} with message: ${message}`);

    return res.status(200).json({ 
        success: true, 
        message: "Reminder sent successfully" 
    });
  } catch (error) {
    console.error("Reminder Error:", error);
    return res.status(500).json({ 
        success: false, 
        message: "Failed to send reminder" 
    });
  }
};
