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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { UserAvatar } from '../components/ui/UserAvatar';
import { CustomerProfileSheet } from '../components/CustomerProfileSheet';
import { useAuth } from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

type DeliveryZoneType = 'bogota' | 'nacional';
type PetFilterType = 'all' | 'dog' | 'cat';

interface ProductBag {
  id: string;
  sku: string;
  brand: 'Diamond Naturals' | 'Taste of the Wild' | 'Acana' | 'Orijen';
  name: string;
  protein: string;
  weightLb: number;
  price: number;
  coins: number;
  petType: 'dog' | 'cat';
  stage: string;
  tag?: string;
}

const CATALOG_BAGS: ProductBag[] = [
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
    stage: 'Adulto',
    tag: '🔥 Más Vendido',
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
    stage: 'Adulto Light',
    tag: '⭐ Favorito Clientes',
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
    stage: 'Todas las etapas',
    tag: '✨ Piel Sensible',
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
    stage: 'Adulto',
    tag: '🥩 Super Premium',
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
    stage: 'Cachorro',
    tag: '🐶 Cachorros',
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
    stage: 'Adulto / Cachorro',
  },
  {
    id: 'prod_9580',
    sku: '9580',
    brand: 'Taste of the Wild',
    name: 'Taste of the Wild Rocky Mountain Feline',
    protein: 'Venado Asado y Salmón Ahumado',
    weightLb: 15,
    price: 218000,
    coins: 218,
    petType: 'cat',
    stage: 'Gatos Adultos y Gatitos',
    tag: '🐱 Top Gatos',
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
    stage: 'Todas las etapas',
    tag: '🏆 70% Proteína Animal',
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
    stage: 'Gatos Adultos',
  },
  {
    id: 'prod_7710',
    sku: '7710',
    brand: 'Orijen',
    name: 'Orijen Original Biológicamente Apropiado',
    protein: 'Pollo y Pavo de Corral + Pescado Salvaje',
    weightLb: 25,
    price: 435000,
    coins: 435,
    petType: 'dog',
    stage: 'Adulto',
    tag: '👑 Ultra Luxury',
  },
];

const BRANDS = [
  'Todas',
  'Diamond Naturals',
  'Taste of the Wild',
  'Acana',
  'Orijen',
] as const;

