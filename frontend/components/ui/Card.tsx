import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, padding = 'md' }) => {
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return SPACING.sm;
      case 'lg': return SPACING.lg;
      default: return SPACING.md;
    }
  };

  const Container = onPress ? Pressable : View;

  return (
    <Container 
      style={[styles.container, { padding: getPadding() }, style]}
      onPress={onPress}
      // @ts-ignore
      android_ripple={onPress ? { color: COLORS.border } : null}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

