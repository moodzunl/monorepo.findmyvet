import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  children,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Background Layer with Shape and Shadow */}
      <View style={styles.backgroundLayer}>
        {/* Decorative Mask for Circles */}
        <View style={styles.decorationMask}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Transparent container for layout
    backgroundColor: 'transparent',
    paddingBottom: SPACING.xl,
    marginBottom: 0,
    zIndex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    // Shadow on the background layer
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: -1,
  },
  decorationMask: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    top: 20,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  safeArea: {
    width: '100%',
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.md,
  },
});
