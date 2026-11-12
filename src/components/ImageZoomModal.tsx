import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

const { width: WIN_W, height: WIN_H } = Dimensions.get('window');
const STAGE_W = WIN_W - 24;
const STAGE_H = Math.round(WIN_H * 0.66);
const MIN_SCALE = 1;
const MAX_SCALE = 4.5;

interface ImageZoomModalProps {
  visible: boolean;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  unitLabel?: string;
  onClose: () => void;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function touchDistance(
  t0: { pageX: number; pageY: number },
  t1: { pageX: number; pageY: number }
) {
  const dx = t0.pageX - t1.pageX;
  const dy = t0.pageY - t1.pageY;
  return Math.hypot(dx, dy);
}

/**
 * Visor en pantalla completa con pellizco (pinch-to-zoom), arrastre libre (pan),
 * doble toque rápido (1x <-> 2.5x) y controles +/- compatible con Android e iOS.
 */
export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  visible,
  imageUrl,
  title,
  subtitle,
  unitLabel,
  onClose,
}) => {
  const [displayScale, setDisplayScale] = useState(1);
  const [loading, setLoading] = useState(true);

  const animScale = useRef(new Animated.Value(1)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;

  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const gestureRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startDist: number;
    startScale: number;
    startX: number;
    startY: number;
    lastTapAt: number;
    moved: boolean;
  }>({
    mode: 'none',
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    lastTapAt: 0,
    moved: false,
  });

  const clampPan = (x: number, y: number, s: number) => {
    const maxX = Math.max(0, ((s - 1) * STAGE_W) / 2);
    const maxY = Math.max(0, ((s - 1) * STAGE_H) / 2);
    return {
      x: clamp(x, -maxX, maxX),
      y: clamp(y, -maxY, maxY),
    };
  };

  const applyInstant = (nextScale: number, nextX: number, nextY: number) => {
    scaleRef.current = nextScale;
    panRef.current = { x: nextX, y: nextY };
    animScale.setValue(nextScale);
    animX.setValue(nextX);
    animY.setValue(nextY);
    setDisplayScale(Number(nextScale.toFixed(1)));
  };

  const animateTo = (targetScale: number, targetX?: number, targetY?: number) => {
    const clampedScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    const finalScale = clampedScale <= 1.05 ? 1 : clampedScale;
    const bounded =
      finalScale === 1
        ? { x: 0, y: 0 }
        : clampPan(targetX ?? panRef.current.x, targetY ?? panRef.current.y, finalScale);

    scaleRef.current = finalScale;
    panRef.current = bounded;
    setDisplayScale(Number(finalScale.toFixed(1)));

    Animated.parallel([
      Animated.spring(animScale, {
        toValue: finalScale,
        useNativeDriver: true,
        damping: 20,
        stiffness: 240,
      }),
      Animated.spring(animX, {
        toValue: bounded.x,
        useNativeDriver: true,
        damping: 20,
        stiffness: 240,
      }),
      Animated.spring(animY, {
        toValue: bounded.y,
        useNativeDriver: true,
        damping: 20,
        stiffness: 240,
      }),
    ]).start();
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      applyInstant(1, 0, 0);
      gestureRef.current.lastTapAt = 0;
    }
  }, [visible, imageUrl]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        animScale.stopAnimation();
        animX.stopAnimation();
        animY.stopAnimation();

        const touches = evt.nativeEvent.touches;
        gestureRef.current.moved = false;

        if (touches.length >= 2) {
          gestureRef.current.mode = 'pinch';
          gestureRef.current.startDist = touchDistance(touches[0], touches[1]);
          gestureRef.current.startScale = scaleRef.current;
        } else {
          gestureRef.current.mode = 'pan';
          gestureRef.current.startX = panRef.current.x;
          gestureRef.current.startY = panRef.current.y;
        }
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          if (gestureRef.current.mode !== 'pinch') {
            gestureRef.current.mode = 'pinch';
            gestureRef.current.startDist = touchDistance(touches[0], touches[1]);
            gestureRef.current.startScale = scaleRef.current;
            gestureRef.current.moved = true;
            return;
          }
          const base = gestureRef.current.startDist;
          if (base > 10) {
            const dist = touchDistance(touches[0], touches[1]);
            const nextScale = clamp(
              gestureRef.current.startScale * (dist / base),
              MIN_SCALE,
              MAX_SCALE
            );
            const bounded = clampPan(panRef.current.x, panRef.current.y, nextScale);
            applyInstant(nextScale, bounded.x, bounded.y);
            gestureRef.current.moved = true;
          }
          return;
        }

        if (touches.length === 1 && gestureRef.current.mode === 'pan') {
          if (Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6) {
            gestureRef.current.moved = true;
          }
          if (scaleRef.current > 1.05) {
            const bounded = clampPan(
              gestureRef.current.startX + gs.dx,
              gestureRef.current.startY + gs.dy,
              scaleRef.current
            );
            panRef.current = bounded;
            animX.setValue(bounded.x);
            animY.setValue(bounded.y);
          }
        }
      },
      onPanResponderRelease: (_evt, gs) => {
        const wasPan = gestureRef.current.mode === 'pan';
        const moved = gestureRef.current.moved;
        gestureRef.current.mode = 'none';

        // Si no hubo desplazamiento significativo, detectamos doble toque para alternar 1x <-> 2.5x
        if (wasPan && !moved) {
          const now = Date.now();
          if (now - gestureRef.current.lastTapAt < 280) {
            gestureRef.current.lastTapAt = 0;
            Haptics.selectionAsync();
            if (scaleRef.current > 1.25) {
              animateTo(1, 0, 0);
            } else {
              animateTo(2.5, 0, 0);
            }
            return;
          }
          gestureRef.current.lastTapAt = now;
        }

        // Deslizar hacia abajo con 1x para cerrar cómodamente
        if (wasPan && scaleRef.current <= 1.05 && gs.dy > 110) {
          Haptics.selectionAsync();
          onClose();
          return;
        }

        animateTo(scaleRef.current, panRef.current.x, panRef.current.y);
      },
    })
  ).current;

  const handleStepZoom = (delta: number) => {
    Haptics.selectionAsync();
    animateTo(scaleRef.current + delta);
  };

  if (!visible || !imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.backdrop} edges={['top', 'bottom', 'left', 'right']}>
        {/* Header superior */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            {unitLabel ? (
              <View style={styles.unitPill}>
                <Text style={styles.unitPillText}>{unitLabel}</Text>
              </View>
            ) : null}
            {title ? (
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
            activeOpacity={0.75}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Escenario interactivo de imagen con pellizco, pan y doble toque */}
        <View style={styles.stageOuter}>
          <View style={styles.stageCard} {...panResponder.panHandlers}>
            {loading && (
              <ActivityIndicator
                size="large"
                color={colors.primary.DEFAULT}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Animated.Image
              source={{ uri: imageUrl }}
              resizeMode="contain"
              onLoadEnd={() => setLoading(false)}
              style={[
                styles.zoomImage,
                {
                  transform: [
                    { translateX: animX },
                    { translateY: animY },
                    { scale: animScale },
                  ],
                },
              ]}
            />
          </View>
        </View>

        {/* Controles flotantes inferiores de zoom */}
        <View style={styles.footer}>
          <View style={styles.controlsBar}>
            <Pressable
              onPress={() => handleStepZoom(-0.75)}
              disabled={displayScale <= 1}
              style={[
                styles.zoomBtn,
                displayScale <= 1 && styles.zoomBtnDisabled,
              ]}
            >
              <Ionicons
                name="remove"
                size={20}
                color={displayScale <= 1 ? '#4B5563' : '#050508'}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                if (displayScale > 1.2) {
                  animateTo(1, 0, 0);
                } else {
                  animateTo(2.5, 0, 0);
                }
              }}
              style={styles.scaleReadoutBtn}
            >
              <Text style={styles.scaleReadoutText}>
                {displayScale.toFixed(1)}x
              </Text>
              <Text style={styles.scaleResetHint}>
                {displayScale > 1.2 ? 'Restablecer' : 'Ampliar 2.5x'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleStepZoom(0.75)}
              disabled={displayScale >= MAX_SCALE}
              style={[
                styles.zoomBtn,
                displayScale >= MAX_SCALE && styles.zoomBtnDisabled,
              ]}
            >
              <Ionicons
                name="add"
                size={20}
                color={displayScale >= MAX_SCALE ? '#4B5563' : '#050508'}
              />
            </Pressable>
          </View>

          <Text style={styles.hintText}>
            Pellizca con dos dedos, arrastra o toca dos veces para hacer zoom
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 9, 0.97)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
  },
  unitPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  unitPillText: {
    color: '#050508',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C202B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stageCard: {
    width: STAGE_W,
    height: STAGE_H,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141720',
    borderRadius: 22,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnDisabled: {
    backgroundColor: '#1E222E',
  },
  scaleReadoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 108,
  },
  scaleReadoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  scaleResetHint: {
    color: colors.primary.light,
    fontSize: 10.5,
    fontWeight: '700',
  },
  hintText: {
    color: '#9CA3AF',
    fontSize: 11.5,
    textAlign: 'center',
  },
});
