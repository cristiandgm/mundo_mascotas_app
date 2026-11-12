import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { ProductThumbnail } from './ui/ProductThumbnail';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type FoodBrandName =
  | 'Diamond Naturals'
  | 'Taste of the Wild'
  | 'Acana'
  | 'Orijen';

export interface BrandProductItem {
  id: string;
  sku: string;
  brand: FoodBrandName | 'Salud Vet';
  name: string;
  protein: string;
  weightLb: number;
  unitLabel?: string;
  price: number;
  coins: number;
  petType: 'dog' | 'cat';
  category: 'bultos' | 'snacks';
  subFilter?: 'humedos' | 'premios' | 'higiene' | 'medicamentos';
  stage: string;
  tag?: string;
  accentColor: string;
  imageUrl?: string;
}

interface BrandDnaProfile {
  id: FoodBrandName;
  shortName: string;
  emoji: string;
  origin: string;
  officialTagline: string;
  headline: string;
  manifesto: string;
  heroGradient: readonly [string, string, string];
  signatureAccent: string;
  badgeLabel: string;
  metrics: {
    proteinRange: string;
    keyTech: string;
    grainStatus: string;
  };
  dnaPillars: {
    icon: keyof typeof Ionicons.glyphMap;
    metric: string;
    title: string;
    description: string;
  }[];
  signatureIngredients: string[];
}