export const HomeScreen: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);

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

  // Estado de cobertura de envío: Bogotá (Gratis) vs Otras Ciudades/Municipios (Recargo transportadora)
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZoneType>('bogota');

  // Filtros de catálogo
  const [searchQuery, setSearchQuery] = useState('');
  const [petFilter, setPetFilter] = useState<PetFilterType>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');

  // Estado del carrito: { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderSuccessToast, setOrderSuccessToast] = useState(false);

  const searchInputRef = useRef<any>(null);

  const formatCOP = (amount: number) => {
    return '$ ' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleHeaderProfilePress = () => {
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

  const handleQuickRepeatLastOrder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Agrega el bulto Diamond Naturals Lamb & Rice 40 LB (#123)
    setCart((prev) => ({
      ...prev,
      prod_123: (prev.prod_123 || 0) + 1,
    }));
  };

  // Filtrado en tiempo real de los bultos
  const filteredProducts = useMemo(() => {
    return CATALOG_BAGS.filter((item) => {
      if (petFilter !== 'all' && item.petType !== petFilter) return false;
      if (selectedBrand !== 'Todas' && item.brand !== selectedBrand) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchProtein = item.protein.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchWeight = `${item.weightLb} lb`.includes(q);
        return matchName || matchProtein || matchBrand || matchWeight;
      }
      return true;
    });
  }, [petFilter, selectedBrand, searchQuery]);

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

    // Estimación de recargo de transportadora fuera de Bogotá según libras de peso
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

  const getPetEmoji = (type?: string) => {
    if (type === 'both') return '🐶🐱';
    if (type === 'cat') return '🐱';
    return '🐶';
  };

  const complementaryCategories = [
    { id: 'c1', title: 'Snacks & Premios', icon: 'gift-outline' as const, color: '#8B5CF6' },
    { id: 'c2', title: 'Salud & Antipulgas', icon: 'medkit-outline' as const, color: '#10B981' },
    { id: 'c3', title: 'Arenas & Higiene', icon: 'water-outline' as const, color: '#06B6D4' },
    { id: 'c4', title: 'Juguetes & Camas', icon: 'tennisball-outline' as const, color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#050508', '#0F1117', '#050508']}
        style={StyleSheet.absoluteFill}
      />

      {/* ==================== TOP BAR ==================== */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleHeaderProfilePress}
          style={({ pressed }) => [
            styles.userInfoRow,
            pressed && { opacity: 0.78 },
          ]}
        >
          <View style={styles.avatarTapWrapper}>
            <UserAvatar
              name={user ? user.name : 'Invitado'}
              avatarUrl={user?.avatarUrl}
              size={46}
            />
            <View style={styles.avatarMiniBadge}>
              <Ionicons name="person" size={9} color="#050508" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeGreeting}>
              {user ? 'Bienvenido de vuelta,' : 'Explora como invitado,'}
            </Text>
            <View style={styles.nameChevronRow}>
              <Text style={[typography.h3, styles.userNameText]} numberOfLines={1}>
                {user ? user.name : 'Invitado'} 👋
              </Text>
              <Ionicons
                name="chevron-down"
                size={15}
                color={colors.primary.light}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text style={styles.tapProfileHint}>
              {user ? 'Ver mi cuenta y pedidos ›' : 'Inicia sesión o regístrate ›'}
            </Text>
          </View>
        </Pressable>

        {/* Botón de Bolsa de Compras en el Header */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setCartModalVisible(true);
          }}
          style={styles.cartHeaderButton}
          hitSlop={8}
        >
          <Ionicons name="bag-handle-outline" size={21} color={colors.primary.light} />
          <View
            style={[
              styles.cartBadge,
              cartSummary.totalItems > 0 && styles.cartBadgeActive,
            ]}
          >
            <Text style={styles.cartBadgeText}>{cartSummary.totalItems}</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          cartSummary.totalItems > 0 && { paddingBottom: 110 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== 1. SELECTOR / BANNER DE COBERTURA LOGÍSTICA ==================== */}
        <View style={styles.logisticsCard}>
          <View style={styles.logisticsSwitchRow}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setDeliveryZone('bogota');
              }}
              style={[
                styles.zonePill,
                deliveryZone === 'bogota' && styles.zonePillBogotaActive,
              ]}
            >
              <Ionicons
                name="location"
                size={14}
                color={deliveryZone === 'bogota' ? '#050508' : colors.dark.textSecondary}
              />
              <Text
                style={[
                  styles.zonePillText,
                  deliveryZone === 'bogota' && styles.zonePillTextActive,
                ]}
              >
                Bogotá D.C.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setDeliveryZone('nacional');
              }}
              style={[
                styles.zonePill,
                deliveryZone === 'nacional' && styles.zonePillNacionalActive,
              ]}
            >
              <Ionicons
                name="bus-outline"
                size={14}
                color={deliveryZone === 'nacional' ? '#050508' : colors.dark.textSecondary}
              />
              <Text
                style={[
                  styles.zonePillText,
                  deliveryZone === 'nacional' && styles.zonePillTextActive,
                ]}
              >
                Otra Ciudad / Municipio
              </Text>
            </Pressable>
          </View>

          {deliveryZone === 'bogota' ? (
            <View style={styles.logisticsInfoRow}>
              <View style={styles.freeDeliveryBadgeIcon}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logisticsHeadlineGreen}>
                  🚚 Domicilio GRATIS en todo Bogotá D.C.
                </Text>
                <Text style={styles.logisticsSubtext}>
                  Entregas con flota propia · Pago Contraentrega disponible
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.logisticsInfoRow}>
              <View style={styles.nationalDeliveryBadgeIcon}>
                <Ionicons name="cube-outline" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logisticsHeadlineAmber}>
                  📦 Envío Nacional con Recargo por Transportadora
                </Text>
                <Text style={styles.logisticsSubtext}>
                  Para municipios y otras ciudades el flete se calcula según el peso del bulto (LB)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==================== 2. BUSCADOR + FILTRO RÁPIDO PERRO / GATO ==================== */}
        <Pressable
          onPress={() => searchInputRef.current?.focus()}
          style={styles.searchBarContainer}
        >
          <Ionicons name="search-outline" size={19} color={colors.primary.DEFAULT} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar Taste of the Wild, Diamond, Acana, 40 LB..."
            placeholderTextColor={colors.dark.textMuted}
            style={styles.searchInput}
            underlineColorAndroid="transparent"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={18} color={colors.dark.textSecondary} />
            </Pressable>
          )}
        </Pressable>

        {/* Píldoras de Especie: Todos | Perros | Gatos */}
        <View style={styles.speciesFilterRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setPetFilter('all');
            }}
            style={[
              styles.speciesChip,
              petFilter === 'all' && styles.speciesChipActive,
            ]}
          >
            <Text
              style={[
                styles.speciesChipText,
                petFilter === 'all' && styles.speciesChipTextActive,
              ]}
            >
              🐾 Todos los Bultos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setPetFilter('dog');
            }}
            style={[
              styles.speciesChip,
              petFilter === 'dog' && styles.speciesChipActive,
            ]}
          >
            <Text
              style={[
                styles.speciesChipText,
                petFilter === 'dog' && styles.speciesChipTextActive,
              ]}
            >
              🐶 Perros
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setPetFilter('cat');
            }}
            style={[
              styles.speciesChip,
              petFilter === 'cat' && styles.speciesChipActive,
            ]}
          >
            <Text
              style={[
                styles.speciesChipText,
                petFilter === 'cat' && styles.speciesChipTextActive,
              ]}
            >
              🐱 Gatos
            </Text>
          </Pressable>
        </View>

        {/* ==================== 3. RECOMPRA EN 1 TOQUE (SI TIENE SESIÓN) ==================== */}
        {user && (
          <View style={styles.quickReorderBanner}>
            <View style={styles.quickReorderLeft}>
              <View style={styles.quickReorderTagRow}>
                <Ionicons name="repeat" size={13} color={colors.primary.DEFAULT} />
                <Text style={styles.quickReorderTag}>RECOMPRA MENSUAL RÁPIDA</Text>
              </View>
              <Text style={styles.quickReorderProduct} numberOfLines={1}>
                Diamond Naturals Lamb & Rice 40 LB
              </Text>
              <Text style={styles.quickReorderPrice}>
                $ 289.000 · {deliveryZone === 'bogota' ? 'Domicilio Gratis Bogotá' : '+ Flete nacional'}
              </Text>
            </View>
            <Pressable
              onPress={handleQuickRepeatLastOrder}
              style={({ pressed }) => [
                styles.quickReorderBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="add-circle" size={16} color="#050508" />
              <Text style={styles.quickReorderBtnText}>Pedir de nuevo</Text>
            </Pressable>
          </View>
        )}

        {/* ==================== 4. TARJETA VIP CONSENTICOINS ==================== */}
        <View style={styles.vipCardOuter}>
          <LinearGradient
            colors={['#C69214', '#D4AF37', '#996515']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipCardGradient}
          >
            <View style={styles.vipCardHeader}>
              <View>
                <Text style={styles.vipCardBadge}>BILLETERA CONSENTICOINS</Text>
                <Text style={styles.vipCardPoints}>
                  {user?.points ?? 250} <Text style={styles.ptsText}>COINS</Text>
                </Text>
              </View>
              <View style={styles.petBadgeHeader}>
                <Text style={styles.petEmojiIcon}>{getPetEmoji(user?.petType)}</Text>
                <Text style={styles.petBadgeName}>{user?.petName || 'Peludo'}</Text>
              </View>
            </View>

            <View style={styles.vipCardFooter}>
              <Text style={styles.vipCardBenefit}>
                {user
                  ? `🎉 Acumulas Coins por cada bulto de concentrado que compres`
                  : '✨ Inicia sesión para reclamar tus 250 Consenticoins de bienvenida'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ==================== 5. VITRINA DE MARCAS SUPER PREMIUM ==================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.h3, styles.sectionTitle]}>Marcas Super Premium</Text>
          <Text style={styles.sectionCounterText}>100% Originales</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandsScrollContainer}
        >
          {BRANDS.map((brand) => {
            const isSelected = selectedBrand === brand;
            return (
              <Pressable
                key={brand}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedBrand(brand);
                }}
                style={[
                  styles.brandPill,
                  isSelected && styles.brandPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.brandPillText,
                    isSelected && styles.brandPillTextActive,
                  ]}
                >
                  {brand}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ==================== 6. CATÁLOGO DE BULTOS DESTACADOS ==================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.h3, styles.sectionTitle]}>
            Bultos Disponibles ({filteredProducts.length})
          </Text>
          <Text style={styles.sectionSubtitleGold}>
            {deliveryZone === 'bogota' ? '📍 Precios Bogotá' : '📦 Envíos Nacionales'}
          </Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptySearchBox}>
            <Ionicons name="search-outline" size={32} color={colors.dark.textMuted} />
            <Text style={styles.emptySearchTitle}>No encontramos ese concentrado</Text>
            <Text style={styles.emptySearchDesc}>
              Intenta buscar por otra marca (Diamond, Taste of the Wild, Acana) o limpia el filtro.
            </Text>
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setSelectedBrand('Todas');
                setPetFilter('all');
              }}
              style={styles.resetFiltersBtn}
            >
              <Text style={styles.resetFiltersText}>Ver todos los bultos</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.productsList}>
            {filteredProducts.map((product) => {
              const qtyInCart = cart[product.id] || 0;
              return (
                <View key={product.id} style={styles.productCard}>
                  {/* Top Row: Brand + Weight Badge */}
                  <View style={styles.productTopRow}>
                    <View style={styles.productBrandRow}>
                      <Text style={styles.productBrandText}>
                        {product.brand.toUpperCase()}
                      </Text>
                      {product.tag && (
                        <View style={styles.productHotTag}>
                          <Text style={styles.productHotTagText}>{product.tag}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.weightBadge}>
                      <Ionicons name="barbell-outline" size={12} color="#050508" />
                      <Text style={styles.weightBadgeText}>{product.weightLb} LB</Text>
                    </View>
                  </View>

                  {/* Middle Row: Bag Icon + Title + Protein + Shipping Badge */}
                  <View style={styles.productMainRow}>
                    <View style={styles.bagVisualBox}>
                      <Text style={styles.bagEmoji}>
                        {product.petType === 'cat' ? '🐱' : '🐶'}
                      </Text>
                      <Text style={styles.bagWeightMini}>{product.weightLb}lb</Text>
                    </View>

                    <View style={styles.productInfoCol}>
                      <Text style={styles.productNameText}>{product.name}</Text>
                      <Text style={styles.productProteinText}>{product.protein}</Text>

                      <View style={styles.productMetaPillsRow}>
                        <View style={styles.stagePill}>
                          <Text style={styles.stagePillText}>{product.stage}</Text>
                        </View>
                        <View style={styles.coinsEarnPill}>
                          <Text style={styles.coinsEarnText}>+{product.coins} Coins</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Indicador de envío según ciudad seleccionada */}
                  <View
                    style={[
                      styles.shippingNoticeStrip,
                      deliveryZone === 'bogota'
                        ? styles.shippingStripBogota
                        : styles.shippingStripNacional,
                    ]}
                  >
                    <Ionicons
                      name={
                        deliveryZone === 'bogota'
                          ? 'checkmark-circle'
                          : 'information-circle'
                      }
                      size={14}
                      color={deliveryZone === 'bogota' ? '#10B981' : '#F59E0B'}
                    />
                    <Text
                      style={[
                        styles.shippingStripText,
                        {
                          color: deliveryZone === 'bogota' ? '#6EE7B7' : '#FDE68A',
                        },
                      ]}
                    >
                      {deliveryZone === 'bogota'
                        ? 'Domicilio GRATIS en Bogotá · Pago Contraentrega'
                        : `Envío fuera de Bogotá: + recargo transportadora (${product.weightLb} LB)`}
                    </Text>
                  </View>

                  {/* Bottom Row: Price + Add to Cart / Quantity Stepper */}
                  <View style={styles.productBottomRow}>
                    <View>
                      <Text style={styles.priceLabel}>Precio por bulto</Text>
                      <Text style={styles.productPriceText}>
                        {formatCOP(product.price)}
                      </Text>
                    </View>

                    {qtyInCart === 0 ? (
                      <Pressable
                        onPress={() => handleAddToCart(product.id)}
                        style={({ pressed }) => [
                          styles.addBagButton,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Ionicons name="add" size={18} color="#050508" />
                        <Text style={styles.addBagButtonText}>Agregar</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.qtyStepper}>
                        <Pressable
                          onPress={() => handleDecrementCart(product.id)}
                          style={styles.qtyStepBtn}
                          hitSlop={6}
                        >
                          <Ionicons name="remove" size={16} color="#FFFFFF" />
                        </Pressable>
                        <Text style={styles.qtyCountText}>{qtyInCart}</Text>
                        <Pressable
                          onPress={() => handleAddToCart(product.id)}
                          style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                          hitSlop={6}
                        >
                          <Ionicons name="add" size={16} color="#050508" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ==================== 7. CATEGORÍAS COMPLEMENTARIAS ==================== */}
        <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
          <Text style={[typography.h3, styles.sectionTitle]}>
            Complementa su Pedido
          </Text>
        </View>

        <View style={styles.complementaryGrid}>
          {complementaryCategories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => Haptics.selectionAsync()}
              style={({ pressed }) => [
                styles.compCard,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.compIconCircle, { backgroundColor: `${cat.color}20` }]}>
                <Ionicons name={cat.icon} size={20} color={cat.color} />
              </View>
              <Text style={styles.compCardTitle}>{cat.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* ==================== BARRA FLOTANTE INFERIOR DE CARRITO ==================== */}
      {cartSummary.totalItems > 0 && (
        <View style={styles.floatingCartWrapper}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCartModalVisible(true);
            }}
            style={styles.floatingCartBar}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartCountCircle}>
                <Text style={styles.floatingCartCountText}>
                  {cartSummary.totalItems}
                </Text>
              </View>
              <View>
                <Text style={styles.floatingCartTotalText}>
                  {formatCOP(cartSummary.subtotal)}
                </Text>
                <Text style={styles.floatingCartSubText}>
                  {cartSummary.totalWeightLb} LB en total ·{' '}
                  {deliveryZone === 'bogota'
                    ? 'Envío Gratis Bogotá'
                    : '+ Flete transportadora'}
                </Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartActionText}>Ver Bolsa</Text>
              <Ionicons name="arrow-forward" size={16} color="#050508" />
            </View>
          </Pressable>
        </View>
      )}

      {/* ==================== MODAL RESUMEN DE BOLSA / LIQUIDACIÓN DE ENVÍO ==================== */}
      <Modal
        visible={cartModalVisible}
        transparent
        animationType="fade"
        onRequestClose={animateCloseCart}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={{ flex: 1 }}
            onPress={animateCloseCart}
          />
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
              contentContainerStyle={styles.cartSheetScroll}
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
                  {/* Selector de destino dentro del carrito */}
                  <View style={styles.cartZoneBox}>
                    <Text style={styles.cartZoneLabel}>
                      Selecciona ciudad de entrega para calcular flete:
                    </Text>
                    <View style={styles.logisticsSwitchRow}>
                      <Pressable
                        onPress={() => setDeliveryZone('bogota')}
                        style={[
                          styles.zonePill,
                          deliveryZone === 'bogota' && styles.zonePillBogotaActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.zonePillText,
                            deliveryZone === 'bogota' && styles.zonePillTextActive,
                          ]}
                        >
                          📍 Bogotá (Gratis)
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setDeliveryZone('nacional')}
                        style={[
                          styles.zonePill,
                          deliveryZone === 'nacional' && styles.zonePillNacionalActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.zonePillText,
                            deliveryZone === 'nacional' && styles.zonePillTextActive,
                          ]}
                        >
                          🚚 Otra Ciudad / Municipio
                        </Text>
                      </Pressable>
                    </View>
                  </View>

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
                        ¡Pedido listo! {deliveryZone === 'bogota' ? 'Domicilio Gratis en Bogotá confirmado.' : 'Incluye guía de transportadora nacional.'}
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

      {/* Panel Deslizable de Cuenta del Cliente */}
      <CustomerProfileSheet
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  avatarTapWrapper: {
    position: 'relative',
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: 1.5,
    borderColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapProfileHint: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  welcomeGreeting: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  userNameText: {
    color: colors.dark.textPrimary,
  },
  cartHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  cartBadgeText: {
    color: '#050508',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
  },
  logisticsCard: {
    backgroundColor: '#0E1017',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 14,
  },
  logisticsSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#050508',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  zonePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
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
  logisticsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  freeDeliveryBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nationalDeliveryBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logisticsHeadlineGreen: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '800',
  },
  logisticsHeadlineAmber: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
  },
  logisticsSubtext: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1017',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 2,
  },
  speciesFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  speciesChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#0E1017',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  speciesChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: colors.primary.DEFAULT,
  },
  speciesChipText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  speciesChipTextActive: {
    color: colors.primary.light,
  },
  quickReorderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#11141E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 16,
    gap: 10,
  },
  quickReorderLeft: {
    flex: 1,
  },
  quickReorderTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  quickReorderTag: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  quickReorderProduct: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quickReorderPrice: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  quickReorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickReorderBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '800',
  },
  vipCardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  vipCardGradient: {
    padding: 18,
    borderRadius: 20,
  },
  vipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vipCardBadge: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  vipCardPoints: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ptsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FEF3C7',
  },
  petBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
    gap: 5,
  },
  petEmojiIcon: {
    fontSize: 16,
  },
  petBadgeName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  vipCardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 10,
  },
  vipCardBenefit: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.dark.textPrimary,
  },
  sectionCounterText: {
    color: colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionSubtitleGold: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
  },
  brandsScrollContainer: {
    gap: 8,
    paddingBottom: 18,
  },
  brandPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#0E1017',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  brandPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  brandPillText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  brandPillTextActive: {
    color: '#050508',
    fontWeight: '800',
  },
  productsList: {
    gap: 14,
    marginBottom: 18,
  },
  productCard: {
    backgroundColor: '#0E1017',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  productBrandText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  productHotTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productHotTagText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightBadgeText: {
    color: '#050508',
    fontSize: 11,
    fontWeight: '900',
  },
  productMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bagVisualBox: {
    width: 62,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#151926',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagEmoji: {
    fontSize: 24,
  },
  bagWeightMini: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  productInfoCol: {
    flex: 1,
  },
  productNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  productProteinText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  productMetaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stagePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stagePillText: {
    color: colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  coinsEarnPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coinsEarnText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '700',
  },
  shippingNoticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  shippingStripBogota: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  shippingStripNacional: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  shippingStripText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceLabel: {
    color: colors.dark.textMuted,
    fontSize: 10,
  },
  productPriceText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  addBagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBagButtonText: {
    color: '#050508',
    fontSize: 13,
    fontWeight: '800',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161925',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    gap: 10,
  },
  qtyStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepBtnPlus: {
    backgroundColor: colors.primary.DEFAULT,
  },
  qtyCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  emptySearchBox: {
    backgroundColor: '#0E1017',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 20,
    gap: 6,
  },
  emptySearchTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySearchDesc: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetFiltersBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  resetFiltersText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
  },
  complementaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  compCard: {
    width: '48.2%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1017',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: 10,
  },
  compIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compCardTitle: {
    color: colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  floatingCartWrapper: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
  },
  floatingCartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartCountCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCountText: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '900',
  },
  floatingCartTotalText: {
    color: '#050508',
    fontSize: 15,
    fontWeight: '900',
  },
  floatingCartSubText: {
    color: 'rgba(5, 5, 8, 0.78)',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 5, 8, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  floatingCartActionText: {
    color: '#050508',
    fontSize: 12,
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
