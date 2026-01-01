import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const THEME_COLOR = '#10B981'; // Success Green for Step 4

export default function CompleteScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Dynamic Background - Step 4: Success Green */}
      <View style={[styles.backgroundContainer, { backgroundColor: THEME_COLOR }]}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="check" size={50} color={COLORS.white} />
            </View>
            
            <Text style={styles.title}>All Set!</Text>
            <Text style={styles.subtitle}>Your profile has been created successfully. You're ready to find the best care for your pet.</Text>

            <View style={styles.spacer} />

            <Button 
              title="Get Started" 
              onPress={() => router.replace('/(tabs)')} 
              size="lg"
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backgroundCircle2: {
    position: 'absolute',
    top: 50,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: SPACING.xl,
    paddingVertical: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
  },
  spacer: {
    height: SPACING.md,
  },
  button: {
    width: '100%',
    borderRadius: RADIUS.full,
    backgroundColor: THEME_COLOR,
  },
});
