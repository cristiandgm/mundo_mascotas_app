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
import { SocialButton } from '../components/ui/SocialButton';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, loginWithSocial, setScreen, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Por favor escribe tu correo electrónico');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor escribe tu contraseña');
      return;
    }

    const res = await login(email, password);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'whatsapp') => {
    await loginWithSocial(provider);
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
            title="¡Hola de nuevo!"
            subtitle="Accede a las mejores ofertas y cuidados para tu consentido"
            showBack
            onBack={() => setScreen('welcome')}
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
              label="Correo Electrónico"
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
              placeholder="••••••••"
              leftIconName="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
            />

            <View style={styles.optionsRow}>
              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.rememberMeRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxActive,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Recordarme</Text>
              </Pressable>

              <Pressable
                onPress={() => setScreen('forgot-password')}
                hitSlop={8}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu clave?
                </Text>
              </Pressable>
            </View>

            <ModernButton
              title="Iniciar Sesión"
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleLogin}
              style={styles.submitBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o ingresa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <SocialButton
                provider="google"
                onPress={() => handleSocialLogin('google')}
              />
              <SocialButton
                provider="apple"
                onPress={() => handleSocialLogin('apple')}
              />
              <SocialButton
                provider="whatsapp"
                onPress={() => handleSocialLogin('whatsapp')}
              />
            </View>
          </GlassCard>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
            <Pressable onPress={() => setScreen('register')}>
              <Text style={styles.registerLink}>Regístrate gratis</Text>
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
    paddingBottom: 30,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -4,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  checkboxActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  rememberMeText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  forgotPasswordText: {
    color: colors.primary.light,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  dividerText: {
    color: colors.dark.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.accent.light,
    fontSize: 14,
    fontWeight: '700',
  },
});
