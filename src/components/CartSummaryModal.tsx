import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { COIN_VALUE_COP, useAuth } from '../context/AuthContext';
import { ProductBag } from '../data/catalog';
import { DeliveryZoneType, formatCOP } from '../data/paymentMethods';
import { useDraggableSheet } from '../utils/useDraggableSheet';
import { AnimatedCartControl } from './ui/CartAddedFeedback';
import { ConsenticoinIcon } from './ui/ConsenticoinIcon';
import { ProductThumbnail } from './ui/ProductThumbnail';

const { width: INITIAL_WIDTH, height: INITIAL_HEIGHT } =
  Dimensions.get('window');

export interface BubbleLaunchOrigin {
  x: number;
  y: number;
}

export interface CartSummaryModalProps {
  visible: boolean;
  launchOrigin: BubbleLaunchOrigin | null;
  deliveryZone: DeliveryZoneType;
  itemsList: { product: ProductBag; quantity: number }[];
  totalItems: number;
  totalWeightLb: number;
  subtotal: number;
  estimatedCarrierFee: number;
  coinsToRedeem: number;
  coinsDiscountCop: number;
  totalCoinsToEarn: number;
  totalWithShipping: number;
  applyCoinsInCart: boolean;
  onToggleApplyCoins: () => void;
  onAddToCart: (productId: string) => void;
  onDecrementCart: (productId: string) => void;
  onRequestAddressChange: () => void;
  onRequestOpenWallet: () => void;
  onRequestProceedToCheckout: () => void;
  onRequestLogin: () => void;
  onClose: (absorbedIntoBubble: boolean) => void;
}

/**
 * Resumen interactivo del carrito/Bolsa.
 * Si recibe `launchOrigin` (al tocar el carrito flotante), emerge animadamente desde
 * el botón circular del carrito y al cerrarse vuelve a incorporarse dentro de él.
 */
