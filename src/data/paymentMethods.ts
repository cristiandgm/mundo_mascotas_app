import { Linking, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomerAddress, CustomerBillingInfo } from '../context/AuthContext';

export type DeliveryZoneType = 'bogota' | 'nacional';

export type PaymentModality = 'contra_entrega' | 'anticipado';

export type PaymentMethodId =
  | 'contra_efectivo'
  | 'contra_breb'
  | 'contra_datafono'
  | 'ant_breb'
  | 'ant_efectivo'
  | 'ant_link_pagos';

export interface PaymentModalityOption {
  id: PaymentModality;
  title: string;
  subtitle: string;
  bogotaOnly: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  modality: PaymentModality;
  title: string;
  shortLabel: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  surchargeRate: number;
  surchargeLabel?: string;
  surchargeBadge?: string;
  orderMethodLabel: string;
  financialStatus: 'pending' | 'paid';
  supportsCashChangeNote?: boolean;
  showBrebKey?: boolean;
  instructionsTitle: string;
  instructionsSteps: string[];
}

export interface CheckoutTotalsInput {
  subtotal: number;
  estimatedCarrierFee: number;
  coinsDiscountCop: number;
  paymentMethodId: PaymentMethodId;
}

export interface CheckoutTotalsBreakdown {
  subtotal: number;
  estimatedCarrierFee: number;
  coinsDiscountCop: number;
  netBeforeSurcharge: number;
  surchargeRate: number;
  surchargeAmount: number;
  finalTotal: number;
  method: PaymentMethodConfig;
}

export interface WhatsAppSummaryParams {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  address: CustomerAddress;
  deliveryZone: DeliveryZoneType;
  items: { name: string; quantity: number; price: number }[];
  totals: CheckoutTotalsBreakdown;
  coinsToRedeem: number;
  coinsEarned: number;
  cashChangeNote?: string;
  deliveryNotes?: string;
  billingInfo?: CustomerBillingInfo;
}

