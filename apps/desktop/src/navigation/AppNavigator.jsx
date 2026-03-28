import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WebRoutes from "./WebRoutes";

const AppNavigator = () => {
  return (
    <BrowserRouter>
      <WebRoutes />
    </BrowserRouter>
  );
};

export default AppNavigator;