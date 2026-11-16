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
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import {
  ColombianLocation,
  COLOMBIAN_LOCATIONS,
  POPULAR_LOCATIONS,
  DEFAULT_COLOMBIAN_LOCATION,
  searchColombianLocations,
  findClosestColombianLocation,
} from '../data/colombiaLocations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CitySelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedCity: ColombianLocation | null;
  onSelectCity: (city: ColombianLocation) => void;
}

type FilterTab = 'all' | 'principal' | 'municipio';

export const CitySelectorSheet: React.FC<CitySelectorSheetProps> = ({
  visible,
  onClose,
  selectedCity,
  onSelectCity,
}) => {
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [tempSelectedCity, setTempSelectedCity] = useState<ColombianLocation | null>(selectedCity);

  // Animations
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setTempSelectedCity(selectedCity);
      setSearchQuery('');
      setActiveTab('all');

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, selectedCity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const formatCleanLocationDisplay = (city: ColombianLocation | null): string => {
    if (!city) {
      return 'Selecciona tu ciudad';
    }
    if (city.isBogota || city.name.toLowerCase().includes('bogotá')) {
      return 'Bogotá D.C.';
    }
    const cleanDept = city.department.replace(/\s*\([^)]*\)/g, '').trim();
    if (!cleanDept || cleanDept.toLowerCase() === city.name.toLowerCase()) {
      return city.name;
    }
    return `${city.name}, ${cleanDept}`;
  };

  const handleDetectLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsDetectingLocation(false);
        setLocationError('Permiso GPS no concedido. Elige tu ciudad en la lista.');
        setTimeout(() => setLocationError(null), 4000);
        return;
      }

      const posPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('GPS Timeout')), 6000)
      );
      const pos = await Promise.race([posPromise, timeoutPromise]);

      const geocoded = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const geo = geocoded && geocoded.length > 0 ? geocoded[0] : null;
      const candidateName =
        geo?.city || geo?.subregion || geo?.district || geo?.region || '';

      const matchedLoc = findClosestColombianLocation(
        pos.coords.latitude,
        pos.coords.longitude,
        candidateName
      );

      if (matchedLoc) {
        setTempSelectedCity(matchedLoc);
        handleConfirm(matchedLoc);
      } else if (candidateName) {
        handleCreateCustomLocation(candidateName);
      } else {
        const def = DEFAULT_COLOMBIAN_LOCATION;
        setTempSelectedCity(def);
        handleConfirm(def);
      }
    } catch (err) {
      console.warn('[Location] GPS detection fallback:', err);
      setLocationError('No se pudo detectar con GPS. Elige tu ciudad en la lista.');
      setTimeout(() => setLocationError(null), 4000);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleConfirm = (cityToConfirm?: ColombianLocation | null) => {
    const finalCity = cityToConfirm || tempSelectedCity || DEFAULT_COLOMBIAN_LOCATION;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectCity(finalCity);
    handleClose();
  };

  const filteredLocations = useMemo(() => {
    return searchColombianLocations(searchQuery, activeTab);
  }, [searchQuery, activeTab]);

  const handleCreateCustomLocation = (customName: string) => {
    const customLoc: ColombianLocation = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      department: 'Colombia (Municipio / Vereda)',
      region: 'Nacional',
      type: 'municipio',
      isBogota: false,
      deliveryBadge: '📦 Envío Nacional Asegurado',
      deliveryEstimate: '2 a 4 días hábiles',
      shippingCostDescription: 'Flete transportadora nacional',
      popular: false,
    };
    handleConfirm(customLoc);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* BACKDROP */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.75],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* SHEET CONTAINER (ANCHORED TO BOTTOM, FULL STABLE HEIGHT) */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.06 : 0}
            style={styles.keyboardInner}
          >
            {/* DRAG HANDLE */}
            <View style={styles.handleContainer}>
              <View style={styles.dragHandle} />
            </View>

          {/* HEADER ROW */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <View style={styles.headerBadgeRow}>
                <Ionicons name="location-sharp" size={14} color={colors.primary.DEFAULT} />
                <Text style={styles.headerPreTitle}>COBERTURA & ENTREGAS</Text>
              </View>
              <Text style={styles.headerTitle}>¿Dónde quieres recibir tu pedido?</Text>
              <View style={styles.trustMiniRow}>
                <Ionicons name="flash" size={12} color="#F5D061" />
                <Text style={styles.trustMiniText}>
                  <Text style={{ fontWeight: '800', color: colors.primary.light }}>Bogotá:</Text> Domicilio Gratis hoy · <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>Resto del país:</Text> Envíos gratis
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* COMBINED SEARCH & GPS ACTION ROW */}
          <View style={styles.searchAndGpsRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={17} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar ciudad o municipio..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleDetectLocation}
              disabled={isDetectingLocation}
              style={({ pressed }) => [
                styles.gpsSideBtn,
                pressed && styles.gpsSideBtnPressed,
                isDetectingLocation && styles.gpsSideBtnLoading,
              ]}
              hitSlop={4}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color="#050508" />
              ) : (
                <Ionicons name="navigate" size={14} color="#050508" />
              )}
              <Text style={styles.gpsSideBtnText}>
                {isDetectingLocation ? '...' : 'Mi GPS'}
              </Text>
            </Pressable>
          </View>

          {/* MENSAJE DE ESTADO GPS SI APLICA */}
          {locationError && (
            <View style={styles.gpsErrorBanner}>
              <Ionicons name="information-circle" size={14} color="#FBBF24" />
              <Text style={styles.gpsErrorText}>{locationError}</Text>
            </View>
          )}

          {/* FILTER TABS (CRO DISCOVERY) */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('all');
              }}
              style={[styles.tabPill, activeTab === 'all' && styles.tabPillActive]}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                🇨🇴 Todas
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('principal');
              }}
              style={[styles.tabPill, activeTab === 'principal' && styles.tabPillActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'principal' && styles.tabTextActive,
                ]}
              >
                🌟 Principales
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('municipio');
              }}
              style={[styles.tabPill, activeTab === 'municipio' && styles.tabPillActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'municipio' && styles.tabTextActive,
                ]}
              >
                🏡 Municipios & Sabana
              </Text>
            </Pressable>
          </View>

          {/* QUICK 1-TAP TOP DESTINATIONS (CHIPS) */}
          {searchQuery.length === 0 && (
            <View style={styles.quickAccessSection}>
              <Text style={styles.quickAccessLabel}>ACCESO RÁPIDO</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsContent}
              >
                {POPULAR_LOCATIONS.map((loc) => {
                  const isSelected = tempSelectedCity ? tempSelectedCity.id === loc.id : false;
                  const isBogotaLoc = loc.isBogota;
                  return (
                    <Pressable
                      key={loc.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setTempSelectedCity(loc);
                        handleConfirm(loc);
                      }}
                      style={[
                        styles.quickChip,
                        isSelected && styles.quickChipActive,
                        isBogotaLoc && styles.quickChipBogota,
                      ]}
                    >
                      {isBogotaLoc ? (
                        <Ionicons name="sparkles" size={13} color="#F5D061" />
                      ) : (
                        <Ionicons
                          name="location-outline"
                          size={13}
                          color={isSelected ? '#FFFFFF' : '#9CA3AF'}
                        />
                      )}
                      <Text
                        style={[
                          styles.quickChipText,
                          isSelected && styles.quickChipTextActive,
                          isBogotaLoc && styles.quickChipTextBogota,
                        ]}
                      >
                        {loc.id === 'chia' ? 'Chía (Sabana)' : loc.name}
                      </Text>
                      {isBogotaLoc && (
                        <View style={styles.freeBadgePill}>
                          <Text style={styles.freeBadgePillText}>GRATIS</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* LIST OF LOCATIONS */}
          <ScrollView
            style={styles.locationsList}
            contentContainerStyle={styles.locationsListContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {filteredLocations.map((loc) => {
              const isSelected = tempSelectedCity ? tempSelectedCity.id === loc.id : false;
              const isBogotaLoc = loc.isBogota;

              return (
                <Pressable
                  key={loc.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTempSelectedCity(loc);
                    handleConfirm(loc);
                  }}
                  style={[
                    styles.locationCard,
                    isSelected && styles.locationCardSelected,
                  ]}
                >
                  {/* LEFT ICON */}
                  <View
                    style={[
                      styles.locationIconWrap,
                      isBogotaLoc && styles.locationIconWrapBogota,
                      isSelected && styles.locationIconWrapSelected,
                    ]}
                  >
                    <Ionicons
                      name={isBogotaLoc ? 'flash' : loc.type === 'principal' ? 'business' : 'home'}
                      size={18}
                      color={
                        isSelected
                          ? colors.primary.DEFAULT
                          : isBogotaLoc
                          ? '#F5D061'
                          : '#9CA3AF'
                      }
                    />
                  </View>

                  {/* CENTER INFO */}
                  <View style={styles.locationDetails}>
                    <View style={styles.cityNameRow}>
                      <Text
                        style={[
                          styles.cityName,
                          isSelected && styles.cityNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {loc.name}
                      </Text>
                      {isBogotaLoc && (
                        <View style={styles.bogotaSuperBadge}>
                          <Text style={styles.bogotaSuperBadgeText}>BOGOTÁ VIP</Text>
                        </View>
                      )}
                      {loc.type === 'municipio' && (
                        <View style={styles.municipioTag}>
                          <Text style={styles.municipioTagText}>Municipio</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.departmentText} numberOfLines={1}>
                      {loc.department} · {loc.region}
                    </Text>

                    {/* BENEFIT / LOGISTICS ROW */}
                    <View style={styles.perksRow}>
                      <View
                        style={[
                          styles.perkPill,
                          isBogotaLoc ? styles.perkPillGold : styles.perkPillBlue,
                        ]}
                      >
                        <Text
                          style={[
                            styles.perkPillText,
                            isBogotaLoc ? styles.perkPillTextGold : styles.perkPillTextBlue,
                          ]}
                        >
                          {loc.deliveryBadge}
                        </Text>
                      </View>
                      <Text style={styles.deliveryEstimateText}>
                        · {loc.deliveryEstimate}
                      </Text>
                    </View>
                  </View>

                  {/* RIGHT RADIO SELECTOR */}
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {/* FALLBACK IF NOT FOUND: CRO NO-DEAD-END CUSTOM ENTRY */}
            {filteredLocations.length === 0 && searchQuery.trim().length > 0 && (
              <View style={styles.customLocationFallback}>
                <View style={styles.fallbackIconWrap}>
                  <Ionicons name="map-outline" size={28} color={colors.primary.DEFAULT} />
                </View>
                <Text style={styles.fallbackTitle}>
                  ¿No encuentras "{searchQuery}" en la lista?
                </Text>
                <Text style={styles.fallbackSubtitle}>
                  Despachamos bultos y accesorios a cualquier rincón, vereda o municipio de
                  Colombia mediante transportadora nacional asegurada.
                </Text>

                <Pressable
                  onPress={() => handleCreateCustomLocation(searchQuery)}
                  style={styles.customLocationBtn}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#050508" />
                  <Text style={styles.customLocationBtnText}>
                    Seleccionar "{searchQuery}" para Envío Nacional
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* BOTTOM CONFIRMATION BUTTON */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.selectedCitySummary}>
              <Text style={styles.selectedCityLabel}>ENTREGAR EN:</Text>
              <Text style={styles.selectedCityName} numberOfLines={1}>
                {formatCleanLocationDisplay(tempSelectedCity)}
              </Text>
            </View>

            <Pressable
              onPress={() => handleConfirm()}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>
                {tempSelectedCity ? 'Confirmar Ubicación' : 'Elegir Ciudad'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#050508" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardInner: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    backgroundColor: '#0B0D13',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.93 : SCREEN_HEIGHT * 0.94,
    maxHeight: SCREEN_HEIGHT * 0.96,
    borderTopWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  headerTitles: {
    flex: 1,
    paddingRight: 8,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  headerPreTitle: {
    color: colors.primary.DEFAULT,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  trustMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  trustMiniText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E232E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAndGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    borderWidth: 1,
    borderColor: '#262C3A',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '500',
    padding: 0,
  },
  gpsSideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: 12,
  },
  gpsSideBtnPressed: {
    backgroundColor: colors.primary.light,
  },
  gpsSideBtnLoading: {
    opacity: 0.75,
  },
  gpsSideBtnText: {
    color: '#050508',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  gpsErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  gpsErrorText: {
    color: '#FBBF24',
    fontSize: 11,
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#262C3A',
  },
  tabPillActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#050508',
    fontWeight: '800',
  },
  quickAccessSection: {
    marginTop: 12,
  },
  quickAccessLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  quickChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161922',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262C3A',
  },
  quickChipActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: '#1C1F2B',
  },
  quickChipBogota: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: '#1A1813',
  },
  quickChipText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickChipTextBogota: {
    color: colors.primary.light,
    fontWeight: '700',
  },
  freeBadgePill: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  freeBadgePillText: {
    color: '#050508',
    fontSize: 9,
    fontWeight: '900',
  },
  locationsList: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  locationsListContent: {
    paddingBottom: 20,
    gap: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141720',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222836',
  },
  locationCardSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: '#1A1D27',
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C212E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIconWrapBogota: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  locationIconWrapSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  locationDetails: {
    flex: 1,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cityNameSelected: {
    color: colors.primary.light,
  },
  bogotaSuperBadge: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  bogotaSuperBadgeText: {
    color: '#050508',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  municipioTag: {
    backgroundColor: '#262D3D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  municipioTagText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '700',
  },
  departmentText: {
    color: '#8E95A5',
    fontSize: 12,
    marginTop: 2,
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  perkPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  perkPillGold: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  perkPillBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  perkPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  perkPillTextGold: {
    color: colors.primary.light,
  },
  perkPillTextBlue: {
    color: '#38BDF8',
  },
  deliveryEstimateText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  radioContainer: {
    paddingLeft: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.DEFAULT,
  },
  customLocationFallback: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#161922',
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#262C3A',
  },
  fallbackIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  fallbackSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  customLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  customLocationBtnText: {
    color: '#050508',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#1F2430',
    backgroundColor: '#0B0D13',
  },
  selectedCitySummary: {
    flex: 1,
    paddingRight: 10,
  },
  selectedCityLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectedCityName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: '#050508',
    fontSize: 13,
    fontWeight: '800',
  },
});