/** Formatea valores monetarios en Pesos Colombianos con separador de miles por punto. */
export const formatCOP = (amount: number): string => {
  const safeAmount = Math.max(0, Math.round(amount));
  return '$ ' + safeAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const sanitizeDigits = (raw?: string): string => (raw ? raw.replace(/[^\d]/g, '') : '');

/** Configuracion del comercio leida de variables publicas Expo si estan definidas. */
export const MERCHANT_PAYMENT_CONFIG = {
  storeName: 'Mundo Mascotas Colombia',
  brebKey: process.env.EXPO_PUBLIC_BREB_KEY?.trim() || '',
  whatsappNumber: sanitizeDigits(process.env.EXPO_PUBLIC_WHATSAPP_NUMBER),
} as const;

export const PAYMENT_MODALITIES: PaymentModalityOption[] = [
  {
    id: 'contra_entrega',
    title: 'Contra entrega',
    subtitle: 'Pagas al recibir en Bogotá',
    bogotaOnly: true,
    icon: 'cube-outline',
  },
  {
    id: 'anticipado',
    title: 'Pago anticipado',
    subtitle: 'Bogotá y envíos nacionales',
    bogotaOnly: false,
    icon: 'shield-checkmark-outline',
  },
];

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'contra_efectivo',
    modality: 'contra_entrega',
    title: 'Efectivo contra entrega',
    shortLabel: 'Efectivo',
    subtitle: 'Pagas en efectivo al domiciliario · Sin recargo',
    icon: 'cash-outline',
    surchargeRate: 0,
    orderMethodLabel: 'Contraentrega · Efectivo',
    financialStatus: 'pending',
    supportsCashChangeNote: true,
    instructionsTitle: 'Pago en efectivo al recibir en Bogotá',
    instructionsSteps: [
      'Alista el total exacto o indica abajo con qué billete pagas para enviar vueltas.',
      'Recibes tus bultos primero en tu dirección y pagas directo al mensajero.',
    ],
  },
  {
    id: 'contra_breb',
    modality: 'contra_entrega',
    title: 'Bre-B contra entrega',
    shortLabel: 'Bre-B',
    subtitle: 'Transferencia inmediata al recibir · Sin recargo (0%)',
    icon: 'flash-outline',
    surchargeRate: 0,
    orderMethodLabel: 'Contraentrega · Bre-B',
    financialStatus: 'pending',
    showBrebKey: true,
    instructionsTitle: 'Transferencia inmediata Bre-B al recibir',
    instructionsSteps: [
      'Cuando llegue tu pedido en Bogotá, transfieres el valor exacto por Bre-B.',
      'Muestras el comprobante de transferencia exitosa al domiciliario al instante.',
    ],
  },
  {
    id: 'contra_datafono',
    modality: 'contra_entrega',
    title: 'Datáfono contra entrega',
    shortLabel: 'Datáfono',
    subtitle: 'Tarjeta débito o crédito en puerta · +5% de incremento',
    icon: 'card-outline',
    surchargeRate: 0.05,
    surchargeLabel: 'Recargo Datáfono (+5%)',
    surchargeBadge: '+5%',
    orderMethodLabel: 'Contraentrega · Datáfono (+5%)',
    financialStatus: 'pending',
    instructionsTitle: 'Datáfono inalámbrico en puerta (+5% incluido)',
    instructionsSteps: [
      'Asignamos domiciliario con datáfono inalámbrico para tu entrega en Bogotá.',
      'El incremento del 5% sobre el saldo neto a pagar ya queda incluido en el total.',
    ],
  },
  {
    id: 'ant_breb',
    modality: 'anticipado',
    title: 'Bre-B anticipado',
    shortLabel: 'Bre-B',
    subtitle: 'Transferencia inmediata previa al despacho · Sin recargo (0%)',
    icon: 'flash-outline',
    surchargeRate: 0,
    orderMethodLabel: 'Anticipado · Bre-B',
    financialStatus: 'pending',
    showBrebKey: true,
    instructionsTitle: 'Transfiere por Bre-B antes del despacho',
    instructionsSteps: [
      'Realiza la transferencia por el monto exacto usando Bre-B sin costo adicional.',
      'Comparte tu comprobante por WhatsApp con el número de pedido para alistar el envío.',
    ],
  },
  {
    id: 'ant_efectivo',
    modality: 'anticipado',
    title: 'Efectivo anticipado',
    shortLabel: 'Efectivo',
    subtitle: 'Recaudo en efectivo o corresponsal antes del envío · Sin recargo',
    icon: 'cash-outline',
    surchargeRate: 0,
    orderMethodLabel: 'Anticipado · Efectivo',
    financialStatus: 'pending',
    instructionsTitle: 'Pago en efectivo anticipado · Sin recargo',
    instructionsSteps: [
      'Registra el pedido y coordina por WhatsApp el punto de recaudo o corresponsal autorizado.',
      'Una vez validado el abono en efectivo, despachamos tu pedido de inmediato.',
    ],
  },
  {
    id: 'ant_link_pagos',
    modality: 'anticipado',
    title: 'Link de pagos anticipado',
    shortLabel: 'Link de pagos',
    subtitle: 'Tarjeta débito/crédito, PSE o Nequi · +5% de incremento',
    icon: 'link-outline',
    surchargeRate: 0.05,
    surchargeLabel: 'Recargo Link de pagos (+5%)',
    surchargeBadge: '+5%',
    orderMethodLabel: 'Anticipado · Link de pagos (+5%)',
    financialStatus: 'pending',
    instructionsTitle: 'Enlace seguro de pago online (+5% incluido)',
    instructionsSteps: [
      'Al confirmar el pedido generamos tu referencia con el +5% incluido en el valor neto.',
      'Toca "Enviar resumen por WhatsApp" para recibir tu link de pago al instante.',
    ],
  },
];

/** En envíos por transportadora nacional solo está permitido pago anticipado. */
export const isModalityAvailableForZone = (
  modality: PaymentModality,
  deliveryZone: DeliveryZoneType
): boolean => {
  if (deliveryZone === 'nacional') {
    return modality === 'anticipado';
  }
  return true;
};

export const getMethodsForModality = (
  modality: PaymentModality
): PaymentMethodConfig[] => PAYMENT_METHODS.filter((m) => m.modality === modality);

export const getPaymentMethodById = (
  methodId: PaymentMethodId
): PaymentMethodConfig =>
  PAYMENT_METHODS.find((m) => m.id === methodId) || PAYMENT_METHODS[0];

export const getDefaultPaymentMethodForZone = (
  deliveryZone: DeliveryZoneType
): PaymentMethodId =>
  deliveryZone === 'bogota' ? 'contra_efectivo' : 'ant_breb';

/**
 * Calcula el total final aplicando domicilio y redención Consenticoins primero,
 * y calculando cualquier recargo del +5% sobre ese saldo neto a pagar.
 */
