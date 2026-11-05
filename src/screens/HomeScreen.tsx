import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { UserAvatar } from '../components/ui/UserAvatar';
import { CustomerProfileSheet } from '../components/CustomerProfileSheet';
import { useAuth } from '../context/AuthContext';

export const HomeScreen: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);

  const handleHeaderProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) {
      setProfileVisible(true);
    } else {
      openAuthModal('login');
    }
  };

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
        <Pressable
          onPress={handleHeaderProfilePress}
          style={({ pressed }) => [
            styles.userInfoRow,
            pressed && { opacity: 0.78 },
          ]}
        >
          <View style={styles.avatarTapWrapper}>
            <UserAvatar
              name={user ? user.name : 'Invitado'}
              avatarUrl={user?.avatarUrl}
              size={46}
            />
            <View style={styles.avatarMiniBadge}>
              <Ionicons name="person" size={9} color="#050508" />
            </View>
          </View>
          <View>
            <Text style={styles.welcomeGreeting}>
              {user ? 'Bienvenido de vuelta,' : 'Explora como invitado,'}
            </Text>
            <View style={styles.nameChevronRow}>
              <Text style={[typography.h3, styles.userNameText]}>
                {user ? user.name : 'Invitado'} 👋
              </Text>
              <Ionicons
                name="chevron-down"
                size={15}
                color={colors.primary.light}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text style={styles.tapProfileHint}>
              {user ? 'Ver mi cuenta y pedidos ›' : 'Inicia sesión o regístrate ›'}
            </Text>
          </View>
        </Pressable>

        {/* Botón de Bolsa de Compras en el Header */}
        <Pressable
          onPress={() => Haptics.selectionAsync()}
          style={styles.cartHeaderButton}
          hitSlop={8}
        >
          <Ionicons name="bag-handle-outline" size={20} color={colors.primary.light} />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>0</Text>
          </View>
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
                {user
                  ? `🎉 Tienes ${user.points} Consenticoins acumuladas para redimir`
                  : '✨ Inicia sesión para reclamar tus 250 Consenticoins de regalo'}
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
            <Pressable
              key={cat.id}
              onPress={() => Haptics.selectionAsync()}
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}20` }]}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Panel Deslizable de Cuenta del Cliente (solo para usuarios autenticados) */}
      <CustomerProfileSheet
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
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
    flex: 1,
  },
  avatarTapWrapper: {
    position: 'relative',
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: 1.5,
    borderColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapProfileHint: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  welcomeGreeting: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  userNameText: {
    color: colors.dark.textPrimary,
  },
  cartHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#050508',
    fontSize: 9,
    fontWeight: '800',
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
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
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
});
