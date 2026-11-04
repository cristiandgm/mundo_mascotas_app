import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { BrandHeader } from '../components/BrandHeader';
import { ModernInput } from '../components/ui/ModernInput';
import { ModernButton } from '../components/ui/ModernButton';
import { PetSelector } from '../components/ui/PetSelector';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth, PetCategory } from '../context/AuthContext';

export const RegisterScreen: React.FC = () => {
  const { register, setScreen, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [petType, setPetType] = useState<PetCategory | null>(null);
  const [petName, setPetName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Medidor de fuerza de contraseña
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Débil', color: '#EF4444' };
    if (score <= 3) return { level: 2, label: 'Media', color: '#F59E0B' };
    return { level: 3, label: 'Fuerte & Segura', color: '#10B981' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
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
    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los términos y condiciones para continuar');
      return;
    }

    const res = await register(name, email, password, petType || undefined, petName);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#050508', '#0F1117', '#050508']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader
            title="Crea tu Cuenta"
            subtitle="¡Regístrate hoy y recibe 250 Consenticoins de bienvenida! 🪙✨"
            showBack
            onBack={() => setScreen('login')}
            compact
          />

          <GlassCard style={styles.card}>
            {errorMessage ? (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.alertText}>{errorMessage}</Text>
              </View>
            ) : null}

            <ModernInput
              label="Tu Nombre Completo"
              placeholder="Ej. Carlos Mendoza"
              leftIconName="person-outline"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="words"
            />

            <ModernInput
              label="Correo Electrónico"
              placeholder="carlos@ejemplo.com"
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

            {/* Medidor visual de seguridad */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarsRow}>
                  <View
                    style={[
                      styles.strengthBar,
                      strength.level >= 1 && { backgroundColor: strength.color },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      strength.level >= 2 && { backgroundColor: strength.color },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      strength.level >= 3 && { backgroundColor: strength.color },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: strength.color }]}>
                  Seguridad: {strength.label}
                </Text>
              </View>
            )}

            {/* Selector interactivo de tipo de mascota */}
            <PetSelector selectedPet={petType} onSelect={setPetType} />

            <ModernInput
              label={
                petType === 'both'
                  ? 'Nombres de tus Mascotas (Opcional)'
                  : 'Nombre de tu Mascota (Opcional)'
              }
              placeholder={
                petType === 'both'
                  ? 'Ej. Bruno y Luna...'
                  : 'Ej. Bruno, Luna, Nala...'
              }
              leftIconName="paw-outline"
              value={petName}
              onChangeText={setPetName}
              autoCapitalize="words"
            />

            {/* Términos y condiciones */}
            <Pressable
              onPress={() => setAcceptTerms(!acceptTerms)}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptTerms && styles.checkboxActive,
                ]}
              >
                {acceptTerms && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.termsHighlight}>Términos del Servicio</Text> y la{' '}
                <Text style={styles.termsHighlight}>Política de Privacidad</Text>
              </Text>
            </Pressable>

            <ModernButton
              title="Crear mi Cuenta"
              variant="accent"
              size="lg"
              loading={isLoading}
              onPress={handleRegister}
              rightIcon={<Ionicons name="sparkles" size={18} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </GlassCard>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <Pressable onPress={() => setScreen('login')}>
              <Text style={styles.loginLink}>Inicia Sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    marginBottom: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  alertText: {
    color: '#FCA5A5',
    fontSize: 13,
    flex: 1,
  },
  strengthContainer: {
    marginTop: -8,
    marginBottom: 16,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dark.border,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.accent.DEFAULT,
    borderColor: colors.accent.DEFAULT,
  },
  termsText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  termsHighlight: {
    color: colors.primary.light,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary.light,
    fontSize: 14,
    fontWeight: '700',
  },
});
