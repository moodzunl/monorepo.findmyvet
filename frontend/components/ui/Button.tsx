import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.border;
    switch (variant) {
      case 'primary': return COLORS.primary;
      case 'secondary': return COLORS.secondary;
      case 'danger': return COLORS.error;
      case 'outline': return 'transparent';
      default: return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textLight;
    switch (variant) {
      case 'outline': return COLORS.primary;
      default: return COLORS.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm };
      case 'lg': return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl };
      default: return { paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        getPadding(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize: size === 'lg' ? FONT_SIZE.lg : FONT_SIZE.md }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // Removed overflow hidden which might cause clipping issues with shadows or custom shapes
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  text: {
    fontWeight: '600',
  },
});
