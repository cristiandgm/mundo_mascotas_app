import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 44,
}) => {
  const [imageError, setImageError] = useState(false);

  // Extraer inicial del nombre
  const getInitial = (userName?: string): string => {
    if (!userName || userName.trim().toLowerCase() === 'invitado') {
      return 'I';
    }
    const cleanName = userName.trim();
    return cleanName.charAt(0).toUpperCase();
  };

  const initial = getInitial(name);
  const borderRadius = size / 2;

  // Si tiene foto de perfil y no ha fallado la carga
  if (avatarUrl && !imageError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { borderRadius }]}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // Si NO tiene foto: Círculo VIP con la Letra Inicial
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      <LinearGradient
        colors={['#F5D061', '#D4AF37']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.initialsGradient, { borderRadius }]}
      >
        <Text
          style={[
            styles.initialText,
            {
              fontSize: Math.round(size * 0.44),
            },
          ]}
        >
          {initial}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#050508',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    overflow: 'hidden',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#050508',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
