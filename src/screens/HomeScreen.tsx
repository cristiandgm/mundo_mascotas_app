import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
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
import { AddressSelectorSheet } from '../components/AddressSelectorSheet';
import { InboxModal } from '../components/InboxModal';
import { useAuth } from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

type DeliveryZoneType = 'bogota' | 'nacional';
type TopServiceTabType = 'bultos' | 'snacks';
type BottomNavTab = 'home' | 'catalog' | 'activity' | 'account';

interface ProductBag {
  id: string;
  sku: string;
  brand: 'Diamond Naturals' | 'Taste of the Wild' | 'Acana' | 'Orijen';
  name: string;
  protein: string;
  weightLb: number;
  unitLabel?: string;
  price: number;
  coins: number;
  petType: 'dog' | 'cat';
  category: TopServiceTabType;
  subFilter?: 'humedos' | 'premios' | 'higiene';
  stage: string;
  tag?: string;
  accentColor: string;
}

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

  // ==================== PERROS: SNACKS & CUIDADO ====================
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

  // ==================== GATOS: HÚMEDOS & ARENA ====================
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

// Los 4 círculos estilo "For you" de Uber para la pestaña Bultos
const FOR_YOU_BULTOS_CIRCLES = [
  { id: 'Todas', label: 'Todos', emoji: '🐾', sub: 'Ver todo' },
  { id: 'Diamond Naturals', label: 'Diamond', emoji: '💎', sub: 'Super Premium' },
  { id: 'Taste of the Wild', label: 'Taste', emoji: '🐺', sub: 'Grain-Free' },
  { id: 'Acana', label: 'Acana & +', emoji: '🥩', sub: 'Biológico' },
];

// Los 4 círculos estilo "For you" de Uber para la pestaña Snacks & Cuidado
const FOR_YOU_SNACKS_CIRCLES = [
  { id: 'Todas', label: 'Todos', emoji: '✨', sub: 'Ver todo' },
  { id: 'humedos', label: 'Húmedos', emoji: '🥫', sub: 'Latas en salsa' },
  { id: 'premios', label: 'Premios', emoji: '🦴', sub: 'Treats & Galletas' },
  { id: 'higiene', label: 'Cuidado', emoji: '🧼', sub: 'Higiene & Arena' },
];