export const CartSummaryModal: React.FC<CartSummaryModalProps> = ({
  visible,
  launchOrigin,
  deliveryZone,
  itemsList,
  totalItems,
  totalWeightLb,
  subtotal,
  estimatedCarrierFee,
  coinsToRedeem,
  coinsDiscountCop,
  totalCoinsToEarn,
  totalWithShipping,
  applyCoinsInCart,
  onToggleApplyCoins,
  onAddToCart,
  onDecrementCart,
  onRequestAddressChange,
  onRequestOpenWallet,
  onRequestProceedToCheckout,
  onRequestLogin,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { user, addresses, selectedAddress } = useAuth();

  const isPortalMode = launchOrigin !== null;

  // Animación de portal (expansión desde la burbuja y retorno hacia ella)
  const portalAnim = useRef(new Animated.Value(0)).current;
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const portalHostRef = useRef<React.ComponentRef<typeof View>>(null);
  const [hostCenter, setHostCenter] = useState({
    x: INITIAL_WIDTH / 2,
    y: INITIAL_HEIGHT / 2,
  });
  const isPortalClosingRef = useRef(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Fallback bottom-sheet cuando se abre desde el dock "Bolsa", Toast o Checkout
  const {
    translateY: sheetTranslateY,
    isExpanded: isSheetExpanded,
    isDragging: isSheetDragging,
    headerPanHandlers: sheetHeaderPanHandlers,
    grabberPanHandlers: sheetGrabberPanHandlers,
    animateClose: animateSheetClose,
  } = useDraggableSheet({
    visible: visible && !isPortalMode,
    onClose: () => onCloseRef.current(false),
  });

  useEffect(() => {
    if (visible && isPortalMode) {
      isPortalClosingRef.current = false;
      portalAnim.setValue(0);
      dragOffsetY.setValue(0);

      const rafId = requestAnimationFrame(() => {
        Animated.spring(portalAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 235,
          mass: 0.85,
          useNativeDriver: true,
        }).start();
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [visible, isPortalMode, launchOrigin?.x, launchOrigin?.y, portalAnim, dragOffsetY]);

  const measurePortalHost = () => {
    portalHostRef.current?.measureInWindow((wx, wy, ww, hh) => {
      if (ww > 0 && hh > 0) {
        setHostCenter({ x: wx + ww / 2, y: wy + hh / 2 });
      }
    });
  };

  const animateClosePortal = (absorbedIntoBubble = true, onDone?: () => void) => {
    if (isPortalClosingRef.current) return;
    isPortalClosingRef.current = true;

    if (absorbedIntoBubble) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onCloseRef.current(absorbedIntoBubble);
      if (onDone) {
        onDone();
      }
    };

    const duration = absorbedIntoBubble ? 245 : 140;
    const fallbackTimer = setTimeout(finish, duration + 35);

    Animated.parallel([
      Animated.timing(portalAnim, {
        toValue: 0,
        duration,
        easing: absorbedIntoBubble
          ? Easing.bezier(0.32, 0, 0.25, 1)
          : Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dragOffsetY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearTimeout(fallbackTimer);
      finish();
    });
  };

  const portalHeaderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        const dampedY = g.dy > 0 ? g.dy * 0.65 : g.dy * 0.16;
        dragOffsetY.setValue(dampedY);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 72 || g.vy > 0.65) {
          animateClosePortal(true);
          return;
        }
        Animated.spring(dragOffsetY, {
          toValue: 0,
          damping: 18,
          stiffness: 240,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragOffsetY, {
          toValue: 0,
          damping: 18,
          stiffness: 240,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleDismiss = () => {
    if (isPortalMode) {
      animateClosePortal(true);
    } else {
      animateSheetClose();
    }
  };

  const handleForwardAction = (action: () => void) => {
    if (isPortalMode) {
      animateClosePortal(false, action);
    } else {
      onClose(false);
      setTimeout(action, 190);
    }
  };

  const originX = launchOrigin?.x ?? hostCenter.x;
  const originY = launchOrigin?.y ?? hostCenter.y;
  const deltaX = originX - hostCenter.x;
  const deltaY = originY - hostCenter.y;

  const portalBackdropOpacity = portalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const portalCardOpacity = portalAnim.interpolate({
    inputRange: [0, 0.14, 1],
    outputRange: [0.05, 0.92, 1],
  });

  const portalScale = portalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 1],
  });

  const portalTranslateX = portalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [deltaX, 0],
  });

  const portalTranslateY = portalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [deltaY, 0],
  });

  const renderCartBody = () => (
    <ScrollView
      contentContainerStyle={[
        styles.cartSheetScroll,
        !isPortalMode && { paddingBottom: Math.max(insets.bottom, 16) + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {itemsList.length === 0 ? (
        <View style={styles.emptyCartBox}>
          <Ionicons
            name="bag-handle-outline"
            size={44}
            color={colors.dark.textMuted}
          />
          <Text style={styles.emptyCartTitle}>Tu bolsa está vacía</Text>
          <Text style={styles.emptyCartSub}>
            Agrega bultos de Diamond Naturals, Taste of the Wild, Acana u Orijen
            para calcular tu entrega.
          </Text>
        </View>
      ) : (
        <>
          {/* Dirección seleccionada dentro del carrito (o aviso en modo invitado) */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              handleForwardAction(
                user ? onRequestAddressChange : onRequestLogin
              );
            }}
            style={styles.cartZoneBox}
          >
            <View style={styles.addressRowFlex}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                {user ? (
                  <>
                    <Text style={styles.cartZoneLabel}>
                      Entregar en ({selectedAddress.label} ·{' '}
                      {selectedAddress.city}):
                    </Text>
                    <Text style={styles.addressPrimaryText}>
                      {selectedAddress.address1}
                    </Text>
                    {selectedAddress.address2 ? (
                      <Text style={styles.addressSecondaryText}>
                        {selectedAddress.address2}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.cartZoneLabel}>
                      📍 Dirección de entrega pendiente (Modo invitado)
                    </Text>
                    <Text style={styles.addressGuestText}>
                      Inicia sesión para elegir tu dirección y cobertura
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.addressActionPill}>
                <Text style={styles.addressActionPillText}>
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
          {itemsList.map(({ product, quantity }) => (
            <View key={product.id} style={styles.cartItemRow}>
              <ProductThumbnail
                product={product}
                emojiSize={24}
                borderRadius={12}
                padding={2}
                style={{ width: 62, height: 68 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{product.name}</Text>
                <Text style={styles.cartItemSub}>
                  Presentación: {product.unitLabel || `${product.weightLb} LB`}{' '}
                  · {formatCOP(product.price)} c/u
                </Text>
              </View>
              <AnimatedCartControl quantity={quantity}>
                <View style={styles.qtyStepper}>
                  <Pressable
                    onPress={() => onDecrementCart(product.id)}
                    style={styles.qtyStepBtn}
                  >
                    <Ionicons name="remove" size={15} color="#FFFFFF" />
                  </Pressable>
                  <Text style={styles.qtyCountText}>{quantity}</Text>
                  <Pressable
                    onPress={() => onAddToCart(product.id)}
                    style={[styles.qtyStepBtn, styles.qtyStepBtnPlus]}
                  >
                    <Ionicons name="add" size={15} color="#050508" />
                  </Pressable>
                </View>
              </AnimatedCartControl>
            </View>
          ))}

          {/* Billetera Consenticoins Cash */}
          <View style={styles.cartZoneBox}>
            <View style={styles.walletRowFlex}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  handleForwardAction(onRequestOpenWallet);
                }}
                style={{ flex: 1 }}
              >
                <View style={styles.inlineIconTitleRow}>
                  <ConsenticoinIcon size={12} />
                  <Text style={styles.cartZoneLabel}>
                    BILLETERA CONSENTICOINS CASH
                  </Text>
                </View>
                <Text style={styles.walletBalanceText}>
                  {user
                    ? `Saldo: ${user.points} Coins (${formatCOP(
                        user.points * COIN_VALUE_COP
                      )})`
                    : 'Tienes 250 Coins ($ 5.000) de bienvenida'}
                </Text>
                <Text style={styles.walletLinkText}>
                  Ver extracto y bóveda de premios ›
                </Text>
              </Pressable>

              {user && user.points > 0 ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onToggleApplyCoins();
                  }}
                  style={[
                    styles.applyCoinsBtn,
                    applyCoinsInCart && styles.applyCoinsBtnActive,
                  ]}
                >
                  <Ionicons
                    name={
                      applyCoinsInCart ? 'checkmark-circle' : 'ellipse-outline'
                    }
                    size={16}
                    color={
                      applyCoinsInCart ? '#050508' : colors.primary.light
                    }
                  />
                  <Text
                    style={[
                      styles.applyCoinsText,
                      applyCoinsInCart && styles.applyCoinsTextActive,
                    ]}
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
                Subtotal ({totalItems} bultos · {totalWeightLb.toFixed(1)} LB)
              </Text>
              <Text style={styles.costValue}>{formatCOP(subtotal)}</Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>
                {deliveryZone === 'bogota'
                  ? 'Domicilio en Bogotá D.C.'
                  : `Flete Transportadora (${totalWeightLb.toFixed(1)} LB)`}
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
                  : `+ ${formatCOP(estimatedCarrierFee)}`}
              </Text>
            </View>

            {coinsDiscountCop > 0 && (
              <View style={styles.costRow}>
                <View style={styles.inlineIconTitleRow}>
                  <Text
                    style={[
                      styles.costLabel,
                      { color: colors.primary.light, fontWeight: '700' },
                    ]}
                  >
                    Redención Consenticoins (-{coinsToRedeem})
                  </Text>
                  <ConsenticoinIcon size={12} />
                </View>
                <Text
                  style={[
                    styles.costValue,
                    { color: colors.primary.light, fontWeight: '900' },
                  ]}
                >
                  - {formatCOP(coinsDiscountCop)}
                </Text>
              </View>
            )}

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Consenticoins a ganar</Text>
              <View style={styles.inlineIconTitleRow}>
                <ConsenticoinIcon size={12} />
                <Text style={[styles.costValue, { color: colors.primary.light }]}>
                  +{totalCoinsToEarn} Coins
                </Text>
              </View>
            </View>

            <View style={styles.costDivider} />

            <View style={styles.costRow}>
              <Text style={styles.costTotalLabel}>Total Estimado</Text>
              <Text style={styles.costTotalValue}>
                {formatCOP(totalWithShipping)}
              </Text>
            </View>
          </View>

          <View style={styles.checkoutHintBanner}>
            <Ionicons
              name="card-outline"
              size={16}
              color={colors.primary.light}
            />
            <Text style={styles.checkoutHintText}>
              {deliveryZone === 'bogota'
                ? 'En el siguiente paso eliges Contra entrega (Efectivo, Bre-B, Datáfono +5%) o Pago anticipado.'
                : 'Envío nacional: en el siguiente paso eliges Pago anticipado (Bre-B, Efectivo o Link de pagos +5%).'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              handleForwardAction(
                user ? onRequestProceedToCheckout : onRequestLogin
              );
            }}
            style={styles.checkoutGoldBtn}
          >
            <Text style={styles.checkoutGoldBtnText}>
              {user
                ? `Continuar al Checkout (${formatCOP(totalWithShipping)})`
                : `Iniciar sesión para continuar (${formatCOP(totalWithShipping)})`}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      {isPortalMode ? (
        <View
          ref={portalHostRef}
          onLayout={measurePortalHost}
          style={styles.portalBackdropRoot}
        >
          <Animated.View
            style={[
              styles.portalDimBackdrop,
              { opacity: portalBackdropOpacity },
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={handleDismiss} />
          </Animated.View>

          <Animated.View
            style={[
              styles.portalWindowCard,
              {
                opacity: portalCardOpacity,
                transform: [
                  { translateX: portalTranslateX },
                  { translateY: Animated.add(portalTranslateY, dragOffsetY) },
                  { scale: portalScale },
                ],
              },
            ]}
          >
            <View
              {...portalHeaderPanResponder.panHandlers}
              style={styles.portalHeader}
            >
              <View style={styles.dragHandleHitZone}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.cartSheetTitleRow}>
                <View style={styles.portalTitleCluster}>
                  <View style={styles.portalCartIconBadge}>
                    <Ionicons name="cart" size={18} color="#050508" />
                  </View>
                  <View>
                    <View style={styles.titleCountRow}>
                      <Text style={styles.portalTitle}>Tu Carrito</Text>
                      <View style={styles.cartCountHeaderPill}>
                        <Text style={styles.cartCountHeaderPillText}>
                          {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.portalSubtitle}>
                      Resumen listo · toca ✕ para guardarlo en la burbuja
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDismiss}
                  style={styles.closeModalBtn}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {renderCartBody()}
          </Animated.View>
        </View>
      ) : (
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={handleDismiss} />
          <Animated.View
            style={[
              styles.cartSheetContainer,
              isSheetExpanded && styles.cartSheetContainerExpanded,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View style={styles.cartSheetHeader}>
              <View style={styles.dragHandleHitZone} {...sheetGrabberPanHandlers}>
                <View
                  style={[
                    styles.dragHandle,
                    isSheetDragging && styles.dragHandleActive,
                  ]}
                />
              </View>
              <View style={styles.cartSheetTitleRow} {...sheetHeaderPanHandlers}>
                <View style={styles.titleCountRow}>
                  <Text style={styles.cartSheetTitle}>Bolsa</Text>
                  <View style={styles.cartCountHeaderPill}>
                    <Text style={styles.cartCountHeaderPillText}>
                      {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDismiss}
                  style={styles.closeModalBtn}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {renderCartBody()}
          </Animated.View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  portalBackdropRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  portalDimBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
  },
  portalWindowCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: '#0A0B0E',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.34)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.72,
    shadowRadius: 28,
    elevation: 28,
  },
  portalHeader: {
    paddingTop: 8,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0E1017',
  },
  portalTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  portalCartIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  portalSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
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
    gap: 10,
  },
  titleCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    padding: 18,
    paddingBottom: 24,
    gap: 14,
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 34,
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
  },
  addressRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  addressSecondaryText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  addressGuestText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  addressActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  addressActionPillText: {
    color: colors.primary.light,
    fontSize: 12,
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
  walletRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inlineIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  walletBalanceText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 4,
  },
  walletLinkText: {
    color: colors.primary.light,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  applyCoinsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#181B22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  applyCoinsBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  applyCoinsText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '900',
  },
  applyCoinsTextActive: {
    color: '#050508',
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
  checkoutHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#12151C',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkoutHintText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
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
});
