import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  TextInput,
  Modal,
  Animated,
  Easing,
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
import { CheckoutModal, PlaceOrderPayload } from '../components/CheckoutModal';
import { BubbleLaunchOrigin, CartSummaryModal } from '../components/CartSummaryModal';
import { InboxModal } from '../components/InboxModal';
import {
  ACANA_LOGO,
  BRAND_LOGO_MAP,
  BrandDnaModal,
  FoodBrandName,
  ORIJEN_LOGO,
} from '../components/BrandDnaModal';
import { ConsenticoinsWalletModal } from '../components/ConsenticoinsWalletModal';
import {
  BreedSelectorSheet,
  PetBreedOption,
  PET_BREEDS_CATALOG,
} from '../components/BreedSelectorSheet';
import {
  useAuth,
  COIN_VALUE_COP,
  PetStageType,
  PetActivityType,
  PetSensitivityType,
} from '../context/AuthContext';
import { ProductBag, TopServiceTabType } from '../data/catalog';
import { useCatalog } from '../hooks/useCatalog';
import { ProductThumbnail } from '../components/ui/ProductThumbnail';
import { ConsenticoinIcon } from '../components/ui/ConsenticoinIcon';
import { ProductDescriptionAccordion } from '../components/ui/ProductDescriptionAccordion';
import {
  AnimatedCartControl,
  CartAddedEvent,
  CartAddedToast,
} from '../components/ui/CartAddedFeedback';
import { ImageZoomModal } from '../components/ImageZoomModal';

type DeliveryZoneType = 'bogota' | 'nacional';
type SearchCategoryType =
  | 'concentrados'
  | 'humedo'
  | 'snacks'
  | 'medicamentos'
  | 'todo';
type MainTopTabType = 'store' | 'quiz' | 'pets';
type BottomNavTab = 'home' | 'catalog' | 'activity' | 'account';

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

// Los 4 círculos de Marcas Insignia (al tocar cualquiera abre la vista especializada con el ADN de la marca y sus productos)
const FOR_YOU_BULTOS_CIRCLES: {
  id: FoodBrandName;
  label: string;
  emoji?: string;
  logoImage?: ImageSourcePropType;
  sub: string;
}[] = [
  { id: 'Diamond Naturals', label: 'Diamond', emoji: '💎', sub: 'K9 Strain®' },
  { id: 'Taste of the Wild', label: 'Taste', emoji: '🐺', sub: 'Ancestral' },
  { id: 'Acana', label: 'Acana', logoImage: ACANA_LOGO, sub: '70% Animal' },
  { id: 'Orijen', label: 'Orijen', logoImage: ORIJEN_LOGO, sub: '85-90% Carne' },
];

// Los 4 círculos estilo "For you" de Uber para la pestaña Snacks & Cuidado
const FOR_YOU_SNACKS_CIRCLES = [
  { id: 'Todas', label: 'Todos', emoji: '✨', sub: 'Ver todo' },
  { id: 'humedos', label: 'Húmedos', emoji: '🥫', sub: 'Latas en salsa' },
  { id: 'premios', label: 'Premios', emoji: '🦴', sub: 'Treats & Galletas' },
  { id: 'higiene', label: 'Cuidado', emoji: '🧼', sub: 'Higiene & Arena' },
];

