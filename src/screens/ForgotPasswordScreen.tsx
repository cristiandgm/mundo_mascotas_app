import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { BrandHeader } from '../components/BrandHeader';
import { ModernInput } from '../components/ui/ModernInput';
import { ModernButton } from '../components/ui/ModernButton';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';

export const ForgotPasswordScreen: React.FC = () => {
  const { setScreen } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    setStep('code');
  };

  const handleResetPassword = async () => {
    setError('');
    if (code.length < 4) {
      setError('Ingresa el código de 4 dígitos enviado');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsLoading(false);
    setStep('success');
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
            title="Recuperar Clave"
            subtitle="Te ayudamos a recuperar el acceso a tu cuenta rápidamente"
            showBack
            onBack={() => setScreen('login')}
            compact
          />

          <GlassCard style={styles.card}>
            {error ? (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            {step === 'email' && (
              <>
                <Text style={styles.instructionText}>
                  Ingresa tu correo registrado y te enviaremos las instrucciones de restablecimiento.
                </Text>

                <ModernInput
                  label="Correo Electrónico"
                  placeholder="ejemplo@correo.com"
                  leftIconName="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <ModernButton
                  title="Enviar Código"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  onPress={handleSendCode}
                  style={styles.submitBtn}
                />
              </>
            )}

            {step === 'code' && (
              <>
                <View style={styles.codeSentBanner}>
                  <Ionicons name="mail-unread-outline" size={24} color={colors.primary.light} />
                  <Text style={styles.codeSentText}>
                    Hemos enviado un código a: <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>
                </View>

                <ModernInput
                  label="Código de Verificación (4 Dígitos)"
                  placeholder="1234"
                  leftIconName="key-outline"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <ModernInput
                  label="Nueva Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  leftIconName="lock-closed-outline"
                  isPassword
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <ModernButton
                  title="Restablecer Contraseña"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  onPress={handleResetPassword}
                  style={styles.submitBtn}
                />
              </>
            )}

            {step === 'success' && (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-done" size={36} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>¡Contraseña Actualizada!</Text>
                <Text style={styles.successDesc}>
                  Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva clave.
                </Text>

                <ModernButton
                  title="Iniciar Sesión Ahora"
                  variant="primary"
                  size="lg"
                  onPress={() => setScreen('login')}
                  style={styles.submitBtn}
                />
              </View>
            )}
          </GlassCard>
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
  instructionText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  codeSentBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
  },
  codeSentText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  emailHighlight: {
    color: colors.primary.light,
    fontWeight: '700',
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark.textPrimary,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});
