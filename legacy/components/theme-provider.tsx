'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderContextType {
  theme?: string;
  setTheme: (theme: string) => void;
  resolvedTheme?: string;
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  attribute = 'class',
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  attribute?: string;
  [key: string]: any;
}) {
  const [theme, setThemeState] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      return getCookie('theme') || localStorage.getItem('theme') || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<string>(theme);

  const setTheme = React.useCallback((newTheme: string) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      
      const hostParts = window.location.hostname.split('.');
      if (hostParts.length === 1) {
        document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
      } else {
        for (let i = hostParts.length - 2; i >= 0; i--) {
          const domain = hostParts.slice(i).join('.');
          document.cookie = `theme=${newTheme}; path=/; max-age=31536000; domain=.${domain}`;
          if (document.cookie.indexOf(`theme=${newTheme}`) !== -1) {
            break;
          }
        }
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let finalTheme = theme;
    if (theme === 'system') {
      finalTheme = 'dark';
    }

    setResolvedTheme(finalTheme);
    root.classList.add(finalTheme);
  }, [theme]);


  // Sync across tabs
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Attempt real-time sync across subdomains via CookieStore API if supported
    let handleCookieChange: any;
    if ('cookieStore' in window) {
      handleCookieChange = (e: any) => {
        const themeCookie = e.changed?.find((c: any) => c.name === 'theme');
        if (themeCookie) {
          setThemeState(themeCookie.value);
        }
      };
      (window as any).cookieStore.addEventListener('change', handleCookieChange);
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if ('cookieStore' in window && handleCookieChange) {
        (window as any).cookieStore.removeEventListener('change', handleCookieChange);
      }
    };
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext);
  if (!context) {
    return {
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: () => {},
    };
  }
  return context;
}
