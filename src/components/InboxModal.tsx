import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { ConsenticoinIcon } from './ui/ConsenticoinIcon';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type InboxCategory = 'all' | 'offers' | 'support' | 'updates' | 'priority';

export interface InboxMessage {
  id: string;
  category: Exclude<InboxCategory, 'all'>;
  title: string;
  subtitle: string;
  timestamp: string;
  detailBody: string;
  actionLabel?: string;
  actionType?: 'reorder_diamond' | 'apply_promo' | 'open_profile' | 'support_chat';
  unreadCount: number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  badgeColor: string;
  showCoinIcon?: boolean;
}

interface InboxModalProps {
  visible: boolean;
  onClose: () => void;
  onQuickAddProduct?: (productId: string) => void;
  onOpenProfile?: () => void;
  onPromoApplied?: (code: string, discountAmount: number) => void;
}

const FILTER_TABS: { id: InboxCategory; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'offers', label: 'Ofertas' },
  { id: 'support', label: 'Soporte' },
  { id: 'updates', label: 'Pedidos' },
  { id: 'priority', label: 'VIP' },
];

const INITIAL_MESSAGES: InboxMessage[] = [
  {
    id: 'msg_support_1',
    category: 'support',
    title: 'Mensaje de Soporte Mundo Mascotas',
    subtitle: 'Toca para ver detalles de tu pedido #59547',
    timestamp: 'Hace 12 min',
    detailBody:
      '¡Hola Alejandra! Tu bulto Diamond Naturals Lamb & Rice 40 LB (#59547) ya fue asignado a nuestra flota propia en Bogotá D.C. Recuerda que tienes Domicilio GRATIS y Pago Contraentrega en Carrera 72 j # 38-36 sur (timbrar en el 4 piso).',
    actionLabel: 'Ver estado en mi perfil VIP',
    actionType: 'open_profile',
    unreadCount: 1,
    iconName: 'headset-outline',
    iconBgColor: '#181B22',
    iconColor: '#FFFFFF',
    badgeColor: '#D4AF37',
  },
  {
    id: 'msg_offer_1',
    category: 'offers',
    title: 'Bono Doble de Consenticoins',
    showCoinIcon: true,
    subtitle: '+200 Coins extra en Taste of the Wild y Diamond',
    timestamp: 'Hoy · 2:15 p. m.',
    detailBody:
      'Por ser cliente Champions VIP (23 pedidos completados), activa el código VIPBOGOTA o pide hoy tu bulto de 28 LB o 40 LB para recibir $ 15.000 de descuento directo + envío gratis en Bogotá.',
    actionLabel: 'Aplicar cupón $ 15.000 OFF',
    actionType: 'apply_promo',
    unreadCount: 1,
    iconName: 'pricetag-outline',
    iconBgColor: '#181B22',
    iconColor: '#F5D061',
    badgeColor: '#D4AF37',
  },
  {
    id: 'msg_update_1',
    category: 'updates',
    title: '¿Se está acabando el bulto de Consentido?',
    subtitle: 'Ya pasaron 28 días desde tu último bulto de 40 LB',
    timestamp: 'Ayer',
    detailBody:
      'Calculamos el consumo promedio de tu mascota y es probable que le queden pocos días de concentrado. Pide ahora tu Diamond Naturals Lamb & Rice 40 LB con 1 toque para que nunca se quede sin alimento.',
    actionLabel: 'Agregar Diamond 40 LB a la Bolsa',
    actionType: 'reorder_diamond',
    unreadCount: 1,
    iconName: 'paw-outline',
    iconBgColor: '#181B22',
    iconColor: '#FFFFFF',
    badgeColor: '#D4AF37',
  },
  {
    id: 'msg_priority_1',
    category: 'priority',
    title: 'Beneficio exclusivo Champions VIP',
    subtitle: 'Tienes 870 Consenticoins listos para redimir',
    timestamp: 'Hace 3 días',
    detailBody:
      'Tus puntos acumulados en tus 23 órdenes equivalen a saldo redimible en bultos Super Premium (Diamond Naturals, Taste of the Wild, Acana y Orijen).',
    actionLabel: 'Abrir mi Billetera Consenticoins',
    actionType: 'open_profile',
    unreadCount: 0,
    iconName: 'trophy-outline',
    iconBgColor: '#181B22',
    iconColor: '#F5D061',
    badgeColor: '#D4AF37',
  },
];

