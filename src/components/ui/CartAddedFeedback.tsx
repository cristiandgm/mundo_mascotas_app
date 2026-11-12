import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ProductThumbnail, ProductVisualSource } from './ProductThumbnail';

export interface CartAddedEvent {
  eventId: number;
  product: ProductVisualSource & {
    id: string;
    name: string;
    price: number;
  };
  qtyInCart: number;
  totalCartItems: number;
}

interface AnimatedCartControlProps {
  quantity: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Envuelve cualquier botón "Pedir" / "Agregar" o stepper [ - qty + ] para
 * animar un rebote elástico y elevar un indicador "+1" cuando aumenta la cantidad.
 * Al vivir por encima del cambio condicional (0 -> 1), la animación nunca se corta.
 */
export const AnimatedCartControl: React.FC<AnimatedCartControlProps> = ({
  quantity,
  children,
  style,
}) => {
  const prevQtyRef = useRef(quantity);
  const popScale = useRef(new Animated.Value(1)).current;
  const floatProgress = useRef(new Animated.Value(0)).current;
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    const prevQty = prevQtyRef.current;
    prevQtyRef.current = quantity;

    if (quantity <= prevQty) {
      return;
    }

    setShowBurst(true);
    popScale.stopAnimation();
    floatProgress.stopAnimation();
    popScale.setValue(0.88);
    floatProgress.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(popScale, {
          toValue: 1.09,
          duration: 115,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(popScale, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(floatProgress, {
        toValue: 1,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShowBurst(false);
      }
    });
  }, [quantity, popScale, floatProgress]);

  const badgeTranslateY = floatProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [2, -18, -36],
  });
  const badgeOpacity = floatProgress.interpolate({
    inputRange: [0, 0.14, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });
  const badgeScale = floatProgress.interpolate({
    inputRange: [0, 0.25, 0.65, 1],
    outputRange: [0.65, 1.16, 1, 0.92],
  });

  return (
    <View style={[styles.controlWrap, style]}>
      {showBurst && (
        <View pointerEvents="none" style={styles.floatingPlusHost}>
          <Animated.View
            style={[
              styles.floatingPlusBadge,
              {
                opacity: badgeOpacity,
                transform: [
                  { translateY: badgeTranslateY },
                  { scale: badgeScale },
                ],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={12} color="#052E16" />
            <Text style={styles.floatingPlusText} numberOfLines={1}>
              +1
            </Text>
          </Animated.View>
        </View>
      )}
      <Animated.View
        style={[styles.controlContent, { transform: [{ scale: popScale }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

interface CartAddedToastProps {
  event: CartAddedEvent | null;
  visible?: boolean;
  topOffset?: number;
  onViewCart?: () => void;
}

/**
 * Toast flotante animado ("¡Agregado al carrito!") que se muestra encima
 * de la vista o modal activo cada vez que se añade un producto.
 */
export const CartAddedToast: React.FC<CartAddedToastProps> = ({
  event,
  visible = true,
  topOffset = 14,
  onViewCart,
}) => {
  const [renderedEvent, setRenderedEvent] = useState<CartAddedEvent | null>(
    null
  );
  const lastHandledIdRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideY = useRef(new Animated.Value(-36)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const haloProgress = useRef(new Animated.Value(0)).current;

  const dismissToast = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: -24,
        duration: 210,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.94,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderedEvent(null);
      }
    });
  };

  useEffect(() => {
    if (!event) {
      return;
    }
    if (!visible) {
      // Registrar el evento como ya consumido cuando este contenedor está oculto
      // evita que se reproduzca tarde al abrir otro modal.
      lastHandledIdRef.current = event.eventId;
      return;
    }
    if (event.eventId === lastHandledIdRef.current) {
      return;
    }
    lastHandledIdRef.current = event.eventId;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    setRenderedEvent(event);
    slideY.stopAnimation();
    opacity.stopAnimation();
    cardScale.stopAnimation();
    checkScale.stopAnimation();
    haloProgress.stopAnimation();

    slideY.setValue(-34);
    opacity.setValue(0);
    cardScale.setValue(0.9);
    checkScale.setValue(0.35);
    haloProgress.setValue(0);

    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        tension: 110,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(50),
        Animated.spring(checkScale, {
          toValue: 1.2,
          tension: 180,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 150,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(haloProgress, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    hideTimerRef.current = setTimeout(() => {
      dismissToast();
    }, 2200);
  }, [event, visible, slideY, opacity, cardScale, checkScale, haloProgress]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!visible || !renderedEvent) {
    return null;
  }

  const haloScale = haloProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.55],
  });
  const haloOpacity = haloProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.75, 0.45, 0],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.toastHost, { top: topOffset }]}
    >
      <Animated.View
        style={[
          styles.toastCard,
          {
            opacity,
            transform: [{ translateY: slideY }, { scale: cardScale }],
          },
        ]}
      >
        <View style={styles.thumbWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumbHalo,
              {
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          <ProductThumbnail
            product={renderedEvent.product}
            emojiSize={18}
            borderRadius={10}
            padding={2}
            style={{ width: 40, height: 40 }}
          />
          <Animated.View
            style={[
              styles.checkBadge,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            <Ionicons name="checkmark" size={11} color="#052E16" />
          </Animated.View>
        </View>

        <View style={styles.toastTextCol}>
          <View style={styles.toastStatusRow}>
            <Text style={styles.toastStatusTitle}>¡Agregado al carrito!</Text>
            <View style={styles.toastDeltaPill}>
              <Text style={styles.toastDeltaText}>+1</Text>
            </View>
          </View>
          <Text style={styles.toastProductName} numberOfLines={1}>
            {renderedEvent.product.name}
          </Text>
          <Text style={styles.toastMetaText} numberOfLines={1}>
            {renderedEvent.qtyInCart}{' '}
            {renderedEvent.qtyInCart === 1 ? 'unidad' : 'unidades'} ·{' '}
            {renderedEvent.totalCartItems} en tu bolsa
          </Text>
        </View>

        {onViewCart && (
          <Pressable
            onPress={() => {
              dismissToast();
              onViewCart();
            }}
            style={({ pressed }) => [
              styles.viewCartBtn,
              pressed && { opacity: 0.84, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Ionicons name="bag-handle" size={13} color="#050508" />
            <Text style={styles.viewCartBtnText}>Ver</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  controlContent: {
    alignSelf: 'stretch',
  },
  floatingPlusHost: {
    position: 'absolute',
    top: -8,
    left: -28,
    right: -28,
    alignItems: 'center',
    zIndex: 50,
  },
  floatingPlusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#34D399',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 12,
  },
  floatingPlusText: {
    color: '#052E16',
    fontSize: 11.5,
    fontWeight: '900',
  },
  toastHost: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 30,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: 'rgba(18, 22, 32, 0.97)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 28,
  },
  thumbWrap: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34D399',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#34D399',
    borderWidth: 1.5,
    borderColor: '#121620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextCol: {
    flex: 1,
    gap: 1,
  },
  toastStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toastStatusTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  toastDeltaPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  toastDeltaText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '900',
  },
  toastProductName: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  toastMetaText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },
  viewCartBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '900',
  },
});
