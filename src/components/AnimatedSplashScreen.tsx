import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onFinish }) => {
  // Animación del logo principal (visible de inmediato con pop elástico)
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Onda expansiva dorada concéntrica
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Huellitas animadas (6 huellitas en cascada alrededor del logo)
  const paw1 = useRef(new Animated.Value(0)).current;
  const paw2 = useRef(new Animated.Value(0)).current;
  const paw3 = useRef(new Animated.Value(0)).current;
  const paw4 = useRef(new Animated.Value(0)).current;
  const paw5 = useRef(new Animated.Value(0)).current;
  const paw6 = useRef(new Animated.Value(0)).current;

  // Destellos estelares superiores
  const starsOpacity = useRef(new Animated.Value(0)).current;

  // Texto y slogan
  const textTranslateY = useRef(new Animated.Value(15)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Salida suave (Fade-out)
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  const isFinishing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishAnimation = (duration = 400) => {
    if (isFinishing.current) return;
    isFinishing.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1.05,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    // 1. EL LOGO ENTRA DE INMEDIATO (Cero retraso, 100% visible)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),

      // Destellos superiores
      Animated.timing(starsOpacity, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),

      // Onda expansiva de luz que nace del logo
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(ringOpacity, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 1.6,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // 2. Caminata de huellitas secuencial apareciendo alrededor del logo
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(paw1, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(paw2, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(450),
        Animated.spring(paw3, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(paw4, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(750),
        Animated.spring(paw5, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.spring(paw6, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),

      // 3. Aparición elegante de la marca y slogan
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Vibración háptica premium al inicio
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignorar en plataformas sin soporte
    }

    // 4. Salida automática tras 3.3 segundos
    timerRef.current = setTimeout(() => {
      finishAnimation(450);
    }, 3300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
    >
      {/* Área táctil: Tap to skip */}
      <Pressable
        onPress={() => finishAnimation(200)}
        style={styles.pressableContent}
      >
        <LinearGradient
          colors={['#030712', '#0A1329', '#060B18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Aura central de color cian */}
        <View style={styles.ambientGlow} />

        {/* Destellos estelares superiores */}
        <Animated.View style={[styles.starsContainer, { opacity: starsOpacity }]}>
          <Ionicons name="sparkles" size={14} color={colors.accent.light} />
          <View style={styles.starDot} />
          <Ionicons name="sparkles" size={18} color={colors.primary.light} />
          <View style={styles.starDot} />
          <Ionicons name="sparkles" size={14} color={colors.accent.light} />
        </Animated.View>

        {/* Huellita 1 - Perro (Arriba izquierda, dorada) */}
        <Animated.View
          style={[
            styles.pawContainer,
            styles.paw1,
            {
              opacity: paw1.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
              transform: [{ scale: paw1 }, { rotate: '-22deg' }],
            },
          ]}
        >
          <Ionicons name="paw" size={26} color={colors.accent.light} />
        </Animated.View>

        {/* Huellita 2 - Gato (Arriba derecha, cian) */}
        <Animated.View
          style={[
            styles.pawContainer,
            styles.paw2,
            {
              opacity: paw2.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
              transform: [{ scale: paw2 }, { rotate: '20deg' }],
            },
          ]}
        >
          <Ionicons name="paw" size={20} color={colors.primary.light} />
        </Animated.View>

        {/* Huellita 3 - Perro (Medio izquierda) */}
        <Animated.View
          style={[
            styles.pawContainer,
            styles.paw3,
            {
              opacity: paw3.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
              transform: [{ scale: paw3 }, { rotate: '-12deg' }],
            },
          ]}
        >
          <Ionicons name="paw" size={28} color={colors.accent.DEFAULT} />
        </Animated.View>

        {/* Huellita 4 - Gato (Medio derecha) */}
        <Animated.View
          style={[
            styles.pawContainer,
            styles.paw4,
            {
              opacity: paw4.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
              transform: [{ scale: paw4 }, { rotate: '16deg' }],
            },
          ]}
        >
          <Ionicons name="paw" size={22} color={colors.primary.DEFAULT} />
        </Animated.View>

        {/* Huellita 5 - Perro (Flanco izquierdo libre del logo) */}
        <Animated.View
          style={[
            styles.pawContainer,
            styles.paw5,
            {
              opacity: paw5.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
              transform: [{ scale: paw5 }, { rotate: '-8deg' }],
            },
          ]}
        >
          <Ionicons name="paw" size={30} color={colors.accent.light} />
        </Animated.View>

        {/* Huellita 6 - Gato (Flanco derecho libre del logo) */}
        <Animated.View
          style={[
            styles.pawContainer,
            styles.paw6,
            {
              opacity: paw6.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
              transform: [{ scale: paw6 }, { rotate: '8deg' }],
            },
          ]}
        >
          <Ionicons name="paw" size={24} color={colors.primary.light} />
        </Animated.View>

        {/* CONTENEDOR DEL LOGO PRINCIPAL (Centrado y visible de inmediato) */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Onda de choque luminosa concéntrica */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          {/* Marco circular del Logo oficial */}
          <View style={styles.logoBorder}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Textos de Marca y Slogan */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <View style={styles.dotYellow} />
            <View style={styles.dotBlue} />
            <View style={styles.dotRed} />
            <Text style={styles.countryText}>COLOMBIA</Text>
          </View>

          <Text style={styles.brandTitle}>Mundo Mascotas</Text>
          <Text style={styles.brandSlogan}>
            Un mundo de variedades para tu Mascota
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pressableContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  starsContainer: {
    position: 'absolute',
    top: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
    zIndex: 20,
  },
  starDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2.5,
    borderColor: colors.accent.DEFAULT,
  },
  pawContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  paw1: {
    top: height * 0.12,
    left: width * 0.14,
  },
  paw2: {
    top: height * 0.15,
    right: width * 0.15,
  },
  paw3: {
    top: height * 0.22,
    left: width * 0.26,
  },
  paw4: {
    top: height * 0.24,
    right: width * 0.24,
  },
  paw5: {
    top: height * 0.40,
    left: width * 0.08,
  },
  paw6: {
    top: height * 0.40,
    right: width * 0.08,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    zIndex: 20,
  },
  logoBorder: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#050508',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
    gap: 5,
  },
  dotYellow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FCD116',
  },
  dotBlue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#003893',
  },
  dotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CE1126',
  },
  countryText: {
    color: colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandSlogan: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.light,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
