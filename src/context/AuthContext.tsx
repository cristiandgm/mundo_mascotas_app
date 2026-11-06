import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ScreenType = 'welcome' | 'login' | 'register' | 'forgot-password' | 'home';

export type AuthModalView = 'login' | 'register' | 'forgot-password';

export type PetCategory = 'dog' | 'cat' | 'both';

export type AuthProviderType = 'email' | 'google' | 'apple' | 'whatsapp';

export type AddressLabelType = 'Casa' | 'Oficina' | 'Finca' | 'Familiar' | 'Otro';

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
  id: string;
  label: AddressLabelType;
  recipient: string;
  address1: string;
  address2?: string;
  locality?: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  isBogota: boolean;
  isDefault?: boolean;
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
  addresses?: CustomerAddress[];
  billingInfo?: CustomerBillingInfo;
  orders?: CustomerOrder[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress;
  selectAddress: (addressId: string) => void;
  addAddress: (newAddr: Omit<CustomerAddress, 'id'>) => CustomerAddress;
  deleteAddress: (addressId: string) => void;
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

// Direcciones guardadas reales de ejemplo para Mundo Mascotas Colombia
export const INITIAL_SAVED_ADDRESSES: CustomerAddress[] = [
  {
    id: 'addr_casa_bog',
    label: 'Casa',
    recipient: 'Alejandra P.',
    address1: 'Carrera 72 j # 38-36 sur',
    address2: 'Casa timbrar en el 4 piso',
    locality: 'Kennedy',
    city: 'Bogotá',
    province: 'Bogotá D.C.',
    country: 'Colombia',
    phone: '+57 300 3918279',
    isBogota: true,
    isDefault: true,
    verifiedCoverage: true,
    deliveryZone: 'Kennedy / Sur-Occidente (Bogotá)',
  },
  {
    id: 'addr_oficina_bog',
    label: 'Oficina',
    recipient: 'Alejandra Pinto (Recepción)',
    address1: 'Av. Calle 26 # 69-76',
    address2: 'Edificio Elemento Torre 2 · Dejar en portería',
    locality: 'Capellanía (Fontibón)',
    city: 'Bogotá',
    province: 'Bogotá D.C.',
    country: 'Colombia',
    phone: '+57 300 3918279',
    isBogota: true,
    isDefault: false,
    verifiedCoverage: true,
    deliveryZone: 'Capellanía (Fontibón)',
  },
  {
    id: 'addr_finca_chia',
    label: 'Finca',
    recipient: 'Familia Pinto',
    address1: 'Km 4 Vía Chía - Cajicá',
    address2: 'Condominio San Jacinto · Casa 14',
    locality: 'Sabana Centro',
    city: 'Chía',
    province: 'Cundinamarca',
    country: 'Colombia',
    phone: '+57 300 3918279',
    isBogota: false,
    isDefault: false,
    verifiedCoverage: true,
    deliveryZone: 'Despacho por Transportadora Nacional',
  },
];

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
  defaultAddress: INITIAL_SAVED_ADDRESSES[0],
  addresses: INITIAL_SAVED_ADDRESSES,
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
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(true);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');

  // Lista de direcciones activas (disponibles tanto para cliente autenticado como invitado)
  const [addresses, setAddresses] = useState<CustomerAddress[]>(INITIAL_SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    INITIAL_SAVED_ADDRESSES[0].id
  );

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const selectAddress = (addressId: string) => {
    const found = addresses.find((a) => a.id === addressId);
    if (!found) return;
    setSelectedAddressId(addressId);
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      }))
    );
    if (user) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              defaultAddress: { ...found, isDefault: true },
            }
          : prev
      );
    }
  };

  const addAddress = (newAddr: Omit<CustomerAddress, 'id'>): CustomerAddress => {
    const created: CustomerAddress = {
      ...newAddr,
      id: 'addr_' + Date.now(),
      isDefault: true,
    };

    setAddresses((prev) => [
      created,
      ...prev.map((a) => ({ ...a, isDefault: false })),
    ]);
    setSelectedAddressId(created.id);

    if (user) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              defaultAddress: created,
              addresses: [created, ...(prev.addresses || [])],
            }
          : prev
      );
    }

    return created;
  };

  const deleteAddress = (addressId: string) => {
    if (addresses.length <= 1) return; // Siempre mantener al menos 1 dirección
    const remaining = addresses.filter((a) => a.id !== addressId);
    setAddresses(remaining);
    if (selectedAddressId === addressId) {
      const next = remaining[0];
      setSelectedAddressId(next.id);
      if (user) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                defaultAddress: next,
                addresses: remaining,
              }
            : prev
        );
      }
    }
  };

  const openAuthModal = (view: AuthModalView = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setCurrentScreen('home');
  };

  const handleSetScreen = (screen: ScreenType) => {
    if (screen === 'login' || screen === 'register' || screen === 'forgot-password') {
      setAuthModalView(screen);
      setIsAuthModalOpen(true);
    } else if (screen === 'home') {
      setIsAuthModalOpen(false);
      setCurrentScreen('home');
    } else {
      setAuthModalView('login');
      setIsAuthModalOpen(true);
    }
  };

  const login = async (email: string, _pass: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 750));
    setIsLoading(false);

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.includes('aleja')) {
      setUser({
        ...DEFAULT_VIP_CUSTOMER,
        defaultAddress: selectedAddress,
        addresses,
      });
      setIsAuthModalOpen(false);
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
      defaultAddress: selectedAddress,
      addresses,
    };

    setUser(mockUser);
    setIsAuthModalOpen(false);
    setCurrentScreen('home');
    return { success: true };
  };

  const loginAsDemoCustomer = () => {
    setUser({
      ...DEFAULT_VIP_CUSTOMER,
      defaultAddress: selectedAddress,
      addresses,
    });
    setIsAuthModalOpen(false);
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
          defaultAddress: selectedAddress,
          addresses,
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
          defaultAddress: selectedAddress,
          addresses,
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
          defaultAddress: selectedAddress,
          addresses,
        };
        break;
    }

    setUser(socialUser);
    setIsAuthModalOpen(false);
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
      defaultAddress: selectedAddress,
      addresses,
    };

    setUser(newUser);
    setIsAuthModalOpen(false);
    setCurrentScreen('home');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setAuthModalView('login');
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currentScreen,
        setScreen: handleSetScreen,
        isAuthModalOpen,
        authModalView,
        openAuthModal,
        closeAuthModal,
        addresses,
        selectedAddress,
        selectAddress,
        addAddress,
        deleteAddress,
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
