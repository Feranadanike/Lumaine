import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  accentColor: string;
  font: string;
  setAccentColor: (color: string) => void;
  setFont: (font: string) => void;
  updateTheme: (color: string, font: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const accentColors = {
  rose: { primary: 'rose-400', hover: 'rose-500', bg: 'rose-50', text: 'rose-600', border: 'rose-200' },
  pink: { primary: 'pink-400', hover: 'pink-500', bg: 'pink-50', text: 'pink-600', border: 'pink-200' },
  purple: { primary: 'purple-400', hover: 'purple-500', bg: 'purple-50', text: 'purple-600', border: 'purple-200' },
  blue: { primary: 'blue-400', hover: 'blue-500', bg: 'blue-50', text: 'blue-600', border: 'blue-200' },
  cyan: { primary: 'cyan-400', hover: 'cyan-500', bg: 'cyan-50', text: 'cyan-600', border: 'cyan-200' },
  teal: { primary: 'teal-400', hover: 'teal-500', bg: 'teal-50', text: 'teal-600', border: 'teal-200' },
  green: { primary: 'green-400', hover: 'green-500', bg: 'green-50', text: 'green-600', border: 'green-200' },
  amber: { primary: 'amber-400', hover: 'amber-500', bg: 'amber-50', text: 'amber-600', border: 'amber-200' },
  emerald: { primary: 'emerald-400', hover: 'emerald-500', bg: 'emerald-50', text: 'emerald-600', border: 'emerald-200' },
  indigo: { primary: 'indigo-400', hover: 'indigo-500', bg: 'indigo-50', text: 'indigo-600', border: 'indigo-200' },
};

export const fonts = {
  sans: { name: 'Sans Serif', class: 'font-sans', style: 'system-ui, sans-serif' },
  serif: { name: 'Serif', class: 'font-serif', style: 'Georgia, serif' },
  mono: { name: 'Monospace', class: 'font-mono', style: 'ui-monospace, monospace' },
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { user } = useAuth();
  const [accentColor, setAccentColorState] = useState('purple');
  const [font, setFontState] = useState('sans');

  useEffect(() => {
    if (user) {
      loadUserTheme();
    } else {
      const savedColor = localStorage.getItem('accentColor');
      const savedFont = localStorage.getItem('font');
      if (savedColor && accentColors[savedColor as keyof typeof accentColors]) {
        setAccentColorState(savedColor);
      }
      if (savedFont && fonts[savedFont as keyof typeof fonts]) {
        setFontState(savedFont);
      }
    }
  }, [user]);

  useEffect(() => {
    const fontClass = fonts[font as keyof typeof fonts]?.class || 'font-sans';
    document.documentElement.className = fontClass;
  }, [font]);

  const loadUserTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('theme_color, theme_font')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.theme_color) setAccentColorState(data.theme_color);
        if (data.theme_font) setFontState(data.theme_font);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setAccentColor = (color: string) => {
    if (accentColors[color as keyof typeof accentColors]) {
      setAccentColorState(color);
      localStorage.setItem('accentColor', color);
    }
  };

  const setFont = (newFont: string) => {
    if (fonts[newFont as keyof typeof fonts]) {
      setFontState(newFont);
      localStorage.setItem('font', newFont);
    }
  };

  const updateTheme = async (color: string, newFont: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          theme_color: color,
          theme_font: newFont,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setAccentColor(color);
      setFont(newFont);
      console.log('Theme updated successfully:', { color, font: newFont });
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ accentColor, font, setAccentColor, setFont, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