export const InboxModal: React.FC<InboxModalProps> = ({
  visible,
  onClose,
  onQuickAddProduct,
  onOpenProfile,
  onPromoApplied,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<InboxCategory>('all');
  const [messages, setMessages] = useState<InboxMessage[]>(INITIAL_MESSAGES);
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // ==================== ANIMACIÓN INNOVADORA: PORTAL DIAGONAL DESDE LA ESQUINA SUPERIOR DERECHA + CASCADA ====================
  // 0 = contraído en el botón "🔔 Inbox" arriba a la derecha | 1 = pantalla completa desplegada
  const portalProgress = useRef(new Animated.Value(0)).current;
  const headerCascade = useRef(new Animated.Value(0)).current;
  const promoBoxCascade = useRef(new Animated.Value(0)).current;
  const listCascade = useRef(new Animated.Value(0)).current;
  const bellRingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      portalProgress.setValue(0);
      headerCascade.setValue(0);
      promoBoxCascade.setValue(0);
      listCascade.setValue(0);
      bellRingAnim.setValue(0);

      // Secuencia coreografiada 60fps:
      // 1) El portal nace desde la esquina superior derecha con resorte orgánico
      // 2) Los elementos internos entran en cascada escalonada (stagger)
      Animated.parallel([
        Animated.spring(portalProgress, {
          toValue: 1,
          damping: 20,
          stiffness: 210,
          mass: 0.85,
          useNativeDriver: true,
        }),
        Animated.stagger(65, [
          Animated.spring(headerCascade, {
            toValue: 1,
            damping: 18,
            stiffness: 230,
            useNativeDriver: true,
          }),
          Animated.spring(promoBoxCascade, {
            toValue: 1,
            damping: 18,
            stiffness: 230,
            useNativeDriver: true,
          }),
          Animated.spring(listCascade, {
            toValue: 1,
            damping: 18,
            stiffness: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bellRingAnim, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.timing(bellRingAnim, {
            toValue: -1,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.spring(bellRingAnim, {
            toValue: 0,
            damping: 8,
            stiffness: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [
    visible,
    portalProgress,
    headerCascade,
    promoBoxCascade,
    listCascade,
    bellRingAnim,
  ]);

  const handleAnimatedClose = () => {
    Haptics.selectionAsync();
    Animated.parallel([
      Animated.timing(listCascade, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(promoBoxCascade, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(headerCascade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(portalProgress, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setExpandedMsgId(null);
      setPromoFeedback(null);
      onClose();
    });
  };

  const filteredMessages = useMemo(() => {
    if (selectedCategory === 'all') return messages;
    return messages.filter((m) => m.category === selectedCategory);
  }, [messages, selectedCategory]);

  const handleTapMessage = (msg: InboxMessage) => {
    Haptics.selectionAsync();
    // Marcar como leído
    if (msg.unreadCount > 0) {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === msg.id ? { ...item, unreadCount: 0 } : item
        )
      );
    }
    setExpandedMsgId((prev) => (prev === msg.id ? null : msg.id));
  };

  const handleApplyPromoCode = (customCode?: string) => {
    const code = (customCode ?? promoCodeInput).trim().toUpperCase();
    if (!code) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPromoFeedback({
        type: 'error',
        text: 'Escribe un código promocional (Ej. VIPBOGOTA o MASCOTA15)',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPromoCodeInput(code);
    setPromoFeedback({
      type: 'success',
      text: `¡Código "${code}" activado! Tienes $ 15.000 OFF en tu próximo bulto.`,
    });
    if (onPromoApplied) {
      onPromoApplied(code, 15000);
    }
  };

  const handleMessageAction = (msg: InboxMessage) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (msg.actionType === 'reorder_diamond' && onQuickAddProduct) {
      onQuickAddProduct('prod_123');
      handleAnimatedClose();
    } else if (msg.actionType === 'apply_promo') {
      handleApplyPromoCode('VIPBOGOTA');
    } else if (msg.actionType === 'open_profile' && onOpenProfile) {
      handleAnimatedClose();
      setTimeout(() => {
        onOpenProfile();
      }, 260);
    }
  };

  // Transformaciones del contenedor principal (nace desde la esquina superior derecha)
  const portalTranslateX = portalProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH * 0.42, 0],
  });
  const portalTranslateY = portalProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_HEIGHT * 0.38, 0],
  });
  const portalScale = portalProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 1],
  });
  const portalOpacity = portalProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.92, 1],
  });

  const totalUnread = messages.reduce((acc, m) => acc + m.unreadCount, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleAnimatedClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop con oscurecimiento progresivo */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdropOverlay,
            { opacity: portalProgress },
          ]}
        />

        {/* Contenedor principal con transición espacial desde esquina superior derecha */}
        <Animated.View
          style={[
            styles.inboxContainer,
            {
              paddingTop: Math.max(insets.top, 14) + 6,
              paddingBottom: Math.max(insets.bottom, 16),
              opacity: portalOpacity,
              transform: [
                { translateX: portalTranslateX },
                { translateY: portalTranslateY },
                { scale: portalScale },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            {/* ==================== 1. BOTÓN CERRAR (X) + CABECERA "Inbox" ESTILO UBER ==================== */}
            <Animated.View
              style={[
                styles.headerBlock,
                {
                  opacity: headerCascade,
                  transform: [
                    {
                      translateY: headerCascade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.topCloseRow}>
                <Pressable
                  onPress={handleAnimatedClose}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  hitSlop={12}
                >
                  <Ionicons name="close" size={26} color="#FFFFFF" />
                </Pressable>

                {totalUnread > 0 && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMessages((prev) =>
                        prev.map((m) => ({ ...m, unreadCount: 0 }))
                      );
                    }}
                    style={styles.markAllReadPill}
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={15}
                      color={colors.primary.light}
                    />
                    <Text style={styles.markAllReadText}>
                      Marcar todo leído
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.inboxBigTitle}>Inbox</Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: bellRingAnim.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: ['-16deg', '0deg', '16deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={colors.primary.light}
                  />
                </Animated.View>
              </View>

              {/* ==================== 2. PÍLDORAS DE FILTRO ESTILO UBER (All | Offers | Support | Updates | Priority) ==================== */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsScroll}
              >
                {FILTER_TABS.map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCategory(tab.id);
                      }}
                      style={[
                        styles.filterPill,
                        isActive && styles.filterPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          isActive && styles.filterPillTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ==================== 3. CAJA "Add offer code" ESTILO UBER ==================== */}
              <Animated.View
                style={{
                  opacity: promoBoxCascade,
                  transform: [
                    {
                      translateY: promoBoxCascade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                    {
                      scale: promoBoxCascade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.offerCodeBox}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color="#E5E7EB"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={styles.offerCodeInput}
                    value={promoCodeInput}
                    onChangeText={(t) => {
                      setPromoCodeInput(t);
                      if (promoFeedback) setPromoFeedback(null);
                    }}
                    placeholder="Agregar código de oferta (Ej. VIPBOGOTA)"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={() => handleApplyPromoCode()}
                  />
                  {promoCodeInput.trim().length > 0 && (
                    <Pressable
                      onPress={() => handleApplyPromoCode()}
                      style={styles.applyCodeBtn}
                    >
                      <Text style={styles.applyCodeBtnText}>Aplicar</Text>
                    </Pressable>
                  )}
                </View>

                {promoFeedback && (
                  <View
                    style={[
                      styles.promoFeedbackBanner,
                      promoFeedback.type === 'error' &&
                        styles.promoFeedbackError,
                    ]}
                  >
                    <Ionicons
                      name={
                        promoFeedback.type === 'success'
                          ? 'checkmark-circle'
                          : 'alert-circle'
                      }
                      size={17}
                      color={
                        promoFeedback.type === 'success' ? colors.primary.light : '#F87171'
                      }
                    />
                    <Text
                      style={[
                        styles.promoFeedbackText,
                        promoFeedback.type === 'error' && { color: '#FCA5A5' },
                      ]}
                    >
                      {promoFeedback.text}
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* ==================== 4. LISTA DE MENSAJES ESTILO UBER ==================== */}
              <Animated.View
                style={[
                  styles.messagesList,
                  {
                    opacity: listCascade,
                    transform: [
                      {
                        translateY: listCascade.interpolate({
                          inputRange: [0, 1],
                          outputRange: [26, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {filteredMessages.length === 0 ? (
                  <View style={styles.emptyCategoryBox}>
                    <Ionicons
                      name="mail-open-outline"
                      size={38}
                      color="#6B7280"
                    />
                    <Text style={styles.emptyCategoryTitle}>
                      No tienes mensajes en esta categoría
                    </Text>
                    <Text style={styles.emptyCategorySub}>
                      Aquí aparecerán las novedades de tus bultos y Consenticoins.
                    </Text>
                  </View>
                ) : (
                  filteredMessages.map((msg) => {
                    const isExpanded = expandedMsgId === msg.id;
                    return (
                      <View key={msg.id} style={styles.messageWrapper}>
                        <Pressable
                          onPress={() => handleTapMessage(msg)}
                          style={({ pressed }) => [
                            styles.messageRow,
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          {/* Círculo izquierdo con ícono (igual al círculo rojo de Uber Support) */}
                          <View
                            style={[
                              styles.messageIconCircle,
                              { backgroundColor: msg.iconBgColor },
                            ]}
                          >
                            <Ionicons
                              name={msg.iconName}
                              size={20}
                              color={msg.iconColor}
                            />
                          </View>

                          {/* Texto central + línea divisoria inferior estilo Uber */}
                          <View style={styles.messageContentCol}>
                            <View style={styles.messageMainLine}>
                              <View style={{ flex: 1, paddingRight: 10 }}>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <Text style={[styles.messageTitle, { flexShrink: 1 }]}>
                                    {msg.title}
                                  </Text>
                                  {msg.showCoinIcon && <ConsenticoinIcon size={13} />}
                                </View>
                                <Text style={styles.messageSubtitle}>
                                  {msg.subtitle}
                                </Text>
                                <Text style={styles.messageTimestamp}>
                                  {msg.timestamp}
                                </Text>
                              </View>

                              {/* Badge circular de no leído a la derecha (exactamente como el "1" salmón de Uber) */}
                              {msg.unreadCount > 0 ? (
                                <View
                                  style={[
                                    styles.unreadCircleBadge,
                                    { backgroundColor: msg.badgeColor },
                                  ]}
                                >
                                  <Text style={styles.unreadCircleText}>
                                    {msg.unreadCount}
                                  </Text>
                                </View>
                              ) : (
                                <Ionicons
                                  name={
                                    isExpanded ? 'chevron-up' : 'chevron-down'
                                  }
                                  size={18}
                                  color="#6B7280"
                                />
                              )}
                            </View>

                            {/* Panel interno desplegable al tocar el mensaje */}
                            {isExpanded && (
                              <View style={styles.expandedDetailBox}>
                                <Text style={styles.expandedDetailText}>
                                  {msg.detailBody}
                                </Text>

                                {msg.actionLabel && (
                                  <Pressable
                                    onPress={() => handleMessageAction(msg)}
                                    style={({ pressed }) => [
                                      styles.messageActionBtn,
                                      pressed && { opacity: 0.9 },
                                    ]}
                                  >
                                    <Text style={styles.messageActionBtnText}>
                                      {msg.actionLabel}
                                    </Text>
                                    <Ionicons
                                      name="arrow-forward"
                                      size={15}
                                      color="#050508"
                                    />
                                  </Pressable>
                                )}
                              </View>
                            )}

                            <View style={styles.uberRowBottomDivider} />
                          </View>
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdropOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  inboxContainer: {
    flex: 1,
    backgroundColor: '#0A0B0E',
    paddingHorizontal: 18,
  },
  headerBlock: {
    marginBottom: 8,
  },
  topCloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllReadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#181B22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  markAllReadText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  inboxBigTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  /* Píldoras de filtro idénticas a Uber Inbox */
  filterPillsScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  filterPill: {
    backgroundColor: '#181B22',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillText: {
    color: '#D1D5DB',
    fontSize: 13.5,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#0A0B0E',
    fontWeight: '700',
  },

  scrollContent: {
    paddingTop: 10,
    paddingBottom: 36,
  },

  /* Caja "Add offer code" estilo Uber */
  offerCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12151C',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  offerCodeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  applyCodeBtn: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  applyCodeBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '800',
  },
  promoFeedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#12151C',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  promoFeedbackError: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  promoFeedbackText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  /* Lista de mensajes estilo Uber */
  messagesList: {
    marginTop: 6,
  },
  messageWrapper: {
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    gap: 14,
  },
  messageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  messageContentCol: {
    flex: 1,
  },
  messageMainLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  messageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  messageSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  messageTimestamp: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  unreadCircleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCircleText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
  },
  expandedDetailBox: {
    backgroundColor: '#1B1C22',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  expandedDetailText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
  },
  messageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  messageActionBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '800',
  },
  uberRowBottomDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyCategoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyCategoryTitle: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCategorySub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
  },
});

