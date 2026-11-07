import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import {
  useAuth,
  AddressLabelType,
  CustomerAddress,
} from '../context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddressSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LABEL_OPTIONS: {
  id: AddressLabelType;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
}[] = [
  { id: 'Casa', icon: 'home-outline', emoji: '🏠' },
  { id: 'Oficina', icon: 'business-outline', emoji: '🏢' },
  { id: 'Finca', icon: 'leaf-outline', emoji: '🏡' },
  { id: 'Familiar', icon: 'heart-outline', emoji: '❤️' },
];

const QUICK_OUTSIDE_CITIES = [
  { city: 'Chía', province: 'Cundinamarca' },
  { city: 'Cajicá', province: 'Cundinamarca' },
  { city: 'La Calera', province: 'Cundinamarca' },
  { city: 'Cota', province: 'Cundinamarca' },
  { city: 'Medellín', province: 'Antioquia' },
  { city: 'Cali', province: 'Valle del Cauca' },
];

export const AddressSelectorSheet: React.FC<AddressSelectorSheetProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    addresses,
    selectedAddress,
    selectAddress,
    addAddress,
    deleteAddress,
  } = useAuth();

  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRevealAnim = useRef(new Animated.Value(0)).current;

  // Animación que nace desde la parte superior (donde está la dirección)
  const translateY = useRef(new Animated.Value(-SCREEN_HEIGHT * 0.75)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Estados del formulario de nueva dirección
  const [label, setLabel] = useState<AddressLabelType>('Casa');
  const [isBogota, setIsBogota] = useState<boolean>(true);
  const [cityInput, setCityInput] = useState<string>('Chía');
  const [provinceInput, setProvinceInput] = useState<string>('Cundinamarca');
  const [address1Input, setAddress1Input] = useState<string>('');
  const [address2Input, setAddress2Input] = useState<string>('');
  const [localityInput, setLocalityInput] = useState<string>('');
  const [recipientInput, setRecipientInput] = useState<string>(
    user?.name || 'Alejandra P.'
  );
  const [phoneInput, setPhoneInput] = useState<string>(
    user?.phone || '+57 300 3918279'
  );
  const [formError, setFormError] = useState<string>('');

  // Disparar transición desde arriba al abrir
  useEffect(() => {
    if (visible) {
      setIsExpanded(false);
      translateY.setValue(-SCREEN_HEIGHT * 0.7);
      scaleAnim.setValue(0.95);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 230,
          mass: 0.85,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, scaleAnim, backdropOpacity]);

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -SCREEN_HEIGHT * 0.75,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode('list');
      setFormError('');
      setConfirmDeleteId(null);
      setIsExpanded(false);
      onClose();
    });
  };

  const handlePromptDelete = (addrId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (confirmDeleteId === addrId) {
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(addrId);
    confirmRevealAnim.setValue(0);
    Animated.spring(confirmRevealAnim, {
      toValue: 1,
      damping: 18,
      stiffness: 240,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmDelete = (addrId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmDeleteId(null);
    deleteAddress(addrId);
  };

  // Gesto en la barra inferior del panel superior:
  // - Deslizar hacia ARRIBA (dy < -65) -> Recoge la ventana hacia arriba y la cierra
  // - Deslizar hacia ABAJO (dy > 55) -> Expande la ventana hacia abajo
  const bottomGrabberPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        setIsDragging(true);
        Haptics.selectionAsync();
      },
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) {
          // Arrastrando hacia arriba para recoger
          translateY.setValue(g.dy);
        } else {
          // Arrastrando hacia abajo con resistencia elástica
          translateY.setValue(g.dy * 0.22);
        }
      },
      onPanResponderRelease: (_, g) => {
        setIsDragging(false);

        if (g.dy < -65 || g.vy < -0.75) {
          // Cerrar recogiendo hacia arriba
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateClose();
          return;
        }

        if (g.dy > 50 || g.vy > 0.6) {
          // Expandir hacia abajo
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsExpanded(true);
        }

        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 240,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleSelectAddress = (addr: CustomerAddress) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    selectAddress(addr.id);
    setTimeout(() => {
      animateClose();
    }, 140);
  };

  const handleSaveNewAddress = () => {
    if (!address1Input.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Por favor ingresa la dirección principal (Ej. Calle 127 # 15-40)');
      return;
    }
    if (!isBogota && !cityInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Por favor indica el municipio o ciudad de entrega');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalCity = isBogota ? 'Bogotá' : cityInput.trim();
    const finalProvince = isBogota ? 'Bogotá D.C.' : provinceInput.trim() || 'Colombia';

    addAddress({
      label,
      recipient: recipientInput.trim() || user?.name || 'Cliente VIP',
      address1: address1Input.trim(),
      address2: address2Input.trim() || undefined,
      locality:
        localityInput.trim() ||
        (isBogota ? 'Bogotá D.C.' : finalCity),
      city: finalCity,
      province: finalProvince,
      country: 'Colombia',
      phone: phoneInput.trim() || '+57 300 0000000',
      isBogota,
      verifiedCoverage: true,
      deliveryZone: isBogota
        ? `${localityInput.trim() || 'Zona Urbana'} (Bogotá)`
        : 'Despacho por Transportadora Nacional',
    });

    setAddress1Input('');
    setAddress2Input('');
    setLocalityInput('');
    setFormError('');
    animateClose();
  };

  const getLabelEmoji = (lbl: AddressLabelType) => {
    const found = LABEL_OPTIONS.find((item) => item.id === lbl);
    return found ? found.emoji : '📍';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
    >
      <View style={styles.backdropContainer}>
        {/* Fondo oscuro con fade sincronizado */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdropOverlay,
            { opacity: backdropOpacity },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={animateClose} />
        </Animated.View>

        {/* Ventana desplegable desde ARRIBA (donde está la dirección en la esquina) */}
        <Animated.View
          style={[
            styles.topDropdownSheet,
            (isExpanded || mode === 'add') && styles.topDropdownSheetExpanded,
            {
              paddingTop: Math.max(insets.top, 12) + 6,
              transform: [{ translateY }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0A0B0F', '#11141E', '#0D0F17']}
            style={StyleSheet.absoluteFill}
          />

          {/* ==================== CABECERA ALINEADA CON LA ESQUINA SUPERIOR ==================== */}
          <View style={styles.sheetTopHeader}>
            <View style={styles.headerRow}>
              {mode === 'add' ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFormError('');
                    setMode('list');
                  }}
                  style={styles.backIconBtn}
                  hitSlop={10}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </Pressable>
              ) : (
                <View style={styles.headerLocationIconBox}>
                  <Ionicons
                    name="location"
                    size={18}
                    color={colors.primary.light}
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>
                  {mode === 'list'
                    ? 'Mis direcciones de entrega'
                    : 'Agregar nueva dirección'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {mode === 'list'
                    ? 'Toca una dirección para actualizar tu cobertura'
                    : 'Guarda tu casa, oficina o finca para futuros pedidos'}
                </Text>
              </View>

              <Pressable
                onPress={animateClose}
                style={styles.closeIconBtn}
                hitSlop={10}
              >
                <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={{
                maxHeight:
                  isExpanded || mode === 'add'
                    ? SCREEN_HEIGHT * 0.72
                    : SCREEN_HEIGHT * 0.58,
              }}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ==================== VISTA 1: LISTA DE DIRECCIONES GUARDADAS ==================== */}
              {mode === 'list' && (
                <>
                  {/* 1. Botón para agregar otra dirección DE PRIMERAS */}
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setRecipientInput(user?.name || 'Alejandra P.');
                      setPhoneInput(user?.phone || '+57 300 3918279');
                      setMode('add');
                    }}
                    style={({ pressed }) => [
                      styles.addNewAddressButton,
                      { marginBottom: 14 },
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <View style={styles.addNewPlusCircle}>
                      <Ionicons name="add" size={20} color="#050508" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addNewAddressTitle}>
                        Agregar otra dirección de entrega
                      </Text>
                      <Text style={styles.addNewAddressSub}>
                        Registra tu oficina, apartamento, finca o casa de un familiar
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.primary.light}
                    />
                  </Pressable>

                  {/* 2. Tarjetas de direcciones guardadas del cliente */}
                  <View style={styles.addressesList}>
                    {addresses.map((addr) => {
                      const isSelected = addr.id === selectedAddress.id;
                      const isConfirmingDelete = confirmDeleteId === addr.id;
                      return (
                        <View
                          key={addr.id}
                          style={[
                            styles.addressCard,
                            isSelected && styles.addressCardSelected,
                            isConfirmingDelete && styles.addressCardDanger,
                          ]}
                        >
                          <View style={styles.addressMainRow}>
                            {/* Área seleccionable (Ícono + Info) */}
                            <Pressable
                              onPress={() => {
                                if (isConfirmingDelete) {
                                  setConfirmDeleteId(null);
                                  return;
                                }
                                handleSelectAddress(addr);
                              }}
                              style={({ pressed }) => [
                                styles.addressTouchableArea,
                                pressed && { opacity: 0.9 },
                              ]}
                            >
                              {/* Columna Izquierda: Ícono */}
                              <View
                                style={[
                                  styles.addressIconCircle,
                                  isSelected && styles.addressIconCircleSelected,
                                ]}
                              >
                                <Text style={styles.addressEmoji}>
                                  {getLabelEmoji(addr.label)}
                                </Text>
                              </View>

                              {/* Columna Central: Datos de la dirección */}
                              <View style={styles.addressInfoCol}>
                                <View style={styles.addressLabelRow}>
                                  <Text style={styles.addressLabelTitle}>
                                    {addr.label}
                                  </Text>
                                  <Text style={styles.addressCityTag}>
                                    · {addr.city}
                                  </Text>
                                  {isSelected && (
                                    <View style={styles.activeNowPill}>
                                      <Text style={styles.activeNowPillText}>
                                        Activa
                                      </Text>
                                    </View>
                                  )}
                                </View>

                                <Text style={styles.addressLine1}>
                                  {addr.address1}
                                </Text>

                                {addr.address2 ? (
                                  <Text style={styles.addressLine2}>
                                    {addr.address2}
                                  </Text>
                                ) : null}

                                <Text style={styles.addressMetaText}>
                                  {addr.locality ? `${addr.locality} · ` : ''}
                                  Recibe: {addr.recipient}
                                </Text>

                                {/* Badge de Envío según la ciudad de esta dirección */}
                                <View style={styles.shippingTagRow}>
                                  {addr.isBogota ? (
                                    <View style={styles.freeBogotaTag}>
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={13}
                                        color="#10B981"
                                      />
                                      <Text style={styles.freeBogotaTagText}>
                                        Domicilio GRATIS ($ 0) · Contraentrega
                                      </Text>
                                    </View>
                                  ) : (
                                    <View style={styles.carrierFeeTag}>
                                      <Ionicons
                                        name="cube-outline"
                                        size={13}
                                        color="#F59E0B"
                                      />
                                      <Text style={styles.carrierFeeTagText}>
                                        + Recargo Transportadora (según LB)
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </Pressable>

                            {/* Columna Derecha: Radio check + botón eliminar */}
                            <View style={styles.addressRightActions}>
                              <Pressable
                                onPress={() => handleSelectAddress(addr)}
                                hitSlop={8}
                                style={[
                                  styles.radioOuter,
                                  isSelected && styles.radioOuterSelected,
                                ]}
                              >
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={14}
                                    color="#050508"
                                  />
                                )}
                              </Pressable>

                              {addresses.length > 1 && !isSelected && (
                                <Pressable
                                  onPress={() => handlePromptDelete(addr.id)}
                                  style={[
                                    styles.deleteAddrBtn,
                                    isConfirmingDelete &&
                                      styles.deleteAddrBtnActive,
                                  ]}
                                  hitSlop={10}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color={
                                      isConfirmingDelete ? '#F87171' : '#6B7280'
                                    }
                                  />
                                </Pressable>
                              )}
                            </View>
                          </View>

                          {/* Mensaje emergente interno de confirmación para eliminar */}
                          {isConfirmingDelete && (
                            <Animated.View
                              style={[
                                styles.inlineDeleteConfirmBox,
                                {
                                  opacity: confirmRevealAnim,
                                  transform: [
                                    {
                                      translateY: confirmRevealAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-8, 0],
                                      }),
                                    },
                                    {
                                      scale: confirmRevealAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.96, 1],
                                      }),
                                    },
                                  ],
                                },
                              ]}
                            >
                              <View style={styles.inlineDeleteHeaderRow}>
                                <Ionicons
                                  name="warning"
                                  size={16}
                                  color="#F87171"
                                />
                                <Text style={styles.inlineDeleteTitle}>
                                  ¿Seguro que deseas eliminar la dirección{' '}
                                  <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>
                                    "{addr.label}"
                                  </Text>
                                  ?
                                </Text>
                              </View>

                              <View style={styles.inlineDeleteActionsRow}>
                                <Pressable
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    setConfirmDeleteId(null);
                                  }}
                                  style={styles.cancelDeleteBtn}
                                >
                                  <Text style={styles.cancelDeleteBtnText}>
                                    No, conservar
                                  </Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => handleConfirmDelete(addr.id)}
                                  style={styles.confirmDeleteBtn}
                                >
                                  <Ionicons
                                    name="trash"
                                    size={14}
                                    color="#FFFFFF"
                                  />
                                  <Text style={styles.confirmDeleteBtnText}>
                                    Sí, eliminar
                                  </Text>
                                </Pressable>
                              </View>
                            </Animated.View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* ==================== VISTA 2: FORMULARIO NUEVA DIRECCIÓN ==================== */}
              {mode === 'add' && (
                <View style={styles.formContainer}>
                  {formError ? (
                    <View style={styles.errorAlert}>
                      <Ionicons
                        name="alert-circle"
                        size={18}
                        color="#F87171"
                      />
                      <Text style={styles.errorAlertText}>{formError}</Text>
                    </View>
                  ) : null}

                  {/* 1. Etiqueta de la dirección */}
                  <Text style={styles.fieldLabel}>
                    1. ¿Qué tipo de lugar es?
                  </Text>
                  <View style={styles.labelPillsRow}>
                    {LABEL_OPTIONS.map((item) => {
                      const active = label === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setLabel(item.id);
                          }}
                          style={[
                            styles.labelOptionPill,
                            active && styles.labelOptionPillActive,
                          ]}
                        >
                          <Text style={styles.labelOptionEmoji}>
                            {item.emoji}
                          </Text>
                          <Text
                            style={[
                              styles.labelOptionText,
                              active && styles.labelOptionTextActive,
                            ]}
                          >
                            {item.id}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* 2. Cobertura / Ciudad */}
                  <Text style={styles.fieldLabel}>
                    2. Ciudad o municipio de entrega
                  </Text>
                  <View style={styles.zoneSelectorRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setIsBogota(true);
                      }}
                      style={[
                        styles.zoneChoiceCard,
                        isBogota && styles.zoneChoiceCardBogotaActive,
                      ]}
                    >
                      <Text style={styles.zoneChoiceTitle}>
                        📍 Bogotá D.C.
                      </Text>
                      <Text style={styles.zoneChoiceSubFree}>
                        Domicilio GRATIS ($ 0)
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setIsBogota(false);
                      }}
                      style={[
                        styles.zoneChoiceCard,
                        !isBogota && styles.zoneChoiceCardNacionalActive,
                      ]}
                    >
                      <Text style={styles.zoneChoiceTitle}>
                        🚚 Otra Ciudad / Municipio
                      </Text>
                      <Text style={styles.zoneChoiceSubCarrier}>
                        + Flete Transportadora
                      </Text>
                    </Pressable>
                  </View>

                  {!isBogota && (
                    <View style={styles.outsideCitySection}>
                      <Text style={styles.quickCitiesLabel}>
                        Municipios frecuentes o escribe tu ciudad:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickCitiesScroll}
                      >
                        {QUICK_OUTSIDE_CITIES.map((c) => {
                          const selected =
                            cityInput.toLowerCase() === c.city.toLowerCase();
                          return (
                            <Pressable
                              key={c.city}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setCityInput(c.city);
                                setProvinceInput(c.province);
                              }}
                              style={[
                                styles.cityChip,
                                selected && styles.cityChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.cityChipText,
                                  selected && styles.cityChipTextActive,
                                ]}
                              >
                                {c.city}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>

                      <View style={styles.twoColInputs}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniInputLabel}>
                            Ciudad / Municipio
                          </Text>
                          <TextInput
                            style={styles.textInputField}
                            value={cityInput}
                            onChangeText={setCityInput}
                            placeholder="Ej. Chía, Medellín"
                            placeholderTextColor="#6B7280"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniInputLabel}>
                            Departamento
                          </Text>
                          <TextInput
                            style={styles.textInputField}
                            value={provinceInput}
                            onChangeText={setProvinceInput}
                            placeholder="Ej. Cundinamarca"
                            placeholderTextColor="#6B7280"
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* 3. Dirección Exacta */}
                  <Text style={styles.fieldLabel}>3. Dirección exacta</Text>
                  <TextInput
                    style={styles.textInputField}
                    value={address1Input}
                    onChangeText={(t) => {
                      setAddress1Input(t);
                      if (formError) setFormError('');
                    }}
                    placeholder={
                      isBogota
                        ? 'Ej. Carrera 72 j # 38-36 sur o Calle 93 # 14-20'
                        : 'Ej. Km 4 Vía Chía - Cajicá Condominio San Jacinto'
                    }
                    placeholderTextColor="#6B7280"
                  />

                  {/* 4. Indicaciones de entrega */}
                  <Text style={styles.fieldLabel}>
                    4. Apto / Casa / Indicaciones para entregar el bulto
                  </Text>
                  <TextInput
                    style={styles.textInputField}
                    value={address2Input}
                    onChangeText={setAddress2Input}
                    placeholder="Ej. Casa timbrar en el 4 piso / Dejar en portería"
                    placeholderTextColor="#6B7280"
                  />

                  {/* 5. Barrio / Localidad y Quién recibe */}
                  <View style={styles.twoColInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Barrio / Localidad</Text>
                      <TextInput
                        style={styles.textInputField}
                        value={localityInput}
                        onChangeText={setLocalityInput}
                        placeholder={
                          isBogota ? 'Ej. Kennedy, Chapinero' : 'Ej. Sabana'
                        }
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Quién recibe</Text>
                      <TextInput
                        style={styles.textInputField}
                        value={recipientInput}
                        onChangeText={setRecipientInput}
                        placeholder="Ej. Alejandra P."
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleSaveNewAddress}
                    style={({ pressed }) => [
                      styles.saveGoldBtn,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#050508"
                    />
                    <Text style={styles.saveGoldBtnText}>
                      Guardar y entregar en esta dirección
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* ==================== BARRA INFERIOR DESLIZABLE (GRABBER) ==================== */}
          <View
            style={styles.bottomGrabberFooter}
            {...bottomGrabberPanResponder.panHandlers}
          >
            <View
              style={[
                styles.grabberPill,
                isDragging && styles.grabberPillActive,
              ]}
            />
            <Text style={styles.grabberHintText}>
              Desliza hacia arriba para cerrar
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdropOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  topDropdownSheet: {
    maxHeight: '78%',
    backgroundColor: '#0A0B0F',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 16,
  },
  topDropdownSheetExpanded: {
    maxHeight: '92%',
  },
  sheetTopHeader: {
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLocationIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 1,
  },
  closeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  bottomGrabberFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#0D0F16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  grabberPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  grabberPillActive: {
    width: 58,
    backgroundColor: colors.primary.DEFAULT,
  },
  grabberHintText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },

  /* Banner reglas de envío */
  logisticsRuleBanner: {
    backgroundColor: '#141720',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  logisticsRuleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  ruleBadgeBogota: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  ruleBadgeBogotaText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  ruleBadgeNacional: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  ruleBadgeNacionalText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Tarjetas de direcciones */
  addressesList: {
    gap: 10,
    marginBottom: 14,
  },
  addressCard: {
    backgroundColor: '#151821',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  addressCardSelected: {
    backgroundColor: '#191D28',
    borderColor: colors.primary.DEFAULT,
  },
  addressCardDanger: {
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: '#1A151B',
  },
  addressMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressTouchableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#222632',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressIconCircleSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  addressEmoji: {
    fontSize: 19,
  },
  addressInfoCol: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addressLabelTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  addressCityTag: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  activeNowPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  activeNowPillText: {
    color: colors.primary.light,
    fontSize: 10,
    fontWeight: '800',
  },
  addressLine1: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
  },
  addressLine2: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 2,
  },
  addressMetaText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 3,
  },
  shippingTagRow: {
    marginTop: 7,
    flexDirection: 'row',
  },
  freeBogotaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBogotaTagText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  carrierFeeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  carrierFeeTagText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  addressRightActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  deleteAddrBtn: {
    padding: 6,
    borderRadius: 10,
  },
  deleteAddrBtnActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
  },
  inlineDeleteConfirmBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(248, 113, 113, 0.22)',
    gap: 10,
  },
  inlineDeleteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  inlineDeleteTitle: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inlineDeleteActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelDeleteBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cancelDeleteBtnText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#EF4444',
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Botón agregar nueva dirección */
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  addNewPlusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewAddressTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  addNewAddressSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },

  /* Formulario Agregar Dirección */
  formContainer: {
    gap: 6,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorAlertText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fieldLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 5,
  },
  labelPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  labelOptionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161922',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelOptionPillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: colors.primary.DEFAULT,
  },
  labelOptionEmoji: {
    fontSize: 15,
  },
  labelOptionText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  labelOptionTextActive: {
    color: '#FFFFFF',
  },
  zoneSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  zoneChoiceCard: {
    flex: 1,
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  zoneChoiceCardBogotaActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  zoneChoiceCardNacionalActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  zoneChoiceTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  zoneChoiceSubFree: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  zoneChoiceSubCarrier: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  outsideCitySection: {
    backgroundColor: '#141720',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickCitiesLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickCitiesScroll: {
    gap: 8,
    marginBottom: 10,
  },
  cityChip: {
    backgroundColor: '#1E2230',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cityChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  cityChipText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  cityChipTextActive: {
    color: '#050508',
  },
  twoColInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  miniInputLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInputField: {
    backgroundColor: '#161922',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveGoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  saveGoldBtnText: {
    color: '#050508',
    fontSize: 15,
    fontWeight: '900',
  },
});
