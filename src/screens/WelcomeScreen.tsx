import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ModernButton } from '../components/ui/ModernButton';
import { useAuth } from '../context/AuthContext';

export const WelcomeScreen: React.FC = () => {
  const { setScreen } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#070B14', '#0F1A2E', '#0B1120']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoBorder}>
              <Image
                source={require('../../assets/logo.jpg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <Text style={[typography.h1, styles.mainHeading]}>
            El mejor cuidado para tu{' '}
            <Text style={styles.highlightText}>mejor amigo</Text>
          </Text>

          <Text style={[typography.body, styles.subHeading]}>
            Alimentos premium, salud y consentimientos exclusivos.
          </Text>
        </View>

        {/* Feature Pills */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="flash-outline" size={18} color={colors.primary.light} />
            </View>
            <View style={styles.featureTextWrapper}>
              <Text style={styles.featureTitle}>Envíos a todo el país</Text>
              <Text style={styles.featureDesc}>Llega directo a tu dirección</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent.light} />
            </View>
            <View style={styles.featureTextWrapper}>
              <Text style={styles.featureTitle}>Marcas Certificadas</Text>
              <Text style={styles.featureDesc}>100% nutrición garantizada</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Ionicons name="sparkles" size={18} color={colors.accent.light} />
            </View>
            <View style={styles.featureTextWrapper}>
              <Text style={styles.featureTitle}>Club Consenticoins</Text>
              <Text style={styles.featureDesc}>Acumula monedas y redime premios</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ModernButton
            title="Iniciar Sesión"
            variant="primary"
            size="lg"
            onPress={() => setScreen('login')}
            rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            style={styles.actionBtn}
          />

          <ModernButton
            title="Crear Cuenta Nueva"
            variant="secondary"
            size="lg"
            onPress={() => setScreen('register')}
            style={styles.actionBtn}
          />

          <ModernButton
            title="Explorar como Invitado"
            variant="ghost"
            size="sm"
            onPress={() => setScreen('home')}
            style={styles.ghostBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  logoBorder: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  mainHeading: {
    color: colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  highlightText: {
    color: colors.primary.light,
  },
  subHeading: {
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '92%',
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: colors.dark.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: 16,
    marginBottom: 28,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark.textPrimary,
  },
  featureDesc: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    width: '100%',
  },
  ghostBtn: {
    marginTop: 4,
  },
});
