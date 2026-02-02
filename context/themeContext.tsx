

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [isDark, setIsDark] = useState(true); // Default to dark theme

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@proxi_theme');
        if (savedTheme !== null) {
          const dark = savedTheme === 'dark';
          setIsDark(dark);
          setColorScheme(dark ? 'dark' : 'light');
        } else {
          // Default to dark theme
          setIsDark(true);
          setColorScheme('dark');
        }
      } catch (e) {
        console.warn('Failed to load theme:', e);
        setColorScheme('dark');
      }
    };

    loadTheme();
  }, [setColorScheme]);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      setColorScheme(newTheme ? 'dark' : 'light');
      await AsyncStorage.setItem('@proxi_theme', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
