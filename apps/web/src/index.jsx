import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css";
import { webTheme } from "./styles/Webtheme"; // Import the theme
import { ThemeProvider } from "./contexts/ThemeContext"; // Assuming you have a ThemeContext

let container = document.getElementById("root");
if (!container) {
  container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(
  <ThemeProvider value={webTheme}> {/* Wrap App with ThemeProvider */}
    <App />
  </ThemeProvider>
);