import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { CustomerProfileSheet } from '../components/CustomerProfileSheet';
import { CustomerOrdersSheet } from '../components/CustomerOrdersSheet';
import { AddressSelectorSheet } from '../components/AddressSelectorSheet';
import { InboxModal } from '../components/InboxModal';
import { BrandDnaModal, FoodBrandName } from '../components/BrandDnaModal';
import { ConsenticoinsWalletModal } from '../components/ConsenticoinsWalletModal';
import {
  useAuth,
  COIN_VALUE_COP,
  PetStageType,
  PetActivityType,
  PetSensitivityType,
} from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

type DeliveryZoneType = 'bogota' | 'nacional';
type TopServiceTabType = 'bultos' | 'snacks';
type SearchCategoryType =
  | 'concentrados'
  | 'humedo'
  | 'snacks'
  | 'medicamentos'
  | 'todo';
type MainTopTabType = 'store' | 'quiz' | 'pets';
type BottomNavTab = 'home' | 'catalog' | 'activity' | 'account';

interface ProductBag {
  id: string;
  sku: string;
  brand:
    | 'Diamond Naturals'
    | 'Taste of the Wild'
    | 'Acana'
    | 'Orijen'
    | 'Salud Vet';
  name: string;
  protein: string;
  weightLb: number;
  unitLabel?: string;
  price: number;
  coins: number;
  petType: 'dog' | 'cat';
  category: TopServiceTabType;
  subFilter?: 'humedos' | 'premios' | 'higiene' | 'medicamentos';
  stage: string;
  tag?: string;
  accentColor: string;
}

const SEARCH_CATEGORY_OPTIONS: {
  id: SearchCategoryType;
  label: string;
  shortLabel: string;
  subtitle: string;
  emoji: string;
  placeholderNoun: string;
}[] = [
  {
    id: 'concentrados',
    label: 'Concentrados',
    shortLabel: 'Concentrados',
    subtitle: 'Bultos Super Premium',
    emoji: '🥩',
    placeholderNoun: 'concentrado',
  },
  {
    id: 'humedo',
    label: 'Alimento Húmedo',
    shortLabel: 'Húmedo',
    subtitle: 'Latas y estofados en salsa',
    emoji: '🥫',
    placeholderNoun: 'alimento húmedo',
  },
  {
    id: 'snacks',
    label: 'Snacks',
    shortLabel: 'Snacks',
    subtitle: 'Premios, galletas y liofilizados',
    emoji: '🦴',
    placeholderNoun: 'snack o premio',
  },
  {
    id: 'medicamentos',
    label: 'Medicamentos',
    shortLabel: 'Medicamentos',
    subtitle: 'Antipulgas, desparasitantes y salud',
    emoji: '💊',
    placeholderNoun: 'medicamento',
  },
  {
    id: 'todo',
    label: 'Ver todo el catálogo',
    shortLabel: 'Todo',
    subtitle: 'Concentrados, húmedos, snacks y salud',
    emoji: '✨',
    placeholderNoun: 'producto',
  },
];

const CATALOG_BAGS: ProductBag[] = [
  // ==================== PERROS: BULTOS DE CONCENTRADO ====================
  {
    id: 'prod_123',
    sku: '123',
    brand: 'Diamond Naturals',
    name: 'Diamond Naturals Lamb & Rice',
    protein: 'Cordero Real y Arroz Integral',
    weightLb: 40,
    price: 289000,
    coins: 289,
    petType: 'dog',
    category: 'bultos',
    stage: 'Adulto',
    tag: 'Más pedido',
    accentColor: '#D4AF37',
  },
  {
    id: 'prod_1773',
    sku: '1773',
    brand: 'Diamond Naturals',
    name: 'Diamond Naturals Light Lamb & Rice',
    protein: 'Cordero Bajo en Calorías · Control Peso',
    weightLb: 30,
    price: 270600,
    coins: 270,
    petType: 'dog',
    category: 'bultos',
    stage: 'Adulto Light',
    tag: 'Control Peso',
    accentColor: '#38BDF8',
  },
  {
    id: 'prod_9423',
    sku: '9423',
    brand: 'Diamond Naturals',
    name: 'Diamond Naturals Skin & Coat',
    protein: 'Salmón Salvaje · Piel y Pelaje Brillante',
    weightLb: 30,
    price: 289600,
    coins: 290,
    petType: 'dog',
    category: 'bultos',
    stage: 'Todas las etapas',
    tag: 'Piel y Pelaje',
    accentColor: '#EC4899',
  },
  {
    id: 'prod_9567',
    sku: '9567',
    brand: 'Taste of the Wild',
    name: 'Taste of the Wild High Prairie',
    protein: 'Bisonte Asado y Venado · Libre de Granos',
    weightLb: 28,
    price: 341300,
    coins: 341,
    petType: 'dog',
    category: 'bultos',
    stage: 'Adulto',
    tag: 'Super Premium',
    accentColor: '#F59E0B',
  },
  {
    id: 'prod_9571',
    sku: '9571',
    brand: 'Taste of the Wild',
    name: 'Taste of the Wild High Prairie Puppy',
    protein: 'Bisonte y Venado · Fórmula Cachorros',
    weightLb: 28,
    price: 354500,
    coins: 355,
    petType: 'dog',
    category: 'bultos',
    stage: 'Cachorro',
    tag: 'Cachorros',
    accentColor: '#10B981',
  },
  {
    id: 'prod_9573',
    sku: '9573',
    brand: 'Taste of the Wild',
    name: 'Taste of the Wild Pacific Stream',
    protein: 'Salmón Ahumado · Libre de Granos',
    weightLb: 28,
    price: 354500,
    coins: 355,
    petType: 'dog',
    category: 'bultos',
    stage: 'Adulto',
    accentColor: '#06B6D4',
  },
  {
    id: 'prod_8812',
    sku: '8812',
    brand: 'Acana',
    name: 'Acana Wild Prairie Recipe',
    protein: 'Pollo Fresco, Pavo y Huevos de Nido',
    weightLb: 25,
    price: 389000,
    coins: 389,
    petType: 'dog',
    category: 'bultos',
    stage: 'Todas las etapas',
    tag: '70% Proteína',
    accentColor: '#8B5CF6',
  },
  {
    id: 'prod_7710',
    sku: '7710',
    brand: 'Orijen',
    name: 'Orijen Original Biológico',
    protein: 'Pollo y Pavo de Corral + Pescado Salvaje',
    weightLb: 25,
    price: 435000,
    coins: 435,
    petType: 'dog',
    category: 'bultos',
    stage: 'Adulto',
    tag: 'Ultra Luxury',
    accentColor: '#EF4444',
  },

  // ==================== PERROS: ALIMENTO HÚMEDO, SNACKS & MEDICAMENTOS ====================
  {
    id: 'prod_dog_snack_1',
    sku: '4401',
    brand: 'Taste of the Wild',
    name: 'Latas Húmedas High Prairie (Pack x6)',
    protein: 'Estofado de Bisonte y Venado en Salsa',
    weightLb: 5,
    unitLabel: 'Pack x6 Latas',
    price: 84000,
    coins: 84,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'humedos',
    stage: 'Húmedo Gourmet',
    tag: 'Pack Ahorro',
    accentColor: '#F59E0B',
  },
  {
    id: 'prod_dog_wet_2',
    sku: '4405',
    brand: 'Taste of the Wild',
    name: 'Latas Húmedas Pacific Stream Salmón (Pack x6)',
    protein: 'Salmón Ahumado y Pescado Blanco en Salsa',
    weightLb: 5,
    unitLabel: 'Pack x6 Latas',
    price: 86000,
    coins: 86,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'humedos',
    stage: 'Piel y Pelaje',
    tag: 'Omega 3 & 6',
    accentColor: '#06B6D4',
  },
  {
    id: 'prod_dog_wet_3',
    sku: '4406',
    brand: 'Diamond Naturals',
    name: 'Estofado Húmedo Cordero & Arroz (Pack x6)',
    protein: 'Trozos de Cordero Real en Caldo Nutritivo',
    weightLb: 5,
    unitLabel: 'Pack x6 Latas',
    price: 74000,
    coins: 74,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'humedos',
    stage: 'Digestión Suave',
    accentColor: '#D4AF37',
  },
  {
    id: 'prod_dog_snack_2',
    sku: '4402',
    brand: 'Orijen',
    name: 'Orijen Original Freeze-Dried Treats',
    protein: 'Premios Liofilizados 100% Carne de Corral',
    weightLb: 1,
    unitLabel: 'Bolsa 92g',
    price: 68500,
    coins: 69,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'premios',
    stage: 'Premios Entrenamiento',
    tag: '100% Carne',
    accentColor: '#EF4444',
  },
  {
    id: 'prod_dog_snack_3',
    sku: '4403',
    brand: 'Diamond Naturals',
    name: 'Galletas Horneadas Cordero & Manzana',
    protein: 'Premios Crujientes para Salud Dental',
    weightLb: 2,
    unitLabel: '2 LB',
    price: 49000,
    coins: 49,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'premios',
    stage: 'Salud Dental',
    accentColor: '#D4AF37',
  },
  {
    id: 'prod_dog_snack_4',
    sku: '4407',
    brand: 'Acana',
    name: 'Acana Crunchy Biscuits Hígado de Res',
    protein: 'Bocados Proteicos con Camote y Caldo de Hueso',
    weightLb: 1,
    unitLabel: 'Bolsa 280g',
    price: 54000,
    coins: 54,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'premios',
    stage: 'Premio Proteico',
    accentColor: '#8B5CF6',
  },
  {
    id: 'prod_dog_med_1',
    sku: '7101',
    brand: 'Salud Vet',
    name: 'Bravecto Masticable 12 Semanas Perros',
    protein: 'Protección Total Pulgas, Garrapatas y Ácaros',
    weightLb: 1,
    unitLabel: '1 Tableta · 90 Días',
    price: 142000,
    coins: 142,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'medicamentos',
    stage: 'Antipulgas 12 Semanas',
    tag: 'Más recetado',
    accentColor: '#38BDF8',
  },
  {
    id: 'prod_dog_med_2',
    sku: '7102',
    brand: 'Salud Vet',
    name: 'NexGard Spectra Antipulgas + Desparasitante',
    protein: 'Bocado Masticable Sabor Carne · Control Interno y Externo',
    weightLb: 1,
    unitLabel: 'Tableta Mensual',
    price: 78000,
    coins: 78,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'medicamentos',
    stage: 'Doble Acción',
    accentColor: '#10B981',
  },
  {
    id: 'prod_dog_med_3',
    sku: '7103',
    brand: 'Salud Vet',
    name: 'Condroprotector Articular Glucosamina & MSM',
    protein: 'Regenerador de Cartílago y Movilidad Canina',
    weightLb: 1,
    unitLabel: 'Frasco x60 Tabs',
    price: 96000,
    coins: 96,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'medicamentos',
    stage: 'Salud Articular',
    accentColor: '#F59E0B',
  },
  {
    id: 'prod_dog_care_1',
    sku: '4404',
    brand: 'Acana',
    name: 'Kit Dermo-Cuidado Avena & Aloe Canino',
    protein: 'Shampoo Hipoalergénico + Bálsamo de Huellas',
    weightLb: 2,
    unitLabel: 'Kit 500ml',
    price: 76000,
    coins: 76,
    petType: 'dog',
    category: 'snacks',
    subFilter: 'higiene',
    stage: 'Cuidado & Baño',
    accentColor: '#10B981',
  },

  // ==================== GATOS: BULTOS DE CONCENTRADO FELINO ====================
  {
    id: 'prod_9580',
    sku: '9580',
    brand: 'Taste of the Wild',
    name: 'Taste of the Wild Rocky Mountain Cat',
    protein: 'Venado Asado y Salmón Ahumado · Sin Granos',
    weightLb: 14,
    price: 218000,
    coins: 218,
    petType: 'cat',
    category: 'bultos',
    stage: 'Gatos y Gatitos',
    tag: 'Top Gatos',
    accentColor: '#F59E0B',
  },
  {
    id: 'prod_9582',
    sku: '9582',
    brand: 'Taste of the Wild',
    name: 'Taste of the Wild Canyon River Feline',
    protein: 'Trucha de Manantial y Salmón Ahumado',
    weightLb: 14,
    price: 224000,
    coins: 224,
    petType: 'cat',
    category: 'bultos',
    stage: 'Piel y Pelaje Felino',
    accentColor: '#06B6D4',
  },
  {
    id: 'prod_1910',
    sku: '1910',
    brand: 'Diamond Naturals',
    name: 'Diamond Naturals Indoor Cat Hairball',
    protein: 'Pollo Fresco y Salmón · Control Bolas de Pelo',
    weightLb: 18,
    price: 189000,
    coins: 189,
    petType: 'cat',
    category: 'bultos',
    stage: 'Gatos de Interior',
    tag: 'Control Pelaje',
    accentColor: '#D4AF37',
  },
  {
    id: 'prod_8845',
    sku: '8845',
    brand: 'Acana',
    name: 'Acana Bountiful Catch Cat',
    protein: 'Salmón Salvaje, Arenque y Merluza',
    weightLb: 10,
    price: 245000,
    coins: 245,
    petType: 'cat',
    category: 'bultos',
    stage: 'Gatos Adultos',
    tag: 'Salmón & Arenque',
    accentColor: '#8B5CF6',
  },
  {
    id: 'prod_7790',
    sku: '7790',
    brand: 'Orijen',
    name: 'Orijen Cat & Kitten Biológico',
    protein: '90% Pollo, Pavo y Pescado Salvaje Fresco',
    weightLb: 12,
    price: 315000,
    coins: 315,
    petType: 'cat',
    category: 'bultos',
    stage: 'Todas las etapas',
    tag: 'Ultra Luxury',
    accentColor: '#EF4444',
  },

  // ==================== GATOS: ALIMENTO HÚMEDO, SNACKS, MEDICAMENTOS & ARENA ====================
  {
    id: 'prod_cat_snack_1',
    sku: '5501',
    brand: 'Taste of the Wild',
    name: 'Latas Felinas Rocky Mountain (Pack x6)',
    protein: 'Salmón y Venado en Salsa Húmeda Hidratante',
    weightLb: 3,
    unitLabel: 'Pack x6 Latas',
    price: 79000,
    coins: 79,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'humedos',
    stage: 'Hidratación Renal',
    tag: 'Más pedido',
    accentColor: '#F59E0B',
  },
  {
    id: 'prod_cat_wet_2',
    sku: '5504',
    brand: 'Taste of the Wild',
    name: 'Latas Felinas Canyon River Trucha (Pack x6)',
    protein: 'Trucha y Salmón en Caldo Hidratante Urinario',
    weightLb: 3,
    unitLabel: 'Pack x6 Latas',
    price: 82000,
    coins: 82,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'humedos',
    stage: 'Cuidado Urinario',
    accentColor: '#06B6D4',
  },
  {
    id: 'prod_cat_wet_3',
    sku: '5505',
    brand: 'Acana',
    name: 'Paté Húmedo Acana Salmón & Pollo (Pack x6)',
    protein: '85% Ingredientes Animales en Caldo de Hueso',
    weightLb: 3,
    unitLabel: 'Pack x6 Latas',
    price: 89000,
    coins: 89,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'humedos',
    stage: 'Gourmet Sin Granos',
    accentColor: '#8B5CF6',
  },
  {
    id: 'prod_cat_snack_2',
    sku: '5502',
    brand: 'Orijen',
    name: 'Orijen Six Fish Cat Treats Liofilizados',
    protein: '100% Pescado Salvaje · Cero Carbohidratos',
    weightLb: 1,
    unitLabel: 'Bolsa 35g',
    price: 58000,
    coins: 58,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'premios',
    stage: 'Premio Gourmet',
    accentColor: '#EF4444',
  },
  {
    id: 'prod_cat_snack_3',
    sku: '5506',
    brand: 'Diamond Naturals',
    name: 'Snacks Cremosos Hidratantes Salmón & Atún (x12)',
    protein: 'Tubitos Cremosos Altos en Humedad y Taurina',
    weightLb: 1,
    unitLabel: 'Pack x12 Tubos',
    price: 46000,
    coins: 46,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'premios',
    stage: 'Snack Hidratante',
    accentColor: '#D4AF37',
  },
  {
    id: 'prod_cat_med_1',
    sku: '7201',
    brand: 'Salud Vet',
    name: 'Bravecto Plus Pipeta Felina 12 Semanas',
    protein: 'Antipulgas, Garrapatas y Parásitos Internos Tópico',
    weightLb: 1,
    unitLabel: '1 Pipeta · 90 Días',
    price: 138000,
    coins: 138,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'medicamentos',
    stage: 'Protección 12 Semanas',
    tag: 'Sin estrés oral',
    accentColor: '#38BDF8',
  },
  {
    id: 'prod_cat_med_2',
    sku: '7202',
    brand: 'Salud Vet',
    name: 'Revolution Plus Pipeta Integral para Gatos',
    protein: 'Control de Pulgas, Ácaros de Oído y Nematodos',
    weightLb: 1,
    unitLabel: 'Pipeta Mensual',
    price: 69000,
    coins: 69,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'medicamentos',
    stage: 'Salud Felina',
    accentColor: '#10B981',
  },
  {
    id: 'prod_cat_med_3',
    sku: '7203',
    brand: 'Salud Vet',
    name: 'Malta Digestiva Felina Control Bolas de Pelo',
    protein: 'Pasta Oral con Omega 3 y Fibra Prebiótica',
    weightLb: 1,
    unitLabel: 'Tubo 100g',
    price: 52000,
    coins: 52,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'medicamentos',
    stage: 'Tránsito Digestivo',
    accentColor: '#F59E0B',
  },
  {
    id: 'prod_cat_care_1',
    sku: '5503',
    brand: 'Diamond Naturals',
    name: 'Arena Aglomerante Carbón Activado',
    protein: 'Sello Instantáneo de Olores · 99.9% Libre de Polvo',
    weightLb: 22,
    unitLabel: 'Bulto 22 LB',
    price: 64000,
    coins: 64,
    petType: 'cat',
    category: 'snacks',
    subFilter: 'higiene',
    stage: 'Higiene Felina',
    accentColor: '#10B981',
  },
];

