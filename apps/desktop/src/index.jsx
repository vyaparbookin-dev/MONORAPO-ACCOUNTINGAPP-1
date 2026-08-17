import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css";
import { webTheme } from "./styles/Webtheme"; // Import the theme
import { ThemeProvider } from "./contexts/ThemeContext"; // Assuming you have a ThemeContext

console.log("📱 Desktop App Starting...");

const container = document.getElementById("root");
if (!container) {
  console.error("❌ Root element not found!");
  throw new Error("Root element (#root) not found in HTML");
}

console.log("✅ Root element found:", container);

try {
  const root = createRoot(container);
  console.log("✅ React root created");
  
  root.render(
    <ThemeProvider value={webTheme}> {/* Wrap App with ThemeProvider */}
      <App />
    </ThemeProvider>
  );
  console.log("✅ App rendered successfully");
} catch (error) {
  console.error("❌ Failed to render app:", error);
  throw error;
}