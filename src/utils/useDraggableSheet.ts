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

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setIsExpanded(false);
      setIsDragging(false);
    }
  }, [visible, translateY]);

  const animateClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onCloseRef.current();
      }
    });
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
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 210,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onCloseRef.current();
        }
      });
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
        translateY.stopAnimation();
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
        translateY.stopAnimation();
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

