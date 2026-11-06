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
    }).start(() => {
      onCloseRef.current();
      translateY.setValue(0);
    });
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
        setIsDragging(false);

        // 1. Deslizar hacia ARRIBA -> Expandir ventana al máximo
        if (gestureState.dy < -40 || gestureState.vy < -0.5) {
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
        if (
          isExpandedRef.current &&
          gestureState.dy > 50 &&
          gestureState.dy < 165 &&
          gestureState.vy < 1.1
        ) {
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

        // 3. Deslizar hacia ABAJO fuerte -> Cerrar ventana flotante (Modo Invitado / Cerrar)
        if (gestureState.dy > 105 || gestureState.vy > 0.75) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            // ignore
          }
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 210,
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current();
            translateY.setValue(0);
          });
          return;
        }

        // 4. Si soltó antes del límite -> Rebote elástico a su posición
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 7,
        }).start();
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
        // Delega la misma lógica de soltado
        panResponder.panHandlers.onResponderRelease?.({} as any);
        setIsDragging(false);

        if (gestureState.dy < -35 || gestureState.vy < -0.45) {
          setIsExpanded(true);
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        if (
          isExpandedRef.current &&
          gestureState.dy > 45 &&
          gestureState.dy < 160 &&
          gestureState.vy < 1.1
        ) {
          setIsExpanded(false);
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
          return;
        }

        if (gestureState.dy > 95 || gestureState.vy > 0.65) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            // ignore
          }
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 210,
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current();
            translateY.setValue(0);
          });
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 7,
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
