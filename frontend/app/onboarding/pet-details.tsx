import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SIZES = ['Small', 'Medium', 'Large', 'Giant'];
const GENDERS = ['Male', 'Female'];

export default function PetDetailsScreen() {
  const { petName, speciesKey } = useLocalSearchParams();
  const nameParam = typeof petName === 'string' ? petName : Array.isArray(petName) ? petName[0] : '';
  const speciesParam = typeof speciesKey === 'string' ? speciesKey : Array.isArray(speciesKey) ? speciesKey[0] : '';

  const [breed, setBreed] = useState('');
  const [size, setSize] = useState('');
  const [gender, setGender] = useState('');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Dynamic Background - Step 2: Secondary Orange */}
        <View style={[styles.backgroundContainer, { backgroundColor: COLORS.secondary }]}>
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
                <View style={[styles.progressBar, { width: '50%' }]} />
              </View>
              
              <Text style={styles.step}>Step 2 of 4</Text>
              <Text style={styles.title}>A bit more detail</Text>
              <Text style={styles.subtitle}>Help us understand their needs.</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Breed</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="e.g. Golden Retriever"
                    style={styles.input}
                    value={breed}
                    onChangeText={setBreed}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Size</Text>
                <View style={styles.chipsContainer}>
                  {SIZES.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, size === s && styles.activeChip]}
                      onPress={() => {
                        setSize(s);
                        Keyboard.dismiss();
                      }}
                    >
                      <Text style={[styles.chipText, size === s && styles.activeChipText]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipsContainer}>
                  {GENDERS.map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, gender === g && styles.activeChip]}
                      onPress={() => {
                        setGender(g);
                        Keyboard.dismiss();
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={g === 'Male' ? 'gender-male' : 'gender-female'} 
                        size={16} 
                        color={gender === g ? COLORS.secondary : COLORS.textLight}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, gender === g && styles.activeChipText]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.footer}>
                <Button 
                  title="Next Step" 
                  onPress={() =>
                    router.push({
                      pathname: '/onboarding/pet-health',
                      params: {
                        petName: nameParam,
                        speciesKey: speciesParam,
                        breed,
                        size,
                        gender,
                      },
                    })
                  } 
                  disabled={!breed || !size || !gender}
                  size="lg"
                  variant="secondary"
                  style={styles.nextButton}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeChip: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  chipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.secondary,
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