export const BRAND_DNA_DATABASE: Record<FoodBrandName, BrandDnaProfile> = {
  'Diamond Naturals': {
    id: 'Diamond Naturals',
    shortName: 'Diamond',
    emoji: '💎',
    origin: '🇺🇸 Missouri, EE. UU. · Diamond Pet Foods',
    officialTagline: 'NUTRITION WITH A PURPOSE™ · HOLISTIC SUPERFOODS',
    headline: 'Nutrición Holística con Superalimentos y Probióticos Vivos',
    manifesto:
      'Desarrollada por veterinarios y nutricionistas clínicos en EE. UU., Diamond Naturals combina proteínas magras de pastoreo (cordero real, salmón salvaje y pollo fresco) con una matriz de superalimentos antioxidantes y cepas probióticas exclusivas que sobreviven en el tracto digestivo.',
    heroGradient: ['#141E30', '#0D131F', '#0A0B0E'] as const,
    signatureAccent: '#60A5FA',
    badgeLabel: 'K9 Strain® & Viables®',
    metrics: {
      proteinRange: '23% – 32% Proteína',
      keyTech: '80M UFC/lb Probióticos',
      grainStatus: 'Sin Maíz, Trigo ni Soya',
    },
    dnaPillars: [
      {
        icon: 'shield-checkmark-outline',
        metric: '80M UFC/lb',
        title: 'Probióticos K9 Strain® y Viables®',
        description:
          'Cepas bacterianas específicas por especie añadidas después de la cocción para garantizar cultivos vivos que blindan la digestión y el sistema inmune.',
      },
      {
        icon: 'nutrition-outline',
        metric: '6 Superfoods',
        title: 'Matriz de Superalimentos Reales',
        description:
          'Arándanos, kale, semillas de chía, calabaza, quinoa y coco que aportan antioxidantes naturales, vitaminas biodisponibles y fibra prebiótica.',
      },
      {
        icon: 'sparkles-outline',
        metric: 'Omega 3 & 6',
        title: 'Minerales Quelados y Piel Radiante',
        description:
          'Ácidos grasos esenciales del salmón y linaza junto con selenio y zinc quelado para máxima absorción celular y pelaje brillante.',
      },
    ],
    signatureIngredients: [
      '🥩 Cordero de Pastoreo',
      '🐟 Salmón Salvaje',
      '🫐 Arándanos & Kale',
      '🌱 Semillas de Chía & Quinoa',
      '🎃 Calabaza Prebiótica',
    ],
  },

  'Taste of the Wild': {
    id: 'Taste of the Wild',
    shortName: 'Taste of the Wild',
    emoji: '🐺',
    origin: '🇺🇸 EE. UU. · Ancestral Wild Nutrition',
    officialTagline: 'BASED ON YOUR PET’S ANCESTRAL DIET™',
    headline: 'La Dieta Ancestral que Dicta el ADN Salvaje de tu Mascota',
    manifesto:
      'Aunque conviven con nosotros, los perros y gatos conservan el ADN intacto de los lobos y felinos salvajes. Taste of the Wild recrea su dieta evolutiva con carnes reales asadas al fuego y ahumadas, 100% libre de granos (Grain-Free) y enriquecida con frutas del bosque.',
    heroGradient: ['#241A0E', '#14100B', '#0A0B0E'] as const,
    signatureAccent: '#F59E0B',
    badgeLabel: '100% Grain-Free Ancestral',
    metrics: {
      proteinRange: '32% – 42% Proteína',
      keyTech: 'Carnes Asadas al Fuego',
      grainStatus: '0% Granos (Grain-Free)',
    },
    dnaPillars: [
      {
        icon: 'flame-outline',
        metric: 'Asado Real',
        title: 'Bisonte Asado, Venado y Salmón Ahumado',
        description:
          'Proteínas noveles de alta palatabilidad asadas y ahumadas lentamente que despiertan el instinto carnívoro y aportan aminoácidos puros.',
      },
      {
        icon: 'leaf-outline',
        metric: '0% Granos',
        title: 'Carbohidratos de Bajo Índice Glucémico',
        description:
          'Sustituye los cereales por batata (camote), guisantes y legumbres ricas en energía sostenida, ideal para mascotas con alergias a granos.',
      },
      {
        icon: 'fitness-outline',
        metric: 'Raíz Achicoria',
        title: 'Prebióticos + K9 Strain® / Viables®',
        description:
          'Raíz de achicoria deshidratada combinada con 80 millones de UFC/lb de probióticos vivos para heces firmes y salud intestinal superior.',
      },
    ],
    signatureIngredients: [
      '🦬 Bisonte Asado',
      '🦌 Venado de Pradera',
      '🐟 Salmón Ahumado & Trucha',
      '🍠 Batata & Guisantes',
      '🍓 Frambuesas & Arándanos',
    ],
  },

  Acana: {
    id: 'Acana',
    shortName: 'Acana',
    emoji: '🍁',
    origin: '🇨🇦 Alberta, Canadá · Champion Petfoods',
    officialTagline: 'GO BEYOND THE 1ST INGREDIENT™ · WHOLEPREY™',
    headline: '60% a 70% Ingredientes Animales en Proporciones WholePrey™',
    manifesto:
      'Nacida en las tierras agrícolas de Alberta, Canadá, Acana va más allá del primer ingrediente: hasta el 70% de cada bulto proviene de aves de corral libres de jaula, carnes regionales y pescados salvajes entregados frescos o crudos a sus cocinas canadienses.',
    heroGradient: ['#10221E', '#0B1514', '#0A0B0E'] as const,
    signatureAccent: '#34D399',
    badgeLabel: '70% Animal WholePrey™',
    metrics: {
      proteinRange: '31% – 37% Proteína',
      keyTech: '65%–70% Inclusión Animal',
      grainStatus: 'Bajo en Carbohidratos',
    },
    dnaPillars: [
      {
        icon: 'restaurant-outline',
        metric: '65%–70%',
        title: 'Dominancia Cárnica Canadiense',
        description:
          'Dos a tres veces más carne que los concentrados convencionales, utilizando pollo Cobb de corral, pavo, huevos de nido y pescado salvaje.',
      },
      {
        icon: 'paw-outline',
        metric: 'WholePrey™',
        title: 'Nutrición de Presa Entera',
        description:
          'Combina carne muscular, órganos nutritivos (hígado, corazón, riñón) y cartílago comestible para aportar nutrientes de forma 100% natural.',
      },
      {
        icon: 'Snow-outline' as any,
        metric: 'Fresco / Crudo',
        title: 'Refrigeración Pura Sin Rellenos Rápidos',
        description:
          'Cero papa, tapioca, maíz o gluten vegetal. Equilibrado con calabaza moscada entera, verduras verdes y botánicos regionales.',
      },
    ],
    signatureIngredients: [
      '🍗 Pollo & Pavo de Corral',
      '🥚 Huevos Enteros de Nido',
      '🐟 Salmón Salvaje & Arenque',
      '🫀 Órganos WholePrey™',
      '🎃 Calabaza Moscada Fresca',
    ],
  },

  Orijen: {
    id: 'Orijen',
    shortName: 'Orijen',
    emoji: '👑',
    origin: '🇨🇦 Alberta, Canadá · The Apex of Nutrition',
    officialTagline: 'NOURISH AS NATURE INTENDED™ · 85%–90% ANIMAL',
    headline: 'El Ápice Mundial de la Nutrición Biológicamente Apropiada™',
    manifesto:
      'Orijen representa la cúspide absoluta de la alimentación biológica para perros y gatos en el mundo. Con un 85% a 90% de ingredientes de origen animal y los primeros 5 ingredientes siempre frescos o crudos, replica con exactitud la dieta de un carnívoro en la naturaleza.',
    heroGradient: ['#281216', '#160C0E', '#0A0B0E'] as const,
    signatureAccent: '#F87171',
    badgeLabel: '85%–90% Carne WholePrey™',
    metrics: {
      proteinRange: '38% – 40% Proteína',
      keyTech: '85%–90% Origen Animal',
      grainStatus: 'Top 5 Frescos o Crudos',
    },
    dnaPillars: [
      {
        icon: 'trophy-outline',
        metric: '85%–90%',
        title: 'La Mayor Inclusión Animal del Mundo',
        description:
          'Ningún otro alimento seco iguala su concentración de carne: 2/3 de los ingredientes animales son FRESCOS (refrigerados) o CRUDOS (ultracongelados).',
      },
      {
        icon: 'medal-outline',
        metric: 'Top 5 Carnes',
        title: 'Primeros 5 Ingredientes Siempre Frescos o Crudos',
        description:
          'Pollo y pavo de corral, lenguado salvaje, caballa entera y órganos frescos encabezan cada receta sin harinas procesadas de bajo costo.',
      },
      {
        icon: 'bonfire-outline',
        metric: 'Liofilizado',
        title: 'Infusión de Hígado Liofilizado (Freeze-Dried)',
        description:
          'Cada croqueta lleva un recubrimiento de hígado liofilizado en frío que multiplica el sabor natural incluso para los paladares más exigentes.',
      },
    ],
    signatureIngredients: [
      '🥩 85%-90% Presa Entera',
      '🍗 Pollo & Pavo Fresco',
      '🐟 Caballa & Lenguado Salvaje',
      '❄️ Hígado Liofilizado en Frío',
      '🦴 Cartílago & Médula Natural',
    ],
  },
};

