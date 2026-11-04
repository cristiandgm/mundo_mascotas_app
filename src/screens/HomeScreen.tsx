import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ModernButton } from '../components/ui/ModernButton';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const getPetEmoji = (type?: string) => {
    if (type === 'both') return '🐶🐱';
    if (type === 'cat') return '🐱';
    return '🐶';
  };

  const categories = [
    { id: '1', title: 'Alimentos', icon: 'nutrition-outline' as const, color: '#38BDF8' },
    { id: '2', title: 'Juguetes', icon: 'tennisball-outline' as const, color: '#F59E0B' },
    { id: '3', title: 'Salud & Farma', icon: 'medkit-outline' as const, color: '#10B981' },
    { id: '4', title: 'Accesorios', icon: 'shirt-outline' as const, color: '#EC4899' },
    { id: '5', title: 'Snacks & Premios', icon: 'gift-outline' as const, color: '#8B5CF6' },
    { id: '6', title: 'Higiene', icon: 'water-outline' as const, color: '#06B6D4' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#050508', '#0F1117', '#050508']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatarBorder}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.avatarImg}
            />
          </View>
          <View>
            <Text style={styles.welcomeGreeting}>Bienvenido de vuelta,</Text>
            <Text style={[typography.h3, styles.userNameText]}>
              {user ? user.name : 'Invitado'} 👋
            </Text>
          </View>
        </View>

        <Pressable
          onPress={logout}
          style={styles.logoutIconButton}
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.dark.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card VIP Consenticoins */}
        <View style={styles.vipCardOuter}>
          <LinearGradient
            colors={['#C69214', '#D4AF37', '#996515']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipCardGradient}
          >
            <View style={styles.vipCardHeader}>
              <View>
                <Text style={styles.vipCardBadge}>BILLETERA CONSENTICOINS</Text>
                <Text style={styles.vipCardPoints}>
                  {user?.points ?? 250} <Text style={styles.ptsText}>COINS</Text>
                </Text>
              </View>
              <View style={styles.petBadgeHeader}>
                <Text style={styles.petEmojiIcon}>{getPetEmoji(user?.petType)}</Text>
                <Text style={styles.petBadgeName}>{user?.petName || 'Peludo'}</Text>
              </View>
            </View>

            <View style={styles.vipCardFooter}>
              <Text style={styles.vipCardBenefit}>
                🎉 Tienes 250 Consenticoins acumuladas para redimir
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <Ionicons name="sparkles" size={20} color={colors.primary.light} />
          <Text style={styles.promoText}>
            🇨🇴 <Text style={{ fontWeight: '700' }}>Envíos Gratis</Text> en Colombia en pedidos mayores a $99.900
          </Text>
        </View>

        {/* Categorías */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.h3, styles.sectionTitle]}>Explorar por Categoría</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}20` }]}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </View>
          ))}
        </View>

        {/* Status card */}
        <GlassCard style={styles.readyCard}>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.readyTitle}>¡Módulo de Autenticación Listo!</Text>
          </View>
          <Text style={styles.readyDesc}>
            Has probado el flujo de inicio de sesión, registro personalizado y recuperación de clave.
          </Text>

          <ModernButton
            title="Probar Cerrar Sesión"
            variant="outline"
            size="md"
            onPress={logout}
            style={styles.logoutBtn}
          />
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#050508',
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  welcomeGreeting: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  userNameText: {
    color: colors.dark.textPrimary,
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  vipCardOuter: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.accent.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  vipCardGradient: {
    padding: 20,
    borderRadius: 22,
  },
  vipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vipCardBadge: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  vipCardPoints: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ptsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FEF3C7',
  },
  petBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  petEmojiIcon: {
    fontSize: 18,
  },
  petBadgeName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  vipCardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
  },
  vipCardBenefit: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  promoText: {
    color: colors.primary.light,
    fontSize: 13,
    flex: 1,
  },
  sectionHeaderRow: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.dark.textPrimary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '30.5%',
    backgroundColor: colors.dark.cardElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  categoryIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    color: colors.dark.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  readyCard: {
    marginTop: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  readyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  readyDesc: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  logoutBtn: {
    width: '100%',
  },
});