export const HomeScreen: React.FC = () => {
  const { user, openAuthModal, selectedAddress, addresses } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileVisible, setProfileVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [inboxVisible, setInboxVisible] = useState(false);

  // Zona derivada automáticamente de la dirección seleccionada por el cliente
  const deliveryZone: DeliveryZoneType = selectedAddress.isBogota
    ? 'bogota'
    : 'nacional';

  // Especie exclusiva según la mascota del cliente:
  // - Si user.petType === 'dog' -> 100% Perros (cero rastro de gatos)
  // - Si user.petType === 'cat' -> 100% Gatos (cero rastro de perros)
  // - Si es Invitado (!user) o tiene Ambos ('both') -> usa fallbackSpecies
  const [fallbackSpecies, setFallbackSpecies] = useState<'dog' | 'cat'>('dog');
  const activeSpecies: 'dog' | 'cat' =
    user?.petType === 'dog'
      ? 'dog'
      : user?.petType === 'cat'
      ? 'cat'
      : fallbackSpecies;

  const isMultiOrGuest = !user || user.petType === 'both';

  // Pestañas superiores estilo Uber (Opción A: Concentrados Bultos | Snacks & Cuidado)
  const [topTab, setTopTab] = useState<TopServiceTabType>('bultos');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTab>('home');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeightFilter, setSelectedWeightFilter] = useState<number | null>(null);

  // Carrito: { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderSuccessToast, setOrderSuccessToast] = useState(false);

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
    setAddressSheetVisible(true);
  };

  const handleAccountAccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) {
      setProfileVisible(true);
    } else {
      openAuthModal('login');
    }
  };

  const handleAddToCart = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
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

  const handleCycleWeightFilter = () => {
    Haptics.selectionAsync();
    const weights =
      activeSpecies === 'cat'
        ? [null, 18, 14, 12, 10]
        : [null, 40, 30, 28, 25];
    const nextIdx = (weights.indexOf(selectedWeightFilter) + 1) % weights.length;
    setSelectedWeightFilter(weights[nextIdx]);
  };

  // Filtrado de productos 100% personalizado a la especie de la mascota del cliente
  const filteredProducts = useMemo(() => {
    return CATALOG_BAGS.filter((item) => {
      // Nunca mostrar productos de otra especie que el cliente no tiene
      if (item.petType !== activeSpecies) return false;

      // Filtrar por pestaña superior (Bultos vs Snacks & Cuidado) salvo que esté escribiendo en el buscador
      if (!searchQuery.trim() && item.category !== topTab) return false;

      if (selectedBrand !== 'Todas') {
        if (topTab === 'snacks') {
          if (item.subFilter !== selectedBrand) return false;
        } else if (selectedBrand === 'Acana') {
          if (item.brand !== 'Acana' && item.brand !== 'Orijen') return false;
        } else if (item.brand !== selectedBrand) {
          return false;
        }
      }
      if (
        topTab === 'bultos' &&
        selectedWeightFilter &&
        item.weightLb !== selectedWeightFilter
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.protein.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          `${item.weightLb}`.includes(q)
        );
      }
      return true;
    });
  }, [activeSpecies, topTab, selectedBrand, selectedWeightFilter, searchQuery]);

  // Los 2 productos frecuentes para la tarjeta de Reloj estilo Uber según la mascota y pestaña activa
  const recentQuickItems = useMemo(() => {
    return CATALOG_BAGS.filter(
      (item) => item.petType === activeSpecies && item.category === topTab
    ).slice(0, 2);
  }, [activeSpecies, topTab]);

  const activeCircles =
    topTab === 'bultos' ? FOR_YOU_BULTOS_CIRCLES : FOR_YOU_SNACKS_CIRCLES;

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

    return {
      totalItems,
      subtotal,
      totalWeightLb,
      totalCoins,
      estimatedCarrierFee,
      totalWithShipping: subtotal + estimatedCarrierFee,
      itemsList,
    };
  }, [cart, deliveryZone]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ==================== 1. UBER HEADER: LOCATION + INBOX/BOLSA ==================== */}
      <View style={styles.uberTopHeader}>
        <Pressable
          onPress={handleToggleZone}
          style={styles.locationSelectorRow}
          hitSlop={8}
        >
          <View
            style={[
              styles.locationDot,
              {
                backgroundColor:
                  deliveryZone === 'bogota' ? '#3B82F6' : '#F59E0B',
              },
            ]}
          />
          <View style={styles.locationTextCol}>
            <View style={styles.locationTopLineRow}>
              <Text style={styles.locationLabelEyebrow} numberOfLines={1}>
                Entregar en {selectedAddress.label}
              </Text>
              <Text
                style={[
                  styles.locationZoneTagText,
                  {
                    color: deliveryZone === 'bogota' ? '#34D399' : '#FBBF24',
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
                size={14}
                color={colors.primary.light}
              />
            </View>

            <Text style={styles.locationText} numberOfLines={1}>
              {selectedAddress.address1}
              {selectedAddress.locality
                ? ` · ${selectedAddress.locality}`
                : ''}, {selectedAddress.city}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setInboxVisible(true);
          }}
          style={styles.inboxBagPill}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={17} color="#FFFFFF" />
          <Text style={styles.inboxBagText}>Inbox</Text>
          <View style={styles.activeGoldDot} />
        </Pressable>
      </View>

      {/* ==================== 2. UBER TOP TABS (OPCIÓN A: CONCENTRADOS BULTOS | SNACKS & CUIDADO) ==================== */}
      <View style={styles.uberTabsContainer}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setTopTab('bultos');
            setSelectedBrand('Todas');
            setSelectedWeightFilter(null);
          }}
          style={styles.uberTabItem}
        >
          <Text style={styles.uberTabEmoji}>
            {activeSpecies === 'cat' ? '🐱' : '🐶'}
          </Text>
          <Text
            style={[
              styles.uberTabText,
              topTab === 'bultos' && styles.uberTabTextActive,
            ]}
          >
            Concentrados
          </Text>
          {topTab === 'bultos' && <View style={styles.uberTabActiveIndicator} />}
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setTopTab('snacks');
            setSelectedBrand('Todas');
            setSelectedWeightFilter(null);
          }}
          style={styles.uberTabItem}
        >
          <Text style={styles.uberTabEmoji}>
            {activeSpecies === 'cat' ? '🐟' : '🦴'}
          </Text>
          <Text
            style={[
              styles.uberTabText,
              topTab === 'snacks' && styles.uberTabTextActive,
            ]}
          >
            {activeSpecies === 'cat' ? 'Húmedos & Arena' : 'Snacks & Cuidado'}
          </Text>
          {topTab === 'snacks' && <View style={styles.uberTabActiveIndicator} />}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 98 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== 3. UBER SEARCH PILL ("Where to?" + Later button) ==================== */}
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
            placeholder={
              topTab === 'bultos'
                ? user?.petName
                  ? `¿Qué bulto busca ${user.petName}?`
                  : activeSpecies === 'cat'
                  ? '¿Qué bulto busca tu gato?'
                  : '¿Qué bulto busca tu perro?'
                : user?.petName
                ? `¿Qué premio o cuidado busca ${user.petName}?`
                : 'Buscar húmedos, premios o cuidado...'
            }
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

          {/* Botón interno estilo "Later" de Uber para filtrar por Libras (solo en Bultos) */}
          {topTab === 'bultos' && (
            <Pressable
              onPress={handleCycleWeightFilter}
              style={[
                styles.uberLaterButton,
                selectedWeightFilter !== null && styles.uberLaterButtonActive,
              ]}
            >
              <Ionicons
                name="barbell-outline"
                size={14}
                color={selectedWeightFilter ? '#050508' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.uberLaterText,
                  selectedWeightFilter !== null && { color: '#050508' },
                ]}
              >
                {selectedWeightFilter ? `${selectedWeightFilter} LB` : 'Peso LB'}
              </Text>
            </Pressable>
          )}
        </Pressable>

        {/* ==================== 4. UBER RECENT / QUICK REORDER STACKED CARD ==================== */}
        <View style={styles.uberRecentCard}>
          {recentQuickItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={styles.uberRecentDivider} />}
              <Pressable
                onPress={() => handleAddToCart(item.id)}
                style={({ pressed }) => [
                  styles.uberRecentRow,
                  pressed && { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                ]}
              >
                <View style={styles.uberClockIconBox}>
                  <Ionicons name="time-outline" size={20} color="#D1D5DB" />
                </View>
                <View style={styles.uberRecentTextCol}>
                  <Text style={styles.uberRecentTitle} numberOfLines={1}>
                    {item.name} ({item.unitLabel || `${item.weightLb} LB`})
                  </Text>
                  <Text style={styles.uberRecentSubtitle} numberOfLines={1}>
                    {formatCOP(item.price)} ·{' '}
                    {deliveryZone === 'bogota'
                      ? 'Domicilio Gratis en Bogotá'
                      : `+${item.coins} Consenticoins`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        {/* ==================== 5. UBER "FOR YOU" 4 CIRCULAR ICONS PERSONALIZADOS ==================== */}
        <View style={styles.uberSectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.uberSectionTitle}>
              {user?.petName
                ? `Para ${user.petName} ${activeSpecies === 'cat' ? '🐱' : '🐶'}`
                : activeSpecies === 'cat'
                ? 'Especial para tu Gato 🐱'
                : 'Especial para tu Perro 🐶'}
            </Text>
            <View style={styles.uberSmallArrowCircle}>
              <Ionicons name="chevron-forward" size={13} color="#D1D5DB" />
            </View>
          </View>

          {/* Solo si es Invitado o tiene Perro y Gato ('both'), permitir alternar especie */}
          {isMultiOrGuest && (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setFallbackSpecies((prev) => (prev === 'dog' ? 'cat' : 'dog'));
                setSelectedBrand('Todas');
                setSelectedWeightFilter(null);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#1C1E26',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text style={{ fontSize: 12 }}>
                {activeSpecies === 'dog' ? '🐱' : '🐶'}
              </Text>
              <Text
                style={{
                  color: '#D1D5DB',
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {activeSpecies === 'dog' ? 'Cambiar a Gato' : 'Cambiar a Perro'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.uberCirclesRow}>
          {activeCircles.map((item) => {
            const isSelected = selectedBrand === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedBrand(item.id);
                }}
                style={styles.uberCircleItem}
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
                    isSelected && { color: colors.primary.light, fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ==================== 6. UBER HORIZONTAL CARDS ==================== */}
        <View style={styles.uberSectionHeader}>
          <Text style={styles.uberSectionTitle}>
            {topTab === 'bultos'
              ? selectedBrand === 'Todas'
                ? activeSpecies === 'cat'
                  ? 'Bultos Super Premium Gatos'
                  : 'Bultos Super Premium Perros'
                : `Línea ${selectedBrand}`
              : activeSpecies === 'cat'
              ? 'Húmedos, Premios y Arena Felina'
              : 'Latas Húmedas, Premios y Cuidado'}
          </Text>
          {selectedBrand !== 'Todas' || selectedWeightFilter !== null ? (
            <Pressable
              onPress={() => {
                setSelectedBrand('Todas');
                setSelectedWeightFilter(null);
              }}
            >
              <Text style={styles.clearFilterLink}>Ver todos</Text>
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
                {/* Banner gráfico superior estilo ilustración de Uber */}
                <LinearGradient
                  colors={['#1A1E2E', '#10131C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.uberCardGraphicArea}
                >
                  <View style={styles.uberCardTopBadges}>
                    <View style={styles.uberBrandBadge}>
                      <Text style={styles.uberBrandBadgeText}>
                        {product.brand}
                      </Text>
                    </View>
                    <View style={styles.uberWeightPill}>
                      <Text style={styles.uberWeightPillText}>
                        {product.unitLabel || `${product.weightLb} LB`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.uberCardVisualCenter}>
                    <View
                      style={[
                        styles.bagIllustrationCircle,
                        { borderColor: `${product.accentColor}55` },
                      ]}
                    >
                      <Text style={{ fontSize: 34 }}>
                        {product.category === 'snacks'
                          ? product.subFilter === 'humedos'
                            ? '🥫'
                            : product.subFilter === 'higiene'
                            ? '🧼'
                            : '🦴'
                          : product.petType === 'cat'
                          ? '🐱'
                          : '🐶'}
                      </Text>
                    </View>
                  </View>

                  {/* Etiqueta flotante inferior estilo logo Uber en la tarjeta */}
                  <View style={styles.uberCardBottomTag}>
                    <Text style={styles.uberCardBottomTagText}>
                      {deliveryZone === 'bogota'
                        ? '🚚 Domicilio Gratis Bogotá'
                        : '📦 + Recargo transportadora'}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Texto inferior y botón de compra */}
                <View style={styles.uberCardBody}>
                  <Text style={styles.uberCardTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.uberCardSubtitle} numberOfLines={1}>
                    {product.protein} · +{product.coins} Coins
                  </Text>

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
                          <Ionicons name="remove" size={14} color="#FFFFFF" />
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

        {/* ==================== 7. SEGUNDA SECCIÓN ESTILO UBER ("Más beneficios Mundo Mascotas") ==================== */}
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
          {/* Tarjeta 1: Billetera Consenticoins */}
          <Pressable
            onPress={handleAccountAccess}
            style={styles.uberPromoWideCard}
          >
            <LinearGradient
              colors={['#C69214', '#D4AF37', '#8A5A10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.uberPromoVisual}
            >
              <View style={styles.uberPromoBadge}>
                <Text style={styles.uberPromoBadgeText}>CLUB VIP</Text>
              </View>
              <Text style={styles.uberPromoBigCoins}>
                {user?.points ?? 250} COINS 🪙
              </Text>
            </LinearGradient>
            <Text style={styles.uberCardTitle}>Billetera Consenticoins</Text>
            <Text style={styles.uberCardSubtitle}>
              {user
                ? `Hola ${user.name}, redime tus monedas en tu próximo bulto`
                : 'Inicia sesión y recibe 250 Consenticoins de regalo'}
            </Text>
          </Pressable>

          {/* Tarjeta 2: Cobertura Bogotá vs Nacional */}
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
      </ScrollView>

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
              handleAccountAccess();
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
            <LinearGradient
              colors={['#0F121C', '#07080D', '#050508']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.cartSheetHeader} {...cartHeaderPanHandlers}>
              <View style={styles.dragHandleHitZone} {...cartGrabberPanHandlers}>
                <View
                  style={[
                    styles.dragHandle,
                    isCartDragging && styles.dragHandleActive,
                  ]}
                />
              </View>
              <View style={styles.cartSheetTitleRow}>
                <Text style={styles.cartSheetTitle}>
                  Tu Bolsa de Concentrados ({cartSummary.totalItems})
                </Text>
                <Pressable
                  onPress={animateCloseCart}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={20} color={colors.dark.textSecondary} />
                </Pressable>
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
                  {/* Dirección seleccionada dentro del carrito (abre el selector de todas las direcciones) */}
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCartModalVisible(false);
                      setTimeout(() => setAddressSheetVisible(true), 200);
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
                        <Text style={styles.cartZoneLabel}>
                          Entregar en ({selectedAddress.label} · {selectedAddress.city}):
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
                          Cambiar ({addresses.length})
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
                          : `Recargo Transportadora (${cartSummary.totalWeightLb} LB)`}
                      </Text>
                      <Text
                        style={[
                          styles.costValue,
                          {
                            color:
                              deliveryZone === 'bogota' ? '#10B981' : '#F59E0B',
                          },
                        ]}
                      >
                        {deliveryZone === 'bogota'
                          ? 'GRATIS ($ 0)'
                          : `+ ${formatCOP(cartSummary.estimatedCarrierFee)}`}
                      </Text>
                    </View>

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
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                      <Text style={styles.orderConfirmedText}>
                        ¡Pedido listo!{' '}
                        {deliveryZone === 'bogota'
                          ? 'Domicilio Gratis en Bogotá confirmado.'
                          : 'Incluye guía de transportadora nacional.'}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => {
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        );
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
                        Confirmar Pedido ({formatCOP(cartSummary.totalWithShipping)})
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

      {/* Panel Deslizable de Cuenta del Cliente */}
      <CustomerProfileSheet
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        onManageAddresses={() => {
          setProfileVisible(false);
          setTimeout(() => setAddressSheetVisible(true), 220);
        }}
      />
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
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
  },
  uberTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    position: 'relative',
  },
  uberTabEmoji: {
    fontSize: 22,
  },
  uberTabText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
  },
  uberTabTextActive: {
    color: '#FFFFFF',
  },
  uberTabActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  /* ==================== 3. UBER SEARCH PILL ==================== */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 115,
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
    marginBottom: 14,
  },
  uberSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  uberLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A0B0E',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  uberLaterButtonActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  uberLaterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '600',
    textAlign: 'center',
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
    borderWidth: 1.5,
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
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
    justifyContent: 'flex-end',
  },
  cartSheetContainer: {
    maxHeight: '84%',
    backgroundColor: '#07080D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
  },
  cartSheetContainerExpanded: {
    maxHeight: '95%',
    height: '95%',
  },
  cartSheetHeader: {
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandleHitZone: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  dragHandleActive: {
    width: 56,
    backgroundColor: colors.primary.light,
  },
  cartSheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartSheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#0E1017',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cartZoneLabel: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  logisticsSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#050508',
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
    backgroundColor: '#F59E0B',
  },
  zonePillText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  zonePillTextActive: {
    color: '#050508',
    fontWeight: '800',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1017',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 10,
  },
  cartItemName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cartItemSub: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  costBreakdownCard: {
    backgroundColor: '#0E1017',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    gap: 10,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  costValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  costDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  costTotalLabel: {
    color: '#FFFFFF',
    fontSize: 15,
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
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  checkoutGoldBtnText: {
    color: '#050508',
    fontSize: 14,
    fontWeight: '900',
  },
  orderConfirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 14,
    borderRadius: 14,
  },
  orderConfirmedText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