// Los 4 círculos de Marcas Insignia (al tocar cualquiera abre la vista especializada con el ADN de la marca y sus productos)
const FOR_YOU_BULTOS_CIRCLES: {
  id: FoodBrandName;
  label: string;
  emoji: string;
  sub: string;
}[] = [
  { id: 'Diamond Naturals', label: 'Diamond', emoji: '💎', sub: 'K9 Strain®' },
  { id: 'Taste of the Wild', label: 'Taste', emoji: '🐺', sub: 'Ancestral' },
  { id: 'Acana', label: 'Acana', emoji: '🍁', sub: '70% Animal' },
  { id: 'Orijen', label: 'Orijen', emoji: '👑', sub: '85-90% Carne' },
];

// Los 4 círculos estilo "For you" de Uber para la pestaña Snacks & Cuidado
const FOR_YOU_SNACKS_CIRCLES = [
  { id: 'Todas', label: 'Todos', emoji: '✨', sub: 'Ver todo' },
  { id: 'humedos', label: 'Húmedos', emoji: '🥫', sub: 'Latas en salsa' },
  { id: 'premios', label: 'Premios', emoji: '🦴', sub: 'Treats & Galletas' },
  { id: 'higiene', label: 'Cuidado', emoji: '🧼', sub: 'Higiene & Arena' },
];

