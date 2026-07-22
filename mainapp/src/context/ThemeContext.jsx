import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('loopers-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return false; // Light theme default
  });

  useEffect(() => {
    const root = document.documentElement;
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (isDarkMode) {
      root.classList.add('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#0F172A');
      localStorage.setItem('loopers-theme', 'dark');
    } else {
      root.classList.remove('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#40A2E3');
      localStorage.setItem('loopers-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