export const HomeScreen: React.FC = () => {
  const { catalog } = useCatalog();
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
    recordOrder,
  } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileVisible, setProfileVisible] = useState(false);
  const [ordersVisible, setOrdersVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const reopenCheckoutAfterAddressRef = useRef(false);
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
  const [zoomProduct, setZoomProduct] = useState<ProductBag | null>(null);
  const productDetailAnim = useRef(new Animated.Value(0)).current;

  const openImageZoom = (product: ProductBag) => {
    if (!product.imageUrl && !product.zoomImageUrl) return;
    Haptics.selectionAsync();
    setZoomProduct(product);
  };
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

  // Estados del Quiz Biológico (Pestaña 2 — Viaje Guiado Paso a Paso)
  const [quizStage, setQuizStage] = useState<PetStageType>(activePet.ageStage);
  const [quizActivity, setQuizActivity] = useState<PetActivityType>(
    activePet.activityLevel
  );
  const [quizSensitivity, setQuizSensitivity] = useState<PetSensitivityType>(
    activePet.sensitivity
  );
  const [quizWeightKg, setQuizWeightKg] = useState<number>(activePet.weightKg);
  const [quizSavedToast, setQuizSavedToast] = useState<boolean>(false);
  const [quizJourneyStep, setQuizJourneyStep] = useState<
    1 | 2 | 3 | 4 | 'analyzing' | 'result'
  >(1);
  const [quizAnalysisStep, setQuizAnalysisStep] = useState<number>(0);
  const quizStepAnim = useRef(new Animated.Value(1)).current;
  const quizStepSlide = useRef(new Animated.Value(0)).current;

  const animateToQuizStep = (
    nextStep: 1 | 2 | 3 | 4 | 'analyzing' | 'result'
  ) => {
    Haptics.selectionAsync();
    quizStepAnim.setValue(0);
    quizStepSlide.setValue(18);
    setQuizJourneyStep(nextStep);
    Animated.parallel([
      Animated.timing(quizStepAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(quizStepSlide, {
        toValue: 0,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startQuizBiologicalAnalysis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuizAnalysisStep(1);
    animateToQuizStep('analyzing');

    setTimeout(() => {
      Haptics.selectionAsync();
      setQuizAnalysisStep(2);
    }, 550);

    setTimeout(() => {
      Haptics.selectionAsync();
      setQuizAnalysisStep(3);
    }, 1100);

    setTimeout(() => {
      Haptics.selectionAsync();
      setQuizAnalysisStep(4);
    }, 1650);

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateToQuizStep('result');
    }, 2250);
  };

  // Estados de Mascota(s) (Pestaña 3)
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState<'dog' | 'cat'>('dog');
  const [newPetBreed, setNewPetBreed] = useState('Golden Retriever');
  const [newPetWeight, setNewPetWeight] = useState('29');
  const [newPetStage, setNewPetStage] = useState<PetStageType>('adult');
  const [newPetActivity, setNewPetActivity] =
    useState<PetActivityType>('moderate');
  const [newPetSensitivity, setNewPetSensitivity] =
    useState<PetSensitivityType>('skin');
  const [newPetBioTrait, setNewPetBioTrait] = useState<string>(
    'Manto dorado y articulaciones · Cordero o Salmón'
  );
  const [breedSheetVisible, setBreedSheetVisible] = useState(false);
  const [editingBreedPetId, setEditingBreedPetId] = useState<string | null>(
    null
  );
  const [confirmDeletePetId, setConfirmDeletePetId] = useState<string | null>(
    null
  );

  const getRecommendedBagIdForBreed = (
    species: 'dog' | 'cat',
    stage: PetStageType,
    sensitivity: PetSensitivityType,
    activity: PetActivityType
  ): string => {
    if (species === 'dog') {
      if (stage === 'puppy') return 'prod_9571';
      if (sensitivity === 'weight' || activity === 'low') return 'prod_1773';
      if (sensitivity === 'skin') return 'prod_9423';
      if (sensitivity === 'grain_free' || activity === 'high') return 'prod_9567';
      return 'prod_123';
    }
    if (sensitivity === 'skin') return 'prod_1910';
    if (sensitivity === 'grain_free' || activity === 'high') return 'prod_7790';
    return 'prod_9580';
  };

  const applyBreedSelectionToNewPet = (
    breed: PetBreedOption,
    stageOverride?: PetStageType
  ) => {
    const targetStage = stageOverride || newPetStage;
    setNewPetBreed(breed.name);
    setNewPetWeight(
      String(
        targetStage === 'puppy' ? breed.puppyWeightKg : breed.avgWeightKg
      )
    );
    setNewPetActivity(breed.defaultActivity);
    setNewPetSensitivity(breed.defaultSensitivity);
    setNewPetBioTrait(breed.bioTrait);
  };

  // Carrito: { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const cartRef = useRef<Record<string, number>>(cart);
  cartRef.current = cart;
  const cartEventIdRef = useRef(0);
  const [cartAddedEvent, setCartAddedEvent] = useState<CartAddedEvent | null>(
    null
  );
  const [cartLaunchOrigin, setCartLaunchOrigin] =
    useState<BubbleLaunchOrigin | null>(null);
  const cartBubbleCircleRef = useRef<React.ComponentRef<typeof View>>(null);
  const [isDraggingCartBubble, setIsDraggingCartBubble] = useState(false);
  const [showBubblePlusOne, setShowBubblePlusOne] = useState(false);
  const cartPulseAnim = useRef(new Animated.Value(1)).current;
  const cartBubbleFlyAnim = useRef(new Animated.Value(0)).current;

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

        // Si fue un toque rápido (sin arrastrar), despliega la ventana de resumen desde el carrito
        if (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8) {
          Haptics.selectionAsync();
          openCartFromBubbleRef.current();
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

  const openCartAsSheet = () => {
    setCartLaunchOrigin(null);
    setCartModalVisible(true);
  };

  const openCartFromBubble = () => {
    if (cartBubbleCircleRef.current) {
      cartBubbleCircleRef.current.measureInWindow((wx, wy, ww, hh) => {
        if (ww > 0 && hh > 0) {
          setCartLaunchOrigin({ x: wx + ww / 2, y: wy + hh / 2 });
        } else {
          setCartLaunchOrigin({
            x: lastCartPosRef.current.x + BUBBLE_SIZE / 2,
            y: lastCartPosRef.current.y + insets.top + BUBBLE_SIZE / 2,
          });
        }
        setCartModalVisible(true);
      });
      return;
    }
    setCartLaunchOrigin({
      x: lastCartPosRef.current.x + BUBBLE_SIZE / 2,
      y: lastCartPosRef.current.y + insets.top + BUBBLE_SIZE / 2,
    });
    setCartModalVisible(true);
  };

  const openCartFromBubbleRef = useRef(openCartFromBubble);
  openCartFromBubbleRef.current = openCartFromBubble;

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
    cartPulseAnim.stopAnimation();
    cartBubbleFlyAnim.stopAnimation();
    cartPulseAnim.setValue(0.92);
    cartBubbleFlyAnim.setValue(0);
    setShowBubblePlusOne(true);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(cartPulseAnim, {
          toValue: 1.26,
          duration: 115,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(cartPulseAnim, {
          toValue: 1,
          tension: 145,
          friction: 4.5,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(cartBubbleFlyAnim, {
        toValue: 1,
        duration: 740,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShowBubblePlusOne(false);
      }
    });
  };

  const triggerBubbleAbsorbPulse = () => {
    cartPulseAnim.stopAnimation();
    cartPulseAnim.setValue(0.84);
    Animated.sequence([
      Animated.timing(cartPulseAnim, {
        toValue: 1.22,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cartPulseAnim, {
        toValue: 1,
        tension: 150,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddToCart = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prevCart = cartRef.current;
    const nextQty = (prevCart[productId] || 0) + 1;
    const nextCart = { ...prevCart, [productId]: nextQty };
    cartRef.current = nextCart;
    setCart(nextCart);
    triggerCartPulse();

    const addedProduct = catalog.find((p) => p.id === productId);
    if (addedProduct) {
      const nextEventId = cartEventIdRef.current + 1;
      cartEventIdRef.current = nextEventId;
      const totalCartItems = Object.values(nextCart).reduce(
        (sum, qty) => sum + (qty > 0 ? qty : 0),
        0
      );
      setCartAddedEvent({
        eventId: nextEventId,
        product: addedProduct,
        qtyInCart: nextQty,
        totalCartItems,
      });
    }
  };

  const handleDecrementCart = (productId: string) => {
    Haptics.selectionAsync();
    const prevCart = cartRef.current;
    const current = prevCart[productId] || 0;
    let nextCart: Record<string, number>;
    if (current <= 1) {
      nextCart = { ...prevCart };
      delete nextCart[productId];
    } else {
      nextCart = {
        ...prevCart,
        [productId]: current - 1,
      };
    }
    cartRef.current = nextCart;
    setCart(nextCart);
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
    return catalog.filter((item) => {
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
    return catalog.filter((item) => {
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
  }, [catalog, activeSpecies, selectedBrand, selectedSearchCategory, searchQuery]);

  // Complementos y snacks para la mascota activa (segundo carrusel en Tienda)
  const speciesSnacks = useMemo(() => {
    return catalog.filter(
      (item) => item.petType === activeSpecies && item.category === 'snacks'
    );
  }, [catalog, activeSpecies]);

  // Los 2 productos frecuentes para la tarjeta de Reloj estilo Uber según la mascota activa
  const recentQuickItems = useMemo(() => {
    return catalog.filter(
      (item) => item.petType === activeSpecies && item.category === 'bultos'
    ).slice(0, 2);
  }, [catalog, activeSpecies]);

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

    const speciesPool = catalog.filter((p) => p.petType === activeSpecies);
    const fallbackProduct =
      (activeSpecies === 'dog' && quizStage === 'puppy'
        ? speciesPool.find((p) => p.stage.toLowerCase().includes('cachorro'))
        : activeSpecies === 'cat' && quizSensitivity === 'weight'
        ? speciesPool.find((p) => p.name.toLowerCase().includes('fit'))
        : undefined) ||
      speciesPool[0] ||
      catalog[0];

    const product =
      catalog.find((p) => p.id === targetProdId) || fallbackProduct;

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
  }, [catalog, activeSpecies, quizStage, quizActivity, quizSensitivity, quizWeightKg]);

  // Totales del carrito
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let subtotal = 0;
    let totalWeightLb = 0;
    let totalCoins = 0;
    const itemsList: { product: ProductBag; quantity: number }[] = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = catalog.find((p) => p.id === id);
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
  }, [catalog, cart, deliveryZone, user, applyCoinsInCart]);

  const handlePlaceCheckoutOrder = (payload: PlaceOrderPayload) => {
    const shippingLabel =
      deliveryZone === 'bogota'
        ? 'Domicilio - Bogotá'
        : `Transportadora Nacional - ${selectedAddress.city}`;

    const createdOrder = recordOrder({
      financialStatus: payload.totals.method.financialStatus,
      total: payload.totals.finalTotal,
      shippingMethod: shippingLabel,
      paymentMethod: payload.totals.method.orderMethodLabel,
      items: cartSummary.itemsList.map((entry) => ({
        name: entry.product.name,
        quantity: entry.quantity,
        price: entry.product.price,
        sku: entry.product.sku,
      })),
    });

    const orderRef = createdOrder ? `#${createdOrder.orderNumber}` : undefined;

    if (cartSummary.coinsToRedeem > 0) {
      redeemCoins(
        cartSummary.coinsToRedeem,
        'Redención en Checkout · Descuento en Pedido',
        `Aplicado en compra de ${cartSummary.totalItems} ítem(s)`,
        orderRef
      );
    }
    if (cartSummary.totalCoins > 0) {
      addCoins(
        cartSummary.totalCoins,
        `Cashback · Pedido de ${cartSummary.totalItems} ítem(s)`,
        `Abono automático en Billetera Consenticoins`,
        'cashback',
        orderRef
      );
    }

    setApplyCoinsInCart(false);
    cartRef.current = {};
    setCart({});
    return createdOrder;
  };

  const renderFeatureCard = (product: ProductBag, bottomTagLabel: string) => {
    const qty = cart[product.id] || 0;
    const hasPhoto = Boolean(product.imageUrl);
    return (
      <View key={product.id} style={styles.uberFeatureCard}>
        <Pressable onPress={() => openProductDetail(product)}>
          {hasPhoto ? (
            <View style={styles.uberCardPhotoArea}>
              <ProductThumbnail
                product={product}
                emojiSize={36}
                borderRadius={18}
                padding={6}
                style={{ width: '100%', height: '100%' }}
              />

              <View
                style={[styles.uberCardTopBadges, styles.uberCardFloatingTop]}
              >
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (product.brand !== 'Salud Vet') {
                      openBrandDna(product.brand as FoodBrandName);
                    } else {
                      openProductDetail(product);
                    }
                  }}
                  style={[
                    styles.uberBrandBadge,
                    { backgroundColor: 'rgba(12, 15, 22, 0.86)' },
                  ]}
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

              <View
                style={[
                  styles.uberCardBottomTag,
                  styles.uberCardFloatingBottom,
                  { backgroundColor: 'rgba(12, 15, 22, 0.88)' },
                ]}
              >
                <Text
                  style={[
                    styles.uberCardBottomTagText,
                    { color: '#FFFFFF' },
                  ]}
                >
                  {bottomTagLabel}
                </Text>
              </View>
            </View>
          ) : (
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
                  <ProductThumbnail
                    product={product}
                    emojiSize={32}
                    borderRadius={29}
                    padding={0}
                    style={{
                      width: 58,
                      height: 58,
                      backgroundColor: 'transparent',
                    }}
                  />
                </View>
              </View>

              <View style={styles.uberCardBottomTag}>
                <Text style={styles.uberCardBottomTagText}>
                  {bottomTagLabel}
                </Text>
              </View>
            </LinearGradient>
          )}
        </Pressable>

        <View style={styles.uberCardBody}>
          <Pressable onPress={() => openProductDetail(product)}>
            <Text style={styles.uberCardTitle} numberOfLines={1}>
              {product.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text
                style={[styles.uberCardSubtitle, { flexShrink: 1 }]}
                numberOfLines={1}
              >
                {product.protein} · +{product.coins} Coins
              </Text>
              <ConsenticoinIcon size={10} />
            </View>
          </Pressable>

          <View style={styles.uberCardPriceRow}>
            <Text style={styles.uberCardPrice}>
              {formatCOP(product.price)}
            </Text>

            <AnimatedCartControl quantity={qty}>
              {qty === 0 ? (
                <Pressable
                  onPress={() => handleAddToCart(product.id)}
                  style={({ pressed }) => [
                    styles.uberAddBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
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
                    style={({ pressed }) => [
                      styles.qtyStepBtn,
                      styles.qtyStepBtnPlus,
                      pressed && { transform: [{ scale: 0.9 }] },
                    ]}
                  >
                    <Ionicons name="add" size={14} color="#050508" />
                  </Pressable>
                </View>
              )}
            </AnimatedCartControl>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ==================== 1. UBER HEADER × LOGO MUNDO MASCOTAS ==================== */}
      <View style={styles.uberTopHeader}>
        {/* LEFT: Address (logged in) or Guest mode label */}
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
              <Text
                style={[styles.locationText, { color: '#FFFFFF' }]}
                numberOfLines={1}
              >
                Modo Invitado
              </Text>
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
                          {/* Foto real del producto (o emoji de respaldo) */}
                          <ProductThumbnail
                            product={item}
                            emojiSize={24}
                            borderRadius={14}
                            padding={2}
                            style={[
                              styles.searchResultIconBox,
                              item.imageUrl ? { backgroundColor: '#FFFFFF' } : null,
                            ]}
                          />

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
                          <AnimatedCartControl quantity={inCart}>
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
                                  style={({ pressed }) => [
                                    styles.searchResultQtyBtn,
                                    { backgroundColor: '#D4AF37' },
                                    pressed && { transform: [{ scale: 0.9 }] },
                                  ]}
                                >
                                  <Ionicons
                                    name="add"
                                    size={16}
                                    color="#050508"
                                  />
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  handleAddToCart(item.id);
                                }}
                                style={({ pressed }) => [
                                  styles.searchResultAddBtn,
                                  pressed && {
                                    opacity: 0.85,
                                    transform: [{ scale: 0.92 }],
                                  },
                                ]}
                              >
                                <Ionicons name="add" size={18} color="#050508" />
                              </Pressable>
                            )}
                          </AnimatedCartControl>
                        </Pressable>
                      </React.Fragment>
                    );
                  })
                )}
              </View>
            )}

            {/* 4. UBER RECENT (SOLO CON SESIÓN INICIADA) */}
            {user && (
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
                      {item.imageUrl ? (
                        <ProductThumbnail
                          product={item}
                          emojiSize={18}
                          borderRadius={11}
                          padding={3}
                          style={{ width: 38, height: 38 }}
                        />
                      ) : (
                        <View style={styles.uberClockIconBox}>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#D1D5DB"
                          />
                        </View>
                      )}
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
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#6B7280"
                      />
                    </Pressable>
                  </React.Fragment>
                ))}
              </View>
            )}

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
                  setQuizJourneyStep(1);
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
                      {item.logoImage ? (
                        <Image
                          source={item.logoImage}
                          style={styles.uberCircleLogoImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.uberCircleEmoji}>{item.emoji}</Text>
                      )}
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
              {filteredProducts.map((product) =>
                renderFeatureCard(
                  product,
                  deliveryZone === 'bogota'
                    ? 'Domicilio Gratis Bogotá'
                    : '+ Flete transportadora'
                )
              )}
            </ScrollView>

            {/* 7. SEGUNDO CARRUSEL EN TIENDA: HÚMEDOS, PREMIOS Y CUIDADO */}
            {speciesSnacks.length > 0 && (
              <>
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
                  {speciesSnacks.map((product) =>
                    renderFeatureCard(product, product.stage)
                  )}
                </ScrollView>
              </>
            )}

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
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={styles.uberPromoBigCoins}>
                      {user?.points ?? 250} COINS
                    </Text>
                    <ConsenticoinIcon size={19} />
                  </View>
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
        {/* ============== VISTA 2: VIAJE BIOLÓGICO INTERACTIVO (ASESOR NUTRICIONAL) ============ */}
        {/* ===================================================================================== */}
        {mainTopTab === 'quiz' && (
          <View style={styles.quizSectionWrapper}>
            {/* CABECERA DEL VIAJE + MAPA DE ESTACIONES (PASOS 1 A 4) */}
            {typeof quizJourneyStep === 'number' && (
              <LinearGradient
                colors={['#171B26', '#0F1219']}
                style={styles.quizHeroCard}
              >
                <View style={styles.quizHeroTopRow}>
                  <View style={[styles.quizHeroBadge, { flexShrink: 1 }]}>
                    <Text style={styles.quizHeroBadgeText} numberOfLines={1}>
                      🧬 PASO {quizJourneyStep} DE 4 · VIAJE BIOLÓGICO
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

                {/* Barra de progreso de las 4 estaciones */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                    marginBottom: 8,
                  }}
                >
                  {[
                    { step: 1, label: 'Etapa' },
                    { step: 2, label: 'Peso' },
                    { step: 3, label: 'Rutina' },
                    { step: 4, label: 'Objetivo' },
                  ].map((st) => {
                    const isCompleted = quizJourneyStep > st.step;
                    const isCurrent = quizJourneyStep === st.step;
                    return (
                      <Pressable
                        key={st.step}
                        onPress={() =>
                          animateToQuizStep(st.step as 1 | 2 | 3 | 4)
                        }
                        style={{ flex: 1, gap: 5 }}
                      >
                        <View
                          style={{
                            height: 5,
                            borderRadius: 3,
                            backgroundColor:
                              isCompleted || isCurrent
                                ? colors.primary.DEFAULT
                                : 'rgba(255, 255, 255, 0.1)',
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: isCurrent ? '900' : '700',
                            color: isCurrent
                              ? colors.primary.light
                              : isCompleted
                              ? '#E5E7EB'
                              : '#6B7280',
                            textAlign: 'center',
                          }}
                        >
                          {isCompleted ? '✓ ' : ''}
                          {st.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </LinearGradient>
            )}

            {/* CONTENEDOR ANIMADO DE CADA ESTACIÓN DEL VIAJE */}
            <Animated.View
              style={{
                opacity: quizStepAnim,
                transform: [{ translateY: quizStepSlide }],
                gap: 14,
              }}
            >
              {/* ==================== ESTACIÓN 1: ETAPA DE VIDA ==================== */}
              {quizJourneyStep === 1 && (
                <View
                  style={{
                    backgroundColor: '#12151C',
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    gap: 14,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 11.5,
                        fontWeight: '800',
                        letterSpacing: 0.6,
                        marginBottom: 4,
                      }}
                    >
                      PASO 1 · MADUREZ METABÓLICA
                    </Text>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 21,
                        fontWeight: '900',
                        lineHeight: 26,
                      }}
                    >
                      ¿En qué etapa de su vida está {displayPetName}?
                    </Text>
                    <Text
                      style={{
                        color: '#9CA3AF',
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 4,
                      }}
                    >
                      Los requerimientos de DHA, calcio y aminoácidos cambian en
                      cada ciclo biológico.
                    </Text>
                  </View>

                  <View style={{ gap: 10 }}>
                    {[
                      {
                        id: 'puppy' as PetStageType,
                        emoji: '🐣',
                        label:
                          activeSpecies === 'cat'
                            ? 'Gatito en Crecimiento'
                            : 'Cachorro en Desarrollo',
                        ageTag: 'Menos de 12 meses',
                        desc: 'Requiere alta densidad proteica, DHA para el cerebro y calcio balanceado.',
                      },
                      {
                        id: 'adult' as PetStageType,
                        emoji: activeSpecies === 'cat' ? '🐱' : '🐕',
                        label: 'Adulto en Plenitud',
                        ageTag: 'De 1 a 7 años',
                        desc: 'Equilibrio celular óptimo entre músculo magro, energía diaria y digestión.',
                      },
                      {
                        id: 'senior' as PetStageType,
                        emoji: '🦮',
                        label: 'Senior / Sabio',
                        ageTag: 'Más de 7 años',
                        desc: 'Soporte articular con glucosamina, antioxidantes y calorías moderadas.',
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
                            styles.quizSensCard,
                            active && styles.quizOptionCardActive,
                            { padding: 14 },
                          ]}
                        >
                          <View
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 23,
                              backgroundColor: active
                                ? 'rgba(212, 175, 55, 0.2)'
                                : '#1A1E29',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 23 }}>{st.emoji}</Text>
                          </View>

                          <View style={{ flex: 1, gap: 4, paddingRight: 4 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <Text
                                style={[
                                  styles.quizSensTitle,
                                  { fontSize: 15, flexShrink: 1 },
                                  active && { color: colors.primary.light },
                                ]}
                              >
                                {st.label}
                              </Text>
                              <View
                                style={{
                                  backgroundColor: active
                                    ? 'rgba(212, 175, 55, 0.2)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2.5,
                                  borderRadius: 6,
                                }}
                              >
                                <Text
                                  style={{
                                    color: active
                                      ? colors.primary.light
                                      : '#D1D5DB',
                                    fontSize: 10.5,
                                    fontWeight: '800',
                                  }}
                                >
                                  {st.ageTag}
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.quizSensSub,
                                { lineHeight: 16, marginTop: 0 },
                              ]}
                            >
                              {st.desc}
                            </Text>
                          </View>

                          <Ionicons
                            name={
                              active ? 'checkmark-circle' : 'ellipse-outline'
                            }
                            size={22}
                            color={
                              active ? colors.primary.DEFAULT : '#4B5563'
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={() => animateToQuizStep(2)}
                    style={[
                      styles.quizPrimaryAddBtn,
                      {
                        paddingVertical: 13,
                        paddingHorizontal: 18,
                        borderRadius: 16,
                        justifyContent: 'space-between',
                      },
                    ]}
                  >
                    <View style={{ width: 32 }} />
                    <Text
                      style={[
                        styles.quizPrimaryAddBtnText,
                        { fontSize: 14.5 },
                      ]}
                    >
                      Siguiente: Peso y Talla
                    </Text>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(5, 5, 8, 0.16)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color="#050508"
                      />
                    </View>
                  </Pressable>
                </View>
              )}

              {/* ==================== ESTACIÓN 2: PESO Y CONSTITUCIÓN ==================== */}
              {quizJourneyStep === 2 && (
                <View
                  style={{
                    backgroundColor: '#12151C',
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    gap: 14,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 11.5,
                        fontWeight: '800',
                        letterSpacing: 0.6,
                        marginBottom: 4,
                      }}
                    >
                      PASO 2 · MASA CORPORAL Y TALLA
                    </Text>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 21,
                        fontWeight: '900',
                        lineHeight: 26,
                      }}
                    >
                      ¿Cuánto pesa aproximadamente {displayPetName}?
                    </Text>
                    <Text
                      style={{
                        color: '#9CA3AF',
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 4,
                      }}
                    >
                      Con su peso exacto calculamos los gramos por porción y los
                      días que te durará el bulto.
                    </Text>
                  </View>

                  {/* Cuadrícula de tarjetas de peso con referencia de talla */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    {(activeSpecies === 'cat'
                      ? [
                          { w: 2.5, tag: 'Esbelto / Joven', icon: '🐱' },
                          { w: 3.5, tag: 'Talla Ligera', icon: '🐈' },
                          { w: 4.5, tag: 'Peso Ideal Promedio', icon: '✨' },
                          { w: 6, tag: 'Gato Grande', icon: '🐈‍⬛' },
                          { w: 8, tag: 'Gigante / Maine Coon', icon: '🦁' },
                        ]
                      : [
                          { w: 5, tag: 'Mini / Toy (<7 kg)', icon: '🐶' },
                          { w: 12, tag: 'Pequeño / Mediano', icon: '🐕' },
                          { w: 20, tag: 'Mediano Estándar', icon: '🐕‍🦺' },
                          { w: 28, tag: 'Raza Grande', icon: '🦮' },
                          { w: 36, tag: 'Grande Atlético', icon: '🐺' },
                          { w: 45, tag: 'Raza Gigante (+40 kg)', icon: '🦁' },
                        ]
                    ).map((item) => {
                      const active = quizWeightKg === item.w;
                      return (
                        <Pressable
                          key={item.w}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setQuizWeightKg(item.w);
                          }}
                          style={[
                            {
                              width: '48%',
                              backgroundColor: '#171B24',
                              borderRadius: 16,
                              padding: 13,
                              borderWidth: 1.5,
                              borderColor: 'rgba(255, 255, 255, 0.08)',
                              gap: 4,
                            },
                            active && styles.quizOptionCardActive,
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text
                              style={{
                                color: active
                                  ? colors.primary.light
                                  : '#FFFFFF',
                                fontSize: 19,
                                fontWeight: '900',
                              }}
                            >
                              {item.w} kg
                            </Text>
                            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                          </View>
                          <Text
                            style={{
                              color: '#9CA3AF',
                              fontSize: 11.5,
                              fontWeight: '600',
                            }}
                          >
                            {item.tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Pre-cálculo energético basal en vivo */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      borderRadius: 14,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    <Ionicons
                      name="flame-outline"
                      size={20}
                      color={colors.primary.light}
                    />
                    <Text
                      style={{
                        color: '#E5E7EB',
                        fontSize: 12,
                        fontWeight: '600',
                        flex: 1,
                        lineHeight: 17,
                      }}
                    >
                      Para{' '}
                      <Text
                        style={{ color: colors.primary.light, fontWeight: '800' }}
                      >
                        {quizWeightKg} kg
                      </Text>
                      , su metabolismo basal requiere aprox.{' '}
                      <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                        {Math.round(70 * Math.pow(quizWeightKg, 0.75) * 1.4)}{' '}
                        kcal/día
                      </Text>
                      .
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => animateToQuizStep(1)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        borderRadius: 16,
                        backgroundColor: '#1A1E29',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color="#E5E7EB"
                      />
                      <Text
                        style={{
                          color: '#E5E7EB',
                          fontSize: 13.5,
                          fontWeight: '800',
                        }}
                      >
                        Atrás
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => animateToQuizStep(3)}
                      style={[
                        styles.quizPrimaryAddBtn,
                        {
                          flex: 1,
                          paddingVertical: 13,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          justifyContent: 'space-between',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quizPrimaryAddBtnText,
                          { fontSize: 14 },
                        ]}
                      >
                        Siguiente: Rutina Diaria
                      </Text>
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: 'rgba(5, 5, 8, 0.16)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#050508"
                        />
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ==================== ESTACIÓN 3: RUTINA Y ACTIVIDAD FÍSICA ==================== */}
              {quizJourneyStep === 3 && (
                <View
                  style={{
                    backgroundColor: '#12151C',
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    gap: 14,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 11.5,
                        fontWeight: '800',
                        letterSpacing: 0.6,
                        marginBottom: 4,
                      }}
                    >
                      PASO 3 · GASTO CALÓRICO DIARIO
                    </Text>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 21,
                        fontWeight: '900',
                        lineHeight: 26,
                      }}
                    >
                      ¿Cómo es la rutina diaria de {displayPetName}?
                    </Text>
                    <Text
                      style={{
                        color: '#9CA3AF',
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 4,
                      }}
                    >
                      Ajustamos el nivel de grasa y proteína para mantener su
                      peso ideal sin hambre.
                    </Text>
                  </View>

                  <View style={{ gap: 10 }}>
                    {[
                      {
                        id: 'low' as PetActivityType,
                        emoji: '🛋️',
                        label: 'Hogareño / Tranquilo',
                        tag: 'Quema Baja',
                        desc: 'Pasa la mayor parte del tiempo en interiores con paseos suaves. Requiere control calórico.',
                      },
                      {
                        id: 'moderate' as PetActivityType,
                        emoji: '🚶',
                        label: 'Paseos y Juego Diario',
                        tag: 'Equilibrio Ideal',
                        desc: 'Salidas diarias al parque o sesiones de juego constantes en casa.',
                      },
                      {
                        id: 'high' as PetActivityType,
                        emoji: '⚡',
                        label: 'Atleta / Alta Energía',
                        tag: 'Alto Rendimiento',
                        desc: 'Corre, entrena o tiene actividad intensa. Necesita máxima proteína animal.',
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
                            styles.quizSensCard,
                            active && styles.quizOptionCardActive,
                            { padding: 14 },
                          ]}
                        >
                          <View
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 23,
                              backgroundColor: active
                                ? 'rgba(212, 175, 55, 0.2)'
                                : '#1A1E29',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 23 }}>{act.emoji}</Text>
                          </View>

                          <View style={{ flex: 1, gap: 4, paddingRight: 4 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <Text
                                style={[
                                  styles.quizSensTitle,
                                  { fontSize: 15, flexShrink: 1 },
                                  active && { color: colors.primary.light },
                                ]}
                              >
                                {act.label}
                              </Text>
                              <View
                                style={{
                                  backgroundColor: active
                                    ? 'rgba(212, 175, 55, 0.2)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2.5,
                                  borderRadius: 6,
                                }}
                              >
                                <Text
                                  style={{
                                    color: active
                                      ? colors.primary.light
                                      : '#D1D5DB',
                                    fontSize: 10.5,
                                    fontWeight: '800',
                                  }}
                                >
                                  {act.tag}
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.quizSensSub,
                                { lineHeight: 16, marginTop: 0 },
                              ]}
                            >
                              {act.desc}
                            </Text>
                          </View>

                          <Ionicons
                            name={
                              active ? 'checkmark-circle' : 'ellipse-outline'
                            }
                            size={22}
                            color={
                              active ? colors.primary.DEFAULT : '#4B5563'
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => animateToQuizStep(2)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        borderRadius: 16,
                        backgroundColor: '#1A1E29',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color="#E5E7EB"
                      />
                      <Text
                        style={{
                          color: '#E5E7EB',
                          fontSize: 13.5,
                          fontWeight: '800',
                        }}
                      >
                        Atrás
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => animateToQuizStep(4)}
                      style={[
                        styles.quizPrimaryAddBtn,
                        {
                          flex: 1,
                          paddingVertical: 13,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          justifyContent: 'space-between',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quizPrimaryAddBtnText,
                          { fontSize: 14 },
                        ]}
                      >
                        Último Paso: Objetivo
                      </Text>
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: 'rgba(5, 5, 8, 0.16)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#050508"
                        />
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ==================== ESTACIÓN 4: PRIORIDAD BIOLÓGICA O SENSIBILIDAD ==================== */}
              {quizJourneyStep === 4 && (
                <View
                  style={{
                    backgroundColor: '#12151C',
                    borderRadius: 22,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    gap: 14,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 11.5,
                        fontWeight: '800',
                        letterSpacing: 0.6,
                        marginBottom: 4,
                      }}
                    >
                      PASO 4 · OBJETIVO NUTRICIONAL
                    </Text>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 21,
                        fontWeight: '900',
                        lineHeight: 26,
                      }}
                    >
                      ¿Qué beneficio quieres priorizar en {displayPetName}?
                    </Text>
                    <Text
                      style={{
                        color: '#9CA3AF',
                        fontSize: 13,
                        lineHeight: 18,
                        marginTop: 4,
                      }}
                    >
                      Elige su prioridad y nuestro laboratorio cruzará su perfil
                      con las fórmulas de Diamond, Taste of the Wild, Acana y
                      Orijen.
                    </Text>
                  </View>

                  <View style={styles.quizSensitivityGrid}>
                    {[
                      {
                        id: 'none' as PetSensitivityType,
                        emoji: '🥩',
                        title: 'Digestión Noble Cordero & Arroz',
                        sub: 'Mantenimiento óptimo diario, estómago tranquilo y probióticos vivos',
                      },
                      {
                        id: 'skin' as PetSensitivityType,
                        emoji: '✨',
                        title: 'Piel Sensible y Pelaje Brillante',
                        sub: 'Fórmula rica en Salmón Salvaje, Trucha, Omega 3 y Omega 6',
                      },
                      {
                        id: 'weight' as PetSensitivityType,
                        emoji: '⚖️',
                        title: 'Control de Peso / Esterilizado',
                        sub: 'Fórmula Light baja en calorías con L-Carnitina quema-grasa',
                      },
                      {
                        id: 'grain_free' as PetSensitivityType,
                        emoji: '🐺',
                        title: '100% Libre de Granos (Ancestral)',
                        sub: 'Proteína pura de Bisonte Asado, Venado o Pollo de Corral',
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
                            { padding: 14 },
                          ]}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: active
                                ? 'rgba(212, 175, 55, 0.2)'
                                : '#1A1E29',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 22 }}>{sens.emoji}</Text>
                          </View>
                          <View style={{ flex: 1, paddingRight: 4 }}>
                            <Text
                              style={[
                                styles.quizSensTitle,
                                { fontSize: 14.5 },
                                active && { color: colors.primary.light },
                              ]}
                            >
                              {sens.title}
                            </Text>
                            <Text
                              style={[
                                styles.quizSensSub,
                                { lineHeight: 16, marginTop: 3 },
                              ]}
                            >
                              {sens.sub}
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              active ? 'checkmark-circle' : 'ellipse-outline'
                            }
                            size={22}
                            color={
                              active ? colors.primary.DEFAULT : '#4B5563'
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <Pressable
                      onPress={() => animateToQuizStep(3)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        borderRadius: 16,
                        backgroundColor: '#1A1E29',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color="#E5E7EB"
                      />
                      <Text
                        style={{
                          color: '#E5E7EB',
                          fontSize: 13.5,
                          fontWeight: '800',
                        }}
                      >
                        Atrás
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={startQuizBiologicalAnalysis}
                      style={[
                        styles.quizPrimaryAddBtn,
                        {
                          flex: 1,
                          paddingVertical: 13,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          justifyContent: 'space-between',
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Ionicons name="sparkles" size={18} color="#050508" />
                        <Text
                          style={[
                            styles.quizPrimaryAddBtnText,
                            { fontSize: 14 },
                          ]}
                        >
                          Analizar ADN y Resultado
                        </Text>
                      </View>
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: 'rgba(5, 5, 8, 0.16)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#050508"
                        />
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ==================== ESTACIÓN 5: LABORATORIO ANALIZANDO EN TIEMPO REAL ==================== */}
              {quizJourneyStep === 'analyzing' && (
                <LinearGradient
                  colors={['#1C2130', '#10131C']}
                  style={{
                    borderRadius: 24,
                    padding: 24,
                    borderWidth: 1.5,
                    borderColor: 'rgba(212, 175, 55, 0.45)',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 37,
                      backgroundColor: 'rgba(212, 175, 55, 0.16)',
                      borderWidth: 1.5,
                      borderColor: colors.primary.DEFAULT,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 34 }}>🧬</Text>
                  </View>

                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 12,
                        fontWeight: '900',
                        letterSpacing: 1,
                      }}
                    >
                      LABORATORIO NUTRICIONAL MUNDO MASCOTAS
                    </Text>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 21,
                        fontWeight: '900',
                        textAlign: 'center',
                      }}
                    >
                      Formulando el plan de {displayPetName}...
                    </Text>
                    <Text
                      style={{
                        color: colors.primary.light,
                        fontSize: 28,
                        fontWeight: '900',
                        marginTop: 2,
                      }}
                    >
                      {Math.min(100, quizAnalysisStep * 25)}%
                    </Text>
                  </View>

                  {/* Barra de carga animada */}
                  <View
                    style={{
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#1E2433',
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(100, quizAnalysisStep * 25)}%`,
                        height: '100%',
                        backgroundColor: colors.primary.DEFAULT,
                        borderRadius: 4,
                      }}
                    />
                  </View>

                  {/* Pasos científicos encendiéndose en vivo */}
                  <View style={{ width: '100%', gap: 10, marginTop: 4 }}>
                    {[
                      {
                        step: 1,
                        text: `Calculando curva metabólica para ${quizWeightKg} kg (${
                          quizStage === 'puppy'
                            ? 'Cachorro'
                            : quizStage === 'senior'
                            ? 'Senior'
                            : 'Adulto'
                        })`,
                      },
                      {
                        step: 2,
                        text: 'Evaluando inclusión proteica y perfil de aminoácidos esenciales',
                      },
                      {
                        step: 3,
                        text: 'Cruzando ADN de Diamond Naturals, Taste of the Wild, Acana y Orijen',
                      },
                      {
                        step: 4,
                        text: 'Determinando gramos exactos por día y duración del bulto',
                      },
                    ].map((check) => {
                      const done = quizAnalysisStep >= check.step;
                      return (
                        <View
                          key={check.step}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            backgroundColor: done
                              ? 'rgba(212, 175, 55, 0.1)'
                              : 'rgba(255, 255, 255, 0.03)',
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: done
                              ? 'rgba(212, 175, 55, 0.35)'
                              : 'rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <Ionicons
                            name={
                              done ? 'checkmark-circle' : 'hourglass-outline'
                            }
                            size={18}
                            color={done ? colors.primary.light : '#6B7280'}
                          />
                          <Text
                            style={{
                              color: done ? '#FFFFFF' : '#6B7280',
                              fontSize: 12.5,
                              fontWeight: done ? '700' : '600',
                              flex: 1,
                            }}
                          >
                            {check.text}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </LinearGradient>
              )}

              {/* ==================== ESTACIÓN 6: REVELACIÓN DEL DIAGNÓSTICO PERSONALIZADO ==================== */}
              {quizJourneyStep === 'result' && (
                <LinearGradient
                  colors={['#1F2433', '#11141D']}
                  style={[styles.quizResultCard, { marginTop: 0 }]}
                >
                  <View style={styles.quizResultBadgeRow}>
                    <View style={styles.quizMatchPill}>
                      <Text style={styles.quizMatchPillText}>
                        ✓ 99.4% COMPATIBILIDAD BIOLÓGICA
                      </Text>
                    </View>
                    <Text style={styles.quizWeightBadgeText}>
                      {quizRecommendation.product.unitLabel ||
                        `${quizRecommendation.product.weightLb} LB`}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Pressable
                      onPress={() => openImageZoom(quizRecommendation.product)}
                      disabled={!quizRecommendation.product.imageUrl}
                    >
                      <ProductThumbnail
                        product={quizRecommendation.product}
                        emojiSize={34}
                        borderRadius={16}
                        padding={2}
                        style={{ width: 96, height: 112 }}
                      />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: '#9CA3AF',
                          fontSize: 11.5,
                          fontWeight: '700',
                          marginBottom: 3,
                        }}
                      >
                        Fórmula ganadora para {displayPetName} ({quizWeightKg} kg ·{' '}
                        {quizStage === 'puppy'
                          ? 'Cachorro'
                          : quizStage === 'senior'
                          ? 'Senior'
                          : 'Adulto'}
                        ):
                      </Text>

                      <Text style={styles.quizResultProdTitle}>
                        {quizRecommendation.product.name}
                      </Text>
                      <Text
                        style={[styles.quizResultProdSub, { marginBottom: 0 }]}
                      >
                        {quizRecommendation.product.protein}
                      </Text>
                    </View>
                  </View>

                  {/* Botón rápido para ver el ADN científico de la marca ganadora */}
                  {quizRecommendation.product.brand !== 'Salud Vet' && (
                    <Pressable
                      onPress={() =>
                        openBrandDna(
                          quizRecommendation.product.brand as FoodBrandName
                        )
                      }
                      style={{
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(212, 175, 55, 0.14)',
                        paddingHorizontal: 11,
                        paddingVertical: 6,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(212, 175, 55, 0.35)',
                        marginBottom: 14,
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>🧬</Text>
                      <Text
                        style={{
                          color: colors.primary.light,
                          fontSize: 11.5,
                          fontWeight: '800',
                        }}
                      >
                        Explorar ADN de {quizRecommendation.product.brand} ›
                      </Text>
                    </Pressable>
                  )}

                  {/* Métricas de ración, porciones y duración */}
                  <View style={styles.quizMetricsRow}>
                    <View style={styles.quizMetricBox}>
                      <Text style={styles.quizMetricValue}>
                        {quizRecommendation.dailyGrams} g/día
                      </Text>
                      <Text style={styles.quizMetricLabel}>
                        2 comidas de {Math.round(quizRecommendation.dailyGrams / 2)}g
                      </Text>
                    </View>
                    <View style={styles.quizMetricBox}>
                      <Text style={styles.quizMetricValue}>
                        ~{quizRecommendation.estimatedDays} días
                      </Text>
                      <Text style={styles.quizMetricLabel}>
                        Duración del bulto
                      </Text>
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
                        openCartAsSheet();
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

                    <Pressable
                      onPress={() => animateToQuizStep(1)}
                      style={{
                        alignSelf: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text
                        style={{
                          color: '#9CA3AF',
                          fontSize: 12.5,
                          fontWeight: '700',
                        }}
                      >
                        🔄 Ajustar respuestas o evaluar otra mascota
                      </Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              )}
            </Animated.View>
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
                          const defaultDogBreed = PET_BREEDS_CATALOG.find(
                            (b) => b.id === 'dog_golden_retriever'
                          );
                          if (defaultDogBreed) {
                            applyBreedSelectionToNewPet(defaultDogBreed);
                          } else {
                            setNewPetBreed('Golden Retriever');
                            setNewPetWeight('29');
                          }
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
                          const defaultCatBreed = PET_BREEDS_CATALOG.find(
                            (b) => b.id === 'cat_criollo_corto'
                          );
                          if (defaultCatBreed) {
                            applyBreedSelectionToNewPet(defaultCatBreed);
                          } else {
                            setNewPetBreed('Criollo / Doméstico Pelo Corto');
                            setNewPetWeight('4.5');
                          }
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
                        style={[styles.petFormInput, { flex: 0.95 }]}
                      />

                      {/* Selector de Raza con catálogo precargado */}
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEditingBreedPetId(null);
                          setBreedSheetVisible(true);
                        }}
                        style={[
                          styles.petFormInput,
                          {
                            flex: 1.25,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderColor: 'rgba(212, 175, 55, 0.45)',
                            backgroundColor: '#151924',
                          },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text
                            style={{
                              color: colors.primary.light,
                              fontSize: 9.5,
                              fontWeight: '800',
                              letterSpacing: 0.3,
                            }}
                          >
                            RAZA PRECARGADA
                          </Text>
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 13,
                              fontWeight: '800',
                            }}
                            numberOfLines={1}
                          >
                            {newPetBreed || 'Elegir raza'}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={colors.primary.light}
                        />
                      </Pressable>
                    </View>

                    {/* Chips rápidos de razas populares + botón Ver Todas */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        gap: 7,
                        paddingTop: 8,
                        paddingBottom: 2,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEditingBreedPetId(null);
                          setBreedSheetVisible(true);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: 'rgba(212, 175, 55, 0.16)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.primary.DEFAULT,
                        }}
                      >
                        <Ionicons
                          name="search"
                          size={12}
                          color={colors.primary.light}
                        />
                        <Text
                          style={{
                            color: colors.primary.light,
                            fontSize: 11.5,
                            fontWeight: '800',
                          }}
                        >
                          Buscar todas (
                          {
                            PET_BREEDS_CATALOG.filter(
                              (b) => b.species === newPetSpecies
                            ).length
                          }
                          ) ›
                        </Text>
                      </Pressable>

                      {PET_BREEDS_CATALOG.filter(
                        (b) => b.species === newPetSpecies
                      )
                        .slice(0, 8)
                        .map((quickBreed) => {
                          const isSelected =
                            newPetBreed.toLowerCase() ===
                            quickBreed.name.toLowerCase();
                          return (
                            <Pressable
                              key={quickBreed.id}
                              onPress={() => {
                                Haptics.selectionAsync();
                                applyBreedSelectionToNewPet(quickBreed);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                backgroundColor: isSelected
                                  ? colors.primary.DEFAULT
                                  : '#161922',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: isSelected
                                  ? colors.primary.light
                                  : 'rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              <Text style={{ fontSize: 12 }}>
                                {quickBreed.emoji}
                              </Text>
                              <Text
                                style={{
                                  color: isSelected ? '#050508' : '#D1D5DB',
                                  fontSize: 11.5,
                                  fontWeight: isSelected ? '900' : '700',
                                }}
                              >
                                {quickBreed.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                    </ScrollView>

                    {/* Nota de calibración biológica según la raza elegida */}
                    {newPetBioTrait ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          marginTop: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>🧬</Text>
                        <Text
                          style={{
                            color: '#9CA3AF',
                            fontSize: 11.5,
                            fontWeight: '600',
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          ADN {newPetBreed}: {newPetBioTrait}
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        marginTop: 8,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 0.9 }}>
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
                      <View style={{ flex: 1.3 }}>
                        <Text style={styles.quizStepTitle}>Etapa</Text>
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            const stages: PetStageType[] = [
                              'puppy',
                              'adult',
                              'senior',
                            ];
                            const nextStage =
                              stages[(stages.indexOf(newPetStage) + 1) % 3];
                            setNewPetStage(nextStage);
                            const matchedBreed = PET_BREEDS_CATALOG.find(
                              (b) =>
                                b.species === newPetSpecies &&
                                b.name.toLowerCase() ===
                                  newPetBreed.toLowerCase()
                            );
                            if (matchedBreed) {
                              setNewPetWeight(
                                String(
                                  nextStage === 'puppy'
                                    ? matchedBreed.puppyWeightKg
                                    : matchedBreed.avgWeightKg
                                )
                              );
                            }
                          }}
                          style={[
                            styles.petFormInput,
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontWeight: '700',
                              fontSize: 13,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {newPetStage === 'puppy'
                              ? newPetSpecies === 'cat'
                                ? '🐣 Gatito (<1 año)'
                                : '🐣 Cachorro (<1 año)'
                              : newPetStage === 'adult'
                              ? '🐕 Adulto (1-7 años)'
                              : '🦮 Senior (+7 años)'}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={15}
                            color="#9CA3AF"
                          />
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
                        const recProdId = getRecommendedBagIdForBreed(
                          newPetSpecies,
                          newPetStage,
                          newPetSensitivity,
                          newPetActivity
                        );
                        addPet({
                          name: newPetName.trim(),
                          species: newPetSpecies,
                          breed:
                            newPetBreed.trim() ||
                            (newPetSpecies === 'cat'
                              ? 'Criollo / Doméstico Pelo Corto'
                              : 'Criollo / Mestizo Mediano'),
                          ageStage: newPetStage,
                          weightKg: parseFloat(newPetWeight) || 15,
                          activityLevel: newPetActivity,
                          sensitivity: newPetSensitivity,
                          recommendedProductId: recProdId,
                        });
                        setNewPetName('');
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
                      catalog.find(
                        (b) => b.id === petItem.recommendedProductId
                      ) ||
                      catalog.find((b) => b.petType === petItem.species) ||
                      catalog[0];

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
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                                marginTop: 2,
                              }}
                            >
                              <Pressable
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  setEditingBreedPetId(petItem.id);
                                  setBreedSheetVisible(true);
                                }}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2.5,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#E5E7EB',
                                    fontSize: 11.5,
                                    fontWeight: '700',
                                  }}
                                >
                                  {petItem.breed}
                                </Text>
                                <Ionicons
                                  name="chevron-down"
                                  size={11}
                                  color={colors.primary.light}
                                />
                              </Pressable>
                              <Text style={styles.petCardMeta}>
                                · {petItem.weightKg} kg ·{' '}
                                {petItem.ageStage === 'puppy'
                                  ? 'Cachorro'
                                  : petItem.ageStage === 'senior'
                                  ? 'Senior'
                                  : 'Adulto'}
                              </Text>
                            </View>
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
            <View
              ref={cartBubbleCircleRef}
              collapsable={false}
              style={styles.draggableCartCircleWrap}
            >
              {showBubblePlusOne && (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.draggableCartPulseRing,
                      {
                        opacity: cartBubbleFlyAnim.interpolate({
                          inputRange: [0, 0.25, 1],
                          outputRange: [0.85, 0.45, 0],
                        }),
                        transform: [
                          {
                            scale: cartBubbleFlyAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.95, 1.65],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={styles.draggableCartPlusOneHost}
                  >
                    <Animated.View
                      style={[
                        styles.draggableCartPlusOnePill,
                        {
                          opacity: cartBubbleFlyAnim.interpolate({
                            inputRange: [0, 0.15, 0.72, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                          transform: [
                            {
                              translateY: cartBubbleFlyAnim.interpolate({
                                inputRange: [0, 0.35, 1],
                                outputRange: [0, -18, -34],
                              }),
                            },
                            {
                              scale: cartBubbleFlyAnim.interpolate({
                                inputRange: [0, 0.25, 1],
                                outputRange: [0.7, 1.18, 0.94],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text
                        style={styles.draggableCartPlusOneText}
                        numberOfLines={1}
                      >
                        +1 ✓
                      </Text>
                    </Animated.View>
                  </View>
                </>
              )}
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
              openCartAsSheet();
            }}
            style={[
              styles.uberDockTab,
              activeBottomTab === 'catalog' && styles.uberDockTabActivePill,
            ]}
          >
            <Animated.View
              style={{
                alignItems: 'center',
                gap: 2,
                transform: [{ scale: cartPulseAnim }],
              }}
            >
              <Ionicons
                name={cartSummary.totalItems > 0 ? 'bag-handle' : 'grid-outline'}
                size={20}
                color={
                  activeBottomTab === 'catalog'
                    ? '#FFFFFF'
                    : cartSummary.totalItems > 0
                    ? colors.primary.light
                    : '#9CA3AF'
                }
              />
              <Text
                style={[
                  styles.uberDockLabel,
                  activeBottomTab === 'catalog' && styles.uberDockLabelActive,
                  cartSummary.totalItems > 0 && {
                    color: colors.primary.light,
                    fontWeight: '700',
                  },
                ]}
              >
                Bolsa ({cartSummary.totalItems})
              </Text>
            </Animated.View>
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

      {/* Notificación animada al agregar cualquier producto desde la vista principal */}
      <CartAddedToast
        event={cartAddedEvent}
        visible={
          !productDetailVisible &&
          !brandDnaModalVisible &&
          !cartModalVisible &&
          !checkoutModalVisible
        }
        topOffset={Math.max(insets.top, 12) + 8}
        onViewCart={() => {
          Haptics.selectionAsync();
          openCartAsSheet();
        }}
      />

      {/* ==================== MODAL RESUMEN DE BOLSA / PORTAL DEL CARRITO ==================== */}
      <CartSummaryModal
        visible={cartModalVisible}
        launchOrigin={cartLaunchOrigin}
        deliveryZone={deliveryZone}
        itemsList={cartSummary.itemsList}
        totalItems={cartSummary.totalItems}
        totalWeightLb={cartSummary.totalWeightLb}
        subtotal={cartSummary.subtotal}
        estimatedCarrierFee={cartSummary.estimatedCarrierFee}
        coinsToRedeem={cartSummary.coinsToRedeem}
        coinsDiscountCop={cartSummary.coinsDiscountCop}
        totalCoinsToEarn={cartSummary.totalCoins}
        totalWithShipping={cartSummary.totalWithShipping}
        applyCoinsInCart={applyCoinsInCart}
        onToggleApplyCoins={() => setApplyCoinsInCart((prev) => !prev)}
        onAddToCart={handleAddToCart}
        onDecrementCart={handleDecrementCart}
        onRequestAddressChange={() => {
          setCartModalVisible(false);
          if (user) {
            setTimeout(() => setAddressSheetVisible(true), 120);
          } else {
            setTimeout(() => openAuthModal('login'), 120);
          }
        }}
        onRequestOpenWallet={() => {
          setCartModalVisible(false);
          setTimeout(() => setWalletVisible(true), 120);
        }}
        onRequestProceedToCheckout={() => {
          setCartModalVisible(false);
          setTimeout(() => setCheckoutModalVisible(true), 120);
        }}
        onRequestLogin={() => {
          setCartModalVisible(false);
          setTimeout(() => openAuthModal('login'), 120);
        }}
        onClose={(absorbedIntoBubble) => {
          setCartModalVisible(false);
          if (absorbedIntoBubble) {
            triggerBubbleAbsorbPulse();
          }
        }}
      />

      {/* Panel de Inbox con transición de portal desde la esquina superior derecha */}
      <InboxModal
        visible={inboxVisible}
        onClose={() => setInboxVisible(false)}
        onQuickAddProduct={(prodId) => {
          handleAddToCart(prodId);
          openCartAsSheet();
        }}
        onOpenProfile={() => setProfileVisible(true)}
      />

      {/* Panel Deslizable de Direcciones de Entrega */}
      <AddressSelectorSheet
        visible={addressSheetVisible}
        onClose={() => {
          setAddressSheetVisible(false);
          if (reopenCheckoutAfterAddressRef.current) {
            reopenCheckoutAfterAddressRef.current = false;
            setTimeout(() => setCheckoutModalVisible(true), 220);
          }
        }}
      />

      {/* Flujo dedicado de Checkout: Contra entrega / Anticipado + recargo +5% */}
      <CheckoutModal
        visible={checkoutModalVisible}
        deliveryZone={deliveryZone}
        itemsList={cartSummary.itemsList}
        totalItems={cartSummary.totalItems}
        totalWeightLb={cartSummary.totalWeightLb}
        subtotal={cartSummary.subtotal}
        estimatedCarrierFee={cartSummary.estimatedCarrierFee}
        coinsToRedeem={cartSummary.coinsToRedeem}
        coinsDiscountCop={cartSummary.coinsDiscountCop}
        totalCoinsToEarn={cartSummary.totalCoins}
        onClose={() => setCheckoutModalVisible(false)}
        onBackToCart={() => {
          setCheckoutModalVisible(false);
          setTimeout(() => openCartAsSheet(), 200);
        }}
        onChangeAddress={() => {
          reopenCheckoutAfterAddressRef.current = true;
          setCheckoutModalVisible(false);
          setTimeout(() => setAddressSheetVisible(true), 220);
        }}
        onPlaceOrder={handlePlaceCheckoutOrder}
        onOpenOrders={() => {
          setCheckoutModalVisible(false);
          setTimeout(() => setOrdersVisible(true), 220);
        }}
      />

      {/* Panel Deslizable exclusivo de Pedidos del Cliente */}
      <CustomerOrdersSheet
        visible={ordersVisible}
        onClose={() => setOrdersVisible(false)}
        onReorderItems={(skus) => {
          skus.forEach((sku) => {
            const matched = catalog.find((b) => b.sku === sku);
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
          openCartAsSheet();
        }}
        onRedeemFreeProduct={(prodId) => {
          handleAddToCart(prodId);
        }}
      />

      {/* Selector Inteligente de Raza Precargada (Perros y Gatos) */}
      <BreedSelectorSheet
        visible={breedSheetVisible}
        species={
          editingBreedPetId
            ? pets.find((p) => p.id === editingBreedPetId)?.species ||
              newPetSpecies
            : newPetSpecies
        }
        selectedBreedName={
          editingBreedPetId
            ? pets.find((p) => p.id === editingBreedPetId)?.breed || ''
            : newPetBreed
        }
        onClose={() => {
          setBreedSheetVisible(false);
          setEditingBreedPetId(null);
        }}
        onSelectBreed={(chosenBreed) => {
          if (editingBreedPetId) {
            const targetPet = pets.find((p) => p.id === editingBreedPetId);
            const targetStage = targetPet?.ageStage || 'adult';
            const nextRecId = getRecommendedBagIdForBreed(
              chosenBreed.species,
              targetStage,
              chosenBreed.defaultSensitivity,
              chosenBreed.defaultActivity
            );
            updatePet(editingBreedPetId, {
              breed: chosenBreed.name,
              weightKg:
                targetStage === 'puppy'
                  ? chosenBreed.puppyWeightKg
                  : chosenBreed.avgWeightKg,
              activityLevel: chosenBreed.defaultActivity,
              sensitivity: chosenBreed.defaultSensitivity,
              recommendedProductId: nextRecId,
            });
            setEditingBreedPetId(null);
          } else {
            applyBreedSelectionToNewPet(chosenBreed);
          }
        }}
      />

      {/* Vista Especializada del ADN de cada Marca Insignia y su Catálogo Completo */}
      <BrandDnaModal
        visible={brandDnaModalVisible}
        brand={activeBrandDna}
        activeSpecies={activeSpecies}
        petName={displayPetName}
        deliveryZone={deliveryZone}
        products={catalog}
        cart={cart}
        onClose={() => setBrandDnaModalVisible(false)}
        onSelectBrand={(newBrand) => setActiveBrandDna(newBrand)}
        onAddToCart={handleAddToCart}
        onDecrementCart={handleDecrementCart}
        onInspectProduct={(prod) => openProductDetail(prod as ProductBag)}
        onZoomProduct={(prod) => openImageZoom(prod as ProductBag)}
        cartAddedEvent={cartAddedEvent}
        suppressAddedToast={
          productDetailVisible || cartModalVisible || checkoutModalVisible
        }
        onOpenCart={() => {
          setBrandDnaModalVisible(false);
          setTimeout(() => openCartAsSheet(), 180);
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
          <View style={styles.productDetailBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeProductDetail}
            />
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

              {/* Close button fijo arriba a la derecha */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={closeProductDetail}
                style={styles.productDetailCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <ScrollView
                style={styles.productDetailScroll}
                bounces={false}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >

                {/* Brand + foto real grande (al tocar abre el visor con zoom) */}
                {selectedProduct.imageUrl && (
                  <Pressable
                    onPress={() => openImageZoom(selectedProduct)}
                    style={({ pressed }) => [
                      styles.productDetailPhotoBanner,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <ProductThumbnail
                      product={selectedProduct}
                      emojiSize={48}
                      borderRadius={0}
                      padding={10}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <View style={styles.productDetailZoomHintPill}>
                      <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.productDetailZoomHintText}>
                        Toca para zoom
                      </Text>
                    </View>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    if (selectedProduct.brand !== 'Salud Vet') {
                      const targetBrand =
                        selectedProduct.brand as FoodBrandName;
                      closeProductDetail();
                      setTimeout(() => openBrandDna(targetBrand), 180);
                    }
                  }}
                  style={[
                    styles.productDetailBrandRow,
                    selectedProduct.imageUrl ? { paddingTop: 14 } : null,
                  ]}
                >
                  {!selectedProduct.imageUrl && (
                    <View style={styles.productDetailEmojiBox}>
                      {(() => {
                        const brandLogo =
                          BRAND_LOGO_MAP[selectedProduct.brand];
                        if (brandLogo) {
                          return (
                            <Image
                              source={brandLogo}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          );
                        }
                        return (
                          <Text style={{ fontSize: 34 }}>
                            {selectedProduct.brand === 'Diamond Naturals'
                              ? '💎'
                              : selectedProduct.brand === 'Taste of the Wild'
                                ? '🐺'
                                : '🛍️'}
                          </Text>
                        );
                      })()}
                    </View>
                  )}
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
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      <Text
                        style={[
                          styles.productDetailSpecValue,
                          { color: colors.primary.light },
                        ]}
                      >
                        +{selectedProduct.coins}
                      </Text>
                      <ConsenticoinIcon size={14} />
                    </View>
                    <Text style={styles.productDetailSpecLabel}>
                      Consenticoins
                    </Text>
                  </View>
                </View>

                {/* Menú desplegable con descripción completa del producto */}
                <ProductDescriptionAccordion
                  key={selectedProduct.id}
                  product={selectedProduct}
                />

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
              </ScrollView>

              {/* Price + Add button fijo abajo */}
              <View style={styles.productDetailFooter}>
                  <View>
                    <Text style={styles.productDetailPriceLabel}>Precio</Text>
                    <Text style={styles.productDetailPrice}>
                      {formatCOP(selectedProduct.price)}
                    </Text>
                  </View>

                  {(() => {
                    const inCart = cart[selectedProduct.id] ?? 0;
                    return (
                      <AnimatedCartControl
                        quantity={inCart}
                        style={
                          inCart === 0 ? styles.productDetailAddWrap : undefined
                        }
                      >
                        {inCart > 0 ? (
                          <View style={styles.productDetailQtyRow}>
                            <Pressable
                              onPress={() =>
                                handleDecrementCart(selectedProduct.id)
                              }
                              style={styles.productDetailQtyBtn}
                              hitSlop={8}
                            >
                              <Ionicons name="remove" size={18} color="#FFFFFF" />
                            </Pressable>
                            <Text style={styles.productDetailQtyText}>
                              {inCart}
                            </Text>
                            <Pressable
                              onPress={() =>
                                handleAddToCart(selectedProduct.id)
                              }
                              style={({ pressed }) => [
                                styles.productDetailQtyBtn,
                                { backgroundColor: '#D4AF37' },
                                pressed && { transform: [{ scale: 0.92 }] },
                              ]}
                              hitSlop={8}
                            >
                              <Ionicons name="add" size={18} color="#050508" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => handleAddToCart(selectedProduct.id)}
                            style={({ pressed }) => [
                              styles.productDetailAddBtn,
                              pressed && {
                                opacity: 0.88,
                                transform: [{ scale: 0.97 }],
                              },
                            ]}
                          >
                            <Ionicons
                              name="cart-outline"
                              size={18}
                              color="#050508"
                            />
                            <Text style={styles.productDetailAddText}>
                              Agregar al carrito
                            </Text>
                          </Pressable>
                        )}
                      </AnimatedCartControl>
                    );
                  })()}
              </View>
            </Animated.View>

            <CartAddedToast
              event={cartAddedEvent}
              visible={productDetailVisible && !cartModalVisible}
              topOffset={Math.max(insets.top, 20) + 10}
              onViewCart={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                closeProductDetail();
                setTimeout(() => openCartAsSheet(), 220);
              }}
            />
          </View>
        </Modal>
      )}

      {/* ==================== VISOR DE IMAGEN EN PANTALLA COMPLETA CON ZOOM ==================== */}
      <ImageZoomModal
        visible={Boolean(zoomProduct)}
        imageUrl={zoomProduct?.zoomImageUrl ?? zoomProduct?.imageUrl}
        title={zoomProduct?.name}
        subtitle={zoomProduct?.protein}
        unitLabel={
          zoomProduct
            ? zoomProduct.unitLabel || `${zoomProduct.weightLb} LB`
            : undefined
        }
        onClose={() => setZoomProduct(null)}
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
    overflow: 'hidden',
  },
  uberCircleGraphicActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },
  uberCircleLogoImage: {
    width: '100%',
    height: '100%',
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
    height: 204,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  uberCardPhotoArea: {
    height: 208,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  uberCardFloatingTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  uberCardFloatingBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
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
  draggableCartPulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#34D399',
  },
  draggableCartPlusOneHost: {
    position: 'absolute',
    top: -12,
    left: -24,
    right: -24,
    alignItems: 'center',
    zIndex: 35,
  },
  draggableCartPlusOnePill: {
    backgroundColor: '#34D399',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    elevation: 25,
  },
  draggableCartPlusOneText: {
    color: '#052E16',
    fontSize: 11,
    fontWeight: '900',
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
    width: 58,
    height: 58,
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
    maxHeight: '88%',
    backgroundColor: '#12151C',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  productDetailScroll: {
    flexShrink: 1,
    flexGrow: 0,
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
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  productDetailPhotoBanner: {
    width: '100%',
    height: 224,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  productDetailZoomHintPill: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(12, 15, 22, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  productDetailZoomHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
    overflow: 'hidden',
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
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
  productDetailAddWrap: {
    flex: 1,
  },
  productDetailAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    alignSelf: 'stretch',
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
