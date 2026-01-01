import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: COLORS.primaryLight, text: COLORS.primary };
      case 'warning': return { bg: COLORS.secondaryLight, text: COLORS.secondary };
      case 'error': return { bg: '#FEE2E2', text: COLORS.error }; // Soft red
      case 'info': return { bg: '#E0F2FE', text: '#0284C7' }; // Soft blue
      default: return { bg: COLORS.surface, text: COLORS.textLight };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});

