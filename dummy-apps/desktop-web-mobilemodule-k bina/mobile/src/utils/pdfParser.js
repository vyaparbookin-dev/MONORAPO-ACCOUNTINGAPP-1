import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const generatePDF = async (htmlContent, fileName = "Invoice.pdf") => {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri);
    console.log("PDF exported:", uri);
  } catch (error) {
    console.error("PDF Generation Error:", error);
  }
};