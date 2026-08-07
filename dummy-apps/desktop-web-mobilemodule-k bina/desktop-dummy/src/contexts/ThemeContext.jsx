import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ThemeContext.Provider;
export const useTheme = () => useContext(ThemeContext);