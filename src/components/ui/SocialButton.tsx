import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface SocialButtonProps {
  provider: 'google' | 'apple' | 'whatsapp';
  onPress: () => void;
  fullWidth?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  fullWidth = false,
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Continuar con Google',
          icon: 'logo-google' as const,
          color: '#EA4335',
        };
      case 'apple':
        return {
          title: 'Continuar con Apple',
          icon: 'logo-apple' as const,
          color: '#FFFFFF',
        };
      case 'whatsapp':
        return {
          title: 'Ingresar con WhatsApp',
          icon: 'logo-whatsapp' as const,
          color: '#25D366',
        };
    }
  };

  const config = getProviderConfig();

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onPress();
  };

  if (!fullWidth) {
    return (
      <Pressable
        onPress={handlePress}
        style={styles.iconOnlyButton}
      >
        <Ionicons name={config.icon} size={22} color={config.color} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.fullButton}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <Text style={styles.fullButtonText}>{config.title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  iconOnlyButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 12,
  },
  iconWrapper: {
    marginRight: 10,
  },
  fullButtonText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

