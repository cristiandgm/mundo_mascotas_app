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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
    }, 2000);
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
          {/* Barra superior minimalista estilo Uber */}
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
              <Text style={styles.uberMainHeaderTitle}>Actividad</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={animateClose}
                style={styles.closeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Píldoras de filtro monocromáticas estilo Uber */}
            <View style={styles.uberFilterRow}>
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
                      styles.uberFilterPill,
                      isSelected && styles.uberFilterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.uberFilterPillText,
                        isSelected && styles.uberFilterPillTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
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
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyOrdersBox}>
                <Ionicons name="receipt-outline" size={38} color="#4B5563" />
                <Text style={styles.emptyOrdersTitle}>Sin pedidos</Text>
                <Text style={styles.emptyOrdersSub}>
                  No tienes pedidos en esta categoría por el momento.
                </Text>
              </View>
            ) : (
              filteredOrders.map((order, index) => {
                const isFirstHero = index === 0 && activeFilter === 'all';
                const isReordered = reorderedId === order.orderNumber;
                const isFulfilled = order.fulfillmentStatus === 'fulfilled';

                return (
                  <View key={order.orderNumber}>
                    {/* Encabezado de sección estilo Uber Activity */}
                    {index === 0 && activeFilter === 'all' && (
                      <Text style={styles.uberSectionLabel}>Más reciente</Text>
                    )}
                    {index === 1 && activeFilter === 'all' && (
                      <Text style={[styles.uberSectionLabel, { marginTop: 10 }]}>
                        Pedidos anteriores
                      </Text>
                    )}

                    <View
                      style={[
                        styles.uberOrderCard,
                        !isFirstHero && styles.uberOrderCardCompact,
                      ]}
                    >
                      {/* Fila principal: Ícono sobrio + Info + Precio y Botón Repetir */}
                      <View style={styles.uberOrderTopRow}>
                        <View style={styles.uberOrderIconBox}>
                          <Ionicons
                            name="bag-handle-outline"
                            size={20}
                            color="#FFFFFF"
                          />
                        </View>

                        <View style={styles.uberOrderInfoCol}>
                          <View style={styles.uberOrderTitleLine}>
                            <Text
                              style={styles.uberOrderTitle}
                              numberOfLines={1}
                            >
                              {order.items[0]?.name ||
                                `Pedido #${order.orderNumber}`}
                            </Text>
                          </View>

                          <Text style={styles.uberOrderMetaText}>
                            Pedido #{order.orderNumber} · {order.createdAt}
                          </Text>

                          <View style={styles.uberStatusRow}>
                            <View
                              style={[
                                styles.uberStatusDot,
                                {
                                  backgroundColor: isFulfilled
                                    ? '#9CA3AF'
                                    : '#FFFFFF',
                                },
                              ]}
                            />
                            <Text style={styles.uberStatusText}>
                              {isFulfilled ? 'Entregado' : 'En alistamiento'} ·{' '}
                              {order.paymentMethod ||
                                (order.financialStatus === 'pending'
                                  ? 'Contraentrega'
                                  : 'Pagado')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.uberOrderRightCol}>
                          <Text style={styles.uberOrderTotal}>
                            {formatCOP(order.total)}
                          </Text>
                        </View>
                      </View>

                      {/* Desglose sutil de artículos */}
                      <View style={styles.uberItemsList}>
                        {order.items.map((item, idx) => (
                          <View key={idx} style={styles.uberItemLine}>
                            <View style={styles.uberQtyBox}>
                              <Text style={styles.uberQtyBoxText}>
                                {item.quantity}
                              </Text>
                            </View>
                            <Text
                              style={styles.uberItemLineName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text style={styles.uberItemLinePrice}>
                              {formatCOP(item.price)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Pie de tarjeta con envío y botón píldora estilo Uber ("Repetir") */}
                      <View style={styles.uberOrderFooter}>
                        <Text style={styles.uberShippingLabel}>
                          {order.shippingMethod}
                        </Text>

                        <Pressable
                          onPress={() => handleReorder(order)}
                          style={({ pressed }) => [
                            styles.uberRepeatPillBtn,
                            isReordered && styles.uberRepeatPillBtnDone,
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <Ionicons
                            name={isReordered ? 'checkmark' : 'refresh'}
                            size={14}
                            color={isReordered ? '#0A0B0E' : '#FFFFFF'}
                          />
                          <Text
                            style={[
                              styles.uberRepeatPillText,
                              isReordered && { color: '#0A0B0E' },
                            ]}
                          >
                            {isReordered ? 'Agregado' : 'Repetir pedido'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
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
    backgroundColor: '#0A0B0E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  sheetContainerExpanded: {
    height: '96%',
  },
  sheetHeaderBar: {
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0A0B0E',
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
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dragIndicatorActive: {
    width: 52,
    backgroundColor: '#FFFFFF',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  uberMainHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    elevation: 35,
  },
  uberFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uberFilterPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#181B22',
  },
  uberFilterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  uberFilterPillText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  uberFilterPillTextActive: {
    color: '#0A0B0E',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  uberSectionLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  emptyOrdersBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyOrdersTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyOrdersSub: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
  uberOrderCard: {
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  uberOrderCardCompact: {
    backgroundColor: '#0F1117',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  uberOrderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  uberOrderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberOrderInfoCol: {
    flex: 1,
  },
  uberOrderTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uberOrderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  uberOrderMetaText: {
    color: '#9CA3AF',
    fontSize: 12.5,
    marginTop: 3,
  },
  uberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  uberStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  uberStatusText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  uberOrderRightCol: {
    alignItems: 'flex-end',
  },
  uberOrderTotal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  uberItemsList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  uberItemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uberQtyBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberQtyBoxText: {
    color: '#D1D5DB',
    fontSize: 11.5,
    fontWeight: '700',
  },
  uberItemLineName: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
  },
  uberItemLinePrice: {
    color: '#9CA3AF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  uberOrderFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uberShippingLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  uberRepeatPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E222D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  uberRepeatPillBtnDone: {
    backgroundColor: '#FFFFFF',
  },
  uberRepeatPillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
