import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ScreenType = 'welcome' | 'login' | 'register' | 'forgot-password' | 'home';

export type PetCategory = 'dog' | 'cat' | 'both';

export type AuthProviderType = 'email' | 'google' | 'apple' | 'whatsapp';

export interface User {
  id: string;
  name: string;
  email: string;
  petType?: PetCategory;
  petName?: string;
  points: number;
  avatarUrl?: string;
  authProvider?: AuthProviderType;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSocial: (provider: 'google' | 'apple' | 'whatsapp') => Promise<void>;
  register: (
    name: string,
    email: string,
    pass: string,
    petType?: PetCategory,
    petName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('welcome');

  const login = async (email: string, _pass: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 750));
    setIsLoading(false);

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido' };
    }

    const cleanName = email.split('@')[0];
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    const mockUser: User = {
      id: 'usr_' + Date.now(),
      name: formattedName,
      email: email,
      petType: 'dog',
      petName: 'Rocky',
      points: 120,
      authProvider: 'email',
      // Sin avatarUrl para que se genere la letra inicial
    };

    setUser(mockUser);
    setCurrentScreen('home');
    return { success: true };
  };

  const loginWithSocial = async (provider: 'google' | 'apple' | 'whatsapp') => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setIsLoading(false);

    let socialUser: User;

    switch (provider) {
      case 'google':
        socialUser = {
          id: 'usr_google_' + Date.now(),
          name: 'Carlos Mendoza',
          email: 'carlos.mendoza@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          authProvider: 'google',
          petType: 'dog',
          petName: 'Bruno',
          points: 250,
        };
        break;
      case 'apple':
        socialUser = {
          id: 'usr_apple_' + Date.now(),
          name: 'David Gómez',
          email: 'david.gomez@icloud.com',
          avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
          authProvider: 'apple',
          petType: 'both',
          petName: 'Bruno & Luna',
          points: 250,
        };
        break;
      case 'whatsapp':
        socialUser = {
          id: 'usr_wa_' + Date.now(),
          name: 'David Gómez',
          email: '+57 312 456 7890',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          authProvider: 'whatsapp',
          petType: 'cat',
          petName: 'Mía',
          points: 250,
        };
        break;
    }

    setUser(socialUser);
    setCurrentScreen('home');
  };

  const register = async (
    name: string,
    email: string,
    _pass: string,
    petType?: PetCategory,
    petName?: string
  ) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 850));
    setIsLoading(false);

    if (!name.trim()) {
      return { success: false, error: 'Ingresa tu nombre completo' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Ingresa un correo electrónico válido' };
    }

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      petType: petType || 'dog',
      petName: petName?.trim() || 'Tu Consentido',
      points: 250, // Bono de bienvenida por registro
      authProvider: 'email',
      // Sin avatarUrl para que se genere la letra inicial automáticamente
    };

    setUser(newUser);
    setCurrentScreen('home');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCurrentScreen('welcome');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currentScreen,
        setScreen: setCurrentScreen,
        login,
        loginWithSocial,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
