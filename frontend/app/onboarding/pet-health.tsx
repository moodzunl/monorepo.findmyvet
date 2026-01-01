import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const PERSONALITIES = ['Playful', 'Calm', 'Aggressive', 'Shy', 'Energetic', 'Friendly'];
const THEME_COLOR = '#0284C7'; // Blue for Step 3
const THEME_LIGHT = '#E0F2FE';

export default function PetHealthScreen() {
  const [allergies, setAllergies] = useState('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
    Keyboard.dismiss(); // Dismiss keyboard when selecting traits
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Dynamic Background - Step 3: Blue */}
        <View style={[styles.backgroundContainer, { backgroundColor: THEME_COLOR }]}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: '75%' }]} />
              </View>
              
              <Text style={styles.step}>Step 3 of 4</Text>
              <Text style={styles.title}>Health & Personality</Text>
              <Text style={styles.subtitle}>Any special considerations?</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Allergies (Optional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="e.g. Chicken, Pollen"
                    style={styles.input}
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Personality Traits</Text>
                <View style={styles.chipsContainer}>
                  {PERSONALITIES.map(trait => (
                    <TouchableOpacity
                      key={trait}
                      style={[
                        styles.chip, 
                        selectedTraits.includes(trait) && styles.activeChip
                      ]}
                      onPress={() => toggleTrait(trait)}
                    >
                      <Text style={[
                        styles.chipText, 
                        selectedTraits.includes(trait) && styles.activeChipText
                      ]}>{trait}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.footer}>
                <Button 
                  title="Finish Profile" 
                  onPress={() => router.push('/onboarding/complete')} 
                  size="lg"
                  style={[styles.nextButton, { backgroundColor: THEME_COLOR }]}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
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
    height: height * 0.4,
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
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  step: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.9)',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: SPACING.xl,
    flex: 1,
  },
  formGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  input: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  activeChip: {
    borderColor: THEME_COLOR,
    backgroundColor: THEME_LIGHT,
  },
  chipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  activeChipText: {
    color: THEME_COLOR,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
  },
  nextButton: {
    borderRadius: RADIUS.full,
  },
});
