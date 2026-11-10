import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { ModernInput } from './ui/ModernInput';
import { ModernButton } from './ui/ModernButton';
import { PetSelector } from './ui/PetSelector';
import { useAuth, PetCategory } from '../context/AuthContext';
import { useDraggableSheet } from '../utils/useDraggableSheet';

export const FloatingAuthModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isAuthModalOpen,
    authModalView,
    openAuthModal,
    closeAuthModal,
    login,
    loginWithSocial,
    loginAsDemoCustomer,
    register,
    isLoading,
  } = useAuth();

  // Estados de formulario Login / Registro / Recuperación
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [petType, setPetType] = useState<PetCategory | null>(null);
  const [petName, setPetName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleCloseAsGuest = () => {
    setErrorMessage('');
    closeAuthModal();
  };

  const {
    translateY,
    isExpanded,
    isDragging,
    headerPanHandlers,
    grabberPanHandlers,
    animateClose,
  } = useDraggableSheet({
    visible: isAuthModalOpen,
    onClose: handleCloseAsGuest,
  });

  const switchView = (view: 'login' | 'register' | 'forgot-password') => {
    Haptics.selectionAsync();
    setErrorMessage('');
    setResetSent(false);
    openAuthModal(view);
  };

  const handleContinueLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Ingresa tu número de teléfono o correo electrónico');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor escribe tu contraseña');
      return;
    }

    const normalizedInput = email.trim().includes('@')
      ? email.trim()
      : `${email.trim().replace(/\s+/g, '')}@mundomascotas.co`;

    const res = await login(normalizedInput, password);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleRegisterSubmit = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const res = await register(name, email, password, petType || undefined, petName);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleSendReset = () => {
    setErrorMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa tu correo electrónico registrado');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setResetSent(true);
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'whatsapp') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await loginWithSocial(provider);
  };

  return (
    <Modal
      visible={isAuthModalOpen}
      transparent
      animationType="fade"
      onRequestClose={animateClose}
    >
      <View style={styles.backdrop}>
        {/* Tocar el fondo superior también permite explorar como invitado */}
        <Pressable style={styles.backdropDismissArea} onPress={animateClose} />

        {/* Pestaña trasera apilada estilo Airbnb */}
        <Animated.View
          style={[
            styles.stackedBackCard,
            { transform: [{ translateY }] },
          ]}
        />

        {/* Hoja flotante principal deslizable */}
        <Animated.View
          style={[
            styles.sheetContainer,
            isExpanded && styles.sheetContainerExpanded,
            { transform: [{ translateY }] },
          ]}
        >
          <LinearGradient
            colors={['#0E1018', '#07080D', '#050508']}
            style={StyleSheet.absoluteFill}
          />

          {/* Barra superior con botón Atrás, Grabber central deslizable y botón X libre de colisiones */}
          <View style={styles.topNavigationRow}>
            {authModalView !== 'login' ? (
              <Pressable
                onPress={() => switchView('login')}
                style={styles.iconCircleBtn}
                hitSlop={12}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.iconPlaceholder} />
            )}

            {/* Zona táctil de la línea superior para arrastrar arriba y abajo */}
            <View style={styles.dragHandleHitZone} {...grabberPanHandlers}>
              <View
                style={[
                  styles.topDragPill,
                  isDragging && styles.topDragPillActive,
                ]}
              />
            </View>

            <Pressable
              onPress={animateClose}
              style={({ pressed }) => [
                styles.closeXButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
              ]}
              hitSlop={14}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 28 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Logo central estilo Airbnb (también permite arrastrar la ventana) */}
              <View style={styles.brandCenterSection} {...headerPanHandlers}>
                <View style={styles.logoCircleFrame}>
                  <Image
                    source={require('../../assets/logo.jpg')}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                </View>

                <Text style={styles.mainTitle}>
                  {authModalView === 'login' && 'Inicia sesión o regístrate'}
                  {authModalView === 'register' && 'Crea tu cuenta VIP'}
                  {authModalView === 'forgot-password' && 'Recupera tu contraseña'}
                </Text>

                {authModalView === 'register' && (
                  <Text style={styles.subtitleText}>
                    Recibe 250 Consenticoins de regalo al registrarte 🪙
                  </Text>
                )}
              </View>

              {/* Mensaje de error si existe */}
              {errorMessage ? (
                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.alertText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* ==================== VISTA 1: INICIA SESIÓN (Estilo Airbnb) ==================== */}
              {authModalView === 'login' && (
                <View style={styles.formSection}>
                  <ModernInput
                    placeholder="Número de teléfono o correo electrónico"
                    leftIconName="mail-outline"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <ModernInput
                    placeholder="Contraseña"
                    leftIconName="lock-closed-outline"
                    isPassword
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                  />

                  <View style={styles.forgotRow}>
                    <Pressable
                      onPress={() => switchView('forgot-password')}
                      hitSlop={8}
                    >
                      <Text style={styles.forgotLinkText}>¿Olvidaste tu clave?</Text>
                    </Pressable>
                  </View>

                  <ModernButton
                    title="Continuar"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    onPress={handleContinueLogin}
                    style={styles.continueButton}
                  />

                  {/* Separador "o" idéntico a Airbnb */}
                  <View style={styles.orDividerRow}>
                    <View style={styles.orDividerLine} />
                    <Text style={styles.orDividerText}>o</Text>
                    <View style={styles.orDividerLine} />
                  </View>

                  {/* Botones cuadrados sociales estilo Airbnb */}
                  <View style={styles.socialSquaresRow}>
                    <Pressable
                      onPress={() => handleSocialAuth('google')}
                      style={({ pressed }) => [
                        styles.socialSquareCard,
                        pressed && styles.socialSquarePressed,
                      ]}
                    >
                      <Ionicons name="logo-google" size={24} color="#EA4335" />
                    </Pressable>

                    <Pressable
                      onPress={() => handleSocialAuth('apple')}
                      style={({ pressed }) => [
                        styles.socialSquareCard,
                        pressed && styles.socialSquarePressed,
                      ]}
                    >
                      <Ionicons name="logo-apple" size={26} color="#FFFFFF" />
                    </Pressable>

                    <Pressable
                      onPress={() => handleSocialAuth('whatsapp')}
                      style={({ pressed }) => [
                        styles.socialSquareCard,
                        pressed && styles.socialSquarePressed,
                      ]}
                    >
                      <Ionicons name="logo-whatsapp" size={25} color="#25D366" />
                    </Pressable>
                  </View>

                  {/* Enlace para cambiar a Crear Cuenta */}
                  <View style={styles.switchModeContainer}>
                    <Text style={styles.switchModePrompt}>
                      ¿Aún no tienes cuenta?{' '}
                    </Text>
                    <Pressable onPress={() => switchView('register')} hitSlop={8}>
                      <Text style={styles.switchModeAction}>Regístrate aquí</Text>
                    </Pressable>
                  </View>

                  {/* Botón discreto de prueba rápida para cargar perfil real de Alejandra */}
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      loginAsDemoCustomer();
                    }}
                    style={styles.quickDemoPill}
                  >
                    <Ionicons name="flash" size={13} color={colors.primary.DEFAULT} />
                    <Text style={styles.quickDemoText}>
                      Acceso rápido de prueba: Alejandra Pinto
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* ==================== VISTA 2: REGISTRO ==================== */}
              {authModalView === 'register' && (
                <View style={styles.formSection}>
                  <ModernInput
                    label="Nombre completo"
                    placeholder="Ej. Alejandra Pinto"
                    leftIconName="person-outline"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="words"
                  />

                  <ModernInput
                    label="Correo electrónico"
                    placeholder="ejemplo@correo.com"
                    leftIconName="mail-outline"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <ModernInput
                    label="Contraseña"
                    placeholder="Mínimo 6 caracteres"
                    leftIconName="lock-closed-outline"
                    isPassword
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                  />

                  <PetSelector selectedPet={petType} onSelect={setPetType} />

                  {petType && (
                    <ModernInput
                      label={
                        petType === 'both'
                          ? 'Nombres de tus Mascotas (Opcional)'
                          : 'Nombre de tu Mascota (Opcional)'
                      }
                      placeholder={
                        petType === 'both'
                          ? 'Ej. Bruno y Mia'
                          : petType === 'cat'
                          ? 'Ej. Luna'
                          : 'Ej. Max'
                      }
                      leftIconName="paw-outline"
                      value={petName}
                      onChangeText={setPetName}
                      autoCapitalize="words"
                    />
                  )}

                  <ModernButton
                    title="Crear Cuenta y Recibir 250 Coins"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    onPress={handleRegisterSubmit}
                    style={styles.continueButton}
                  />

                  <View style={styles.switchModeContainer}>
                    <Text style={styles.switchModePrompt}>
                      ¿Ya tienes una cuenta?{' '}
                    </Text>
                    <Pressable onPress={() => switchView('login')} hitSlop={8}>
                      <Text style={styles.switchModeAction}>Inicia sesión</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ==================== VISTA 3: RECUPERAR CONTRASEÑA ==================== */}
              {authModalView === 'forgot-password' && (
                <View style={styles.formSection}>
                  <Text style={styles.forgotDescription}>
                    Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu clave.
                  </Text>

                  {resetSent ? (
                    <View style={styles.successResetBox}>
                      <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                      <Text style={styles.successResetTitle}>
                        ¡Enlace enviado a tu correo!
                      </Text>
                      <Text style={styles.successResetDesc}>
                        Revisa tu bandeja de entrada en {email} para crear tu nueva clave.
                      </Text>
                      <ModernButton
                        title="Volver a Iniciar Sesión"
                        variant="primary"
                        size="md"
                        onPress={() => switchView('login')}
                        style={{ width: '100%', marginTop: 12 }}
                      />
                    </View>
                  ) : (
                    <>
                      <ModernInput
                        placeholder="Tu correo electrónico"
                        leftIconName="mail-outline"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errorMessage) setErrorMessage('');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <ModernButton
                        title="Enviar Enlace de Recuperación"
                        variant="primary"
                        size="lg"
                        onPress={handleSendReset}
                        style={styles.continueButton}
                      />
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    flex: 1,
  },
  stackedBackCard: {
    height: 12,
    marginHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginBottom: -4,
  },
  sheetContainer: {
    height: '88%',
    backgroundColor: '#07080D',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
  },
  sheetContainerExpanded: {
    height: '96%',
  },
  topNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  iconPlaceholder: {
    width: 38,
    height: 38,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleHitZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  topDragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  topDragPillActive: {
    width: 56,
    backgroundColor: colors.primary.light,
  },
  closeXButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 44,
  },
  brandCenterSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircleFrame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#050508',
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  alertText: {
    color: '#FCA5A5',
    fontSize: 13,
    flex: 1,
  },
  formSection: {
    width: '100%',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 18,
  },
  forgotLinkText: {
    color: colors.primary.light,
    fontSize: 12,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    marginTop: 4,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  orDividerText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  socialSquaresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 26,
  },
  socialSquareCard: {
    width: 68,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#12151F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialSquarePressed: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.primary.DEFAULT,
    transform: [{ scale: 0.96 }],
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  switchModePrompt: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  switchModeAction: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  quickDemoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  quickDemoText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '600',
  },
  forgotDescription: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successResetBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  successResetTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successResetDesc: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
