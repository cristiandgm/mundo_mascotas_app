import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { UserAvatar } from './ui/UserAvatar';
import {
  useAuth,
  DEFAULT_VIP_CUSTOMER,
} from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

interface CustomerProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onManageAddresses?: () => void;
  onOpenOrders?: () => void;
  onOpenWallet?: () => void;
}

export const CustomerProfileSheet: React.FC<CustomerProfileSheetProps> = ({
  visible,
  onClose,
  onManageAddresses,
  onOpenOrders,
  onOpenWallet,
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

  const handleSavePet = () => {
    if (petNameInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updatePetInfo(petNameInput.trim(), profileData.petType || 'dog');
    }
    setEditingPet(false);
  };

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
              <Text style={styles.uberMainHeaderTitle}>Cuenta</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={animateClose}
                style={styles.closeBtn}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
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
            {/* Cabecera de Identidad estilo Uber Account + Mundo Mascotas Gold */}
            <View style={styles.uberIdentitySection}>
              <View style={styles.uberIdentityLeft}>
                <Text style={styles.customerName}>{profileData.name}</Text>
                <View style={styles.groupPillRow}>
                  <View style={styles.groupPill}>
                    <Ionicons name="star" size={11} color={colors.primary.DEFAULT} />
                    <Text style={styles.groupPillText}>
                      {profileData.customerGroup || 'Champions VIP'}
                    </Text>
                  </View>
                  <Text style={styles.memberSinceText}>
                    · {profileData.customerSince || 'Más de 1 año'}
                  </Text>
                </View>
                <Text style={styles.customerEmailText}>{profileData.email}</Text>
              </View>

              <UserAvatar
                name={profileData.name}
                avatarUrl={profileData.avatarUrl}
                size={62}
              />
            </View>

            {/* 3 Azulejos de Acceso Rápido estilo Uber ("Pedidos", "Entregas", "Coins") */}
            <View style={styles.uberQuickTilesRow}>
              <Pressable
                onPress={() => {
                  if (onOpenOrders) {
                    Haptics.selectionAsync();
                    onOpenOrders();
                  }
                }}
                style={({ pressed }) => [
                  styles.uberQuickTile,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="receipt-outline" size={22} color="#FFFFFF" />
                <Text style={styles.uberQuickTileTitle}>Pedidos</Text>
                <Text style={styles.uberQuickTileSub}>
                  {profileData.ordersCount ?? 23} realizados
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (onManageAddresses) {
                    Haptics.selectionAsync();
                    onManageAddresses();
                  }
                }}
                style={({ pressed }) => [
                  styles.uberQuickTile,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="location-outline" size={22} color="#FFFFFF" />
                <Text style={styles.uberQuickTileTitle}>Direcciones</Text>
                <Text style={styles.uberQuickTileSub}>
                  {addresses.length} guardadas
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (onOpenWallet) {
                    Haptics.selectionAsync();
                    onOpenWallet();
                  }
                }}
                style={({ pressed }) => [
                  styles.uberQuickTileGold,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="wallet-outline" size={22} color={colors.primary.light} />
                <Text style={styles.uberQuickTileTitle}>
                  {profileData.points} Coins
                </Text>
                <Text style={styles.uberQuickTileSubGold}>
                  Ver Billetera ›
                </Text>
              </Pressable>
            </View>

            {/* SECCIÓN: CONTACTO Y DIRECCIÓN DE ENTREGA */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Entrega y contacto</Text>

              {/* Dirección activa */}
              <View style={styles.infoBlock}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.infoTextCol}>
                  <View style={styles.addressHeaderRow}>
                    <Text style={styles.infoBlockPrimary}>
                      {selectedAddress.label} · {selectedAddress.city}
                    </Text>
                    <View style={styles.coveragePill}>
                      <View style={styles.coverageDot} />
                      <Text style={styles.coveragePillText}>
                        {selectedAddress.isBogota
                          ? 'Domicilio Gratis'
                          : 'Transportadora'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.infoBlockSecondary}>
                    {selectedAddress.address1}
                    {selectedAddress.address2 ? ` · ${selectedAddress.address2}` : ''}
                  </Text>
                  <Text style={styles.infoBlockMuted}>
                    Recibe: {selectedAddress.recipient || 'Alejandra P.'}
                  </Text>

                  {onManageAddresses && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        onManageAddresses();
                      }}
                      style={styles.uberActionPillBtn}
                    >
                      <Text style={styles.uberActionPillText}>
                        Cambiar dirección ({addresses.length})
                      </Text>
                      <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.blockSeparator} />

              {/* Contacto */}
              <View style={styles.infoBlock}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoBlockPrimary}>
                    {profileData.phone || '+57 300 3918279'}
                  </Text>
                  <Text style={styles.infoBlockSecondary}>
                    {profileData.email}
                  </Text>
                  <Text style={styles.infoBlockMuted}>
                    Alertas vía:{' '}
                    {(profileData.marketingSubscriptions || ['Correo electrónico', 'SMS']).join(', ')}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN: PREFERENCIAS DE FACTURACIÓN Y MASCOTA */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Facturación y mascota</Text>
                <Text style={styles.sectionSubtitleBadge}>Verificado</Text>
              </View>

              {/* Requiere Factura */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>Factura electrónica</Text>
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

              {/* Documento */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>Documento registrado</Text>
                <View style={styles.billingValuePill}>
                  <Text style={styles.billingValueText}>
                    CC · {profileData.billingInfo?.documentNumber || '1030631037'}
                  </Text>
                </View>
              </View>

              {/* Especie */}
              <View style={styles.billingFieldRow}>
                <Text style={styles.billingFieldLabel}>Especie principal</Text>
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

              {/* Nombre de mascota */}
              <View style={[styles.billingFieldRow, { borderBottomWidth: 0, paddingBottom: 2 }]}>
                <Text style={styles.billingFieldLabel}>Nombre de mascota</Text>
                {editingPet ? (
                  <View style={styles.petEditRow}>
                    <TextInput
                      value={petNameInput}
                      onChangeText={setPetNameInput}
                      placeholder="Nombre"
                      placeholderTextColor="#6B7280"
                      style={styles.petEditInput}
                      autoFocus
                    />
                    <Pressable onPress={handleSavePet} style={styles.petSaveBtn}>
                      <Ionicons name="checkmark" size={16} color="#0A0B0E" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setPetNameInput(profileData.petName || '');
                      setEditingPet(true);
                    }}
                    style={styles.uberActionPillBtn}
                  >
                    <Text style={styles.uberActionPillText}>
                      {profileData.petName
                        ? `${profileData.petName} · Editar`
                        : '+ Agregar'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Botón Cerrar Sesión estilo Uber */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
                logout();
              }}
              style={({ pressed }) => [
                styles.logoutRowBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
              <Text style={styles.logoutRowText}>Cerrar sesión</Text>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
  },
  uberIdentitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  uberIdentityLeft: {
    flex: 1,
    gap: 5,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  groupPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#181B22',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  groupPillText: {
    color: colors.primary.light,
    fontSize: 11.5,
    fontWeight: '700',
  },
  memberSinceText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  customerEmailText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  uberQuickTilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uberQuickTile: {
    flex: 1,
    backgroundColor: '#12151C',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  uberQuickTileGold: {
    flex: 1,
    backgroundColor: '#12151C',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    gap: 4,
  },
  uberQuickTileTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 4,
  },
  uberQuickTileSub: {
    color: '#9CA3AF',
    fontSize: 11.5,
  },
  uberQuickTileSubGold: {
    color: colors.primary.light,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#12151C',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionSubtitleBadge: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1C202B',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 2,
  },
  infoBlockPrimary: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  infoBlockSecondary: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  infoBlockMuted: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  coveragePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1C202B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  coverageDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary.DEFAULT,
  },
  coveragePillText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  uberActionPillBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E222D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  uberActionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  blockSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
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
    color: '#9CA3AF',
    fontSize: 13.5,
    flex: 1,
  },
  booleanToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#0A0B0E',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  booleanPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  booleanPillActive: {
    backgroundColor: '#FFFFFF',
  },
  booleanPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  booleanPillTextActive: {
    color: '#0A0B0E',
    fontWeight: '700',
  },
  billingValuePill: {
    backgroundColor: '#1C202B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  billingValueText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  petEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petEditInput: {
    backgroundColor: '#0A0B0E',
    color: '#FFFFFF',
    fontSize: 12.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 120,
  },
  petSaveBtn: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#12151C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  logoutRowText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '700',
  },
});