export const ALL_FOOD_BRANDS: FoodBrandName[] = [
  'Diamond Naturals',
  'Taste of the Wild',
  'Acana',
  'Orijen',
];

interface BrandDnaModalProps {
  visible: boolean;
  brand: FoodBrandName | null;
  activeSpecies: 'dog' | 'cat';
  petName: string;
  deliveryZone: 'bogota' | 'nacional';
  products: BrandProductItem[];
  cart: Record<string, number>;
  onClose: () => void;
  onSelectBrand: (brand: FoodBrandName) => void;
  onAddToCart: (productId: string) => void;
  onDecrementCart: (productId: string) => void;
  onInspectProduct: (product: BrandProductItem) => void;
  onOpenCart: () => void;
}

export const BrandDnaModal: React.FC<BrandDnaModalProps> = ({
  visible,
  brand,
  activeSpecies,
  petName,
  deliveryZone,
  products,
  cart,
  onClose,
  onSelectBrand,
  onAddToCart,
  onDecrementCart,
  onInspectProduct,
  onOpenCart,
}) => {
  const insets = useSafeAreaInsets();
  const [speciesFilter, setSpeciesFilter] = useState<'dog' | 'cat' | 'all'>(
    activeSpecies
  );
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'bultos' | 'snacks'
  >('all');

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSpeciesFilter(activeSpecies);
  }, [activeSpecies]);

  useEffect(() => {
    if (visible && brand) {
      setCategoryFilter('all');
      slideAnim.setValue(SCREEN_HEIGHT * 0.35);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 230,
          mass: 0.85,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, brand, slideAnim, fadeAnim]);

  const handleClose = () => {
    Haptics.selectionAsync();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT * 0.4,
        duration: 210,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const currentBrand: FoodBrandName = brand || 'Diamond Naturals';
  const dna = BRAND_DNA_DATABASE[currentBrand];

  const brandProducts = useMemo(() => {
    return products.filter((item) => {
      if (item.brand !== currentBrand) return false;
      if (speciesFilter !== 'all' && item.petType !== speciesFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [products, currentBrand, speciesFilter, categoryFilter]);

  const cartTotals = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const found = products.find((p) => p.id === id);
      if (found && qty > 0) {
        count += qty;
        subtotal += found.price * qty;
      }
    });
    return { count, subtotal };
  }, [cart, products]);

  const formatCOP = (amount: number) => {
    return '$ ' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  if (!brand) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            { opacity: fadeAnim },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.storeContainer,
            {
              paddingTop: Math.max(insets.top, 14) + 4,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ==================== 1. BARRA SUPERIOR DE NAVEGACIÓN + CAMBIADOR RÁPIDO DE MARCA ==================== */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandSwitcherScroll}
            >
              {ALL_FOOD_BRANDS.map((bName) => {
                const isSelected = bName === currentBrand;
                const bInfo = BRAND_DNA_DATABASE[bName];
                return (
                  <Pressable
                    key={bName}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onSelectBrand(bName);
                    }}
                    style={[
                      styles.brandSwitchPill,
                      isSelected && styles.brandSwitchPillActive,
                    ]}
                  >
                    <Text style={{ fontSize: 13 }}>{bInfo.emoji}</Text>
                    <Text
                      style={[
                        styles.brandSwitchText,
                        isSelected && styles.brandSwitchTextActive,
                      ]}
                    >
                      {bInfo.shortName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  Math.max(insets.bottom, 16) +
                  (cartTotals.count > 0 ? 110 : 36),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ==================== 2. HERO BANNER DEL ADN DE LA MARCA ==================== */}
            <LinearGradient
              colors={dna.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.originPill}>
                  <Text style={styles.originPillText}>{dna.origin}</Text>
                </View>
                <View
                  style={[
                    styles.dnaSignatureBadge,
                    { borderColor: `${dna.signatureAccent}55` },
                  ]}
                >
                  <View
                    style={[
                      styles.dnaSignatureDot,
                      { backgroundColor: dna.signatureAccent },
                    ]}
                  />
                  <Text style={styles.dnaSignatureBadgeText}>
                    {dna.badgeLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.brandIdentityHeroRow}>
                <View
                  style={[
                    styles.brandEmblemBox,
                    { borderColor: `${dna.signatureAccent}66` },
                  ]}
                >
                  <Text style={{ fontSize: 36 }}>{dna.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.officialTaglineText}>
                    {dna.officialTagline}
                  </Text>
                  <Text style={styles.brandBigTitle}>{dna.id}</Text>
                </View>
              </View>

              <Text style={styles.brandHeadlineText}>{dna.headline}</Text>
              <Text style={styles.brandManifestoText}>{dna.manifesto}</Text>

              {/* 3 Métricas clave en barra estilo Uber */}
              <View style={styles.metricsStrip}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{dna.metrics.proteinRange}</Text>
                  <Text style={styles.metricSub}>Densidad proteica</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text
                    style={[styles.metricVal, { color: colors.primary.light }]}
                  >
                    {dna.metrics.keyTech}
                  </Text>
                  <Text style={styles.metricSub}>Sello biológico</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{dna.metrics.grainStatus}</Text>
                  <Text style={styles.metricSub}>Perfil glucémico</Text>
                </View>
              </View>
            </LinearGradient>

            {/* ==================== 3. LOS 3 PILARES CIENTÍFICOS DEL ADN DE LA MARCA ==================== */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>ADN Biológico de {dna.id}</Text>
              <Text style={styles.sectionCaption}>Fórmula Oficial</Text>
            </View>

            <View style={styles.pillarsContainer}>
              {dna.dnaPillars.map((pillar, index) => (
                <View key={index} style={styles.pillarCard}>
                  <View style={styles.pillarIconCol}>
                    <View style={styles.pillarIconBox}>
                      <Ionicons
                        name={
                          pillar.icon === ('Snow-outline' as any)
                            ? 'snow-outline'
                            : pillar.icon
                        }
                        size={20}
                        color={colors.primary.light}
                      />
                    </View>
                    <Text style={styles.pillarMetricTag}>{pillar.metric}</Text>
                  </View>

                  <View style={styles.pillarTextCol}>
                    <Text style={styles.pillarTitle}>{pillar.title}</Text>
                    <Text style={styles.pillarDesc}>{pillar.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Ingredientes Insignia */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ingredientsScroll}
            >
              {dna.signatureIngredients.map((ing, i) => (
                <View key={i} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ing}</Text>
                </View>
              ))}
            </ScrollView>

            {/* ==================== 4. CATÁLOGO ESPECIALIZADO DE LA MARCA ==================== */}
            <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
              <View>
                <Text style={styles.sectionTitle}>
                  Línea {dna.id} ({brandProducts.length})
                </Text>
                <Text style={styles.catalogSubtext}>
                  {deliveryZone === 'bogota'
                    ? 'Domicilio Gratis en Bogotá D.C. · Pago Contraentrega'
                    : 'Despacho nacional + recargo transportadora según LB'}
                </Text>
              </View>
            </View>

            {/* Filtros estilo Uber: Especie + Tipo de Alimento */}
            <View style={styles.filtersBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {[
                  {
                    id: 'dog' as const,
                    label:
                      activeSpecies === 'dog'
                        ? `🐶 Para ${petName}`
                        : '🐶 Perros',
                  },
                  {
                    id: 'cat' as const,
                    label:
                      activeSpecies === 'cat'
                        ? `🐱 Para ${petName}`
                        : '🐱 Gatos',
                  },
                  { id: 'all' as const, label: '🐾 Ver Ambos' },
                ].map((sp) => {
                  const active = speciesFilter === sp.id;
                  return (
                    <Pressable
                      key={sp.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSpeciesFilter(sp.id);
                      }}
                      style={[
                        styles.uberFilterPill,
                        active && styles.uberFilterPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.uberFilterPillText,
                          active && styles.uberFilterPillTextActive,
                        ]}
                      >
                        {sp.label}
                      </Text>
                    </Pressable>
                  );
                })}

                <View style={styles.filterVerticalSep} />

                {[
                  { id: 'all' as const, label: 'Todos' },
                  { id: 'bultos' as const, label: 'Concentrados' },
                  { id: 'snacks' as const, label: 'Húmedos y Premios' },
                ].map((cat) => {
                  const active = categoryFilter === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategoryFilter(cat.id);
                      }}
                      style={[
                        styles.uberFilterPill,
                        active && styles.uberFilterPillGoldActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.uberFilterPillText,
                          active && styles.uberFilterPillTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Lista de Productos de la Marca estilo Uber Storefront */}
            <View style={styles.productsList}>
              {brandProducts.map((product) => {
                const qty = cart[product.id] || 0;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => onInspectProduct(product)}
                    style={({ pressed }) => [
                      styles.productRowCard,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    {/* Ícono / Foto real izquierda ampliada */}
                    <View
                      style={[
                        styles.productVisualBox,
                        product.imageUrl
                          ? { backgroundColor: '#FFFFFF', padding: 0 }
                          : null,
                      ]}
                    >
                      <ProductThumbnail
                        product={product}
                        emojiSize={34}
                        borderRadius={15}
                        padding={2}
                        style={{ width: '100%', flex: 1 }}
                      />
                      <View
                        style={[
                          styles.productWeightMiniPill,
                          styles.productWeightFloatingPill,
                        ]}
                      >
                        <Text style={styles.productWeightMiniText}>
                          {product.unitLabel || `${product.weightLb} LB`}
                        </Text>
                      </View>
                    </View>

                    {/* Información Central */}
                    <View style={styles.productInfoCol}>
                      <View style={styles.productBadgesLine}>
                        <Text style={styles.productStageLabel}>
                          {product.stage}
                        </Text>
                        {product.tag && (
                          <View style={styles.productHighlightTag}>
                            <Text style={styles.productHighlightTagText}>
                              {product.tag}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.productNameText} numberOfLines={2}>
                        {product.name}
                      </Text>

                      <Text style={styles.productProteinText} numberOfLines={2}>
                        {product.protein}
                      </Text>

                      <View style={styles.productBottomPriceLine}>
                        <View>
                          <Text style={styles.productPriceText}>
                            {formatCOP(product.price)}
                          </Text>
                          <Text style={styles.productCoinsText}>
                            +{product.coins} Consenticoins 🪙
                          </Text>
                        </View>

                        {/* Botón Pedir o Stepper */}
                        {qty === 0 ? (
                          <Pressable
                            onPress={() => onAddToCart(product.id)}
                            style={styles.addBtn}
                          >
                            <Ionicons name="add" size={16} color="#050508" />
                            <Text style={styles.addBtnText}>Pedir</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.qtyStepper}>
                            <Pressable
                              onPress={() => onDecrementCart(product.id)}
                              style={styles.qtyStepBtn}
                              hitSlop={6}
                            >
                              <Ionicons
                                name="remove"
                                size={14}
                                color="#FFFFFF"
                              />
                            </Pressable>
                            <Text style={styles.qtyCountText}>{qty}</Text>
                            <Pressable
                              onPress={() => onAddToCart(product.id)}
                              style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                              hitSlop={6}
                            >
                              <Ionicons name="add" size={14} color="#050508" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* ==================== 5. BARRA INFERIOR FLOTANTE DE BOLSA (ESTILO UBER EATS) ==================== */}
          {cartTotals.count > 0 && (
            <View
              style={[
                styles.bottomCartBarWrapper,
                { bottom: Math.max(insets.bottom, 14) },
              ]}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleClose();
                  setTimeout(() => onOpenCart(), 220);
                }}
                style={({ pressed }) => [
                  styles.bottomCartBarBtn,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={styles.bottomCartCountCircle}>
                  <Text style={styles.bottomCartCountText}>
                    {cartTotals.count}
                  </Text>
                </View>
                <Text style={styles.bottomCartBarLabel}>
                  Ver Bolsa · Confirmar pedido
                </Text>
                <Text style={styles.bottomCartBarPrice}>
                  {formatCOP(cartTotals.subtotal)}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  storeContainer: {
    flex: 1,
    backgroundColor: '#0A0B0E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandSwitcherScroll: {
    gap: 8,
    paddingRight: 10,
  },
  brandSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12151C',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  brandSwitchPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  brandSwitchText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  brandSwitchTextActive: {
    color: '#0A0B0E',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  originPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  originPillText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  dnaSignatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12151C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  dnaSignatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dnaSignatureBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  brandIdentityHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  brandEmblemBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#12151C',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialTaglineText: {
    color: colors.primary.light,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  brandBigTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandHeadlineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  brandManifestoText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 11, 14, 0.75)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricSub: {
    color: '#6B7280',
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCaption: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
  },
  catalogSubtext: {
    color: '#9CA3AF',
    fontSize: 12.5,
    marginTop: 2,
  },
  pillarsContainer: {
    gap: 10,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillarIconCol: {
    alignItems: 'center',
    width: 68,
    gap: 6,
  },
  pillarIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
  pillarMetricTag: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  pillarTextCol: {
    flex: 1,
    gap: 3,
  },
  pillarTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  pillarDesc: {
    color: '#9CA3AF',
    fontSize: 12.5,
    lineHeight: 18,
  },
  ingredientsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  ingredientChip: {
    backgroundColor: '#12151C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  ingredientChipText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersBar: {
    marginVertical: 2,
  },
  uberFilterPill: {
    backgroundColor: '#181B22',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  uberFilterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  uberFilterPillGoldActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  uberFilterPillText: {
    color: '#D1D5DB',
    fontSize: 12.5,
    fontWeight: '600',
  },
  uberFilterPillTextActive: {
    color: '#0A0B0E',
    fontWeight: '800',
  },
  filterVerticalSep: {
    width: 1,
    height: 22,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 4,
  },
  productsList: {
    gap: 12,
  },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    backgroundColor: '#12151C',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  productVisualBox: {
    width: 114,
    minHeight: 132,
    borderRadius: 16,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
  productWeightMiniPill: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  productWeightFloatingPill: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  productWeightMiniText: {
    color: '#050508',
    fontSize: 10,
    fontWeight: '900',
  },
  productInfoCol: {
    flex: 1,
    gap: 3,
  },
  productBadgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  productStageLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  productHighlightTag: {
    backgroundColor: '#1C202B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  productHighlightTagText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '700',
  },
  productNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  productProteinText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  productBottomPriceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productPriceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  productCoinsText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  addBtnText: {
    color: '#050508',
    fontSize: 12.5,
    fontWeight: '800',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181B22',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    gap: 8,
  },
  qtyStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepBtnPlus: {
    backgroundColor: colors.primary.DEFAULT,
  },
  qtyCountText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  bottomCartBarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  bottomCartBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 14,
  },
  bottomCartCountCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0A0B0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCartCountText: {
    color: colors.primary.light,
    fontSize: 12.5,
    fontWeight: '900',
  },
  bottomCartBarLabel: {
    color: '#050508',
    fontSize: 14.5,
    fontWeight: '900',
  },
  bottomCartBarPrice: {
    color: '#050508',
    fontSize: 14.5,
    fontWeight: '900',
  },
});