export const HomeScreen: React.FC = () => {
  const {
    user,
    openAuthModal,
    selectedAddress,
    addresses,
    pets,
    activePet,
    selectPet,
    addPet,
    updatePet,
    deletePet,
    addCoins,
    redeemCoins,
  } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileVisible, setProfileVisible] = useState(false);
  const [ordersVisible, setOrdersVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [inboxVisible, setInboxVisible] = useState(false);
  const [walletVisible, setWalletVisible] = useState(false);
  const [applyCoinsInCart, setApplyCoinsInCart] = useState(false);

  // Vista especializada de ADN de Marca (Diamond Naturals, Taste of the Wild, Acana, Orijen)
  const [activeBrandDna, setActiveBrandDna] = useState<FoodBrandName | null>(
    null
  );
  const [brandDnaModalVisible, setBrandDnaModalVisible] = useState(false);

  const openBrandDna = (brandName: FoodBrandName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveBrandDna(brandName);
    setBrandDnaModalVisible(true);
  };

  // Product detail card modal
  const [selectedProduct, setSelectedProduct] = useState<ProductBag | null>(null);
  const [productDetailVisible, setProductDetailVisible] = useState(false);
  const productDetailAnim = useRef(new Animated.Value(0)).current;
  const productDetailScale = useRef(new Animated.Value(0.85)).current;
  const productDetailTransY = useRef(new Animated.Value(60)).current;

  const openProductDetail = (product: ProductBag) => {
    setSelectedProduct(product);
    setProductDetailVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    productDetailAnim.setValue(0);
    productDetailScale.setValue(0.85);
    productDetailTransY.setValue(60);
    Animated.parallel([
      Animated.spring(productDetailAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }),
      Animated.spring(productDetailScale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }),
      Animated.spring(productDetailTransY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
    ]).start();
  };

  const closeProductDetail = () => {
    Haptics.selectionAsync();
    // "Pop & vanish" exit: micro-bounce up then disappear
    Animated.sequence([
      Animated.parallel([
        Animated.timing(productDetailScale, { toValue: 1.06, duration: 90, useNativeDriver: true }),
        Animated.timing(productDetailTransY, { toValue: -12, duration: 90, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(productDetailAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(productDetailScale, { toValue: 0.7, duration: 220, useNativeDriver: true }),
        Animated.timing(productDetailTransY, { toValue: -80, duration: 220, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setProductDetailVisible(false);
      setSelectedProduct(null);
    });
  };

  // Zona derivada automáticamente de la dirección seleccionada por el cliente (en modo invitado asume cobertura Bogotá de referencia)
  const deliveryZone: DeliveryZoneType = user
    ? selectedAddress.isBogota
      ? 'bogota'
      : 'nacional'
    : 'bogota';

  // Especie en modo invitado (permite alternar entre Perro y Gato sin tener cuenta aún)
  const [guestSpecies, setGuestSpecies] = useState<'dog' | 'cat'>('dog');

  // Especie exclusiva sincronizada con la mascota activa (o la elegida por el invitado)
  const activeSpecies: 'dog' | 'cat' = user ? activePet.species : guestSpecies;
  const displayPetName: string = user
    ? activePet.name
    : activeSpecies === 'cat'
    ? 'tu Gato'
    : 'tu Perro';

  // Las 3 pestañas superiores principales: 1. Tienda | 2. Quiz Biológico | 3. Mascota(s)
  const [mainTopTab, setMainTopTab] = useState<MainTopTabType>('store');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTab>('home');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCategory, setSelectedSearchCategory] =
    useState<SearchCategoryType>('concentrados');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuAnim = useRef(new Animated.Value(0)).current;

  // Estados del Quiz Biológico (Pestaña 2)
  const [quizStage, setQuizStage] = useState<PetStageType>(activePet.ageStage);
  const [quizActivity, setQuizActivity] = useState<PetActivityType>(
    activePet.activityLevel
  );
  const [quizSensitivity, setQuizSensitivity] = useState<PetSensitivityType>(
    activePet.sensitivity
  );
  const [quizWeightKg, setQuizWeightKg] = useState<number>(activePet.weightKg);
  const [quizSavedToast, setQuizSavedToast] = useState<boolean>(false);

  // Estados de Mascota(s) (Pestaña 3)
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<'dog' | 'cat'>('dog');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetWeight, setNewPetWeight] = useState('15');
  const [newPetStage, setNewPetStage] = useState<PetStageType>('adult');
  const [confirmDeletePetId, setConfirmDeletePetId] = useState<string | null>(
    null
  );

  // Carrito: { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderSuccessToast, setOrderSuccessToast] = useState(false);
  const [miniCartPreviewOpen, setMiniCartPreviewOpen] = useState(false);
  const [isDraggingCartBubble, setIsDraggingCartBubble] = useState(false);
  const cartPulseAnim = useRef(new Animated.Value(1)).current;

  // Posición 2D arrastrable con efecto imán hacia los bordes laterales (igual al engranaje de Expo Go)
  const { width: screenW, height: screenH } = Dimensions.get('window');
  const BUBBLE_SIZE = 58;
  const EDGE_MARGIN = 12;
  const initialBubbleX = Math.max(EDGE_MARGIN, screenW - BUBBLE_SIZE - EDGE_MARGIN);
  const initialBubbleY = Math.round(screenH * 0.64);
  const floatingCartPos = useRef(
    new Animated.ValueXY({ x: initialBubbleX, y: initialBubbleY })
  ).current;
  const lastCartPosRef = useRef({ x: initialBubbleX, y: initialBubbleY });

  const snapBubbleToNearestEdge = (
    rawX: number,
    rawY: number,
    vx: number
  ) => {
    const { width: w, height: h } = Dimensions.get('window');
    const clampedY = Math.min(Math.max(64, rawY), h - BUBBLE_SIZE - 96);

    // Proyecta ligeramente con la velocidad horizontal del dedo para que un "flick" cambie de orilla
    const projectedCenterX = rawX + BUBBLE_SIZE / 2 + vx * 85;
    const snapToLeft = projectedCenterX < w / 2;
    const targetX = snapToLeft ? EDGE_MARGIN : w - BUBBLE_SIZE - EDGE_MARGIN;

    lastCartPosRef.current = { x: targetX, y: clampedY };

    Animated.spring(floatingCartPos, {
      toValue: { x: targetX, y: clampedY },
      tension: 75,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const floatingCartPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        floatingCartPos.stopAnimation();
        setIsDraggingCartBubble(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const { width: w, height: h } = Dimensions.get('window');
        const nextX = Math.min(
          Math.max(6, lastCartPosRef.current.x + gestureState.dx),
          w - BUBBLE_SIZE - 6
        );
        const nextY = Math.min(
          Math.max(60, lastCartPosRef.current.y + gestureState.dy),
          h - BUBBLE_SIZE - 92
        );
        floatingCartPos.setValue({ x: nextX, y: nextY });
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDraggingCartBubble(false);
        const rawX = lastCartPosRef.current.x + gestureState.dx;
        const rawY = lastCartPosRef.current.y + gestureState.dy;

        // Si fue un toque rápido (sin arrastrar), abre la vista rápida de lo que va agregando
        if (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8) {
          Haptics.selectionAsync();
          setMiniCartPreviewOpen((prev) => !prev);
          return;
        }

        // Efecto imán: se adhiere con resorte al borde izquierdo o derecho más cercano
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        snapBubbleToNearestEdge(rawX, rawY, gestureState.vx);
      },
      onPanResponderTerminate: (_, gestureState) => {
        setIsDraggingCartBubble(false);
        const rawX = lastCartPosRef.current.x + gestureState.dx;
        const rawY = lastCartPosRef.current.y + gestureState.dy;
        snapBubbleToNearestEdge(rawX, rawY, gestureState.vx);
      },
    })
  ).current;

  const searchInputRef = useRef<any>(null);

  const {
    translateY: cartTranslateY,
    isExpanded: isCartExpanded,
    isDragging: isCartDragging,
    headerPanHandlers: cartHeaderPanHandlers,
    grabberPanHandlers: cartGrabberPanHandlers,
    animateClose: animateCloseCart,
  } = useDraggableSheet({
    visible: cartModalVisible,
    onClose: () => setCartModalVisible(false),
  });

  const formatCOP = (amount: number) => {
    return '$ ' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleToggleZone = () => {
    Haptics.selectionAsync();
    if (user) {
      setAddressSheetVisible(true);
    } else {
      openAuthModal('login');
    }
  };

  const handleAccountAccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) {
      setProfileVisible(true);
    } else {
      openAuthModal('login');
    }
  };

  const handleOrdersAccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) {
      setOrdersVisible(true);
    } else {
      openAuthModal('login');
    }
  };

  const triggerCartPulse = () => {
    cartPulseAnim.setValue(0.95);
    Animated.spring(cartPulseAnim, {
      toValue: 1,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToCart = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    triggerCartPulse();
  };

  const handleDecrementCart = (productId: string) => {
    Haptics.selectionAsync();
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: current - 1,
      };
    });
  };

  const activeCategoryMeta = useMemo(() => {
    return (
      SEARCH_CATEGORY_OPTIONS.find(
        (opt) => opt.id === selectedSearchCategory
      ) || SEARCH_CATEGORY_OPTIONS[0]
    );
  }, [selectedSearchCategory]);

  const toggleCategoryMenu = () => {
    Haptics.selectionAsync();
    if (categoryMenuOpen) {
      Animated.timing(categoryMenuAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => setCategoryMenuOpen(false));
    } else {
      setCategoryMenuOpen(true);
      Animated.spring(categoryMenuAnim, {
        toValue: 1,
        tension: 75,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelectSearchCategory = (catId: SearchCategoryType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSearchCategory(catId);
    if (catId !== 'concentrados' && catId !== 'todo') {
      setSelectedBrand('Todas');
    }
    Animated.timing(categoryMenuAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setCategoryMenuOpen(false));
  };

  const getCategoryItemCount = (catId: SearchCategoryType) => {
    return CATALOG_BAGS.filter((item) => {
      if (item.petType !== activeSpecies) return false;
      if (catId === 'todo') return true;
      if (catId === 'concentrados') return item.category === 'bultos';
      if (catId === 'humedo') return item.subFilter === 'humedos';
      if (catId === 'snacks') return item.subFilter === 'premios';
      if (catId === 'medicamentos') return item.subFilter === 'medicamentos';
      return true;
    }).length;
  };

  // Filtrado de productos para la pestaña 1 (Tienda) según mascota activa + categoría del mini-menú flotante
  const filteredProducts = useMemo(() => {
    return CATALOG_BAGS.filter((item) => {
      if (item.petType !== activeSpecies) return false;

      if (selectedSearchCategory === 'concentrados') {
        if (item.category !== 'bultos') return false;
      } else if (selectedSearchCategory === 'humedo') {
        if (item.subFilter !== 'humedos') return false;
      } else if (selectedSearchCategory === 'snacks') {
        if (item.subFilter !== 'premios') return false;
      } else if (selectedSearchCategory === 'medicamentos') {
        if (item.subFilter !== 'medicamentos') return false;
      }

      if (selectedBrand !== 'Todas') {
        if (selectedBrand === 'Acana') {
          if (item.brand !== 'Acana' && item.brand !== 'Orijen') return false;
        } else if (item.brand !== selectedBrand) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.protein.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.stage.toLowerCase().includes(q) ||
          `${item.weightLb}`.includes(q)
        );
      }
      return true;
    });
  }, [activeSpecies, selectedBrand, selectedSearchCategory, searchQuery]);

  // Complementos y snacks para la mascota activa (segundo carrusel en Tienda)
  const speciesSnacks = useMemo(() => {
    return CATALOG_BAGS.filter(
      (item) => item.petType === activeSpecies && item.category === 'snacks'
    );
  }, [activeSpecies]);

  // Los 2 productos frecuentes para la tarjeta de Reloj estilo Uber según la mascota activa
  const recentQuickItems = useMemo(() => {
    return CATALOG_BAGS.filter(
      (item) => item.petType === activeSpecies && item.category === 'bultos'
    ).slice(0, 2);
  }, [activeSpecies]);

  // Algoritmo del Quiz Biológico (Pestaña 2): calcula bulto ideal, ración en gramos y duración
  const quizRecommendation = useMemo(() => {
    let targetProdId = 'prod_123';

    if (activeSpecies === 'dog') {
      if (quizStage === 'puppy') {
        targetProdId = 'prod_9571'; // Taste of the Wild High Prairie Puppy 28 LB
      } else if (quizSensitivity === 'weight' || quizActivity === 'low') {
        targetProdId = 'prod_1773'; // Diamond Naturals Light Lamb & Rice 30 LB
      } else if (quizSensitivity === 'skin') {
        targetProdId = 'prod_9423'; // Diamond Naturals Skin & Coat Salmón 30 LB
      } else if (
        quizSensitivity === 'grain_free' ||
        quizActivity === 'high'
      ) {
        targetProdId = 'prod_9567'; // Taste of the Wild High Prairie 28 LB
      } else {
        targetProdId = 'prod_123'; // Diamond Naturals Lamb & Rice 40 LB
      }
    } else {
      // Gatos
      if (quizSensitivity === 'skin' || quizSensitivity === 'digestion') {
        targetProdId = 'prod_1910'; // Diamond Indoor Cat Hairball 18 LB
      } else if (quizActivity === 'high' || quizSensitivity === 'grain_free') {
        targetProdId = 'prod_7790'; // Orijen Cat & Kitten 12 LB
      } else {
        targetProdId = 'prod_9580'; // Taste of the Wild Rocky Mountain Cat 14 LB
      }
    }

    const product =
      CATALOG_BAGS.find((p) => p.id === targetProdId) || CATALOG_BAGS[0];

    // Cálculo de ración biológica diaria en gramos según peso y actividad
    const baseFactor =
      activeSpecies === 'cat'
        ? 14
        : quizStage === 'puppy'
        ? 22
        : quizActivity === 'high'
        ? 15
        : quizActivity === 'low'
        ? 10.5
        : 12.5;
    const dailyGrams = Math.max(
      45,
      Math.round((quizWeightKg * baseFactor) / 5) * 5
    );
    const totalBagGrams = Math.round(product.weightLb * 453.592);
    const estimatedDays = Math.max(
      12,
      Math.round(totalBagGrams / dailyGrams)
    );
    const costPerDay = Math.round(product.price / estimatedDays);

    return {
      product,
      dailyGrams,
      estimatedDays,
      costPerDay,
    };
  }, [activeSpecies, quizStage, quizActivity, quizSensitivity, quizWeightKg]);

  // Totales del carrito
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let subtotal = 0;
    let totalWeightLb = 0;
    let totalCoins = 0;
    const itemsList: { product: ProductBag; quantity: number }[] = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = CATALOG_BAGS.find((p) => p.id === id);
      if (prod && qty > 0) {
        totalItems += qty;
        subtotal += prod.price * qty;
        totalWeightLb += prod.weightLb * qty;
        totalCoins += prod.coins * qty;
        itemsList.push({ product: prod, quantity: qty });
      }
    });

    const estimatedCarrierFee =
      deliveryZone === 'bogota' ? 0 : Math.max(18000, Math.round(totalWeightLb * 850));

    const availableCoins = user ? user.points : 0;
    const maxRedeemableCoins = Math.min(
      availableCoins,
      Math.floor((subtotal + estimatedCarrierFee) / COIN_VALUE_COP)
    );
    const coinsToRedeem =
      user && applyCoinsInCart ? maxRedeemableCoins : 0;
    const coinsDiscountCop = coinsToRedeem * COIN_VALUE_COP;

    return {
      totalItems,
      subtotal,
      totalWeightLb,
      totalCoins,
      estimatedCarrierFee,
      availableCoins,
      coinsToRedeem,
      coinsDiscountCop,
      totalWithShipping: Math.max(
        0,
        subtotal + estimatedCarrierFee - coinsDiscountCop
      ),
      itemsList,
    };
  }, [cart, deliveryZone, user, applyCoinsInCart]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ==================== 1. UBER HEADER × LOGO MUNDO MASCOTAS ==================== */}
      <View style={styles.uberTopHeader}>
        {/* LEFT: Mundo Mascotas Logo Emblem + Address (logged in) or Guest prompt */}
        <Pressable
          onPress={() => {
            if (user) {
              handleToggleZone();
            } else {
              openAuthModal('login');
            }
          }}
          style={styles.locationSelectorRow}
          hitSlop={8}
        >
          <View style={styles.headerLogoCircle}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.headerLogoImg}
              resizeMode="cover"
            />
          </View>
          <View style={styles.locationTextCol}>
            {user ? (
              <>
                <View style={styles.locationTopLineRow}>
                  <Text style={styles.locationLabelEyebrow} numberOfLines={1}>
                    Entregar en {selectedAddress.label}
                  </Text>
                  <Text
                    style={[
                      styles.locationZoneTagText,
                      {
                        color:
                          deliveryZone === 'bogota'
                            ? colors.primary.light
                            : '#D1D5DB',
                      },
                    ]}
                  >
                    ·{' '}
                    {deliveryZone === 'bogota'
                      ? 'Domicilio Gratis'
                      : '+ Flete transportadora'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={13}
                    color={colors.primary.light}
                  />
                </View>
                <Text style={styles.locationText} numberOfLines={1}>
                  {selectedAddress.address1}
                  {selectedAddress.locality
                    ? ` · ${selectedAddress.locality}`
                    : ''}, {selectedAddress.city}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[styles.locationLabelEyebrow, { color: '#9CA3AF' }]}
                  numberOfLines={1}
                >
                  Modo invitado · Toca para ingresar
                </Text>
                <Text
                  style={[styles.locationText, { color: '#FFFFFF' }]}
                  numberOfLines={1}
                >
                  Explorar Mundo Mascotas
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* RIGHT: Inbox (logged in) or Login button (guest) */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            if (user) {
              setInboxVisible(true);
            } else {
              openAuthModal('login');
            }
          }}
          style={styles.inboxBagPill}
          hitSlop={8}
        >
          <Ionicons
            name={user ? 'notifications-outline' : 'person-outline'}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.inboxBagText}>{user ? 'Inbox' : 'Ingresar'}</Text>
          {user && <View style={styles.activeGoldDot} />}
        </Pressable>
      </View>

      {/* ==================== 2. LAS 3 PESTAÑAS SUPERIORES: 1. TIENDA | 2. QUIZ BIOLÓGICO | 3. MASCOTA(S) ==================== */}
      <View style={styles.uberTabsContainer}>
        {/* Opción 1: Tienda */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setMainTopTab('store');
          }}
          style={[styles.uberTabItem, { flex: 0.9 }]}
        >
          <Text style={styles.uberTabEmoji}>🛍️</Text>
          <Text
            numberOfLines={1}
            style={[
              styles.uberTabText,
              mainTopTab === 'store' && styles.uberTabTextActive,
            ]}
          >
            Tienda
          </Text>
          {mainTopTab === 'store' && (
            <View style={styles.uberTabActiveIndicator} />
          )}
        </Pressable>

        {/* Opción 2: Quiz Biológico */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            if (user) {
              setQuizStage(activePet.ageStage);
              setQuizActivity(activePet.activityLevel);
              setQuizSensitivity(activePet.sensitivity);
              setQuizWeightKg(activePet.weightKg);
            }
            setMainTopTab('quiz');
          }}
          style={[styles.uberTabItem, { flex: 1.35 }]}
        >
          <Text style={styles.uberTabEmoji}>🧬</Text>
          <Text
            numberOfLines={1}
            style={[
              styles.uberTabText,
              mainTopTab === 'quiz' && styles.uberTabTextActive,
            ]}
          >
            Quiz Biológico
          </Text>
          {mainTopTab === 'quiz' && (
            <View style={styles.uberTabActiveIndicator} />
          )}
        </Pressable>

        {/* Opción 3: Mascota(s) */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setMainTopTab('pets');
          }}
          style={[styles.uberTabItem, { flex: 1.05 }]}
        >
          <Text style={styles.uberTabEmoji}>
            {activeSpecies === 'cat' ? '🐱' : '🐶'}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.uberTabText,
              mainTopTab === 'pets' && styles.uberTabTextActive,
            ]}
          >
            {user && pets.length > 1 ? `Mascotas (${pets.length})` : 'Mascota(s)'}
          </Text>
          {mainTopTab === 'pets' && (
            <View style={styles.uberTabActiveIndicator} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(insets.bottom, 12) +
              (mainTopTab === 'store' ? 166 : 98),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ===================================================================================== */}
        {/* ======================= VISTA 1: TIENDA (CATÁLOGO PERSONALIZADO) ==================== */}
        {/* ===================================================================================== */}
        {mainTopTab === 'store' && (
          <>
            {/* 3. UBER SEARCH PILL + MINI MENÚ FLOTANTE DE CATEGORÍAS */}
            <View style={styles.searchPillWrapper}>
              <Pressable
                onPress={() => searchInputRef.current?.focus()}
                style={styles.uberSearchPill}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.dark.textSecondary}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`¿Qué ${activeCategoryMeta.placeholderNoun} busca ${displayPetName}?`}
                  placeholderTextColor="#9CA3AF"
                  style={styles.uberSearchInput}
                  underlineColorAndroid="transparent"
                />

                {searchQuery.length > 0 ? (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={{ marginRight: 8 }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </Pressable>
                ) : null}

                {/* Botón selector que despliega el mini menú flotante */}
                <Pressable
                  onPress={toggleCategoryMenu}
                  style={[
                    styles.uberLaterButton,
                    (categoryMenuOpen ||
                      selectedSearchCategory !== 'concentrados') &&
                      styles.uberLaterButtonActive,
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>
                    {activeCategoryMeta.emoji}
                  </Text>
                  <Text
                    style={[
                      styles.uberLaterText,
                      (categoryMenuOpen ||
                        selectedSearchCategory !== 'concentrados') && {
                        color: '#050508',
                      },
                    ]}
                  >
                    {activeCategoryMeta.shortLabel}
                  </Text>
                  <Ionicons
                    name={categoryMenuOpen ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={
                      categoryMenuOpen ||
                      selectedSearchCategory !== 'concentrados'
                        ? '#050508'
                        : '#FFFFFF'
                    }
                  />
                </Pressable>
              </Pressable>

              {/* MINI MENÚ FLOTANTE DESPLEGABLE (POPOVER) */}
              {categoryMenuOpen && (
                <Animated.View
                  style={[
                    styles.categoryFloatingMenu,
                    {
                      opacity: categoryMenuAnim,
                      transform: [
                        {
                          translateY: categoryMenuAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0],
                          }),
                        },
                        {
                          scale: categoryMenuAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.94, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.categoryMenuHeaderRow}>
                    <Text style={styles.categoryMenuHeaderText}>
                      ¿Qué deseas buscar para {displayPetName}{' '}
                      {activeSpecies === 'cat' ? '🐱' : '🐶'}?
                    </Text>
                    <Pressable onPress={toggleCategoryMenu} hitSlop={8}>
                      <Ionicons name="close" size={16} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  {SEARCH_CATEGORY_OPTIONS.map((option, idx) => {
                    const isSelected = selectedSearchCategory === option.id;
                    const count = getCategoryItemCount(option.id);
                    return (
                      <React.Fragment key={option.id}>
                        {idx > 0 && (
                          <View style={styles.categoryMenuDivider} />
                        )}
                        <Pressable
                          onPress={() => handleSelectSearchCategory(option.id)}
                          style={({ pressed }) => [
                            styles.categoryMenuItemRow,
                            isSelected && styles.categoryMenuItemRowActive,
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <View
                            style={[
                              styles.categoryMenuIconBox,
                              isSelected && styles.categoryMenuIconBoxActive,
                            ]}
                          >
                            <Text style={{ fontSize: 18 }}>{option.emoji}</Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <Text
                                style={[
                                  styles.categoryMenuTitle,
                                  isSelected && {
                                    color: colors.primary.light,
                                  },
                                ]}
                              >
                                {option.label}
                              </Text>
                              <View style={styles.categoryCountPill}>
                                <Text style={styles.categoryCountText}>
                                  {count}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.categoryMenuSubtitle}>
                              {option.subtitle}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.categoryMenuRadio,
                              isSelected && styles.categoryMenuRadioActive,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={13}
                                color="#050508"
                              />
                            )}
                          </View>
                        </Pressable>
                      </React.Fragment>
                    );
                  })}
                </Animated.View>
              )}
            </View>

            {/* ===== SEARCH RESULTS PANEL: visible only when searchQuery has text ===== */}
            {searchQuery.trim().length > 0 && (
              <View style={styles.searchResultsPanel}>
                {/* Header row */}
                <View style={styles.searchResultsHeader}>
                  <Text style={styles.searchResultsTitle}>
                    {filteredProducts.length > 0
                      ? `${filteredProducts.length} resultado${filteredProducts.length !== 1 ? 's' : ''} para "${searchQuery.trim()}"`
                      : `Sin resultados para "${searchQuery.trim()}"`}
                  </Text>
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}
                    style={styles.searchResultsClearBtn}
                  >
                    <Text style={styles.searchResultsClearText}>Limpiar</Text>
                  </Pressable>
                </View>

                {filteredProducts.length === 0 ? (
                  /* Empty state */
                  <View style={styles.searchEmptyState}>
                    <Text style={{ fontSize: 42, marginBottom: 10 }}>🔍</Text>
                    <Text style={styles.searchEmptyTitle}>
                      No encontramos ese producto
                    </Text>
                    <Text style={styles.searchEmptySubtitle}>
                      Intenta con otro nombre, marca o proteína
                    </Text>
                    <Pressable
                      onPress={() => setSearchQuery('')}
                      style={styles.searchEmptyResetBtn}
                    >
                      <Text style={styles.searchEmptyResetText}>
                        Ver todos los productos
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  /* Result rows */
                  filteredProducts.map((item, idx) => {
                    const inCart = cart[item.id] ?? 0;
                    const brandEmoji =
                      item.brand === 'Diamond Naturals'
                        ? '💎'
                        : item.brand === 'Taste of the Wild'
                          ? '🌿'
                          : item.brand === 'Acana'
                            ? '🦅'
                            : item.brand === 'Orijen'
                              ? '🐾'
                              : '🛍️';
                    return (
                      <React.Fragment key={item.id}>
                        {idx > 0 && <View style={styles.uberRecentDivider} />}
                        <Pressable
                          onPress={() => openProductDetail(item)}
                          style={({ pressed }) => [
                            styles.searchResultRow,
                            pressed && { backgroundColor: 'rgba(255,255,255,0.04)' },
                          ]}
                        >
                          {/* Brand emoji icon */}
                          <View style={styles.searchResultIconBox}>
                            <Text style={{ fontSize: 20 }}>{brandEmoji}</Text>
                          </View>

                          {/* Text info */}
                          <View style={{ flex: 1 }}>
                            <Text
                              style={styles.searchResultName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={styles.searchResultProtein}
                              numberOfLines={1}
                            >
                              {item.protein}
                            </Text>
                            <View style={styles.searchResultPriceRow}>
                              <Text style={styles.searchResultPrice}>
                                {formatCOP(item.price)}
                              </Text>
                              {item.tag ? (
                                <View style={styles.searchResultTag}>
                                  <Text style={styles.searchResultTagText}>
                                    {item.tag}
                                  </Text>
                                </View>
                              ) : null}
                              <Text style={styles.searchResultWeight}>
                                {item.unitLabel ?? `${item.weightLb} LB`}
                              </Text>
                            </View>
                          </View>

                          {/* Add button / quantity */}
                          {inCart > 0 ? (
                            <View style={styles.searchResultQtyRow}>
                              <Pressable
                                onPress={() => handleDecrementCart(item.id)}
                                hitSlop={8}
                                style={styles.searchResultQtyBtn}
                              >
                                <Ionicons
                                  name="remove"
                                  size={16}
                                  color="#FFFFFF"
                                />
                              </Pressable>
                              <Text style={styles.searchResultQtyText}>
                                {inCart}
                              </Text>
                              <Pressable
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  handleAddToCart(item.id);
                                }}
                                hitSlop={8}
                                style={[
                                  styles.searchResultQtyBtn,
                                  { backgroundColor: '#D4AF37' },
                                ]}
                              >
                                <Ionicons name="add" size={16} color="#050508" />
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable
                              onPress={() => {
                                Haptics.selectionAsync();
                                handleAddToCart(item.id);
                              }}
                              style={styles.searchResultAddBtn}
                            >
                              <Ionicons name="add" size={18} color="#050508" />
                            </Pressable>
                          )}
                        </Pressable>
                      </React.Fragment>
                    );
                  })
                )}
              </View>
            )}

            {/* 4. UBER RECENT (CON SESIÓN) O MÁS PEDIDOS DESTACADOS (MODO INVITADO) */}
            <View style={styles.uberRecentCard}>
              {recentQuickItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.uberRecentDivider} />}
                  <Pressable
                    onPress={() => openProductDetail(item)}
                    style={({ pressed }) => [
                      styles.uberRecentRow,
                      pressed && {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      },
                    ]}
                  >
                    <View style={styles.uberClockIconBox}>
                      <Ionicons
                        name={user ? 'time-outline' : 'flame-outline'}
                        size={20}
                        color={user ? '#D1D5DB' : colors.primary.light}
                      />
                    </View>
                    <View style={styles.uberRecentTextCol}>
                      <Text style={styles.uberRecentTitle} numberOfLines={1}>
                        {item.name} ({item.unitLabel || `${item.weightLb} LB`})
                      </Text>
                      <Text style={styles.uberRecentSubtitle} numberOfLines={1}>
                        {formatCOP(item.price)} ·{' '}
                        {user
                          ? deliveryZone === 'bogota'
                            ? 'Domicilio Gratis en Bogotá'
                            : `+${item.coins} Consenticoins`
                          : '🔥 Favorito en Mundo Mascotas'}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#6B7280"
                    />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>

            {/* 5. UBER "FOR YOU" 4 CIRCULAR ICONS PERSONALIZADOS */}
            <View style={styles.uberSectionHeader}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setMainTopTab('pets');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Text style={styles.uberSectionTitle}>
                  Para {displayPetName}{' '}
                  {activeSpecies === 'cat' ? '🐱' : '🐶'}
                </Text>
                <View style={styles.uberSmallArrowCircle}>
                  <Ionicons name="chevron-forward" size={13} color="#D1D5DB" />
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setMainTopTab('quiz');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.35)',
                }}
              >
                <Text style={{ fontSize: 12 }}>🧬</Text>
                <Text
                  style={{
                    color: colors.primary.light,
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  Hacer Quiz
                </Text>
              </Pressable>
            </View>

            <View style={styles.uberCirclesRow}>
              {FOR_YOU_BULTOS_CIRCLES.map((item) => {
                const isSelected =
                  brandDnaModalVisible && activeBrandDna === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openBrandDna(item.id)}
                    style={({ pressed }) => [
                      styles.uberCircleItem,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                    ]}
                  >
                    <View
                      style={[
                        styles.uberCircleGraphic,
                        isSelected && styles.uberCircleGraphicActive,
                      ]}
                    >
                      <Text style={styles.uberCircleEmoji}>{item.emoji}</Text>
                    </View>
                    <Text
                      style={[
                        styles.uberCircleLabel,
                        isSelected && {
                          color: colors.primary.light,
                          fontWeight: '800',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.uberCircleSubLabel} numberOfLines={1}>
                      {item.sub} ›
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 6. UBER HORIZONTAL CARDS: CATÁLOGO SEGÚN CATEGORÍA DEL MINI MENÚ */}
            <View style={styles.uberSectionHeader}>
              <Text style={styles.uberSectionTitle}>
                {selectedSearchCategory === 'humedo'
                  ? `🥫 Alimento Húmedo para ${displayPetName}`
                  : selectedSearchCategory === 'snacks'
                  ? `🦴 Snacks y Premios para ${displayPetName}`
                  : selectedSearchCategory === 'medicamentos'
                  ? `💊 Medicamentos y Salud para ${displayPetName}`
                  : selectedSearchCategory === 'todo'
                  ? `✨ Todo el catálogo para ${displayPetName}`
                  : selectedBrand === 'Todas'
                  ? activeSpecies === 'cat'
                    ? 'Bultos Super Premium Gatos'
                    : 'Bultos Super Premium Perros'
                  : `Línea ${selectedBrand}`}
              </Text>
              {selectedBrand !== 'Todas' ||
              selectedSearchCategory !== 'concentrados' ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedBrand('Todas');
                    setSelectedSearchCategory('concentrados');
                  }}
                >
                  <Text style={styles.clearFilterLink}>Restablecer</Text>
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.uberHorizontalCardsScroll}
            >
              {filteredProducts.map((product) => {
                const qty = cart[product.id] || 0;
                return (
                  <View key={product.id} style={styles.uberFeatureCard}>
                    <Pressable onPress={() => openProductDetail(product)}>
                      <LinearGradient
                        colors={['#161922', '#0F1117']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.uberCardGraphicArea}
                      >
                        <View style={styles.uberCardTopBadges}>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              if (product.brand !== 'Salud Vet') {
                                openBrandDna(product.brand as FoodBrandName);
                              } else {
                                openProductDetail(product);
                              }
                            }}
                            style={styles.uberBrandBadge}
                          >
                            <Text style={styles.uberBrandBadgeText}>
                              {product.brand}
                              {product.brand !== 'Salud Vet' ? ' · ADN ›' : ''}
                            </Text>
                          </Pressable>
                          <View style={styles.uberWeightPill}>
                            <Text style={styles.uberWeightPillText}>
                              {product.unitLabel || `${product.weightLb} LB`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.uberCardVisualCenter}>
                          <View style={styles.bagIllustrationCircle}>
                            <Text style={{ fontSize: 34 }}>
                              {product.subFilter === 'medicamentos'
                                ? '💊'
                                : product.subFilter === 'humedos'
                                ? '🥫'
                                : product.subFilter === 'premios'
                                ? '🦴'
                                : product.subFilter === 'higiene'
                                ? '🧼'
                                : product.petType === 'cat'
                                ? '🐱'
                                : '🐶'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.uberCardBottomTag}>
                          <Text style={styles.uberCardBottomTagText}>
                            {deliveryZone === 'bogota'
                              ? 'Domicilio Gratis Bogotá'
                              : '+ Flete transportadora'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>

                    <View style={styles.uberCardBody}>
                      <Pressable onPress={() => openProductDetail(product)}>
                        <Text style={styles.uberCardTitle} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.uberCardSubtitle} numberOfLines={1}>
                          {product.protein} · +{product.coins} Coins
                        </Text>
                      </Pressable>

                      <View style={styles.uberCardPriceRow}>
                        <Text style={styles.uberCardPrice}>
                          {formatCOP(product.price)}
                        </Text>

                        {qty === 0 ? (
                          <Pressable
                            onPress={() => handleAddToCart(product.id)}
                            style={({ pressed }) => [
                              styles.uberAddBtn,
                              pressed && { opacity: 0.85 },
                            ]}
                          >
                            <Ionicons name="add" size={16} color="#050508" />
                            <Text style={styles.uberAddBtnText}>Pedir</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.qtyStepper}>
                            <Pressable
                              onPress={() => handleDecrementCart(product.id)}
                              style={styles.qtyStepBtn}
                            >
                              <Ionicons
                                name="remove"
                                size={14}
                                color="#FFFFFF"
                              />
                            </Pressable>
                            <Text style={styles.qtyCountText}>{qty}</Text>
                            <Pressable
                              onPress={() => handleAddToCart(product.id)}
                              style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                            >
                              <Ionicons name="add" size={14} color="#050508" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* 7. SEGUNDO CARRUSEL EN TIENDA: HÚMEDOS, PREMIOS Y CUIDADO */}
            <View style={[styles.uberSectionHeader, { marginTop: 22 }]}>
              <Text style={styles.uberSectionTitle}>
                {activeSpecies === 'cat'
                  ? `Húmedos y Arena para ${displayPetName}`
                  : `Premios y Húmedos para ${displayPetName}`}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.uberHorizontalCardsScroll}
            >
              {speciesSnacks.map((product) => {
                const qty = cart[product.id] || 0;
                return (
                  <View key={product.id} style={styles.uberFeatureCard}>
                    <Pressable onPress={() => openProductDetail(product)}>
                      <LinearGradient
                        colors={['#161922', '#0F1117']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.uberCardGraphicArea}
                      >
                        <View style={styles.uberCardTopBadges}>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              if (product.brand !== 'Salud Vet') {
                                openBrandDna(product.brand as FoodBrandName);
                              } else {
                                openProductDetail(product);
                              }
                            }}
                            style={styles.uberBrandBadge}
                          >
                            <Text style={styles.uberBrandBadgeText}>
                              {product.brand}
                              {product.brand !== 'Salud Vet' ? ' · ADN ›' : ''}
                            </Text>
                          </Pressable>
                          <View style={styles.uberWeightPill}>
                            <Text style={styles.uberWeightPillText}>
                              {product.unitLabel || `${product.weightLb} LB`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.uberCardVisualCenter}>
                          <View style={styles.bagIllustrationCircle}>
                            <Text style={{ fontSize: 32 }}>
                              {product.subFilter === 'humedos'
                                ? '🥫'
                                : product.subFilter === 'higiene'
                                ? '🧼'
                                : '🦴'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.uberCardBottomTag}>
                          <Text style={styles.uberCardBottomTagText}>
                            {product.stage}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>

                    <View style={styles.uberCardBody}>
                      <Pressable onPress={() => openProductDetail(product)}>
                        <Text style={styles.uberCardTitle} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.uberCardSubtitle} numberOfLines={1}>
                          {product.protein} · +{product.coins} Coins
                        </Text>
                      </Pressable>

                      <View style={styles.uberCardPriceRow}>
                        <Text style={styles.uberCardPrice}>
                          {formatCOP(product.price)}
                        </Text>

                        {qty === 0 ? (
                          <Pressable
                            onPress={() => handleAddToCart(product.id)}
                            style={({ pressed }) => [
                              styles.uberAddBtn,
                              pressed && { opacity: 0.85 },
                            ]}
                          >
                            <Ionicons name="add" size={16} color="#050508" />
                            <Text style={styles.uberAddBtnText}>Pedir</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.qtyStepper}>
                            <Pressable
                              onPress={() => handleDecrementCart(product.id)}
                              style={styles.qtyStepBtn}
                            >
                              <Ionicons
                                name="remove"
                                size={14}
                                color="#FFFFFF"
                              />
                            </Pressable>
                            <Text style={styles.qtyCountText}>{qty}</Text>
                            <Pressable
                              onPress={() => handleAddToCart(product.id)}
                              style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                            >
                              <Ionicons name="add" size={14} color="#050508" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* 8. TERCER CARRUSEL EN TIENDA ("Más beneficios en Mundo Mascotas") */}
            <View style={[styles.uberSectionHeader, { marginTop: 22 }]}>
              <Text style={styles.uberSectionTitle}>
                Más beneficios en Mundo Mascotas
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.uberHorizontalCardsScroll}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWalletVisible(true);
                }}
                style={styles.uberPromoWideCard}
              >
                <LinearGradient
                  colors={['#261F10', '#161922', '#0E1016']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.uberPromoVisual,
                    {
                      borderWidth: 1,
                      borderColor: 'rgba(212, 175, 55, 0.45)',
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={styles.uberPromoBadge}>
                      <Text style={styles.uberPromoBadgeText}>
                        CONSENTICOINS CASH
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      = {formatCOP((user?.points ?? 250) * COIN_VALUE_COP)}
                    </Text>
                  </View>
                  <Text style={styles.uberPromoBigCoins}>
                    {user?.points ?? 250} COINS 🪙
                  </Text>
                </LinearGradient>
                <Text style={styles.uberCardTitle}>
                  Billetera Consenticoins ›
                </Text>
                <Text style={styles.uberCardSubtitle}>
                  {user
                    ? `Saldo disponible: ${formatCOP(
                        user.points * COIN_VALUE_COP
                      )} · Extracto y Bóveda`
                    : 'Bono de 250 Coins ($ 5.000) listo para activar'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleToggleZone}
                style={styles.uberPromoWideCard}
              >
                <LinearGradient
                  colors={['#112233', '#0B1520']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.uberPromoVisual}
                >
                  <View style={styles.uberPromoBadge}>
                    <Text style={styles.uberPromoBadgeText}>LOGÍSTICA</Text>
                  </View>
                  <Text style={[styles.uberPromoBigCoins, { fontSize: 18 }]}>
                    {deliveryZone === 'bogota'
                      ? '🚚 Gratis en Bogotá'
                      : '📦 Envíos Nacionales'}
                  </Text>
                </LinearGradient>
                <Text style={styles.uberCardTitle}>
                  {deliveryZone === 'bogota'
                    ? 'Domicilio sin costo en Bogotá'
                    : 'Despachos a toda Colombia'}
                </Text>
                <Text style={styles.uberCardSubtitle}>
                  {deliveryZone === 'bogota'
                    ? 'Pago contraentrega con nuestra flota propia'
                    : 'Recargo por transportadora según el peso en libras'}
                </Text>
              </Pressable>
            </ScrollView>
          </>
        )}

        {/* ===================================================================================== */}
        {/* ==================== VISTA 2: QUIZ BIOLÓGICO (ASESOR NUTRICIONAL) =================== */}
        {/* ===================================================================================== */}
        {mainTopTab === 'quiz' && (
          <View style={styles.quizSectionWrapper}>
            {/* Cabecera del Quiz Biológico */}
            <LinearGradient
              colors={['#191E2B', '#10131C']}
              style={styles.quizHeroCard}
            >
              <View style={styles.quizHeroTopRow}>
                <View style={styles.quizHeroBadge}>
                  <Text style={styles.quizHeroBadgeText}>
                    🧬 ALGORITMO NUTRICIONAL
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (user) {
                      setMainTopTab('pets');
                    } else {
                      const nextSp = activeSpecies === 'dog' ? 'cat' : 'dog';
                      setGuestSpecies(nextSp);
                      setQuizWeightKg(nextSp === 'cat' ? 4.5 : 20);
                    }
                  }}
                  style={styles.quizSwitchPetPill}
                >
                  <Text style={styles.quizSwitchPetText}>
                    {user
                      ? `${activeSpecies === 'cat' ? '🐱' : '🐶'} ${activePet.name} ⌄`
                      : `${activeSpecies === 'cat' ? '🐱 Modo Gato' : '🐶 Modo Perro'} ⇄`}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.quizHeroTitle}>
                Fórmula Biológica Ideal para {displayPetName}
              </Text>
              <Text style={styles.quizHeroSub}>
                Responde estos 4 parámetros para calcular la proteína exacta, los
                gramos diarios y cuántos días te durará el bulto.
              </Text>
            </LinearGradient>

            {/* Paso 1: Etapa de vida */}
            <Text style={styles.quizStepTitle}>1. Etapa biológica actual</Text>
            <View style={styles.quizOptionRow}>
              {[
                {
                  id: 'puppy' as PetStageType,
                  emoji: '🐣',
                  label: activeSpecies === 'cat' ? 'Gatito' : 'Cachorro',
                  sub: '< 12 meses',
                },
                {
                  id: 'adult' as PetStageType,
                  emoji: activeSpecies === 'cat' ? '🐱' : '🐕',
                  label: 'Adulto',
                  sub: '1 a 7 años',
                },
                {
                  id: 'senior' as PetStageType,
                  emoji: '🦮',
                  label: 'Senior',
                  sub: '+7 años',
                },
              ].map((st) => {
                const active = quizStage === st.id;
                return (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQuizStage(st.id);
                    }}
                    style={[
                      styles.quizOptionCard,
                      active && styles.quizOptionCardActive,
                    ]}
                  >
                    <Text style={styles.quizOptionEmoji}>{st.emoji}</Text>
                    <Text
                      style={[
                        styles.quizOptionLabel,
                        active && styles.quizOptionLabelActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                    <Text style={styles.quizOptionSub}>{st.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Paso 2: Peso aproximado en Kg */}
            <Text style={styles.quizStepTitle}>
              2. Peso actual aproximado ({quizWeightKg} kg)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {(activeSpecies === 'cat'
                ? [2.5, 3.5, 4.5, 6, 8]
                : [5, 12, 20, 28, 36, 45]
              ).map((w) => {
                const active = quizWeightKg === w;
                return (
                  <Pressable
                    key={w}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQuizWeightKg(w);
                    }}
                    style={[
                      styles.quizWeightChip,
                      active && styles.quizWeightChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quizWeightChipText,
                        active && styles.quizWeightChipTextActive,
                      ]}
                    >
                      {w} kg
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Paso 3: Nivel de Actividad */}
            <Text style={styles.quizStepTitle}>3. Nivel de actividad física</Text>
            <View style={styles.quizOptionRow}>
              {[
                {
                  id: 'low' as PetActivityType,
                  emoji: '🛋️',
                  label: 'Hogareño',
                  sub: 'Baja quema calórica',
                },
                {
                  id: 'moderate' as PetActivityType,
                  emoji: '🚶',
                  label: 'Moderado',
                  sub: 'Paseos diarios',
                },
                {
                  id: 'high' as PetActivityType,
                  emoji: '⚡',
                  label: 'Alta Energía',
                  sub: 'Deporte / Trabajo',
                },
              ].map((act) => {
                const active = quizActivity === act.id;
                return (
                  <Pressable
                    key={act.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQuizActivity(act.id);
                    }}
                    style={[
                      styles.quizOptionCard,
                      active && styles.quizOptionCardActive,
                    ]}
                  >
                    <Text style={styles.quizOptionEmoji}>{act.emoji}</Text>
                    <Text
                      style={[
                        styles.quizOptionLabel,
                        active && styles.quizOptionLabelActive,
                      ]}
                    >
                      {act.label}
                    </Text>
                    <Text style={styles.quizOptionSub}>{act.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Paso 4: Necesidad Biológica Principal */}
            <Text style={styles.quizStepTitle}>
              4. Prioridad biológica o sensibilidad
            </Text>
            <View style={styles.quizSensitivityGrid}>
              {[
                {
                  id: 'none' as PetSensitivityType,
                  emoji: '🥩',
                  title: 'Nutrición Balanceada Cordero & Arroz',
                  sub: 'Mantenimiento óptimo diario y alta digestibilidad',
                },
                {
                  id: 'skin' as PetSensitivityType,
                  emoji: '✨',
                  title: 'Piel Sensible y Pelaje Brillante',
                  sub: 'Rico en Salmón Salvaje, Omega 3 y Omega 6',
                },
                {
                  id: 'weight' as PetSensitivityType,
                  emoji: '⚖️',
                  title: 'Control de Peso / Esterilizado',
                  sub: 'Fórmula Light baja en calorías con L-Carnitina',
                },
                {
                  id: 'grain_free' as PetSensitivityType,
                  emoji: '🐺',
                  title: '100% Libre de Granos (Ancestral)',
                  sub: 'Proteína pura de Bisonte, Venado o Salmón Ahumado',
                },
              ].map((sens) => {
                const active = quizSensitivity === sens.id;
                return (
                  <Pressable
                    key={sens.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQuizSensitivity(sens.id);
                    }}
                    style={[
                      styles.quizSensCard,
                      active && styles.quizOptionCardActive,
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{sens.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.quizSensTitle,
                          active && { color: colors.primary.light },
                        ]}
                      >
                        {sens.title}
                      </Text>
                      <Text style={styles.quizSensSub}>{sens.sub}</Text>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={active ? colors.primary.DEFAULT : '#4B5563'}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* TARJETA DE RESULTADO BIOLÓGICO EN TIEMPO REAL */}
            <LinearGradient
              colors={['#1F2433', '#12151E']}
              style={styles.quizResultCard}
            >
              <View style={styles.quizResultBadgeRow}>
                <View style={styles.quizMatchPill}>
                  <Text style={styles.quizMatchPillText}>
                    ✓ 99% COMPATIBILIDAD BIOLÓGICA
                  </Text>
                </View>
                <Text style={styles.quizWeightBadgeText}>
                  {quizRecommendation.product.weightLb} LB
                </Text>
              </View>

              <Text style={styles.quizResultProdTitle}>
                {quizRecommendation.product.name}
              </Text>
              <Text style={styles.quizResultProdSub}>
                {quizRecommendation.product.protein}
              </Text>

              {/* Métricas de ración y duración */}
              <View style={styles.quizMetricsRow}>
                <View style={styles.quizMetricBox}>
                  <Text style={styles.quizMetricValue}>
                    {quizRecommendation.dailyGrams} g/día
                  </Text>
                  <Text style={styles.quizMetricLabel}>Ración sugerida</Text>
                </View>
                <View style={styles.quizMetricBox}>
                  <Text style={styles.quizMetricValue}>
                    ~{quizRecommendation.estimatedDays} días
                  </Text>
                  <Text style={styles.quizMetricLabel}>Duración del bulto</Text>
                </View>
                <View style={styles.quizMetricBox}>
                  <Text style={styles.quizMetricValue}>
                    {formatCOP(quizRecommendation.costPerDay)}
                  </Text>
                  <Text style={styles.quizMetricLabel}>Costo por día</Text>
                </View>
              </View>

              <View style={styles.quizResultActions}>
                <Pressable
                  onPress={() => {
                    handleAddToCart(quizRecommendation.product.id);
                    setCartModalVisible(true);
                  }}
                  style={styles.quizPrimaryAddBtn}
                >
                  <Ionicons name="bag-add" size={18} color="#050508" />
                  <Text style={styles.quizPrimaryAddBtnText}>
                    Pedir Bulto ({formatCOP(quizRecommendation.product.price)})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (!user) {
                      Haptics.selectionAsync();
                      openAuthModal('login');
                      return;
                    }
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                    updatePet(activePet.id, {
                      ageStage: quizStage,
                      weightKg: quizWeightKg,
                      activityLevel: quizActivity,
                      sensitivity: quizSensitivity,
                      recommendedProductId: quizRecommendation.product.id,
                    });
                    setQuizSavedToast(true);
                    setTimeout(() => setQuizSavedToast(false), 2500);
                  }}
                  style={styles.quizSecondarySaveBtn}
                >
                  <Text style={styles.quizSecondarySaveText}>
                    {!user
                      ? '🔒 Inicia sesión para guardar este diagnóstico en tu perfil'
                      : quizSavedToast
                      ? `✓ Guardado en la ficha de ${activePet.name}`
                      : `Guardar diagnóstico en el perfil de ${activePet.name}`}
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ===================================================================================== */}
        {/* ==================== VISTA 3: MASCOTA(S) (PERFILES & PERSONALIZACIÓN) =============== */}
        {/* ===================================================================================== */}
        {mainTopTab === 'pets' && (
          <View style={styles.petsSectionWrapper}>
            {!user ? (
              /* MODO INVITADO EN PESTAÑA MASCOTA(S): COHERENTE SIN DATOS AJENOS */
              <View style={{ gap: 14 }}>
                <LinearGradient
                  colors={['#191E2B', '#10131C']}
                  style={styles.quizHeroCard}
                >
                  <View style={styles.quizHeroBadge}>
                    <Text style={styles.quizHeroBadgeText}>
                      🐾 EXPLORACIÓN EN MODO INVITADO
                    </Text>
                  </View>
                  <Text style={[styles.quizHeroTitle, { marginTop: 10 }]}>
                    ¿Para qué mascota estás buscando hoy?
                  </Text>
                  <Text style={styles.quizHeroSub}>
                    Elige la especie para filtrar inmediatamente la Tienda y el
                    Quiz Biológico mientras exploras como invitado.
                  </Text>

                  <View style={[styles.quizOptionRow, { marginTop: 14 }]}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setGuestSpecies('dog');
                        setQuizWeightKg(20);
                      }}
                      style={[
                        styles.quizOptionCard,
                        guestSpecies === 'dog' && styles.quizOptionCardActive,
                      ]}
                    >
                      <Text style={styles.quizOptionEmoji}>🐶</Text>
                      <Text
                        style={[
                          styles.quizOptionLabel,
                          guestSpecies === 'dog' && styles.quizOptionLabelActive,
                        ]}
                      >
                        Perros
                      </Text>
                      <Text style={styles.quizOptionSub}>
                        {guestSpecies === 'dog'
                          ? '✓ Catálogo activo'
                          : 'Ver línea canina'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setGuestSpecies('cat');
                        setQuizWeightKg(4.5);
                      }}
                      style={[
                        styles.quizOptionCard,
                        guestSpecies === 'cat' && styles.quizOptionCardActive,
                      ]}
                    >
                      <Text style={styles.quizOptionEmoji}>🐱</Text>
                      <Text
                        style={[
                          styles.quizOptionLabel,
                          guestSpecies === 'cat' && styles.quizOptionLabelActive,
                        ]}
                      >
                        Gatos
                      </Text>
                      <Text style={styles.quizOptionSub}>
                        {guestSpecies === 'cat'
                          ? '✓ Catálogo activo'
                          : 'Ver línea felina'}
                      </Text>
                    </Pressable>
                  </View>
                </LinearGradient>

                {/* Tarjeta para invitar a iniciar sesión y registrar sus propias mascotas */}
                <View style={styles.newPetFormCard}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <View style={styles.petAvatarCircleActive}>
                      <Ionicons
                        name="paw"
                        size={22}
                        color={colors.primary.light}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.newPetFormTitle}>
                        Guarda el perfil de tu mascota
                      </Text>
                      <Text style={styles.petCardMeta}>
                        Registra su nombre, raza, peso exacto y recordatorios de
                        alimento.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openAuthModal('login');
                    }}
                    style={styles.quizPrimaryAddBtn}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={19}
                      color="#050508"
                    />
                    <Text style={styles.quizPrimaryAddBtnText}>
                      Iniciar sesión para registrar mis mascotas
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {/* Botón de primeras: Agregar otra mascota */}
                {!isAddingPet ? (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsAddingPet(true);
                    }}
                    style={styles.addNewPetTopBtn}
                  >
                    <View style={styles.addNewPetPlusCircle}>
                      <Ionicons name="add" size={20} color="#050508" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addNewPetTitle}>
                        Agregar otra mascota (Perro o Gato)
                      </Text>
                      <Text style={styles.addNewPetSub}>
                        Personaliza la Tienda y el Quiz Biológico para cada una
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.primary.light}
                    />
                  </Pressable>
                ) : (
                  /* Formulario interno para crear una nueva mascota */
                  <View style={styles.newPetFormCard}>
                    <View style={styles.newPetFormHeader}>
                      <Text style={styles.newPetFormTitle}>
                        Registrar nueva mascota
                      </Text>
                      <Pressable
                        onPress={() => setIsAddingPet(false)}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={20} color="#9CA3AF" />
                      </Pressable>
                    </View>

                    <Text style={styles.quizStepTitle}>1. ¿Es Perro o Gato?</Text>
                    <View style={styles.quizOptionRow}>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setNewPetSpecies('dog');
                          setNewPetWeight('20');
                        }}
                        style={[
                          styles.quizOptionCard,
                          newPetSpecies === 'dog' && styles.quizOptionCardActive,
                        ]}
                      >
                        <Text style={styles.quizOptionEmoji}>🐶</Text>
                        <Text
                          style={[
                            styles.quizOptionLabel,
                            newPetSpecies === 'dog' &&
                              styles.quizOptionLabelActive,
                          ]}
                        >
                          Perro
                        </Text>
                        <Text style={styles.quizOptionSub}>
                          Solo catálogo canino
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setNewPetSpecies('cat');
                          setNewPetWeight('4.5');
                        }}
                        style={[
                          styles.quizOptionCard,
                          newPetSpecies === 'cat' && styles.quizOptionCardActive,
                        ]}
                      >
                        <Text style={styles.quizOptionEmoji}>🐱</Text>
                        <Text
                          style={[
                            styles.quizOptionLabel,
                            newPetSpecies === 'cat' &&
                              styles.quizOptionLabelActive,
                          ]}
                        >
                          Gato
                        </Text>
                        <Text style={styles.quizOptionSub}>
                          Solo catálogo felino
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={styles.quizStepTitle}>2. Nombre y Raza</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        value={newPetName}
                        onChangeText={setNewPetName}
                        placeholder={
                          newPetSpecies === 'cat'
                            ? 'Ej. Luna, Michi'
                            : 'Ej. Bruno, Max'
                        }
                        placeholderTextColor="#6B7280"
                        style={[styles.petFormInput, { flex: 1 }]}
                      />
                      <TextInput
                        value={newPetBreed}
                        onChangeText={setNewPetBreed}
                        placeholder={
                          newPetSpecies === 'cat'
                            ? 'Ej. Siamés / Criollo'
                            : 'Ej. Labrador / Bulldog'
                        }
                        placeholderTextColor="#6B7280"
                        style={[styles.petFormInput, { flex: 1 }]}
                      />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginTop: 8,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quizStepTitle}>3. Peso (kg)</Text>
                        <TextInput
                          value={newPetWeight}
                          onChangeText={setNewPetWeight}
                          keyboardType="numeric"
                          placeholder="Ej. 22"
                          placeholderTextColor="#6B7280"
                          style={styles.petFormInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quizStepTitle}>Etapa</Text>
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            const stages: PetStageType[] = [
                              'puppy',
                              'adult',
                              'senior',
                            ];
                            setNewPetStage(
                              stages[(stages.indexOf(newPetStage) + 1) % 3]
                            );
                          }}
                          style={styles.petFormInput}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                            {newPetStage === 'puppy'
                              ? '🐣 Cachorro / Gatito'
                              : newPetStage === 'adult'
                              ? '🐕 Adulto (1-7 años)'
                              : '🦮 Senior (+7 años)'}{' '}
                            ⌄
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => {
                        if (!newPetName.trim()) {
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Warning
                          );
                          return;
                        }
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        );
                        addPet({
                          name: newPetName.trim(),
                          species: newPetSpecies,
                          breed:
                            newPetBreed.trim() ||
                            (newPetSpecies === 'cat'
                              ? 'Felino Consentido'
                              : 'Canino Consentido'),
                          ageStage: newPetStage,
                          weightKg: parseFloat(newPetWeight) || 15,
                          activityLevel: 'moderate',
                          sensitivity: 'none',
                          recommendedProductId:
                            newPetSpecies === 'cat' ? 'prod_9580' : 'prod_123',
                        });
                        setNewPetName('');
                        setNewPetBreed('');
                        setIsAddingPet(false);
                      }}
                      style={styles.quizPrimaryAddBtn}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#050508"
                      />
                      <Text style={styles.quizPrimaryAddBtnText}>
                        Guardar y activar esta mascota
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Lista de mascotas registradas */}
                <View style={{ gap: 12, marginTop: 14 }}>
                  {pets.map((petItem) => {
                    const isCurrent = petItem.id === activePet.id;
                    const isConfirmingDel = confirmDeletePetId === petItem.id;
                    const recBag =
                      CATALOG_BAGS.find(
                        (b) => b.id === petItem.recommendedProductId
                      ) ||
                      CATALOG_BAGS.find((b) => b.petType === petItem.species) ||
                      CATALOG_BAGS[0];

                    return (
                      <View
                        key={petItem.id}
                        style={[
                          styles.petProfileCard,
                          isCurrent && styles.petProfileCardActive,
                        ]}
                      >
                        <Pressable
                          onPress={() => {
                            Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Success
                            );
                            selectPet(petItem.id);
                          }}
                          style={styles.petCardHeaderRow}
                        >
                          <View
                            style={[
                              styles.petAvatarCircle,
                              isCurrent && styles.petAvatarCircleActive,
                            ]}
                          >
                            <Text style={{ fontSize: 26 }}>
                              {petItem.species === 'cat' ? '🐱' : '🐶'}
                            </Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <Text style={styles.petCardName}>
                                {petItem.name}
                              </Text>
                              {isCurrent && (
                                <View style={styles.petActiveBadge}>
                                  <Text style={styles.petActiveBadgeText}>
                                    Mascota Activa
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.petCardMeta}>
                              {petItem.breed} · {petItem.weightKg} kg ·{' '}
                              {petItem.ageStage === 'puppy'
                                ? 'Cachorro'
                                : petItem.ageStage === 'senior'
                                ? 'Senior'
                                : 'Adulto'}
                            </Text>
                            <Text style={styles.petExclusiveNote}>
                              ✓ Tienda filtrada 100% para{' '}
                              {petItem.species === 'cat' ? 'Gatos' : 'Perros'}
                            </Text>
                          </View>

                          <View style={{ alignItems: 'center', gap: 12 }}>
                            <View
                              style={[
                                styles.petRadioCircle,
                                isCurrent && styles.petRadioCircleActive,
                              ]}
                            >
                              {isCurrent && (
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color="#050508"
                                />
                              )}
                            </View>

                            {pets.length > 1 && !isCurrent && (
                              <Pressable
                                onPress={() => {
                                  Haptics.notificationAsync(
                                    Haptics.NotificationFeedbackType.Warning
                                  );
                                  setConfirmDeletePetId((prev) =>
                                    prev === petItem.id ? null : petItem.id
                                  );
                                }}
                                hitSlop={8}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={16}
                                  color={
                                    isConfirmingDel ? '#F87171' : '#6B7280'
                                  }
                                />
                              </Pressable>
                            )}
                          </View>
                        </Pressable>

                        {/* Confirmación interna si toca la papelera de esta mascota */}
                        {isConfirmingDel && (
                          <View style={styles.petInlineDeleteBox}>
                            <Text style={styles.petInlineDeleteText}>
                              ¿Seguro que deseas eliminar el perfil de "
                              {petItem.name}"?
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                              <Pressable
                                onPress={() => setConfirmDeletePetId(null)}
                                style={styles.petCancelDelBtn}
                              >
                                <Text style={styles.petCancelDelText}>
                                  No, conservar
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  Haptics.notificationAsync(
                                    Haptics.NotificationFeedbackType.Success
                                  );
                                  setConfirmDeletePetId(null);
                                  deletePet(petItem.id);
                                }}
                                style={styles.petConfirmDelBtn}
                              >
                                <Text style={styles.petConfirmDelText}>
                                  Sí, eliminar
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        )}

                        {/* Bulto recomendado y accesos rápidos */}
                        <View style={styles.petCardFooterActions}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.petRecLabel}>
                              Fórmula recomendada:
                            </Text>
                            <Text style={styles.petRecName} numberOfLines={1}>
                              {recBag.name} ({recBag.weightLb} LB)
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => {
                              Haptics.selectionAsync();
                              selectPet(petItem.id);
                              setQuizStage(petItem.ageStage);
                              setQuizActivity(petItem.activityLevel);
                              setQuizSensitivity(petItem.sensitivity);
                              setQuizWeightKg(petItem.weightKg);
                              setMainTopTab('quiz');
                            }}
                            style={styles.petQuizShortcutBtn}
                          >
                            <Text style={styles.petQuizShortcutText}>
                              🧬 Quiz
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              Haptics.selectionAsync();
                              selectPet(petItem.id);
                              setMainTopTab('store');
                            }}
                            style={styles.petStoreShortcutBtn}
                          >
                            <Text style={styles.petStoreShortcutText}>
                              Ir a Tienda ›
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ==================== 7.5 BURBUJA CIRCULAR ARRASTRABLE DE CARRITO (ESTILO ENGRANAJE EXPO GO · SOLO EN "TIENDA") ==================== */}
      {mainTopTab === 'store' && (
        <>
          {/* Panel flotante rápido cuando el cliente toca la burbuja del carrito */}
          {miniCartPreviewOpen && (
            <View
              style={[
                styles.floatingBubblePopoverCard,
                { bottom: Math.max(insets.bottom, 12) + 82 },
              ]}
            >
              <View style={styles.miniCartDrawerHeader}>
                <Text style={styles.miniCartDrawerTitle}>
                  🛒 {user ? `Carrito de ${activePet.name}` : 'Tu Carrito'} (
                  {cartSummary.totalItems})
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMiniCartPreviewOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              </View>

              {cartSummary.itemsList.length === 0 ? (
                <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: '#9CA3AF',
                      fontSize: 12.5,
                      textAlign: 'center',
                    }}
                  >
                    Aún no has agregado productos. Toca "+ Pedir" en cualquier
                    tarjeta para verlos aquí en tiempo real.
                  </Text>
                </View>
              ) : (
                <>
                  <ScrollView
                    style={{ maxHeight: 175 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {cartSummary.itemsList.map(({ product, quantity }, idx) => (
                      <View
                        key={product.id}
                        style={[
                          styles.miniCartItemRow,
                          idx > 0 && styles.miniCartItemDivider,
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>
                          {product.subFilter === 'medicamentos'
                            ? '💊'
                            : product.subFilter === 'humedos'
                            ? '🥫'
                            : product.subFilter === 'premios'
                            ? '🦴'
                            : product.petType === 'cat'
                            ? '🐱'
                            : '🐶'}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={styles.miniCartItemName}
                            numberOfLines={1}
                          >
                            {product.name}
                          </Text>
                          <Text style={styles.miniCartItemMeta}>
                            {product.unitLabel || `${product.weightLb} LB`} ·{' '}
                            {formatCOP(product.price * quantity)}
                          </Text>
                        </View>

                        <View style={styles.qtyStepper}>
                          <Pressable
                            onPress={() => handleDecrementCart(product.id)}
                            style={styles.qtyStepBtn}
                          >
                            <Ionicons name="remove" size={13} color="#FFFFFF" />
                          </Pressable>
                          <Text style={styles.qtyCountText}>{quantity}</Text>
                          <Pressable
                            onPress={() => handleAddToCart(product.id)}
                            style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                          >
                            <Ionicons name="add" size={13} color="#050508" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.miniCartFooterRow}>
                    <View>
                      <Text style={styles.miniCartFooterTotal}>
                        {formatCOP(cartSummary.subtotal)}
                      </Text>
                      <Text style={styles.miniCartFooterShip}>
                        {deliveryZone === 'bogota'
                          ? '🚚 Domicilio Gratis Bogotá'
                          : `📦 + Flete (${cartSummary.totalWeightLb} LB)`}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setMiniCartPreviewOpen(false);
                        setCartModalVisible(true);
                      }}
                      style={styles.storeFloatingCartCheckoutBtn}
                    >
                      <Text style={styles.storeFloatingCartCheckoutText}>
                        Confirmar pedido
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#050508"
                      />
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Burbuja Circular Arrastrable con el dedo a cualquier parte de la pantalla */}
          <Animated.View
            {...floatingCartPanResponder.panHandlers}
            style={[
              styles.draggableCartBubbleContainer,
              {
                transform: [
                  { translateX: floatingCartPos.x },
                  { translateY: floatingCartPos.y },
                  {
                    scale: isDraggingCartBubble ? 1.12 : cartPulseAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.draggableCartCircleWrap}>
              <LinearGradient
                colors={
                  cartSummary.totalItems > 0
                    ? ['#F5D061', '#D4AF37', '#AA8214']
                    : ['#222738', '#151822']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.draggableCartCircle,
                  cartSummary.totalItems > 0 &&
                    styles.draggableCartCircleActive,
                  isDraggingCartBubble && styles.draggableCartCircleDragging,
                ]}
              >
                <Ionicons
                  name={cartSummary.totalItems > 0 ? 'cart' : 'cart-outline'}
                  size={25}
                  color={cartSummary.totalItems > 0 ? '#050508' : '#FFFFFF'}
                />
              </LinearGradient>

              {/* Contador flotante fuera del LinearGradient para que nunca se recorte por el borderRadius */}
              <View
                style={[
                  styles.draggableCartBadge,
                  cartSummary.totalItems === 0 &&
                    styles.draggableCartBadgeEmpty,
                ]}
              >
                <Text
                  style={[
                    styles.draggableCartBadgeText,
                    cartSummary.totalItems === 0 && { color: '#D1D5DB' },
                  ]}
                >
                  {cartSummary.totalItems}
                </Text>
              </View>
            </View>

            {/* Mini etiqueta de precio debajo del círculo cuando lleva productos */}
            {cartSummary.totalItems > 0 && (
              <View style={styles.draggableCartPricePill}>
                <Text style={styles.draggableCartPriceText} numberOfLines={1}>
                  {formatCOP(cartSummary.subtotal)}
                </Text>
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* ==================== 8. UBER FLOATING PILL BOTTOM NAVIGATION BAR ==================== */}
      <View
        style={[
          styles.uberFloatingDockWrapper,
          { bottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <View style={styles.uberFloatingDock}>
          {/* Tab 1: Home / Inicio */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActiveBottomTab('home');
              setSelectedBrand('Todas');
            }}
            style={[
              styles.uberDockTab,
              activeBottomTab === 'home' && styles.uberDockTabActivePill,
            ]}
          >
            <Ionicons
              name={activeBottomTab === 'home' ? 'home' : 'home-outline'}
              size={20}
              color={activeBottomTab === 'home' ? '#FFFFFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.uberDockLabel,
                activeBottomTab === 'home' && styles.uberDockLabelActive,
              ]}
            >
              Inicio
            </Text>
          </Pressable>

          {/* Tab 2: Services / Marcas */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActiveBottomTab('catalog');
              setCartModalVisible(true);
            }}
            style={[
              styles.uberDockTab,
              activeBottomTab === 'catalog' && styles.uberDockTabActivePill,
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeBottomTab === 'catalog' ? '#FFFFFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.uberDockLabel,
                activeBottomTab === 'catalog' && styles.uberDockLabelActive,
              ]}
            >
              Bolsa ({cartSummary.totalItems})
            </Text>
          </Pressable>

          {/* Tab 3: Activity / Pedidos */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActiveBottomTab('activity');
              handleOrdersAccess();
            }}
            style={[
              styles.uberDockTab,
              activeBottomTab === 'activity' && styles.uberDockTabActivePill,
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={activeBottomTab === 'activity' ? '#FFFFFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.uberDockLabel,
                activeBottomTab === 'activity' && styles.uberDockLabelActive,
              ]}
            >
              Pedidos
            </Text>
          </Pressable>

          {/* Tab 4: Account / Cuenta */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActiveBottomTab('account');
              handleAccountAccess();
            }}
            style={[
              styles.uberDockTab,
              activeBottomTab === 'account' && styles.uberDockTabActivePill,
            ]}
          >
            <Ionicons
              name={user ? 'person' : 'person-outline'}
              size={20}
              color={
                activeBottomTab === 'account'
                  ? '#FFFFFF'
                  : user
                  ? colors.primary.light
                  : '#9CA3AF'
              }
            />
            <Text
              style={[
                styles.uberDockLabel,
                activeBottomTab === 'account' && styles.uberDockLabelActive,
                user && { color: colors.primary.light },
              ]}
              numberOfLines={1}
            >
              {user ? user.name.split(' ')[0] : 'Cuenta'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ==================== MODAL RESUMEN DE BOLSA / LIQUIDACIÓN DE ENVÍO ==================== */}
      <Modal
        visible={cartModalVisible}
        transparent
        animationType="fade"
        onRequestClose={animateCloseCart}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={animateCloseCart} />
          <Animated.View
            style={[
              styles.cartSheetContainer,
              isCartExpanded && styles.cartSheetContainerExpanded,
              { transform: [{ translateY: cartTranslateY }] },
            ]}
          >
            <View style={styles.cartSheetHeader}>
              <View style={styles.dragHandleHitZone} {...cartGrabberPanHandlers}>
                <View
                  style={[
                    styles.dragHandle,
                    isCartDragging && styles.dragHandleActive,
                  ]}
                />
              </View>
              <View style={styles.cartSheetTitleRow} {...cartHeaderPanHandlers}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.cartSheetTitle}>Bolsa</Text>
                  <View style={styles.cartCountHeaderPill}>
                    <Text style={styles.cartCountHeaderPillText}>
                      {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'ítem' : 'ítems'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={animateCloseCart}
                  style={styles.closeModalBtn}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.cartSheetScroll,
                { paddingBottom: Math.max(insets.bottom, 16) + 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {cartSummary.itemsList.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={42}
                    color={colors.dark.textMuted}
                  />
                  <Text style={styles.emptyCartTitle}>Tu bolsa está vacía</Text>
                  <Text style={styles.emptyCartSub}>
                    Agrega bultos de Diamond Naturals, Taste of the Wild o Acana para calcular tu entrega.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Dirección seleccionada dentro del carrito (o aviso en modo invitado) */}
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCartModalVisible(false);
                      if (user) {
                        setTimeout(() => setAddressSheetVisible(true), 200);
                      } else {
                        setTimeout(() => openAuthModal('login'), 200);
                      }
                    }}
                    style={styles.cartZoneBox}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        {user ? (
                          <>
                            <Text style={styles.cartZoneLabel}>
                              Entregar en ({selectedAddress.label} ·{' '}
                              {selectedAddress.city}):
                            </Text>
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontSize: 14,
                                fontWeight: '800',
                                marginTop: 2,
                              }}
                            >
                              {selectedAddress.address1}
                            </Text>
                            {selectedAddress.address2 ? (
                              <Text
                                style={{
                                  color: '#9CA3AF',
                                  fontSize: 12,
                                  marginTop: 2,
                                }}
                              >
                                {selectedAddress.address2}
                              </Text>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <Text style={styles.cartZoneLabel}>
                              📍 Dirección de entrega pendiente (Modo invitado)
                            </Text>
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontSize: 13.5,
                                fontWeight: '800',
                                marginTop: 2,
                              }}
                            >
                              Inicia sesión para elegir tu dirección y cobertura
                            </Text>
                          </>
                        )}
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: 'rgba(212, 175, 55, 0.14)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(212, 175, 55, 0.35)',
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary.light,
                            fontSize: 12,
                            fontWeight: '800',
                          }}
                        >
                          {user ? `Cambiar (${addresses.length})` : 'Ingresar'}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.primary.light}
                        />
                      </View>
                    </View>
                  </Pressable>

                  {/* Lista de bultos */}
                  {cartSummary.itemsList.map(({ product, quantity }) => (
                    <View key={product.id} style={styles.cartItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemName}>{product.name}</Text>
                        <Text style={styles.cartItemSub}>
                          Presentación: {product.weightLb} LB ·{' '}
                          {formatCOP(product.price)} c/u
                        </Text>
                      </View>
                      <View style={styles.qtyStepper}>
                        <Pressable
                          onPress={() => handleDecrementCart(product.id)}
                          style={styles.qtyStepBtn}
                        >
                          <Ionicons name="remove" size={15} color="#FFFFFF" />
                        </Pressable>
                        <Text style={styles.qtyCountText}>{quantity}</Text>
                        <Pressable
                          onPress={() => handleAddToCart(product.id)}
                          style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                        >
                          <Ionicons name="add" size={15} color="#050508" />
                        </Pressable>
                      </View>
                    </View>
                  ))}

                  {/* Selector estilo Uber Cash para usar Consenticoins en la Bolsa */}
                  <View style={styles.cartZoneBox}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCartModalVisible(false);
                          setTimeout(() => setWalletVisible(true), 200);
                        }}
                        style={{ flex: 1 }}
                      >
                        <Text style={styles.cartZoneLabel}>
                          🪙 BILLETERA CONSENTICOINS CASH
                        </Text>
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 13.5,
                            fontWeight: '800',
                            marginTop: 2,
                          }}
                        >
                          {user
                            ? `Saldo: ${user.points} Coins (${formatCOP(
                                user.points * COIN_VALUE_COP
                              )})`
                            : 'Tienes 250 Coins ($ 5.000) de bienvenida'}
                        </Text>
                        <Text
                          style={{
                            color: colors.primary.light,
                            fontSize: 11.5,
                            fontWeight: '700',
                            marginTop: 2,
                          }}
                        >
                          Ver extracto y bóveda de premios ›
                        </Text>
                      </Pressable>

                      {user && user.points > 0 ? (
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setApplyCoinsInCart((prev) => !prev);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: applyCoinsInCart
                              ? colors.primary.DEFAULT
                              : '#181B22',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: applyCoinsInCart
                              ? colors.primary.light
                              : 'rgba(212, 175, 55, 0.35)',
                          }}
                        >
                          <Ionicons
                            name={
                              applyCoinsInCart
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={16}
                            color={
                              applyCoinsInCart
                                ? '#050508'
                                : colors.primary.light
                            }
                          />
                          <Text
                            style={{
                              color: applyCoinsInCart
                                ? '#050508'
                                : colors.primary.light,
                              fontSize: 12,
                              fontWeight: '900',
                            }}
                          >
                            {applyCoinsInCart ? 'Aplicado' : 'Usar saldo'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>

                  {/* Desglose de Costos */}
                  <View style={styles.costBreakdownCard}>
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>
                        Subtotal ({cartSummary.totalItems} bultos ·{' '}
                        {cartSummary.totalWeightLb} LB)
                      </Text>
                      <Text style={styles.costValue}>
                        {formatCOP(cartSummary.subtotal)}
                      </Text>
                    </View>

                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>
                        {deliveryZone === 'bogota'
                          ? 'Domicilio en Bogotá D.C.'
                          : `Flete Transportadora (${cartSummary.totalWeightLb} LB)`}
                      </Text>
                      <Text
                        style={[
                          styles.costValue,
                          {
                            color:
                              deliveryZone === 'bogota'
                                ? colors.primary.light
                                : '#D1D5DB',
                          },
                        ]}
                      >
                        {deliveryZone === 'bogota'
                          ? 'Gratis ($ 0)'
                          : `+ ${formatCOP(cartSummary.estimatedCarrierFee)}`}
                      </Text>
                    </View>

                    {cartSummary.coinsDiscountCop > 0 && (
                      <View style={styles.costRow}>
                        <Text
                          style={[
                            styles.costLabel,
                            { color: colors.primary.light, fontWeight: '700' },
                          ]}
                        >
                          Redención Consenticoins (-{cartSummary.coinsToRedeem}{' '}
                          🪙)
                        </Text>
                        <Text
                          style={[
                            styles.costValue,
                            { color: colors.primary.light, fontWeight: '900' },
                          ]}
                        >
                          - {formatCOP(cartSummary.coinsDiscountCop)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>Consenticoins a ganar</Text>
                      <Text style={[styles.costValue, { color: colors.primary.light }]}>
                        +{cartSummary.totalCoins} Coins 🪙
                      </Text>
                    </View>

                    <View style={styles.costDivider} />

                    <View style={styles.costRow}>
                      <Text style={styles.costTotalLabel}>Total Estimado</Text>
                      <Text style={styles.costTotalValue}>
                        {formatCOP(cartSummary.totalWithShipping)}
                      </Text>
                    </View>
                  </View>

                  {orderSuccessToast ? (
                    <View style={styles.orderConfirmedBanner}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary.light}
                      />
                      <Text style={styles.orderConfirmedText}>
                        ¡Pedido listo!{' '}
                        {deliveryZone === 'bogota'
                          ? 'Domicilio Gratis en Bogotá confirmado.'
                          : 'Incluye guía de transportadora nacional.'}{' '}
                        (+{cartSummary.totalCoins} Coins abonados)
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => {
                        if (!user) {
                          Haptics.selectionAsync();
                          setCartModalVisible(false);
                          setTimeout(() => openAuthModal('login'), 200);
                          return;
                        }
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        );
                        if (cartSummary.coinsToRedeem > 0) {
                          redeemCoins(
                            cartSummary.coinsToRedeem,
                            'Redención en Bolsa · Descuento en Pedido',
                            `Aplicado en compra de ${cartSummary.totalItems} ítem(s)`
                          );
                        }
                        if (cartSummary.totalCoins > 0) {
                          addCoins(
                            cartSummary.totalCoins,
                            `Cashback · Pedido de ${cartSummary.totalItems} ítem(s)`,
                            `Abono automático en Billetera Consenticoins`,
                            'cashback'
                          );
                        }
                        setApplyCoinsInCart(false);
                        setOrderSuccessToast(true);
                        setTimeout(() => {
                          setOrderSuccessToast(false);
                          setCart({});
                          setCartModalVisible(false);
                        }, 2200);
                      }}
                      style={styles.checkoutGoldBtn}
                    >
                      <Text style={styles.checkoutGoldBtnText}>
                        {user
                          ? `Confirmar Pedido (${formatCOP(cartSummary.totalWithShipping)})`
                          : `Iniciar sesión para pedir (${formatCOP(cartSummary.totalWithShipping)})`}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Panel de Inbox con transición de portal desde la esquina superior derecha */}
      <InboxModal
        visible={inboxVisible}
        onClose={() => setInboxVisible(false)}
        onQuickAddProduct={(prodId) => {
          handleAddToCart(prodId);
          setCartModalVisible(true);
        }}
        onOpenProfile={() => setProfileVisible(true)}
      />

      {/* Panel Deslizable de Direcciones de Entrega */}
      <AddressSelectorSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
      />

      {/* Panel Deslizable exclusivo de Pedidos del Cliente */}
      <CustomerOrdersSheet
        visible={ordersVisible}
        onClose={() => setOrdersVisible(false)}
        onReorderItems={(skus) => {
          skus.forEach((sku) => {
            const matched = CATALOG_BAGS.find((b) => b.sku === sku);
            if (matched) {
              handleAddToCart(matched.id);
            }
          });
        }}
      />

      {/* Panel Deslizable de Cuenta del Cliente */}
      <CustomerProfileSheet
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        onManageAddresses={() => {
          setProfileVisible(false);
          setTimeout(() => setAddressSheetVisible(true), 220);
        }}
        onOpenOrders={() => {
          setProfileVisible(false);
          setTimeout(() => setOrdersVisible(true), 220);
        }}
        onOpenWallet={() => {
          setProfileVisible(false);
          setTimeout(() => setWalletVisible(true), 220);
        }}
      />

      {/* Billetera Bancaria Consenticoins Cash (Extracto, Tarjeta Metálica y Bóveda de Canje) */}
      <ConsenticoinsWalletModal
        visible={walletVisible}
        onClose={() => setWalletVisible(false)}
        applyCoinsInCart={applyCoinsInCart}
        onToggleApplyCoinsInCart={(val) => setApplyCoinsInCart(val)}
        onOpenCartWithCoins={() => {
          setCartModalVisible(true);
        }}
        onRedeemFreeProduct={(prodId) => {
          handleAddToCart(prodId);
        }}
      />

      {/* Vista Especializada del ADN de cada Marca Insignia y su Catálogo Completo */}
      <BrandDnaModal
        visible={brandDnaModalVisible}
        brand={activeBrandDna}
        activeSpecies={activeSpecies}
        petName={displayPetName}
        deliveryZone={deliveryZone}
        products={CATALOG_BAGS}
        cart={cart}
        onClose={() => setBrandDnaModalVisible(false)}
        onSelectBrand={(newBrand) => setActiveBrandDna(newBrand)}
        onAddToCart={handleAddToCart}
        onDecrementCart={handleDecrementCart}
        onInspectProduct={(prod) => openProductDetail(prod as ProductBag)}
        onOpenCart={() => {
          setBrandDnaModalVisible(false);
          setTimeout(() => setCartModalVisible(true), 180);
        }}
      />

      {/* ==================== MODAL DETALLE DE PRODUCTO ==================== */}
      {productDetailVisible && selectedProduct && (
        <Modal
          visible={productDetailVisible}
          transparent
          animationType="none"
          onRequestClose={closeProductDetail}
          statusBarTranslucent
        >
          {/* Backdrop — tap to dismiss */}
          <Pressable
            style={styles.productDetailBackdrop}
            onPress={closeProductDetail}
          >
            {/* Stop propagation so taps on the card don't dismiss */}
            <Animated.View
              style={[
                styles.productDetailCard,
                {
                  opacity: productDetailAnim,
                  transform: [
                    { scale: productDetailScale },
                    { translateY: productDetailTransY },
                  ],
                },
              ]}
            >
              <Pressable onPress={() => {}}>
                {/* Top luxury gold subtle glow */}
                <LinearGradient
                  colors={[
                    'rgba(212, 175, 55, 0.16)',
                    'rgba(212, 175, 55, 0.03)',
                    'transparent',
                  ]}
                  style={styles.productDetailGradientTop}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                {/* Close button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeProductDetail}
                  style={styles.productDetailCloseBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Brand + emoji (clicable para abrir el ADN de la marca) */}
                <Pressable
                  onPress={() => {
                    if (selectedProduct.brand !== 'Salud Vet') {
                      const targetBrand =
                        selectedProduct.brand as FoodBrandName;
                      closeProductDetail();
                      setTimeout(() => openBrandDna(targetBrand), 180);
                    }
                  }}
                  style={styles.productDetailBrandRow}
                >
                  <View style={styles.productDetailEmojiBox}>
                    <Text style={{ fontSize: 34 }}>
                      {selectedProduct.brand === 'Diamond Naturals'
                        ? '💎'
                        : selectedProduct.brand === 'Taste of the Wild'
                          ? '🐺'
                          : selectedProduct.brand === 'Acana'
                            ? '🍁'
                            : selectedProduct.brand === 'Orijen'
                              ? '👑'
                              : '🛍️'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productDetailBrand}>
                      {selectedProduct.brand}
                      {selectedProduct.brand !== 'Salud Vet'
                        ? ' · Ver ADN ›'
                        : ''}
                    </Text>
                    <View style={styles.productDetailStagePill}>
                      <Text style={styles.productDetailStageText}>
                        {selectedProduct.stage}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Product name */}
                <Text style={styles.productDetailName}>
                  {selectedProduct.name}
                </Text>

                {/* Protein / description */}
                <Text style={styles.productDetailProtein}>
                  {selectedProduct.protein}
                </Text>

                {/* Specs row */}
                <View style={styles.productDetailSpecsRow}>
                  <View style={styles.productDetailSpecBox}>
                    <Text style={styles.productDetailSpecValue}>
                      {selectedProduct.unitLabel ??
                        `${selectedProduct.weightLb} LB`}
                    </Text>
                    <Text style={styles.productDetailSpecLabel}>Presentación</Text>
                  </View>
                  <View style={styles.productDetailSpecDivider} />
                  <View style={styles.productDetailSpecBox}>
                    <Text style={styles.productDetailSpecValue}>
                      {selectedProduct.petType === 'dog' ? '🐶 Perro' : '🐱 Gato'}
                    </Text>
                    <Text style={styles.productDetailSpecLabel}>Especie</Text>
                  </View>
                  <View style={styles.productDetailSpecDivider} />
                  <View style={styles.productDetailSpecBox}>
                    <Text
                      style={[
                        styles.productDetailSpecValue,
                        { color: colors.primary.light },
                      ]}
                    >
                      +{selectedProduct.coins} 🪙
                    </Text>
                    <Text style={styles.productDetailSpecLabel}>
                      Consenticoins
                    </Text>
                  </View>
                </View>

                {/* Delivery info */}
                <View style={styles.productDetailDeliveryRow}>
                  <Ionicons
                    name="car-outline"
                    size={16}
                    color={
                      deliveryZone === 'bogota'
                        ? colors.primary.light
                        : '#9CA3AF'
                    }
                  />
                  <Text
                    style={[
                      styles.productDetailDeliveryText,
                      {
                        color:
                          deliveryZone === 'bogota'
                            ? '#FFFFFF'
                            : '#9CA3AF',
                      },
                    ]}
                  >
                    {deliveryZone === 'bogota'
                      ? 'Domicilio Gratis en Bogotá'
                      : '+ Flete transportadora'}
                  </Text>
                  {selectedProduct.tag ? (
                    <View style={styles.productDetailTagPill}>
                      <Text style={styles.productDetailTagText}>
                        {selectedProduct.tag}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Price + Add button */}
                <View style={styles.productDetailFooter}>
                  <View>
                    <Text style={styles.productDetailPriceLabel}>Precio</Text>
                    <Text style={styles.productDetailPrice}>
                      {formatCOP(selectedProduct.price)}
                    </Text>
                  </View>

                  {(() => {
                    const inCart = cart[selectedProduct.id] ?? 0;
                    return inCart > 0 ? (
                      <View style={styles.productDetailQtyRow}>
                        <Pressable
                          onPress={() => handleDecrementCart(selectedProduct.id)}
                          style={styles.productDetailQtyBtn}
                          hitSlop={8}
                        >
                          <Ionicons name="remove" size={18} color="#FFFFFF" />
                        </Pressable>
                        <Text style={styles.productDetailQtyText}>{inCart}</Text>
                        <Pressable
                          onPress={() => handleAddToCart(selectedProduct.id)}
                          style={[
                            styles.productDetailQtyBtn,
                            { backgroundColor: '#D4AF37' },
                          ]}
                          hitSlop={8}
                        >
                          <Ionicons name="add" size={18} color="#050508" />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleAddToCart(selectedProduct.id)}
                        style={styles.productDetailAddBtn}
                      >
                        <Ionicons name="cart-outline" size={18} color="#050508" />
                        <Text style={styles.productDetailAddText}>
                          Agregar al carrito
                        </Text>
                      </Pressable>
                    );
                  })()}
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0B0E',
  },
  /* ==================== 1. UBER HEADER ==================== */
  uberTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
    paddingRight: 12,
  },
  headerLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#050508',
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    overflow: 'hidden',
  },
  headerLogoImg: {
    width: '100%',
    height: '100%',
  },
  locationTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  locationTopLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationLabelEyebrow: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  locationZoneTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  inboxBagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181B22',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inboxBagText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  activeGoldDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary.DEFAULT,
  },

  /* ==================== 2. UBER TOP TABS ==================== */
  uberTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
  },
  uberTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    position: 'relative',
  },
  uberTabEmoji: {
    fontSize: 16,
  },
  uberTabText: {
    color: '#9CA3AF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  uberTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  uberTabActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  /* ==================== 3. UBER SEARCH PILL + MINI MENÚ FLOTANTE ==================== */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 115,
  },
  searchPillWrapper: {
    position: 'relative',
    zIndex: 50,
    marginBottom: 14,
  },
  uberSearchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 32,
    paddingLeft: 18,
    paddingRight: 8,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  uberSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  uberLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0A0B0E',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  uberLaterButtonActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  uberLaterText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  categoryFloatingMenu: {
    marginTop: 10,
    backgroundColor: '#141720',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 18,
  },
  categoryMenuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 4,
  },
  categoryMenuHeaderText: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  categoryMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 54,
  },
  categoryMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  categoryMenuItemRowActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  categoryMenuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E2230',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  categoryMenuIconBoxActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: colors.primary.DEFAULT,
  },
  categoryMenuTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  categoryCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCountText: {
    color: '#D1D5DB',
    fontSize: 10.5,
    fontWeight: '800',
  },
  categoryMenuSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 1,
  },
  categoryMenuRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryMenuRadioActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },

  /* ==================== 4. UBER RECENT STACKED CARD ==================== */
  uberRecentCard: {
    backgroundColor: '#12141A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 26,
  },
  uberRecentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  uberClockIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E212B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberRecentTextCol: {
    flex: 1,
  },
  uberRecentTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  uberRecentSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  uberRecentDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginLeft: 70,
  },

  /* ==================== 5. UBER "FOR YOU" 4 CIRCLES ==================== */
  uberSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  uberSectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  uberSmallArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 'auto',
  },
  clearFilterLink: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '700',
  },
  uberCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  uberCircleItem: {
    width: '23%',
    alignItems: 'center',
    gap: 8,
  },
  uberCircleGraphic: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  uberCircleGraphicActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },
  uberCircleEmoji: {
    fontSize: 30,
  },
  uberCircleLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  uberCircleSubLabel: {
    color: colors.primary.light,
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -4,
  },

  /* ==================== 6. UBER HORIZONTAL CARDS ==================== */
  uberHorizontalCardsScroll: {
    gap: 14,
    paddingRight: 16,
  },
  uberFeatureCard: {
    width: 256,
  },
  uberCardGraphicArea: {
    height: 148,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  uberCardTopBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uberBrandBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  uberBrandBadgeText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
  },
  uberWeightPill: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  uberWeightPillText: {
    color: '#050508',
    fontSize: 11,
    fontWeight: '900',
  },
  uberCardVisualCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagIllustrationCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberCardBottomTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uberCardBottomTagText: {
    color: '#050508',
    fontSize: 10,
    fontWeight: '800',
  },
  uberCardBody: {
    paddingHorizontal: 2,
  },
  uberCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  uberCardSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 8,
  },
  uberCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uberCardPrice: {
    color: colors.primary.light,
    fontSize: 16,
    fontWeight: '900',
  },
  uberAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  uberAddBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '800',
  },
  uberPromoWideCard: {
    width: 260,
  },
  uberPromoVisual: {
    height: 125,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  uberPromoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uberPromoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  uberPromoBigCoins: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  /* ==================== 7.5 BURBUJA CIRCULAR ARRASTRABLE DE CARRITO (ESTILO EXPO GO) ==================== */
  draggableCartBubbleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 90,
    alignItems: 'center',
  },
  draggableCartCircleWrap: {
    width: 58,
    height: 58,
    position: 'relative',
  },
  draggableCartCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 18,
  },
  draggableCartCircleActive: {
    borderColor: '#FFFFFF',
  },
  draggableCartCircleDragging: {
    borderColor: colors.primary.light,
    shadowOpacity: 0.85,
    shadowRadius: 18,
  },
  draggableCartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#0A0B0E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    zIndex: 10,
    elevation: 22,
  },
  draggableCartBadgeEmpty: {
    backgroundColor: '#181B22',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  draggableCartBadgeText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '900',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  draggableCartPricePill: {
    marginTop: 4,
    backgroundColor: 'rgba(10, 11, 14, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  draggableCartPriceText: {
    color: colors.primary.light,
    fontSize: 10.5,
    fontWeight: '900',
  },
  floatingBubblePopoverCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 88,
    backgroundColor: '#12151C',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.72,
    shadowRadius: 20,
    elevation: 20,
  },
  miniCartDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniCartDrawerTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  miniCartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  miniCartItemDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  miniCartItemName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  miniCartItemMeta: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 1,
  },
  miniCartFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniCartFooterTotal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  miniCartFooterShip: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  storeFloatingCartCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  storeFloatingCartCheckoutText: {
    color: '#050508',
    fontSize: 12.5,
    fontWeight: '900',
  },

  /* ==================== 8. UBER FLOATING PILL BOTTOM DOCK ==================== */
  uberFloatingDockWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 22,
    right: 22,
  },
  uberFloatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16181F',
    borderRadius: 38,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  uberDockTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 30,
    gap: 2,
  },
  uberDockTabActivePill: {
    backgroundColor: '#262934',
  },
  uberDockLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  uberDockLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ==================== CARRITO & STEPPERS ==================== */
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    gap: 8,
  },
  qtyStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepBtnPlus: {
    backgroundColor: colors.primary.DEFAULT,
  },
  qtyCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  cartSheetContainer: {
    maxHeight: '86%',
    backgroundColor: '#0A0B0E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cartSheetContainerExpanded: {
    maxHeight: '95%',
    height: '95%',
  },
  cartSheetHeader: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0A0B0E',
    zIndex: 30,
    elevation: 30,
  },
  dragHandleHitZone: {
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dragHandleActive: {
    width: 52,
    backgroundColor: '#FFFFFF',
  },
  cartSheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cartSheetTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cartCountHeaderPill: {
    backgroundColor: '#181B22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cartCountHeaderPillText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    elevation: 35,
  },
  cartSheetScroll: {
    padding: 20,
    paddingBottom: 42,
    gap: 14,
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyCartTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCartSub: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  cartZoneBox: {
    backgroundColor: '#12151C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cartZoneLabel: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  logisticsSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#0A0B0E',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  zonePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  zonePillBogotaActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  zonePillNacionalActive: {
    backgroundColor: '#181B22',
  },
  zonePillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  zonePillTextActive: {
    color: '#0A0B0E',
    fontWeight: '800',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12151C',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  cartItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cartItemSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  costBreakdownCard: {
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  costValue: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  costDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 4,
  },
  costTotalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  costTotalValue: {
    color: colors.primary.light,
    fontSize: 18,
    fontWeight: '900',
  },
  checkoutGoldBtn: {
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  checkoutGoldBtnText: {
    color: '#050508',
    fontSize: 14.5,
    fontWeight: '900',
  },
  orderConfirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#12151C',
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    padding: 14,
    borderRadius: 16,
  },
  orderConfirmedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  /* ==================== ESTILOS QUIZ BIOLÓGICO (PESTAÑA 2) ==================== */
  quizSectionWrapper: {
    gap: 10,
  },
  quizHeroCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 4,
  },
  quizHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizHeroBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quizHeroBadgeText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quizSwitchPetPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quizSwitchPetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quizHeroTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  quizHeroSub: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  quizStepTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  quizOptionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quizOptionCard: {
    flex: 1,
    backgroundColor: '#141720',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  quizOptionCardActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderColor: colors.primary.DEFAULT,
  },
  quizOptionEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  quizOptionLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
  },
  quizOptionLabelActive: {
    color: colors.primary.light,
  },
  quizOptionSub: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  quizWeightChip: {
    backgroundColor: '#141720',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quizWeightChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  quizWeightChipText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
  },
  quizWeightChipTextActive: {
    color: '#050508',
  },
  quizSensitivityGrid: {
    gap: 8,
  },
  quizSensCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141720',
    borderRadius: 15,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  quizSensTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quizSensSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  quizResultCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
  },
  quizResultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quizMatchPill: {
    backgroundColor: '#1C202B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  quizMatchPillText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '800',
  },
  quizWeightBadgeText: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '900',
  },
  quizResultProdTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  quizResultProdSub: {
    color: '#D1D5DB',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 14,
  },
  quizMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quizMetricBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  quizMetricValue: {
    color: colors.primary.light,
    fontSize: 14,
    fontWeight: '900',
  },
  quizMetricLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  quizResultActions: {
    gap: 10,
  },
  quizPrimaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 14,
    borderRadius: 14,
  },
  quizPrimaryAddBtnText: {
    color: '#050508',
    fontSize: 14,
    fontWeight: '900',
  },
  quizSecondarySaveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  quizSecondarySaveText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ==================== ESTILOS MASCOTA(S) (PESTAÑA 3) ==================== */
  petsSectionWrapper: {
    gap: 6,
  },
  addNewPetTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.09)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  addNewPetPlusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewPetTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  addNewPetSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  newPetFormCard: {
    backgroundColor: '#141720',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    gap: 8,
  },
  newPetFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  newPetFormTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  petFormInput: {
    backgroundColor: '#1B1F2B',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  petProfileCard: {
    backgroundColor: '#141720',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  petProfileCardActive: {
    backgroundColor: '#181C27',
    borderColor: colors.primary.DEFAULT,
  },
  petCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#222634',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarCircleActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
  },
  petCardName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  petActiveBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  petActiveBadgeText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
  },
  petCardMeta: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 2,
  },
  petExclusiveNote: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  petRadioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petRadioCircleActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  petInlineDeleteBox: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(248, 113, 113, 0.25)',
    gap: 8,
  },
  petInlineDeleteText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  petCancelDelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  petCancelDelText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  petConfirmDelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  petConfirmDelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  petCardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  petRecLabel: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  petRecName: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '800',
  },
  petQuizShortcutBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  petQuizShortcutText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '800',
  },
  petStoreShortcutBtn: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  petStoreShortcutText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '900',
  },

  // ===== SEARCH RESULTS PANEL =====
  searchResultsPanel: {
    marginBottom: 20,
    backgroundColor: '#12151C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchResultsTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  searchResultsClearBtn: {
    marginLeft: 10,
  },
  searchResultsClearText: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '700',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 13,
  },
  searchResultIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchResultName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  searchResultProtein: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 5,
  },
  searchResultPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  searchResultPrice: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  searchResultWeight: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  searchResultTag: {
    backgroundColor: '#1C202B',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  searchResultTagText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '700',
  },
  searchResultAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchResultQtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultQtyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  searchEmptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  searchEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  searchEmptySubtitle: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  searchEmptyResetBtn: {
    backgroundColor: '#1C202B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchEmptyResetText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // ===== PRODUCT DETAIL MODAL =====
  productDetailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  productDetailCard: {
    width: '100%',
    backgroundColor: '#12151C',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  productDetailGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    borderRadius: 28,
  },
  productDetailCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  productDetailBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 12,
  },
  productDetailEmojiBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1C202B',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetailBrand: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  productDetailStagePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C202B',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  productDetailStageText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
  },
  productDetailName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 22,
    marginBottom: 6,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  productDetailProtein: {
    color: '#9CA3AF',
    fontSize: 13.5,
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  productDetailSpecsRow: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginBottom: 18,
    backgroundColor: '#0A0B0E',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  productDetailSpecBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  productDetailSpecValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  productDetailSpecLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  productDetailSpecDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 4,
  },
  productDetailDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 22,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  productDetailDeliveryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productDetailTagPill: {
    backgroundColor: '#1C202B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  productDetailTagText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
  },
  productDetailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 12,
  },
  productDetailPriceLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  productDetailPrice: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  productDetailAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
  productDetailAddText: {
    color: '#050508',
    fontSize: 14,
    fontWeight: '900',
  },
  productDetailQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productDetailQtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E212B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetailQtyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
});
