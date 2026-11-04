import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  leftIconName,
  isPassword = false,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);
  const inputRef = useRef<any>(null);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[typography.caption, styles.label]}>{label}</Text>}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {leftIconName && (
          <View style={styles.leftIcon}>
            <Ionicons
              name={leftIconName}
              size={20}
              color={
                error
                  ? colors.error
                  : isFocused
                  ? colors.primary.light
                  : colors.dark.textMuted
              }
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          placeholderTextColor={colors.dark.textMuted}
          style={[styles.input, leftIconName ? { paddingLeft: 4 } : null]}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          underlineColorAndroid="transparent"
          {...inputProps}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={12}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.dark.textSecondary}
            />
          </Pressable>
        )}
      </Pressable>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={[typography.caption, styles.errorText]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: colors.dark.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.cardElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  leftIcon: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.dark.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
});
