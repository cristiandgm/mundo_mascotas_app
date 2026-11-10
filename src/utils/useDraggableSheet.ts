import { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface UseDraggableSheetOptions {
  visible: boolean;
  onClose: () => void;
}

export const useDraggableSheet = ({ visible, onClose }: UseDraggableSheetOptions) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setIsExpanded(false);
      setIsDragging(false);
      translateY.setValue(32);

      // En Android es indispensable disparar una animación con useNativeDriver: true hacia 0
      // una vez montado el Modal para que NativeAnimatedModule sincronice el nodo y el hit-testing
      const rafId = requestAnimationFrame(() => {
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          stiffness: 260,
          mass: 0.8,
          useNativeDriver: true,
        }).start();
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [visible, translateY]);

  const triggerGuaranteedClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }

    let closed = false;
    const finishClose = () => {
      if (closed) return;
      closed = true;
      onCloseRef.current();
    };

    // Fallback garantizado para Android por si el callback de useNativeDriver se interrumpe
    const fallbackTimer = setTimeout(finishClose, 225);

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      clearTimeout(fallbackTimer);
      finishClose();
    });
  };

  const animateClose = () => {
    triggerGuaranteedClose();
  };

  const handleReleaseGesture = (dy: number, vy: number) => {
    setIsDragging(false);

    // 1. Deslizar hacia ARRIBA -> Expandir ventana al máximo
    if (dy < -40 || vy < -0.5) {
      if (!isExpandedRef.current) {
        setIsExpanded(true);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          // ignore
        }
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
      return;
    }

    // 2. Si estaba expandida y desliza un poco hacia abajo -> volver a altura normal
    if (isExpandedRef.current && dy > 45 && dy < 160 && vy < 1.1) {
      setIsExpanded(false);
      try {
        Haptics.selectionAsync();
      } catch {
        // ignore
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
      return;
    }

    // 3. Deslizar hacia ABAJO fuerte -> Cerrar ventana flotante (se queda abajo en SCREEN_HEIGHT mientras cierra)
    if (dy > 95 || vy > 0.65) {
      triggerGuaranteedClose();
      return;
    }

    // 4. Si soltó antes del límite -> Rebote elástico a su posición
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 7,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > 5 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        try {
          Haptics.selectionAsync();
        } catch {
          // ignore
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          // Resistencia elástica suave al deslizar hacia arriba
          translateY.setValue(gestureState.dy * 0.35);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        handleReleaseGesture(gestureState.dy, gestureState.vy);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // PanResponder exclusivo para la barrita superior (captura desde el toque inicial)
  const handleBarPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        try {
          Haptics.selectionAsync();
        } catch {
          // ignore
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy * 0.35);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        handleReleaseGesture(gestureState.dy, gestureState.vy);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return {
    translateY,
    isExpanded,
    isDragging,
    headerPanHandlers: panResponder.panHandlers,
    grabberPanHandlers: handleBarPanResponder.panHandlers,
    animateClose,
  };
};

