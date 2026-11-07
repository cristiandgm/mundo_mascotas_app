import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { UserAvatar } from './ui/UserAvatar';
import {
  useAuth,
  DEFAULT_VIP_CUSTOMER,
  CustomerOrder,
} from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

interface CustomerProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onManageAddresses?: () => void;
}

export const CustomerProfileSheet: React.FC<CustomerProfileSheetProps> = ({
  visible,
  onClose,
  onManageAddresses,
}) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    selectedAddress,
    addresses,
    updateBillingInfo,
    updatePetInfo,
    logout,
  } = useAuth();

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

  const profileData = user || DEFAULT_VIP_CUSTOMER;

  const [showAllOrders, setShowAllOrders] = useState(false);
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState(false);
  const [petNameInput, setPetNameInput] = useState(profileData.petName || '');

  const formatCOP = (amount: number) => {
    return (
      '$ ' +
      amount
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    );
  };

  const handleToggleInvoice = (val: boolean) => {
    Haptics.selectionAsync();
    updateBillingInfo({ requiresInvoice: val });
  };

  const handleReorder = (orderNumber: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReorderedId(orderNumber);
    setTimeout(() => {
      setReorderedId(null);
    }, 2500);
  };

  const handleSavePet = () => {
    if (petNameInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updatePetInfo(petNameInput.trim(), profileData.petType || 'dog');
    }
    setEditingPet(false);
  };

  const orders = profileData.orders || DEFAULT_VIP_CUSTOMER.orders || [];
  const latestOrder: CustomerOrder | undefined = orders[0];
  const requiresInvoice = profileData.billingInfo?.requiresInvoice ?? false;

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
            colors={['#0F121C', '#07080C', '#050508']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Drag Handle & Close Bar */}
          <View style={styles.sheetHeaderBar} {...headerPanHandlers}>
            <View style={styles.dragIndicatorHitZone} {...grabberPanHandlers}>
              <View
                style={[
                  styles.dragIndicator,
                  isDragging && styles.dragIndicatorActive,
                ]}
              />
            </View>
            <View style={styles.sheetTitleRow}>
              <View style={styles.brandBadge}>
                <Ionicons name="paw" size={13} color={colors.primary.DEFAULT} />
                <Text style={styles.brandBadgeText}>MI CUENTA MUNDO MASCOTAS</Text>
              </View>
              <Pressable onPress={animateClose} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.dark.textSecondary} />
              </Pressable>
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
            {/* Cabecera del Cliente */}
            <View style={styles.customerHeaderCard}>
              <View style={styles.customerIdentityRow}>
                <UserAvatar
                  name={profileData.name}
                  avatarUrl={profileData.avatarUrl}
                  size={60}
                />
                <View style={styles.customerNameCol}>
                  <View style={styles.nameAndGroupRow}>
                    <Text style={styles.customerName}>{profileData.name}</Text>
                    <View style={styles.groupPill}>
                      <Text style={styles.groupPillText}>
                        🏆 {profileData.customerGroup || 'Champions VIP'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.customerEmailText}>{profileData.email}</Text>
                  <View style={styles.sessionStatusRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.sessionStatusText}>
                      Cuenta activa · Notificaciones en Español
                    </Text>
                  </View>
                </View>
              </View>

              {/* Resumen de Fidelidad */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total en compras</Text>
                  <Text style={styles.statValueGold}>
                    {formatCOP(profileData.totalSpent ?? 8721100)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBoxSmall}>
                  <Text style={styles.statLabel}>Pedidos</Text>
                  <Text style={styles.statValue}>{profileData.ordersCount ?? 23}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Miembro desde</Text>
                  <Text style={styles.statValue}>
                    {profileData.customerSince || 'Más de 1 año'}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN: ÚLTIMO PEDIDO REALIZADO */}
            {latestOrder && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Último pedido realizado</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowAllOrders(!showAllOrders);
                    }}
                  >
                    <Text style={styles.linkGoldText}>
                      {showAllOrders
                        ? 'Ocultar historial'
                        : `Ver mis pedidos (${profileData.ordersCount ?? 23})`}
                    </Text>
                  </Pressable>
                </View>

                {/* Tarjeta del Último Pedido */}
                <View style={styles.orderBox}>
                  <View style={styles.orderTopBar}>
                    <View style={styles.orderBadgesWrap}>
                      <Text style={styles.orderIdText}>Pedido #{latestOrder.orderNumber}</Text>

                      <View
                        style={[
                          styles.statusBadge,
                          latestOrder.financialStatus === 'pending'
                            ? styles.badgePendingPayment
                            : styles.badgePaid,
                        ]}
                      >
                        <View
                          style={[
                            styles.badgeDot,
                            {
                              backgroundColor:
                                latestOrder.financialStatus === 'pending'
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
                                latestOrder.financialStatus === 'pending'
                                  ? '#FDBA74'
                                  : '#6EE7B7',
                            },
                          ]}
                        >
                          {latestOrder.financialStatus === 'pending'
                            ? 'Pago pendiente'
                            : 'Pagado'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          latestOrder.fulfillmentStatus === 'unfulfilled'
                            ? styles.badgeUnfulfilled
                            : styles.badgeFulfilled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                latestOrder.fulfillmentStatus === 'unfulfilled'
                                  ? '#FDE047'
                                  : '#93C5FD',
                            },
                          ]}
                        >
                          {latestOrder.fulfillmentStatus === 'unfulfilled'
                            ? 'En alistamiento'
                            : 'Entregado'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.orderTotalText}>
                      {formatCOP(latestOrder.total)}
                    </Text>
                  </View>

                  <Text style={styles.orderDateText}>
                    {latestOrder.createdAt} · {latestOrder.shippingMethod}
                  </Text>

                  <View style={styles.orderItemsDivider} />

                  {latestOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.lineItemRow}>
                      <View style={styles.productThumb}>
                        <Ionicons name="nutrition" size={20} color={colors.primary.DEFAULT} />
                      </View>
                      <View style={styles.lineItemInfo}>
                        <Text style={styles.lineItemName}>{item.name}</Text>
                        <Text style={styles.lineItemSku}>Ref: {item.sku}</Text>
                      </View>
                      <Text style={styles.lineItemQty}>x {item.quantity}</Text>
                      <Text style={styles.lineItemPrice}>{formatCOP(item.price)}</Text>
                    </View>
                  ))}

                  {/* Botón Volver a Pedir */}
                  <Pressable
                    onPress={() => handleReorder(latestOrder.orderNumber)}
                    style={[
                      styles.reorderButton,
                      reorderedId === latestOrder.orderNumber && styles.reorderButtonSuccess,
                    ]}
                  >
                    <Ionicons
                      name={
                        reorderedId === latestOrder.orderNumber
                          ? 'checkmark-circle'
                          : 'repeat-outline'
                      }
                      size={17}
                      color={
                        reorderedId === latestOrder.orderNumber ? '#10B981' : '#050508'
                      }
                    />
                    <Text
                      style={[
                        styles.reorderButtonText,
                        reorderedId === latestOrder.orderNumber && { color: '#10B981' },
                      ]}
                    >
                      {reorderedId === latestOrder.orderNumber
                        ? '¡Agregado a tu carrito de recompra!'
                        : 'Volver a pedir en 1 toque'}
                    </Text>
                  </Pressable>
                </View>

                {/* Historial desplegable de pedidos anteriores */}
                {showAllOrders && orders.length > 1 && (
                  <View style={styles.previousOrdersContainer}>
                    <Text style={styles.previousOrdersHeading}>
                      HISTORIAL DE MIS PEDIDOS RECIENTES
                    </Text>
                    {orders.slice(1).map((ord) => (
                      <View key={ord.orderNumber} style={styles.prevOrderRow}>
                        <View style={styles.prevOrderLeft}>
                          <View style={styles.prevOrderHeader}>
                            <Text style={styles.prevOrderId}>Pedido #{ord.orderNumber}</Text>
                            <Text style={styles.prevOrderStatus}>
                              {ord.fulfillmentStatus === 'fulfilled'
                                ? '✓ Entregado'
                                : '⏳ En proceso'}
                            </Text>
                          </View>
                          <Text style={styles.prevOrderDate}>{ord.createdAt}</Text>
                          {ord.items.map((it, i) => (
                            <Text key={i} style={styles.prevOrderItemText} numberOfLines={1}>
                              • {it.quantity}x {it.name}
                            </Text>
                          ))}
                        </View>
                        <View style={styles.prevOrderRight}>
                          <Text style={styles.prevOrderTotal}>{formatCOP(ord.total)}</Text>
                          <Pressable
                            onPress={() => handleReorder(ord.orderNumber)}
                            style={styles.miniRepeatBtn}
                          >
                            <Text style={styles.miniRepeatBtnText}>
                              {reorderedId === ord.orderNumber ? '¡Listo!' : 'Repetir'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* SECCIÓN: DATOS DE FACTURACIÓN Y MASCOTA */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Datos de Facturación y Mascota</Text>
                <Text style={styles.sectionSubtitleBadge}>Perfil Verificado</Text>
              </View>

              {/* Requiere Factura */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>Requiere Factura Electrónica</Text>
                <View style={styles.booleanToggleGroup}>
                  <Pressable
                    onPress={() => handleToggleInvoice(false)}
                    style={[
                      styles.booleanPill,
                      !requiresInvoice && styles.booleanPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.booleanPillText,
                        !requiresInvoice && styles.booleanPillTextActive,
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleToggleInvoice(true)}
                    style={[
                      styles.booleanPill,
                      requiresInvoice && styles.booleanPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.booleanPillText,
                        requiresInvoice && styles.booleanPillTextActive,
                      ]}
                    >
                      Sí
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Tipo de Documento */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>Tipo de Documento</Text>
                <View style={styles.billingValuePill}>
                  <Ionicons name="card-outline" size={14} color={colors.primary.DEFAULT} />
                  <Text style={styles.billingValueText}>
                    {profileData.billingInfo?.documentType || 'Cédula de Ciudadanía (CC)'}
                  </Text>
                </View>
              </View>

              {/* Número de Identificación */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>Número de Identificación</Text>
                <View style={styles.billingValuePill}>
                  <Ionicons name="id-card-outline" size={14} color={colors.primary.DEFAULT} />
                  <Text style={styles.billingValueText}>
                    {profileData.billingInfo?.documentNumber || '1030631037'}
                  </Text>
                </View>
              </View>

              {/* Tipo de Mascota (Personaliza el catálogo de la App) */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>
                  Especie de mi mascota
                </Text>
                <View style={styles.booleanToggleGroup}>
                  {[
                    { id: 'dog' as const, label: '🐶 Perro' },
                    { id: 'cat' as const, label: '🐱 Gato' },
                    { id: 'both' as const, label: '🐾 Ambos' },
                  ].map((opt) => {
                    const isSelected = (profileData.petType || 'dog') === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          updatePetInfo(profileData.petName || 'Consentido', opt.id);
                        }}
                        style={[
                          styles.booleanPill,
                          isSelected && styles.booleanPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.booleanPillText,
                            isSelected && styles.booleanPillTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Mascota */}
              <View style={[styles.billingFieldRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.billingFieldLabel}>Nombre de mi mascota</Text>
                {editingPet ? (
                  <View style={styles.petEditRow}>
                    <TextInput
                      value={petNameInput}
                      onChangeText={setPetNameInput}
                      placeholder="Nombre de tu mascota"
                      placeholderTextColor={colors.dark.textMuted}
                      style={styles.petEditInput}
                      autoFocus
                    />
                    <Pressable onPress={handleSavePet} style={styles.petSaveBtn}>
                      <Ionicons name="checkmark" size={16} color="#050508" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setPetNameInput(profileData.petName || '');
                      setEditingPet(true);
                    }}
                    style={styles.billingActionPill}
                  >
                    <Text style={styles.billingActionText}>
                      {profileData.petName
                        ? `🐾 ${profileData.petName} (Editar)`
                        : '+ Agregar nombre'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* SECCIÓN: INFORMACIÓN DE CONTACTO Y DIRECCIÓN DE ENTREGA */}
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>
                Contacto y Dirección de Entrega
              </Text>

              {/* Contacto */}
              <View style={styles.infoBlock}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="call-outline" size={18} color={colors.primary.DEFAULT} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoBlockLabel}>Datos de contacto</Text>
                  <Text style={styles.infoBlockPrimary}>{profileData.email}</Text>
                  <Text style={styles.infoBlockSecondary}>
                    {profileData.phone || '+57 300 3918279'}
                  </Text>
                </View>
              </View>

              <View style={styles.blockSeparator} />

              {/* Dirección activa y gestor de múltiples direcciones */}
              <View style={styles.infoBlock}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={18} color={colors.primary.DEFAULT} />
                </View>
                <View style={styles.infoTextCol}>
                  <View style={styles.addressHeaderRow}>
                    <Text style={styles.infoBlockLabel}>
                      Dirección activa ({selectedAddress.label})
                    </Text>
                    {selectedAddress.verifiedCoverage && (
                      <View style={styles.verifiedTag}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.verifiedTagText}>Cobertura verificada</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.infoBlockPrimary}>
                    {selectedAddress.recipient || 'Alejandra P.'}
                  </Text>
                  <Text style={styles.infoBlockSecondary}>
                    {selectedAddress.address1}
                  </Text>
                  {selectedAddress.address2 && (
                    <Text style={styles.infoBlockSecondary}>
                      {selectedAddress.address2}
                    </Text>
                  )}
                  <Text style={styles.infoBlockSecondary}>
                    {selectedAddress.locality
                      ? `${selectedAddress.locality} · `
                      : ''}
                    {selectedAddress.city}, {selectedAddress.country}
                  </Text>
                  {selectedAddress.deliveryZone && (
                    <Text style={styles.zoneHighlightText}>
                      🚚 Zona de cobertura: {selectedAddress.deliveryZone}
                    </Text>
                  )}
                  {onManageAddresses && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        onManageAddresses();
                      }}
                      style={{
                        marginTop: 10,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(212, 175, 55, 0.12)',
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(212, 175, 55, 0.35)',
                      }}
                    >
                      <Ionicons
                        name="map-outline"
                        size={14}
                        color={colors.primary.light}
                      />
                      <Text
                        style={{
                          color: colors.primary.light,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        Ver o cambiar mis direcciones ({addresses.length})
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.blockSeparator} />

              {/* Beneficios y Notificaciones */}
              <View style={styles.footerMetaGrid}>
                <View style={styles.footerMetaItem}>
                  <Text style={styles.footerMetaLabel}>Alertas de mis pedidos</Text>
                  <Text style={styles.footerMetaValue}>
                    {(profileData.marketingSubscriptions || ['Correo electrónico', 'SMS']).join(
                      ', '
                    )}
                  </Text>
                </View>
                <View style={styles.footerMetaItem}>
                  <Text style={styles.footerMetaLabel}>Saldo Consenticoins</Text>
                  <Text style={[styles.footerMetaValue, { color: colors.primary.light }]}>
                    {profileData.points} Coins disponibles
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón Cerrar Sesión */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
                logout();
              }}
              style={styles.logoutRowBtn}
            >
              <Ionicons name="log-out-outline" size={18} color="#F87171" />
              <Text style={styles.logoutRowText}>Cerrar Sesión de mi Cuenta</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    height: '86%',
    backgroundColor: '#07080C',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
  },
  sheetContainerExpanded: {
    height: '95%',
  },
  sheetHeaderBar: {
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  dragIndicatorHitZone: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  dragIndicatorActive: {
    width: 56,
    backgroundColor: colors.primary.light,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  brandBadgeText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 44,
    gap: 16,
  },
  guestNoticeCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 16,
    padding: 14,
  },
  guestNoticeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guestNoticeTitle: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  guestNoticeSub: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  guestActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activateDemoBtn: {
    flex: 1.4,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  activateDemoBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '800',
  },
  goToLoginBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  goToLoginBtnText: {
    color: colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  customerHeaderCard: {
    backgroundColor: '#0E1017',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
  },
  customerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  customerNameCol: {
    flex: 1,
  },
  nameAndGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  groupPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupPillText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '700',
  },
  customerEmailText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    marginBottom: 5,
  },
  sessionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  sessionStatusText: {
    color: colors.dark.textMuted,
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 8, 0.65)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statBox: {
    flex: 1.3,
    alignItems: 'center',
  },
  statBoxSmall: {
    flex: 0.7,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabel: {
    color: colors.dark.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  statValueGold: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '800',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#0E1017',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitleBadge: {
    color: colors.dark.textMuted,
    fontSize: 11,
  },
  linkGoldText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '600',
  },
  orderBox: {
    backgroundColor: 'rgba(5, 5, 8, 0.6)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
  },
  orderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  orderBadgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  orderIdText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
  },
  badgePendingPayment: {
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  badgePaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  badgeUnfulfilled: {
    backgroundColor: 'rgba(234, 179, 8, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  badgeFulfilled: {
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderTotalText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  orderDateText: {
    color: colors.dark.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  orderItemsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  productThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lineItemSku: {
    color: colors.dark.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  lineItemQty: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  lineItemPrice: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  reorderButtonSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  reorderButtonText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '800',
  },
  previousOrdersContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  previousOrdersHeading: {
    color: colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  prevOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  prevOrderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  prevOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  prevOrderId: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  prevOrderStatus: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  prevOrderDate: {
    color: colors.dark.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  prevOrderItemText: {
    color: colors.dark.textSecondary,
    fontSize: 11,
  },
  prevOrderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  prevOrderTotal: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
  },
  miniRepeatBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniRepeatBtnText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
  },
  billingFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  billingFieldLabel: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  booleanToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  booleanPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  booleanPillActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  booleanPillText: {
    color: colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  booleanPillTextActive: {
    color: '#050508',
    fontWeight: '800',
  },
  billingValuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    gap: 6,
  },
  billingValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  billingActionPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  billingActionText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
  },
  petEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petEditInput: {
    backgroundColor: '#050508',
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    minWidth: 130,
  },
  petSaveBtn: {
    backgroundColor: colors.primary.DEFAULT,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoTextCol: {
    flex: 1,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 3,
  },
  infoBlockLabel: {
    color: colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoBlockPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoBlockSecondary: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedTagText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  zoneHighlightText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  blockSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  footerMetaGrid: {
    gap: 8,
  },
  footerMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerMetaLabel: {
    color: colors.dark.textMuted,
    fontSize: 12,
  },
  footerMetaValue: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  logoutRowText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
