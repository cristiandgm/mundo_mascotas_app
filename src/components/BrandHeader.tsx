import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  compact?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  compact = false,
}) => {
  return (
    <View style={styles.container}>
      {showBack && onBack && (
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.dark.textPrimary} />
        </Pressable>
      )}

      <View style={styles.logoRow}>
        <View style={[styles.logoBorder, compact && styles.logoBorderCompact]}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={[styles.logoImage, compact && styles.logoImageCompact]}
            resizeMode="cover"
          />
        </View>
      </View>

      {title && (
        <Text style={[typography.h1, styles.titleText, compact && styles.titleCompact]}>
          {title}
        </Text>
      )}

      {subtitle && (
        <Text style={[typography.body, styles.subtitleText]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  logoBorderCompact: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoImageCompact: {
    width: '100%',
    height: '100%',
  },
  titleText: {
    color: colors.dark.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  titleCompact: {
    fontSize: 22,
    marginTop: 4,
  },
  subtitleText: {
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: '85%',
  },
});

