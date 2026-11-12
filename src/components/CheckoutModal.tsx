import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { ConsenticoinIcon } from './ui/ConsenticoinIcon';
import {
  CustomerAddress,
  CustomerBillingInfo,
  CustomerOrder,
  useAuth,
} from '../context/AuthContext';
import { ProductBag } from '../data/catalog';
import {
  buildWhatsAppOrderMessage,
  calculateCheckoutTotals,
  CheckoutTotalsBreakdown,
  DeliveryZoneType,
  formatCOP,
  getDefaultPaymentMethodForZone,
  getMethodsForModality,
  getPaymentMethodById,
  isModalityAvailableForZone,
  MERCHANT_PAYMENT_CONFIG,
  openWhatsAppOrderSummary,
  PAYMENT_MODALITIES,
  PaymentMethodConfig,
  PaymentMethodId,
  PaymentModality,
} from '../data/paymentMethods';
import { useDraggableSheet } from '../utils/useDraggableSheet';

export interface CheckoutCartItem {
  product: ProductBag;
  quantity: number;
}

export interface PlaceOrderPayload {
  paymentMethodId: PaymentMethodId;
  totals: CheckoutTotalsBreakdown;
  cashChangeNote?: string;
  deliveryNotes?: string;
}

interface CheckoutModalProps {
  visible: boolean;
  deliveryZone: DeliveryZoneType;
  itemsList: CheckoutCartItem[];
  totalItems: number;
  totalWeightLb: number;
  subtotal: number;
  estimatedCarrierFee: number;
  coinsToRedeem: number;
  coinsDiscountCop: number;
  totalCoinsToEarn: number;
  onClose: () => void;
  onBackToCart: () => void;
  onChangeAddress: () => void;
  onPlaceOrder: (payload: PlaceOrderPayload) => CustomerOrder | null;
  onOpenOrders: () => void;
}

interface ConfirmedOrderSnapshot {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  address: CustomerAddress;
  deliveryZone: DeliveryZoneType;
  items: { name: string; quantity: number; price: number }[];
  totalItems: number;
  totalWeightLb: number;
  totals: CheckoutTotalsBreakdown;
  coinsToRedeem: number;
  coinsEarned: number;
  cashChangeNote?: string;
  deliveryNotes?: string;
  billingInfo?: CustomerBillingInfo;
}

const CASH_CHANGE_PRESETS = [
  'Pago exacto',
  'Billete de $50.000',
  'Billete de $100.000',
  'Billete de $200.000',
];

