import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
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
  // Huellitas animadas (caminata de perro y gato)
  const paw1Scale = useRef(new Animated.Value(0)).current;
  const paw1Opacity = useRef(new Animated.Value(0)).current;

  const paw2Scale = useRef(new Animated.Value(0)).current;
  const paw2Opacity = useRef(new Animated.Value(0)).current;

  const paw3Scale = useRef(new Animated.Value(0)).current;
  const paw3Opacity = useRef(new Animated.Value(0)).current;

  const paw4Scale = useRef(new Animated.Value(0)).current;
  const paw4Opacity = useRef(new Animated.Value(0)).current;

  const paw5Scale = useRef(new Animated.Value(0)).current;
  const paw5Opacity = useRef(new Animated.Value(0)).current;

  const paw6Scale = useRef(new Animated.Value(0)).current;
  const paw6Opacity = useRef(new Animated.Value(0)).current;

  // Animaciones del logo
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones de los aros de energía expansiva
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones de texto y slogan
  const textTranslateY = useRef(new Animated.Value(25)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Animación de salida (fade-out y zoom sutil)
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  // Helper para animar cada paso de huellita
  const animatePaw = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
    return Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]);
  };

  useEffect(() => {
    // 1. Caminata de huellitas desde la parte superior hacia los laterales del logo
    Animated.parallel([
      animatePaw(paw1Scale, paw1Opacity, 100),   // Paso 1 (Perro 🐶, arriba izq)
      animatePaw(paw2Scale, paw2Opacity, 300),   // Paso 2 (Gato 🐱, arriba der)
      animatePaw(paw3Scale, paw3Opacity, 500),   // Paso 3 (Perro 🐶, descendiendo izq)
      animatePaw(paw4Scale, paw4Opacity, 700),   // Paso 4 (Gato 🐱, descendiendo der)
      animatePaw(paw5Scale, paw5Opacity, 900),   // Paso 5 (Perro 🐶, flanco izq logo)
      animatePaw(paw6Scale, paw6Opacity, 1100),  // Paso 6 (Gato 🐱, flanco der logo)

      // 2. Nacimiento del Logo con efecto shockwave en el segundo 1.25
      Animated.sequence([
        Animated.delay(1250),
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          // Onda expansiva de luz
          Animated.sequence([
            Animated.timing(ringOpacity, {
              toValue: 0.8,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(ringScale, {
                toValue: 1.7,
                duration: 1200,
                useNativeDriver: true,
              }),
              Animated.timing(ringOpacity, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]),

      // 3. Entrada de Marca y Slogan en el segundo 1.75
      Animated.sequence([
        Animated.delay(1750),
        Animated.parallel([
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Haptics sutiles
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 1250);
    } catch {
      // Ignorar
    }

    // 4. Salida cinematográfica después de 3.6 segundos
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 1.06,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 3600);

    return () => clearTimeout(timer);
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
      <LinearGradient
        colors={['#030712', '#0A1329', '#060B18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Aura ambiental en el centro */}
      <View style={styles.ambientGlow} />

      {/* Insignia decorativa superior para equilibrar la pantalla */}
      <Animated.View
        style={[
          styles.topHeader,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Ionicons name="sparkles" size={13} color={colors.accent.light} />
        <Text style={styles.topHeaderText}>BIENVENIDOS AL CLUB DE MASCOTAS</Text>
        <Ionicons name="sparkles" size={13} color={colors.primary.light} />
      </Animated.View>

      {/* HUELLITAS DE PERRO Y GATO (Ubicadas en la parte superior y laterales, sin tapar textos) */}
      {/* Huella 1 - Perro (Dorado, arriba izquierda) */}
      <Animated.View
        style={[
          styles.pawContainer,
          styles.paw1,
          {
            opacity: paw1Opacity,
            transform: [{ scale: paw1Scale }, { rotate: '-22deg' }],
          },
        ]}
      >
        <Ionicons name="paw" size={26} color={colors.accent.light} />
      </Animated.View>

      {/* Huella 2 - Gato (Cian, arriba derecha) */}
      <Animated.View
        style={[
          styles.pawContainer,
          styles.paw2,
          {
            opacity: paw2Opacity,
            transform: [{ scale: paw2Scale }, { rotate: '20deg' }],
          },
        ]}
      >
        <Ionicons name="paw" size={20} color={colors.primary.light} />
      </Animated.View>

      {/* Huella 3 - Perro (Dorado, bajando hacia el logo, izquierda) */}
      <Animated.View
        style={[
          styles.pawContainer,
          styles.paw3,
          {
            opacity: paw3Opacity,
            transform: [{ scale: paw3Scale }, { rotate: '-12deg' }],
          },
        ]}
      >
        <Ionicons name="paw" size={28} color={colors.accent.DEFAULT} />
      </Animated.View>

      {/* Huella 4 - Gato (Cian, bajando hacia el logo, derecha) */}
      <Animated.View
        style={[
          styles.pawContainer,
          styles.paw4,
          {
            opacity: paw4Opacity,
            transform: [{ scale: paw4Scale }, { rotate: '16deg' }],
          },
        ]}
      >
        <Ionicons name="paw" size={22} color={colors.primary.DEFAULT} />
      </Animated.View>

      {/* Huella 5 - Perro (Flanco izquierdo libre del logo) */}
      <Animated.View
        style={[
          styles.pawContainer,
          styles.paw5,
          {
            opacity: paw5Opacity,
            transform: [{ scale: paw5Scale }, { rotate: '-8deg' }],
          },
        ]}
      >
        <Ionicons name="paw" size={30} color={colors.accent.light} />
      </Animated.View>

      {/* Huella 6 - Gato (Flanco derecho libre del logo) */}
      <Animated.View
        style={[
          styles.pawContainer,
          styles.paw6,
          {
            opacity: paw6Opacity,
            transform: [{ scale: paw6Scale }, { rotate: '8deg' }],
          },
        ]}
      >
        <Ionicons name="paw" size={24} color={colors.primary.light} />
      </Animated.View>

      {/* Onda expansiva animada */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Contenedor del Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoBorder}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Textos y Marca (Zona inferior sin ninguna huella encima) */}
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

      {/* Huellitas compañeras al pie */}
      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Ionicons name="paw" size={14} color={colors.accent.light} />
          <Text style={styles.footerText}>Hecho con amor para tus peludos</Text>
          <Ionicons name="paw" size={12} color={colors.primary.light} />
        </View>
      </View>
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
  ambientGlow: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  topHeader: {
    position: 'absolute',
    top: 55,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 7,
    zIndex: 20,
  },
  topHeaderText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
  // Coordenadas superiores y laterales (Libres de texto)
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
    top: height * 0.38,
    left: width * 0.08,
  },
  paw6: {
    top: height * 0.38,
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
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
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
  footer: {
    position: 'absolute',
    bottom: 45,
    zIndex: 20,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    color: colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
