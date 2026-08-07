import JsBarcode from "jsbarcode";

export const generateBarcode = (text, elementId) => {
  try {
    JsBarcode(`#${elementId}`, text, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
    });
  } catch (err) {
    console.error("Barcode generation failed:", err);
  }
}