export const calculateCheckoutTotals = ({
  subtotal,
  estimatedCarrierFee,
  coinsDiscountCop,
  paymentMethodId,
}: CheckoutTotalsInput): CheckoutTotalsBreakdown => {
  const method = getPaymentMethodById(paymentMethodId);
  const netBeforeSurcharge = Math.max(
    0,
    subtotal + estimatedCarrierFee - coinsDiscountCop
  );
  const surchargeAmount =
    method.surchargeRate > 0
      ? Math.round(netBeforeSurcharge * method.surchargeRate)
      : 0;
  const finalTotal = netBeforeSurcharge + surchargeAmount;

  return {
    subtotal,
    estimatedCarrierFee,
    coinsDiscountCop,
    netBeforeSurcharge,
    surchargeRate: method.surchargeRate,
    surchargeAmount,
    finalTotal,
    method,
  };
};

export const buildWhatsAppOrderMessage = ({
  orderNumber,
  customerName,
  customerPhone,
  address,
  deliveryZone,
  items,
  totals,
  coinsToRedeem,
  coinsEarned,
  cashChangeNote,
  deliveryNotes,
  billingInfo,
}: WhatsAppSummaryParams): string => {
  const itemLines = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name} — ${formatCOP(item.price * item.quantity)}`
    )
    .join('\n');

  const lines: string[] = [
    `*Nuevo Pedido #${orderNumber} · ${MERCHANT_PAYMENT_CONFIG.storeName}*`,
    `Cliente: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`,
    `Entrega: ${address.address1}${address.address2 ? `, ${address.address2}` : ''} · ${address.city}, ${address.province}`,
    `Zona: ${
      deliveryZone === 'bogota'
        ? 'Domicilio Gratis Bogotá D.C.'
        : 'Transportadora Nacional'
    }`,
    '',
    '*Productos:*',
    itemLines,
    '',
    `*Pago:* ${totals.method.orderMethodLabel}`,
    `Subtotal: ${formatCOP(totals.subtotal)}`,
    deliveryZone === 'bogota'
      ? 'Domicilio: Gratis ($ 0)'
      : `Envío Transportadora: ${formatCOP(totals.estimatedCarrierFee)}`,
  ];

  if (coinsToRedeem > 0 && totals.coinsDiscountCop > 0) {
    lines.push(
      `Descuento Consenticoins (-${coinsToRedeem} Coins): -${formatCOP(
        totals.coinsDiscountCop
      )}`
    );
  }
  if (totals.surchargeAmount > 0 && totals.method.surchargeLabel) {
    lines.push(
      `${totals.method.surchargeLabel}: +${formatCOP(totals.surchargeAmount)}`
    );
  }

  lines.push(`*Total a pagar: ${formatCOP(totals.finalTotal)}*`);
  if (coinsEarned > 0) {
    lines.push(`Cashback: +${coinsEarned} Consenticoins`);
  }
  if (totals.method.supportsCashChangeNote && cashChangeNote?.trim()) {
    lines.push(`Efectivo / cambio: ${cashChangeNote.trim()}`);
  }
  if (billingInfo?.requiresInvoice) {
    lines.push(
      `Factura electrónica: Sí (${billingInfo.documentType}: ${billingInfo.documentNumber})`
    );
  }
  if (deliveryNotes?.trim()) {
    lines.push(`Notas: ${deliveryNotes.trim()}`);
  }

  return lines.join('\n');
};

/** Abre WhatsApp con el mensaje prellenado o usa el selector nativo de compartir como respaldo. */
export const openWhatsAppOrderSummary = async (
  message: string
): Promise<'whatsapp' | 'shared' | 'cancelled'> => {
  const encoded = encodeURIComponent(message);
  const waUrl = MERCHANT_PAYMENT_CONFIG.whatsappNumber
    ? `https://wa.me/${MERCHANT_PAYMENT_CONFIG.whatsappNumber}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(waUrl);
    if (canOpen) {
      await Linking.openURL(waUrl);
      return 'whatsapp';
    }
  } catch {
    // Continua al fallback nativo Share.share si WhatsApp o el esquema https no esta disponible.
  }

  const result = await Share.share({
    message,
    title: 'Resumen de pedido · Mundo Mascotas',
  });
  return result.action === Share.sharedAction ? 'shared' : 'cancelled';
};
