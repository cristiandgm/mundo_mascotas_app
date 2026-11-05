import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ScreenType = 'welcome' | 'login' | 'register' | 'forgot-password' | 'home';

export type PetCategory = 'dog' | 'cat' | 'both';

export type AuthProviderType = 'email' | 'google' | 'apple' | 'whatsapp';

export interface CustomerOrderItem {
  name: string;
  quantity: number;
  price: number;
  sku: string;
}

export interface CustomerOrder {
  orderNumber: string;
  createdAt: string;
  financialStatus: 'pending' | 'paid';
  fulfillmentStatus: 'unfulfilled' | 'fulfilled';
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  items: CustomerOrderItem[];
}

export interface CustomerAddress {
  recipient: string;
  address1: string;
  address2?: string;
  locality?: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  verifiedCoverage?: boolean;
  deliveryZone?: string;
}

export interface CustomerBillingInfo {
  requiresInvoice: boolean;
  documentType: string;
  documentNumber: string;
  petNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  petType?: PetCategory;
  petName?: string;
  points: number;
  avatarUrl?: string;
  authProvider?: AuthProviderType;
  totalSpent?: number;
  ordersCount?: number;
  customerSince?: string;
  customerGroup?: string;
  marketingSubscriptions?: string[];
  storeCredit?: number;
  defaultAddress?: CustomerAddress;
  billingInfo?: CustomerBillingInfo;
  orders?: CustomerOrder[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSocial: (provider: 'google' | 'apple' | 'whatsapp') => Promise<void>;
  loginAsDemoCustomer: () => void;
  updateBillingInfo: (updates: Partial<CustomerBillingInfo>) => void;
  updatePetInfo: (petName: string, petType: PetCategory) => void;
  register: (
    name: string,
    email: string,
    pass: string,
    petType?: PetCategory,
    petName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Datos de cliente VIP Mundo Mascotas Colombia
export const DEFAULT_VIP_CUSTOMER: User = {
  id: 'mmc_8324',
  name: 'Alejandra Pinto',
  email: 'aleja-18-93@hotmail.com',
  phone: '+57 300 3918279',
  petType: 'dog',
  petName: 'Consentido',
  points: 870,
  authProvider: 'email',
  totalSpent: 8721100,
  ordersCount: 23,
  customerSince: 'Más de 1 año',
  customerGroup: 'Champions VIP',
  marketingSubscriptions: ['Correo electrónico', 'SMS'],
  storeCredit: 0,
  defaultAddress: {
    recipient: 'Alejandra P.',
    address1: 'Carrera 72 j # 38-36 sur',
    address2: 'Casa timbrar en el 4 piso',
    locality: 'Kennedy',
    city: 'Bogotá',
    province: 'Bogotá D.C.',
    country: 'Colombia',
    phone: '+57 300 3918279',
    verifiedCoverage: true,
    deliveryZone: 'Capellanía (Fontibón)',
  },
  billingInfo: {
    requiresInvoice: false,
    documentType: 'Cédula de Ciudadanía (CC)',
    documentNumber: '1030631037',
    petNotes: 'Línea Diamond Naturals & Taste of the Wild',
  },
  orders: [
    {
      orderNumber: '59547',
      createdAt: '4 de noviembre de 2026 · 6:47 p. m.',
      financialStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      total: 289000,
      shippingMethod: 'Domicilio - Bogotá',
      paymentMethod: 'Pago Contraentrega',
      items: [
        {
          name: 'DIAMOND NATURALS LAMB AND RICE 40 LB',
          quantity: 1,
          price: 289000,
          sku: '123',
        },
      ],
    },
    {
      orderNumber: '58756',
      createdAt: '5 de octubre de 2026 · 8:35 a. m.',
      financialStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      total: 611900,
      shippingMethod: 'Domicilio - Bogotá',
      paymentMethod: 'Pago Contraentrega',
      items: [
        {
          name: 'TASTE OF THE WILD HIGH PRAIRIE BISONTE Y VENADO 28 LB.',
          quantity: 1,
          price: 341300,
          sku: '9567',
        },
        {
          name: 'DIAMOND NATURALS LIGHT LAMB AND RICE 30 LB.',
          quantity: 1,
          price: 270600,
          sku: '1773',
        },
      ],
    },
    {
      orderNumber: '57886',
      createdAt: '4 de septiembre de 2026 · 8:49 p. m.',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      total: 289000,
      shippingMethod: 'Domicilio - Bogotá',
      paymentMethod: 'Pago Verificado',
      items: [
        {
          name: 'DIAMOND NATURALS LAMB AND RICE 40 LB.',
          quantity: 1,
          price: 289000,
          sku: '123',
        },
      ],
    },
    {
      orderNumber: '57173',
      createdAt: '11 de agosto de 2026 · 8:07 p. m.',
      financialStatus: 'pending',
      fulfillmentStatus: 'fulfilled',
      total: 289600,
      shippingMethod: 'Domicilio - Bogotá',
      paymentMethod: 'Pago Contraentrega',
      items: [
        {
          name: 'DIAMOND NATURALS SKIN & COAT 30 LB.',
          quantity: 1,
          price: 289600,
          sku: '9423',
        },
      ],
    },
    {
      orderNumber: '56352',
      createdAt: '15 de julio de 2026 · 9:14 p. m.',
      financialStatus: 'pending',
      fulfillmentStatus: 'fulfilled',
      total: 270600,
      shippingMethod: 'Domicilio - Bogotá',
      paymentMethod: 'Pago Contraentrega',
      items: [
        {
          name: 'DIAMOND NATURALS LIGHT LAMB AND RICE 30 LB.',
          quantity: 1,
          price: 270600,
          sku: '1773',
        },
      ],
    },
  ],
};

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

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.includes('aleja')) {
      setUser(DEFAULT_VIP_CUSTOMER);
      setCurrentScreen('home');
      return { success: true };
    }

    const cleanName = email.split('@')[0];
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    const mockUser: User = {
      ...DEFAULT_VIP_CUSTOMER,
      id: 'usr_' + Date.now(),
      name: formattedName,
      email: email.trim(),
      authProvider: 'email',
    };

    setUser(mockUser);
    setCurrentScreen('home');
    return { success: true };
  };

