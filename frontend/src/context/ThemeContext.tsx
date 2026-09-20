import React, { useState, useEffect, useCallback } from 'react';
import { ColorModeContext, type ColorMode } from './colorModeContext';

const STORAGE_KEY = 'merkeb-color-mode';

const getInitialMode = (): ColorMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'dark' || saved === 'light' ? saved : 'light';
};

interface ColorModeProviderProps {
  children: React.ReactNode;
}

export const ColorModeProvider = ({ children }: ColorModeProviderProps) => {
  const [mode, setMode] = useState<ColorMode>(getInitialMode);

  const setColorMode = useCallback((nextMode: ColorMode) => {
    setMode(nextMode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode, setColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
};