/** Flujo dedicado de Checkout con selección de modalidad (Contra entrega / Anticipado), medios de pago y recargo +5%. */
export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  deliveryZone,
  itemsList,
  totalItems,
  totalWeightLb,
  subtotal,
  estimatedCarrierFee,
  coinsToRedeem,
  coinsDiscountCop,
  totalCoinsToEarn,
  onClose,
  onBackToCart,
  onChangeAddress,
  onPlaceOrder,
  onOpenOrders,
}) => {
  const insets = useSafeAreaInsets();
  const { user, selectedAddress, updateBillingInfo } = useAuth();

  const [selectedModality, setSelectedModality] = useState<PaymentModality>(
    deliveryZone === 'bogota' ? 'contra_entrega' : 'anticipado'
  );
  const [selectedMethodId, setSelectedMethodId] = useState<PaymentMethodId>(
    getDefaultPaymentMethodForZone(deliveryZone)
  );
  const [zoneRestrictionNotice, setZoneRestrictionNotice] = useState(false);
  const [cashChangeNote, setCashChangeNote] = useState('Pago exacto');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [confirmedSnapshot, setConfirmedSnapshot] =
    useState<ConfirmedOrderSnapshot | null>(null);
  const [whatsappSentFeedback, setWhatsappSentFeedback] = useState(false);

  const wasVisibleRef = useRef(false);

  const handleRequestClose = () => {
    setConfirmedSnapshot(null);
    setWhatsappSentFeedback(false);
    setZoneRestrictionNotice(false);
    onClose();
  };

  const {
    translateY,
    isExpanded,
    isDragging,
    headerPanHandlers,
    grabberPanHandlers,
    animateClose,
  } = useDraggableSheet({
    visible,
    onClose: handleRequestClose,
  });

  // Reinicia solo al abrir un checkout nuevo con carrito activo; conserva elección al volver de cambiar dirección.
  useEffect(() => {
    if (visible && !wasVisibleRef.current && itemsList.length > 0 && !confirmedSnapshot) {
      setWhatsappSentFeedback(false);
      setZoneRestrictionNotice(false);
    }
    wasVisibleRef.current = visible;
  }, [visible, itemsList.length, confirmedSnapshot]);

  // Asegura coherencia automática si cambia la dirección entre Bogotá y Nacional.
  useEffect(() => {
    if (!isModalityAvailableForZone(selectedModality, deliveryZone)) {
      setSelectedModality('anticipado');
      setSelectedMethodId(getDefaultPaymentMethodForZone('nacional'));
    }
  }, [deliveryZone, selectedModality]);

  const activeMethods = useMemo(
    () => getMethodsForModality(selectedModality),
    [selectedModality]
  );

  const totals = useMemo(
    () =>
      calculateCheckoutTotals({
        subtotal,
        estimatedCarrierFee,
        coinsDiscountCop,
        paymentMethodId: selectedMethodId,
      }),
    [subtotal, estimatedCarrierFee, coinsDiscountCop, selectedMethodId]
  );

  const handleSelectModality = (modality: PaymentModality) => {
    if (!isModalityAvailableForZone(modality, deliveryZone)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setZoneRestrictionNotice(true);
      return;
    }

    Haptics.selectionAsync();
    setZoneRestrictionNotice(false);
    setSelectedModality(modality);

    const methodsInModality = getMethodsForModality(modality);
    if (!methodsInModality.some((m) => m.id === selectedMethodId)) {
      setSelectedMethodId(methodsInModality[0].id);
    }
  };

  const handleSelectMethod = (method: PaymentMethodConfig) => {
    Haptics.selectionAsync();
    setSelectedMethodId(method.id);
  };

  const handleToggleInvoice = (requiresInvoice: boolean) => {
    Haptics.selectionAsync();
    updateBillingInfo({ requiresInvoice });
  };

  const handleConfirmCheckout = () => {
    if (!user || itemsList.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const snapshotItems = itemsList.map((entry) => ({
      name: entry.product.name,
      quantity: entry.quantity,
      price: entry.product.price,
    }));

    const trimmedCashNote = totals.method.supportsCashChangeNote
      ? cashChangeNote.trim()
      : undefined;
    const trimmedNotes = deliveryNotes.trim() || undefined;

    const createdOrder = onPlaceOrder({
      paymentMethodId: selectedMethodId,
      totals,
      cashChangeNote: trimmedCashNote,
      deliveryNotes: trimmedNotes,
    });

    setConfirmedSnapshot({
      orderNumber: createdOrder?.orderNumber || String(Math.floor(59600 + Math.random() * 399)),
      createdAt: createdOrder?.createdAt || 'Hoy · Ahora mismo',
      customerName: user.name,
      customerPhone: selectedAddress.phone || user.phone,
      address: selectedAddress,
      deliveryZone,
      items: snapshotItems,
      totalItems,
      totalWeightLb,
      totals,
      coinsToRedeem,
      coinsEarned: totalCoinsToEarn,
      cashChangeNote: trimmedCashNote,
      deliveryNotes: trimmedNotes,
      billingInfo: user.billingInfo,
    });
    setDeliveryNotes('');
  };

  const handleSendWhatsApp = async () => {
    if (!confirmedSnapshot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = buildWhatsAppOrderMessage({
      orderNumber: confirmedSnapshot.orderNumber,
      customerName: confirmedSnapshot.customerName,
      customerPhone: confirmedSnapshot.customerPhone,
      address: confirmedSnapshot.address,
      deliveryZone: confirmedSnapshot.deliveryZone,
      items: confirmedSnapshot.items,
      totals: confirmedSnapshot.totals,
      coinsToRedeem: confirmedSnapshot.coinsToRedeem,
      coinsEarned: confirmedSnapshot.coinsEarned,
      cashChangeNote: confirmedSnapshot.cashChangeNote,
      deliveryNotes: confirmedSnapshot.deliveryNotes,
      billingInfo: confirmedSnapshot.billingInfo,
    });
    const status = await openWhatsAppOrderSummary(message);
    if (status !== 'cancelled') {
      setWhatsappSentFeedback(true);
    }
  };

  const activeMethod = getPaymentMethodById(selectedMethodId);
  const requiresInvoice = user?.billingInfo?.requiresInvoice ?? false;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={animateClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrapper}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              isExpanded && styles.sheetContainerExpanded,
              { transform: [{ translateY }] },
            ]}
          >
            {/* Cabecera arrastrable */}
            <View {...headerPanHandlers} style={styles.sheetHeaderBar}>
              <View {...grabberPanHandlers} style={styles.grabberHitZone}>
                <View
                  style={[
                    styles.grabberBar,
                    isDragging && styles.grabberBarActive,
                  ]}
                />
              </View>

              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleCluster}>
                  {!confirmedSnapshot ? (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        onBackToCart();
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.backPillBtn}
                    >
                      <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                      <Text style={styles.backPillText}>Bolsa</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.confirmedStepBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={colors.success}
                      />
                      <Text style={styles.confirmedStepText}>Listo</Text>
                    </View>
                  )}

                  <View>
                    <Text style={styles.sheetTitle}>
                      {confirmedSnapshot ? 'Pedido Confirmado' : 'Checkout'}
                    </Text>
                    <Text style={styles.sheetSubtitle}>
                      {confirmedSnapshot
                        ? `Orden #${confirmedSnapshot.orderNumber} registrada`
                        : 'Elige cómo deseas pagar tu pedido'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={animateClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {confirmedSnapshot ? (
              <CheckoutConfirmationView
                snapshot={confirmedSnapshot}
                whatsappSentFeedback={whatsappSentFeedback}
                bottomInset={insets.bottom}
                onSendWhatsApp={handleSendWhatsApp}
                onOpenOrders={() => {
                  Haptics.selectionAsync();
                  setConfirmedSnapshot(null);
                  setWhatsappSentFeedback(false);
                  onOpenOrders();
                }}
                onContinueShopping={animateClose}
              />
            ) : (
              <>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* 1. Dirección y Cobertura */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.sectionTitleGroup}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={colors.primary.light}
                        />
                        <Text style={styles.sectionTitle}>Dirección de entrega</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          onChangeAddress();
                        }}
                        style={styles.changeAddressBtn}
                      >
                        <Text style={styles.changeAddressBtnText}>Cambiar</Text>
                      </Pressable>
                    </View>

                    <View style={styles.addressBodyRow}>
                      <View style={styles.addressBadge}>
                        <Text style={styles.addressBadgeText}>
                          {selectedAddress.label}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.zoneRulePill,
                          deliveryZone === 'nacional' && styles.zoneRulePillNacional,
                        ]}
                      >
                        <Text
                          style={[
                            styles.zoneRulePillText,
                            deliveryZone === 'nacional' &&
                              styles.zoneRulePillTextNacional,
                          ]}
                        >
                          {deliveryZone === 'bogota'
                            ? 'Bogotá D.C. · Contraentrega o Anticipado'
                            : 'Envío Nacional · Solo Anticipado'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.addressMainText}>
                      {selectedAddress.address1}
                      {selectedAddress.address2
                        ? ` · ${selectedAddress.address2}`
                        : ''}
                    </Text>
                    <Text style={styles.addressMetaText}>
                      {selectedAddress.recipient} ·{' '}
                      {selectedAddress.phone || user?.phone || 'Sin teléfono'} ·{' '}
                      {selectedAddress.city}, {selectedAddress.province}
                    </Text>
                  </View>

                  {/* 2. Selector de Modalidad (Contra entrega vs Anticipado) */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.blockHeading}>1. Modalidad de pago</Text>
                    <View style={styles.modalityRow}>
                      {PAYMENT_MODALITIES.map((modality) => {
                        const isAvailable = isModalityAvailableForZone(
                          modality.id,
                          deliveryZone
                        );
                        const isActive = selectedModality === modality.id;
                        return (
                          <Pressable
                            key={modality.id}
                            onPress={() => handleSelectModality(modality.id)}
                            style={[
                              styles.modalityCard,
                              isActive && styles.modalityCardActive,
                              !isAvailable && styles.modalityCardDisabled,
                            ]}
                          >
                            <View style={styles.modalityTopRow}>
                              <View
                                style={[
                                  styles.modalityIconCircle,
                                  isActive && styles.modalityIconCircleActive,
                                ]}
                              >
                                <Ionicons
                                  name={modality.icon}
                                  size={18}
                                  color={
                                    isActive
                                      ? '#050508'
                                      : isAvailable
                                      ? colors.primary.light
                                      : '#6B7280'
                                  }
                                />
                              </View>
                              {!isAvailable ? (
                                <View style={styles.lockedTag}>
                                  <Text style={styles.lockedTagText}>
                                    Solo Bogotá
                                  </Text>
                                </View>
                              ) : (
                                <Ionicons
                                  name={
                                    isActive
                                      ? 'checkmark-circle'
                                      : 'ellipse-outline'
                                  }
                                  size={19}
                                  color={
                                    isActive
                                      ? colors.primary.light
                                      : 'rgba(255,255,255,0.28)'
                                  }
                                />
                              )}
                            </View>

                            <Text
                              style={[
                                styles.modalityTitle,
                                !isAvailable && styles.modalityTitleDisabled,
                              ]}
                            >
                              {modality.title}
                            </Text>
                            <Text style={styles.modalitySubtitle}>
                              {modality.subtitle}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {(zoneRestrictionNotice || deliveryZone === 'nacional') && (
                      <View style={styles.zoneInfoBanner}>
                        <Ionicons
                          name="information-circle-outline"
                          size={16}
                          color={colors.warning}
                        />
                        <Text style={styles.zoneInfoText}>
                          Para entregas fuera de Bogotá por transportadora nacional
                          solo está habilitado el pago anticipado (Bre-B, Efectivo o
                          Link de pagos +5%).
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 3. Selector de Medio de Pago según Modalidad */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.blockHeading}>
                      2. Medio de pago (
                      {selectedModality === 'contra_entrega'
                        ? 'Contra entrega'
                        : 'Anticipado'}
                      )
                    </Text>

                    <View style={styles.methodsList}>
                      {activeMethods.map((method) => {
                        const isSelected = method.id === selectedMethodId;
                        const hasSurcharge = method.surchargeRate > 0;
                        return (
                          <Pressable
                            key={method.id}
                            onPress={() => handleSelectMethod(method)}
                            style={[
                              styles.methodCard,
                              isSelected && styles.methodCardActive,
                            ]}
                          >
                            <View
                              style={[
                                styles.methodIconBox,
                                isSelected && styles.methodIconBoxActive,
                              ]}
                            >
                              <Ionicons
                                name={method.icon}
                                size={20}
                                color={
                                  isSelected
                                    ? '#050508'
                                    : hasSurcharge
                                    ? colors.primary.light
                                    : '#E5E7EB'
                                }
                              />
                            </View>

                            <View style={styles.methodBody}>
                              <View style={styles.methodTitleLine}>
                                <Text style={styles.methodTitle}>
                                  {method.shortLabel}
                                </Text>
                                {hasSurcharge ? (
                                  <View style={styles.surchargeBadge}>
                                    <Text style={styles.surchargeBadgeText}>
                                      {method.surchargeBadge} recargo
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.noFeeBadge}>
                                    <Text style={styles.noFeeBadgeText}>
                                      0% recargo
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.methodSubtitle}>
                                {method.subtitle}
                              </Text>
                            </View>

                            <Ionicons
                              name={
                                isSelected
                                  ? 'checkmark-circle'
                                  : 'ellipse-outline'
                              }
                              size={21}
                              color={
                                isSelected
                                  ? colors.primary.light
                                  : 'rgba(255,255,255,0.25)'
                              }
                            />
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Caja contextual del medio de pago seleccionado */}
                    <View style={styles.methodDetailBox}>
                      <View style={styles.methodDetailHeader}>
                        <Ionicons
                          name={activeMethod.icon}
                          size={16}
                          color={colors.primary.light}
                        />
                        <Text style={styles.methodDetailTitle}>
                          {activeMethod.instructionsTitle}
                        </Text>
                      </View>

                      {activeMethod.instructionsSteps.map((step, idx) => (
                        <Text key={idx} style={styles.methodDetailStep}>
                          {idx + 1}. {step}
                        </Text>
                      ))}

                      {activeMethod.showBrebKey && (
                        <View style={styles.brebKeyBox}>
                          <Text style={styles.brebKeyLabel}>Llave Bre-B</Text>
                          <Text style={styles.brebKeyValue}>
                            {MERCHANT_PAYMENT_CONFIG.brebKey ||
                              'Te la enviamos al confirmar pedido / WhatsApp'}
                          </Text>
                        </View>
                      )}

                      {activeMethod.surchargeRate > 0 && (
                        <View style={styles.surchargePreviewBox}>
                          <Text style={styles.surchargePreviewText}>
                            Incremento del 5% sobre{' '}
                            {formatCOP(totals.netBeforeSurcharge)}:{' '}
                            <Text style={styles.surchargePreviewBold}>
                              +{formatCOP(totals.surchargeAmount)}
                            </Text>
                          </Text>
                        </View>
                      )}

                      {activeMethod.supportsCashChangeNote && (
                        <View style={styles.cashChangeSection}>
                          <Text style={styles.cashChangeLabel}>
                            ¿Necesitas cambio / vueltas? (Opcional)
                          </Text>
                          <View style={styles.cashChipsRow}>
                            {CASH_CHANGE_PRESETS.map((preset) => {
                              const chipActive = cashChangeNote === preset;
                              return (
                                <Pressable
                                  key={preset}
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    setCashChangeNote(preset);
                                  }}
                                  style={[
                                    styles.cashChip,
                                    chipActive && styles.cashChipActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.cashChipText,
                                      chipActive && styles.cashChipTextActive,
                                    ]}
                                  >
                                    {preset}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <TextInput
                            value={cashChangeNote}
                            onChangeText={setCashChangeNote}
                            placeholder="Ej: Pago con billete de $100.000"
                            placeholderTextColor="#6B7280"
                            style={styles.noteInput}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 4. Facturación y notas */}
                  <View style={styles.sectionCard}>
                    <View style={styles.invoiceRow}>
                      <View style={styles.invoiceInfoCol}>
                        <Text style={styles.invoiceTitle}>
                          Factura electrónica
                        </Text>
                        <Text style={styles.invoiceSubtitle}>
                          {requiresInvoice
                            ? `${
                                user?.billingInfo?.documentType || 'CC'
                              } · ${user?.billingInfo?.documentNumber || ''}`
                            : 'Comprobante estándar de pedido'}
                        </Text>
                      </View>
                      <View style={styles.booleanToggleWrap}>
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

                    <TextInput
                      value={deliveryNotes}
                      onChangeText={setDeliveryNotes}
                      placeholder="Instrucciones de entrega (portería, horario, timbre...)"
                      placeholderTextColor="#6B7280"
                      style={[styles.noteInput, { marginTop: 10 }]}
                    />
                  </View>

                  {/* 5. Desglose final con Recargo +5% cuando aplica */}
                  <View style={styles.costBreakdownCard}>
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>
                        Subtotal ({totalItems}{' '}
                        {totalItems === 1 ? 'ítem' : 'ítems'} ·{' '}
                        {totalWeightLb.toFixed(1)} LB)
                      </Text>
                      <Text style={styles.costValue}>{formatCOP(subtotal)}</Text>
                    </View>

                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>
                        {deliveryZone === 'bogota'
                          ? 'Domicilio en Bogotá D.C.'
                          : 'Envío Transportadora Nacional'}
                      </Text>
                      <Text
                        style={[
                          styles.costValue,
                          deliveryZone === 'bogota' && {
                            color: colors.primary.light,
                          },
                        ]}
                      >
                        {deliveryZone === 'bogota'
                          ? 'Gratis ($ 0)'
                          : `+ ${formatCOP(estimatedCarrierFee)}`}
                      </Text>
                    </View>

                    {coinsToRedeem > 0 && coinsDiscountCop > 0 && (
                      <View style={styles.costRow}>
                        <Text
                          style={[
                            styles.costLabel,
                            { color: colors.primary.light },
                          ]}
                        >
                          Descuento Consenticoins (-{coinsToRedeem} Coins)
                        </Text>
                        <Text
                          style={[
                            styles.costValue,
                            { color: colors.primary.light },
                          ]}
                        >
                          - {formatCOP(coinsDiscountCop)}
                        </Text>
                      </View>
                    )}

                    {totals.surchargeAmount > 0 && totals.method.surchargeLabel && (
                      <View style={styles.costRow}>
                        <Text style={styles.surchargeRowLabel}>
                          {totals.method.surchargeLabel}
                        </Text>
                        <Text style={styles.surchargeRowValue}>
                          + {formatCOP(totals.surchargeAmount)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>Consenticoins a ganar</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <ConsenticoinIcon size={12} />
                        <Text
                          style={[
                            styles.costValue,
                            { color: colors.primary.light },
                          ]}
                        >
                          +{totalCoinsToEarn} Coins
                        </Text>
                      </View>
                    </View>

                    <View style={styles.costDivider} />

                    <View style={styles.costRow}>
                      <View>
                        <Text style={styles.costTotalLabel}>Total Final</Text>
                        <Text style={styles.costTotalSub}>
                          {totals.method.orderMethodLabel}
                        </Text>
                      </View>
                      <Text style={styles.costTotalValue}>
                        {formatCOP(totals.finalTotal)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Botón fijo de confirmación */}
                <View
                  style={[
                    styles.footerBar,
                    { paddingBottom: Math.max(insets.bottom, 14) },
                  ]}
                >
                  <Pressable
                    onPress={handleConfirmCheckout}
                    disabled={itemsList.length === 0}
                    style={({ pressed }) => [
                      styles.confirmGoldBtn,
                      itemsList.length === 0 && { opacity: 0.45 },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <LinearGradient
                      colors={colors.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.confirmGoldGradient}
                    >
                      <Text style={styles.confirmGoldBtnText}>
                        Confirmar Pedido · {formatCOP(totals.finalTotal)}
                      </Text>
                      <Text style={styles.confirmGoldBtnSub}>
                        {totals.method.orderMethodLabel}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

interface CheckoutConfirmationViewProps {
  snapshot: ConfirmedOrderSnapshot;
  whatsappSentFeedback: boolean;
  bottomInset: number;
  onSendWhatsApp: () => void;
  onOpenOrders: () => void;
  onContinueShopping: () => void;
}

const CheckoutConfirmationView: React.FC<CheckoutConfirmationViewProps> = ({
  snapshot,
  whatsappSentFeedback,
  bottomInset,
  onSendWhatsApp,
  onOpenOrders,
  onContinueShopping,
}) => {
  const { method, surchargeAmount, netBeforeSurcharge, finalTotal } =
    snapshot.totals;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.confirmedScrollContent,
        { paddingBottom: Math.max(bottomInset, 24) + 12 },
      ]}
    >
      <View style={styles.confirmedHeroCard}>
        <View style={styles.confirmedHeroIcon}>
          <Ionicons name="checkmark-circle" size={42} color={colors.success} />
        </View>
        <Text style={styles.confirmedHeroTitle}>
          ¡Pedido #{snapshot.orderNumber} confirmado!
        </Text>
        <Text style={styles.confirmedHeroSub}>
          Guardado en tu historial de pedidos · {snapshot.createdAt}
        </Text>

        <View style={styles.confirmedMethodChip}>
          <Ionicons
            name={method.icon}
            size={14}
            color={colors.primary.light}
          />
          <Text style={styles.confirmedMethodChipText}>
            {method.orderMethodLabel} · {formatCOP(finalTotal)}
          </Text>
        </View>

        {snapshot.coinsEarned > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            <ConsenticoinIcon size={13} />
            <Text style={styles.confirmedCoinsText}>
              +{snapshot.coinsEarned} Consenticoins abonados a tu billetera
              {snapshot.coinsToRedeem > 0
                ? ` (descontaste ${snapshot.coinsToRedeem} Coins)`
                : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Instrucciones del medio elegido */}
      <View style={styles.sectionCard}>
        <View style={styles.methodDetailHeader}>
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.primary.light}
          />
          <Text style={styles.methodDetailTitle}>{method.instructionsTitle}</Text>
        </View>

        {method.instructionsSteps.map((step, idx) => (
          <Text key={idx} style={styles.methodDetailStep}>
            {idx + 1}. {step}
          </Text>
        ))}

        {method.showBrebKey && (
          <View style={styles.brebKeyBox}>
            <Text style={styles.brebKeyLabel}>Llave Bre-B Mundo Mascotas</Text>
            <Text style={styles.brebKeyValue}>
              {MERCHANT_PAYMENT_CONFIG.brebKey ||
                'Solicita o confirma la llave directa en nuestro WhatsApp oficial'}
            </Text>
            <Text style={styles.brebAmountHint}>
              Valor exacto a transferir: {formatCOP(finalTotal)}
            </Text>
          </View>
        )}

        {surchargeAmount > 0 && (
          <View style={styles.surchargePreviewBox}>
            <Text style={styles.surchargePreviewText}>
              Total neto {formatCOP(netBeforeSurcharge)} + 5% (
              {formatCOP(surchargeAmount)}) ={' '}
              <Text style={styles.surchargePreviewBold}>
                {formatCOP(finalTotal)}
              </Text>
            </Text>
          </View>
        )}

        {snapshot.cashChangeNote && (
          <Text style={styles.confirmedNoteLine}>
            💵 Efectivo indicado: {snapshot.cashChangeNote}
          </Text>
        )}
        {snapshot.deliveryNotes && (
          <Text style={styles.confirmedNoteLine}>
            📝 Nota de entrega: {snapshot.deliveryNotes}
          </Text>
        )}
      </View>

      {/* Resumen de dirección y productos */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Entrega y resumen</Text>
        <Text style={[styles.addressMainText, { marginTop: 6 }]}>
          {snapshot.address.label} · {snapshot.address.address1}
        </Text>
        <Text style={styles.addressMetaText}>
          {snapshot.address.city}, {snapshot.address.province} ·{' '}
          {snapshot.totalItems}{' '}
          {snapshot.totalItems === 1 ? 'producto' : 'productos'}
        </Text>
      </View>

      {/* Botón WhatsApp opcional */}
      <Pressable
        onPress={onSendWhatsApp}
        style={({ pressed }) => [
          styles.whatsappBtn,
          pressed && { opacity: 0.88 },
        ]}
      >
        <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
        <Text style={styles.whatsappBtnText}>
          {method.id === 'ant_link_pagos'
            ? 'Solicitar Link de pagos por WhatsApp'
            : 'Enviar resumen por WhatsApp (opcional)'}
        </Text>
      </Pressable>

      {whatsappSentFeedback && (
        <Text style={styles.whatsappSentText}>
          ✓ Resumen preparado para WhatsApp
        </Text>
      )}

      <View style={styles.confirmedActionsRow}>
        <Pressable onPress={onOpenOrders} style={styles.secondaryActionBtn}>
          <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
          <Text style={styles.secondaryActionText}>Ver en Mis Pedidos</Text>
        </Pressable>

        <Pressable
          onPress={onContinueShopping}
          style={[styles.secondaryActionBtn, styles.secondaryActionGoldBtn]}
        >
          <Text style={styles.secondaryActionGoldText}>Seguir en la tienda</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  keyboardWrapper: {
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '89%',
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
    paddingHorizontal: 18,
    backgroundColor: '#0A0B0E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  grabberHitZone: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  grabberBar: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  grabberBarActive: {
    width: 54,
    backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  headerTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#181B22',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backPillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  confirmedStepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  confirmedStepText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  changeAddressBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#1B1F2A',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  changeAddressBtnText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
  },
  addressBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  addressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  addressBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  zoneRulePill: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
  zoneRulePillNacional: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  zoneRulePillText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
  },
  zoneRulePillTextNacional: {
    color: colors.accent.light,
  },
  addressMainText: {
    color: '#F3F4F6',
    fontSize: 13.5,
    fontWeight: '600',
  },
  addressMetaText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 3,
  },
  sectionBlock: {
    gap: 10,
  },
  blockHeading: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalityCard: {
    flex: 1,
    backgroundColor: '#12151C',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalityCardActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: '#19160E',
  },
  modalityCardDisabled: {
    opacity: 0.55,
  },
  modalityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalityIconCircleActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  lockedTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockedTagText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '700',
  },
  modalityTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  modalityTitleDisabled: {
    color: '#9CA3AF',
  },
  modalitySubtitle: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 2,
  },
  zoneInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 10,
  },
  zoneInfoText: {
    flex: 1,
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 17,
  },
  methodsList: {
    gap: 9,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#12151C',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  methodCardActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: '#19160E',
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconBoxActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  methodBody: {
    flex: 1,
    gap: 3,
  },
  methodTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  methodSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  surchargeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  surchargeBadgeText: {
    color: colors.accent.light,
    fontSize: 10.5,
    fontWeight: '800',
  },
  noFeeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.32)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  noFeeBadgeText: {
    color: colors.success,
    fontSize: 10.5,
    fontWeight: '700',
  },
  methodDetailBox: {
    backgroundColor: '#10131A',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    gap: 6,
  },
  methodDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  methodDetailTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    flex: 1,
  },
  methodDetailStep: {
    color: '#D1D5DB',
    fontSize: 12.2,
    lineHeight: 17,
  },
  brebKeyBox: {
    marginTop: 6,
    backgroundColor: '#171B24',
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brebKeyLabel: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  brebKeyValue: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  brebAmountHint: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 4,
  },
  surchargePreviewBox: {
    marginTop: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  surchargePreviewText: {
    color: '#FDE68A',
    fontSize: 12,
  },
  surchargePreviewBold: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cashChangeSection: {
    marginTop: 6,
    gap: 8,
  },
  cashChangeLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  cashChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cashChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1A1E28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cashChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: colors.primary.DEFAULT,
  },
  cashChipText: {
    color: '#9CA3AF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cashChipTextActive: {
    color: colors.primary.light,
  },
  noteInput: {
    backgroundColor: '#0A0B0E',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  invoiceInfoCol: {
    flex: 1,
  },
  invoiceTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  invoiceSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  booleanToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#0A0B0E',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  booleanPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  booleanPillActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  booleanPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  booleanPillTextActive: {
    color: '#050508',
    fontWeight: '800',
  },
  costBreakdownCard: {
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 9,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  costLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    flex: 1,
  },
  costValue: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  surchargeRowLabel: {
    color: colors.accent.light,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  surchargeRowValue: {
    color: colors.accent.light,
    fontSize: 13.5,
    fontWeight: '800',
  },
  costDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  costTotalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  costTotalSub: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 2,
  },
  costTotalValue: {
    color: colors.primary.light,
    fontSize: 20,
    fontWeight: '900',
  },
  footerBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: '#0A0B0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  confirmGoldBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGoldGradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmGoldBtnText: {
    color: '#050508',
    fontSize: 15.5,
    fontWeight: '900',
  },
  confirmGoldBtnSub: {
    color: '#2A2107',
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 2,
  },
  confirmedScrollContent: {
    padding: 18,
    gap: 14,
  },
  confirmedHeroCard: {
    backgroundColor: '#12151C',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    gap: 8,
  },
  confirmedHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedHeroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  confirmedHeroSub: {
    color: '#9CA3AF',
    fontSize: 12.5,
    textAlign: 'center',
  },
  confirmedMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginTop: 4,
  },
  confirmedMethodChipText: {
    color: colors.primary.light,
    fontSize: 12.5,
    fontWeight: '800',
  },
  confirmedCoinsText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  confirmedNoteLine: {
    color: '#E5E7EB',
    fontSize: 12.5,
    marginTop: 4,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 15,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  whatsappSentText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmedActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionGoldBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  secondaryActionGoldText: {
    color: '#050508',
    fontSize: 13,
    fontWeight: '900',
  },
});

