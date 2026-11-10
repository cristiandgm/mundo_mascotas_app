import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import {
  useAuth,
  DEFAULT_VIP_CUSTOMER,
  CustomerOrder,
} from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

interface CustomerOrdersSheetProps {
  visible: boolean;
  onClose: () => void;
  onReorderItems?: (skus: string[]) => void;
}

type OrderFilterType = 'all' | 'pending' | 'fulfilled';

export const CustomerOrdersSheet: React.FC<CustomerOrdersSheetProps> = ({
  visible,
  onClose,
  onReorderItems,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const profileData = user || DEFAULT_VIP_CUSTOMER;

  const [activeFilter, setActiveFilter] = useState<OrderFilterType>('all');
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  const {
    translateY,
    isExpanded,
    isDragging,
    headerPanHandlers,
    grabberPanHandlers,
    animateClose,
  } = useDraggableSheet({
    visible,
    onClose,
  });

  const orders: CustomerOrder[] = useMemo(() => {
    return profileData.orders || DEFAULT_VIP_CUSTOMER.orders || [];
  }, [profileData.orders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'pending') {
      return orders.filter((o) => o.fulfillmentStatus === 'unfulfilled');
    }
    if (activeFilter === 'fulfilled') {
      return orders.filter((o) => o.fulfillmentStatus === 'fulfilled');
    }
    return orders;
  }, [orders, activeFilter]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.fulfillmentStatus === 'unfulfilled').length,
    [orders]
  );

  const fulfilledCount = useMemo(
    () => orders.filter((o) => o.fulfillmentStatus === 'fulfilled').length,
    [orders]
  );

  const formatCOP = (amount: number) => {
    return '$ ' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleReorder = (order: CustomerOrder) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReorderedId(order.orderNumber);
    if (onReorderItems) {
      const skus = order.items.map((it) => it.sku);
      onReorderItems(skus);
    }
    setTimeout(() => {
      setReorderedId(null);
    }, 2200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={animateClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={animateClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            isExpanded && styles.sheetContainerExpanded,
            { transform: [{ translateY }] },
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['#0F121C', '#07080C', '#050508']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Drag Handle & Close Bar */}
          <View style={styles.sheetHeaderBar}>
            <View style={styles.dragIndicatorHitZone} {...grabberPanHandlers}>
              <View
                style={[
                  styles.dragIndicator,
                  isDragging && styles.dragIndicatorActive,
                ]}
              />
            </View>

            <View style={styles.sheetTitleRow} {...headerPanHandlers}>
              <View style={styles.brandBadge}>
                <Ionicons
                  name="receipt"
                  size={14}
                  color={colors.primary.DEFAULT}
                />
                <Text style={styles.brandBadgeText}>
                  MIS PEDIDOS Y RECOMPRA RÁPIDA
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={animateClose}
                style={styles.closeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={colors.dark.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 32 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Cabecera exclusiva de Pedidos (sin contaminar con datos de cuenta) */}
            <LinearGradient
              colors={['#191E2B', '#10131C']}
              style={styles.ordersSummaryHero}
            >
              <View style={styles.ordersSummaryTextRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ordersHeroTitle}>
                    Historial de Pedidos
                  </Text>
                  <Text style={styles.ordersHeroSubtitle}>
                    Repite tu bulto favorito en 1 toque o revisa el estado de
                    despacho
                  </Text>
                </View>
                <View style={styles.totalOrdersCircle}>
                  <Text style={styles.totalOrdersNumber}>{orders.length}</Text>
                  <Text style={styles.totalOrdersLabel}>Recientes</Text>
                </View>
              </View>

              {/* Filtros rápidos: Todos | En alistamiento | Entregados */}
              <View style={styles.filterPillsRow}>
                {[
                  {
                    id: 'all' as OrderFilterType,
                    label: `Todos (${orders.length})`,
                  },
                  {
                    id: 'pending' as OrderFilterType,
                    label: `En curso (${pendingCount})`,
                  },
                  {
                    id: 'fulfilled' as OrderFilterType,
                    label: `Entregados (${fulfilledCount})`,
                  },
                ].map((tab) => {
                  const isSelected = activeFilter === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveFilter(tab.id);
                      }}
                      style={[
                        styles.filterPill,
                        isSelected && styles.filterPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          isSelected && styles.filterPillTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </LinearGradient>

            {/* Lista limpia y directa de todas las tarjetas de pedidos */}
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyOrdersBox}>
                <Ionicons
                  name="cube-outline"
                  size={40}
                  color={colors.dark.textMuted}
                />
                <Text style={styles.emptyOrdersTitle}>
                  No hay pedidos en este filtro
                </Text>
                <Text style={styles.emptyOrdersSub}>
                  Cambia a "Todos" para ver tu historial completo de compras.
                </Text>
              </View>
            ) : (
              filteredOrders.map((order, index) => {
                const isLatest = index === 0 && activeFilter === 'all';
                const isReordered = reorderedId === order.orderNumber;

                return (
                  <View
                    key={order.orderNumber}
                    style={[
                      styles.orderCard,
                      isLatest && styles.orderCardLatest,
                    ]}
                  >
                    {isLatest && (
                      <View style={styles.latestRibbon}>
                        <Text style={styles.latestRibbonText}>
                          ★ PEDIDO MÁS RECIENTE
                        </Text>
                      </View>
                    )}

                    <View style={styles.orderTopBar}>
                      <View style={styles.orderBadgesWrap}>
                        <Text style={styles.orderIdText}>
                          Pedido #{order.orderNumber}
                        </Text>

                        {/* Estado de pago */}
                        <View
                          style={[
                            styles.statusBadge,
                            order.financialStatus === 'pending'
                              ? styles.badgePendingPayment
                              : styles.badgePaid,
                          ]}
                        >
                          <View
                            style={[
                              styles.badgeDot,
                              {
                                backgroundColor:
                                  order.financialStatus === 'pending'
                                    ? '#F97316'
                                    : '#10B981',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  order.financialStatus === 'pending'
                                    ? '#FDBA74'
                                    : '#6EE7B7',
                              },
                            ]}
                          >
                            {order.financialStatus === 'pending'
                              ? 'Pago contraentrega'
                              : 'Pagado'}
                          </Text>
                        </View>

                        {/* Estado de entrega */}
                        <View
                          style={[
                            styles.statusBadge,
                            order.fulfillmentStatus === 'unfulfilled'
                              ? styles.badgeUnfulfilled
                              : styles.badgeFulfilled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  order.fulfillmentStatus === 'unfulfilled'
                                    ? '#FDE047'
                                    : '#93C5FD',
                              },
                            ]}
                          >
                            {order.fulfillmentStatus === 'unfulfilled'
                              ? '🚚 En alistamiento'
                              : '✓ Entregado'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.orderTotalText}>
                        {formatCOP(order.total)}
                      </Text>
                    </View>

                    <Text style={styles.orderDateText}>
                      🗓️ {order.createdAt} · {order.shippingMethod}
                    </Text>

                    <View style={styles.orderItemsDivider} />

                    {/* Lista de productos del pedido */}
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.lineItemRow}>
                        <View style={styles.productThumb}>
                          <Ionicons
                            name="paw"
                            size={18}
                            color={colors.primary.DEFAULT}
                          />
                        </View>
                        <View style={styles.lineItemInfo}>
                          <Text style={styles.lineItemName}>{item.name}</Text>
                          <Text style={styles.lineItemSku}>
                            SKU #{item.sku} · {order.paymentMethod}
                          </Text>
                        </View>
                        <Text style={styles.lineItemQty}>x{item.quantity}</Text>
                        <Text style={styles.lineItemPrice}>
                          {formatCOP(item.price)}
                        </Text>
                      </View>
                    ))}

                    {/* Botón de Recompra en 1 toque */}
                    <Pressable
                      onPress={() => handleReorder(order)}
                      style={[
                        styles.reorderButton,
                        isReordered && styles.reorderButtonSuccess,
                      ]}
                    >
                      <Ionicons
                        name={
                          isReordered ? 'checkmark-circle' : 'repeat-outline'
                        }
                        size={17}
                        color={isReordered ? '#10B981' : '#050508'}
                      />
                      <Text
                        style={[
                          styles.reorderButtonText,
                          isReordered && { color: '#10B981' },
                        ]}
                      >
                        {isReordered
                          ? '¡Agregado a tu bolsa!'
                          : 'Volver a pedir en 1 toque'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    height: '88%',
    backgroundColor: '#07080C',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
  },
  sheetContainerExpanded: {
    height: '96%',
  },
  sheetHeaderBar: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    zIndex: 30,
    elevation: 30,
  },
  dragIndicatorHitZone: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dragIndicator: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  dragIndicatorActive: {
    width: 54,
    backgroundColor: colors.primary.light,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  brandBadgeText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    elevation: 35,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 14,
  },
  ordersSummaryHero: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  ordersSummaryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  ordersHeroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  ordersHeroSubtitle: {
    color: '#9CA3AF',
    fontSize: 12.5,
    lineHeight: 18,
  },
  totalOrdersCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalOrdersNumber: {
    color: colors.primary.light,
    fontSize: 19,
    fontWeight: '900',
  },
  totalOrdersLabel: {
    color: '#D1D5DB',
    fontSize: 9.5,
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.light,
  },
  filterPillText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#050508',
    fontWeight: '900',
  },
  emptyOrdersBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyOrdersTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyOrdersSub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#11141E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  orderCardLatest: {
    borderColor: 'rgba(212, 175, 55, 0.42)',
    backgroundColor: '#131724',
  },
  latestRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  latestRibbonText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  orderIdText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginRight: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgePendingPayment: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  badgePaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  badgeUnfulfilled: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  badgeFulfilled: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  orderTotalText: {
    color: colors.primary.light,
    fontSize: 16,
    fontWeight: '900',
  },
  orderDateText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 7,
  },
  orderItemsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700',
  },
  lineItemSku: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  lineItemQty: {
    color: '#9CA3AF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  lineItemPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  reorderButton: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 11,
    borderRadius: 13,
  },
  reorderButtonSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  reorderButtonText: {
    color: '#050508',
    fontSize: 13,
    fontWeight: '900',
  },
});