  const loginAsDemoCustomer = () => {
    setUser(DEFAULT_VIP_CUSTOMER);
    setCurrentScreen('home');
  };

  const loginWithSocial = async (provider: 'google' | 'apple' | 'whatsapp') => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setIsLoading(false);

    let socialUser: User;

    switch (provider) {
      case 'google':
        socialUser = {
          ...DEFAULT_VIP_CUSTOMER,
          id: 'usr_google_' + Date.now(),
          name: 'Carlos Mendoza',
          email: 'carlos.mendoza@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          authProvider: 'google',
          petType: 'dog',
          petName: 'Bruno',
          points: 450,
        };
        break;
      case 'apple':
        socialUser = {
          ...DEFAULT_VIP_CUSTOMER,
          id: 'usr_apple_' + Date.now(),
          name: 'David Gómez',
          email: 'david.gomez@icloud.com',
          avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
          authProvider: 'apple',
          petType: 'both',
          petName: 'Bruno & Luna',
          points: 870,
        };
        break;
      case 'whatsapp':
        socialUser = {
          ...DEFAULT_VIP_CUSTOMER,
          id: 'usr_wa_' + Date.now(),
          name: 'Alejandra Pinto',
          email: 'aleja-18-93@hotmail.com',
          phone: '+57 300 3918279',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          authProvider: 'whatsapp',
          petType: 'dog',
          petName: 'Max',
          points: 870,
        };
        break;
    }

    setUser(socialUser);
    setCurrentScreen('home');
  };

  const updateBillingInfo = (updates: Partial<CustomerBillingInfo>) => {
    setUser((prev) => {
      const baseUser = prev || DEFAULT_VIP_CUSTOMER;
      return {
        ...baseUser,
        billingInfo: {
          requiresInvoice: baseUser.billingInfo?.requiresInvoice ?? false,
          documentType: baseUser.billingInfo?.documentType ?? 'Cédula de Ciudadanía (CC)',
          documentNumber: baseUser.billingInfo?.documentNumber ?? '1030631037',
          ...updates,
        },
      };
    });
  };

  const updatePetInfo = (petName: string, petType: PetCategory) => {
    setUser((prev) => {
      const baseUser = prev || DEFAULT_VIP_CUSTOMER;
      return {
        ...baseUser,
        petName,
        petType,
      };
    });
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
      ...DEFAULT_VIP_CUSTOMER,
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      petType: petType || 'dog',
      petName: petName?.trim() || 'Tu Consentido',
      points: 250,
      ordersCount: 1,
      totalSpent: 289000,
      customerSince: 'Nuevo miembro VIP',
      customerGroup: 'Club Consentidos',
      authProvider: 'email',
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
        loginAsDemoCustomer,
        updateBillingInfo,
        updatePetInfo,
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
