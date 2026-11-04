import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Si la plataforma no soporta haptics no interrumpe
    }
    onPress();
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      case 'md':
      default:
        return { paddingVertical: 14, paddingHorizontal: 20 };
    }
  };

  const renderContent = () => (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary.DEFAULT : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text
            style={[
              typography.button,
              styles.textBase,
              variant === 'outline' && styles.textOutline,
              variant === 'ghost' && styles.textGhost,
              variant === 'secondary' && styles.textSecondary,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </>
      )}
    </View>
  );

  const containerAnimatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: disabled ? 0.5 : 1,
  };

  if (variant === 'primary') {
    return (
      <Animated.View style={[styles.wrapper, containerAnimatedStyle, style]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || loading}
          style={styles.pressable}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, getPadding()]}
          >
            {renderContent()}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'accent') {
    return (
      <Animated.View style={[styles.wrapper, containerAnimatedStyle, style]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || loading}
          style={styles.pressable}
        >
          <LinearGradient
            colors={colors.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, getPadding()]}
          >
            {renderContent()}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrapper, containerAnimatedStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.pressable,
          styles.solidContainer,
          variant === 'outline' && styles.outlineContainer,
          variant === 'ghost' && styles.ghostContainer,
          variant === 'secondary' && styles.secondaryContainer,
          getPadding(),
        ]}
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: 16,
  },
  gradient: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  solidContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineContainer: {
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'transparent',
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  secondaryContainer: {
    backgroundColor: colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  textBase: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textOutline: {
    color: colors.primary.light,
  },
  textGhost: {
    color: colors.dark.textSecondary,
  },
  textSecondary: {
    color: colors.dark.textPrimary,
  },
});

