import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const PET_TYPES = [
  { id: 'dog', label: 'Dog', icon: 'dog' },
  { id: 'cat', label: 'Cat', icon: 'cat' },
  { id: 'bird', label: 'Bird', icon: 'bird' },
  { id: 'rabbit', label: 'Rabbit', icon: 'rabbit' },
  { id: 'other', label: 'Other', icon: 'paw' },
];

export default function PetNameScreen() {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const handleNext = () => {
    if (name && selectedType) {
      router.push('/onboarding/pet-details');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Dynamic Background - Step 1: Primary Green */}
        <View style={[styles.backgroundContainer, { backgroundColor: COLORS.primary }]}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: '25%' }]} />
              </View>
              <Text style={styles.step}>Step 1 of 4</Text>
              <Text style={styles.title}>Tell us about your pet</Text>
              <Text style={styles.subtitle}>What’s your furry friend’s name?</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Pet’s Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="e.g. Max"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <Text style={styles.label}>What kind of pet is {name || 'it'}?</Text>
              <View style={styles.typesContainer}>
                {PET_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      selectedType === type.id && styles.selectedTypeCard
                    ]}
                    onPress={() => {
                      setSelectedType(type.id);
                      Keyboard.dismiss();
                    }}
                  >
                    <MaterialCommunityIcons 
                      // @ts-ignore
                      name={type.icon} 
                      size={32} 
                      color={selectedType === type.id ? COLORS.primary : COLORS.textLight} 
                    />
                    <Text style={[
                      styles.typeLabel,
                      selectedType === type.id && styles.selectedTypeLabel
                    ]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <Button 
                title="Next Step" 
                onPress={handleNext} 
                disabled={!name || !selectedType}
                size="lg"
                style={styles.nextButton}
              />
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
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    marginBottom: SPACING.xl,
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
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '47%',
    aspectRatio: 1.3,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  selectedTypeCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  typeLabel: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  selectedTypeLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  footer: {
    paddingTop: SPACING.sm,
    backgroundColor: 'transparent',
  },
  nextButton: {
    borderRadius: RADIUS.full,
  },
});
