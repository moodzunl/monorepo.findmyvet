import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useProviderApplication } from '../../lib/provider-application';

export default function VetDetailsScreen() {
  const { draft, updateData } = useProviderApplication();

  const [licenseNumber, setLicenseNumber] = useState<string>(draft.data?.license_number || '');
  const [licenseState, setLicenseState] = useState<string>(draft.data?.license_state || '');
  const [specialty, setSpecialty] = useState<string>(draft.data?.specialty || '');
  const [years, setYears] = useState<string>(draft.data?.years_experience?.toString?.() || '');

  const handleNext = () => {
    updateData({
      license_number: licenseNumber.trim(),
      license_state: licenseState.trim(),
      specialty: specialty.trim() || null,
      years_experience: years.trim() ? Number(years.trim()) : null,
    });
    router.push('/provider/review');
  };

  const disabled = !licenseNumber.trim() || !licenseState.trim();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vet verification details</Text>
      <Text style={styles.subtitle}>
        Add your license details so our team can review your application.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>License Number *</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="e.g. 123456"
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>License State *</Text>
        <TextInput
          style={styles.input}
          value={licenseState}
          onChangeText={setLicenseState}
          placeholder="e.g. CA"
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Specialty (optional)</Text>
        <TextInput
          style={styles.input}
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="e.g. Surgery"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Years of experience (optional)</Text>
        <TextInput
          style={styles.input}
          value={years}
          onChangeText={setYears}
          placeholder="e.g. 5"
          placeholderTextColor={COLORS.textLight}
          keyboardType="number-pad"
        />
      </View>

      <Button title="Continue" onPress={handleNext} disabled={disabled} style={styles.button} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  button: {
    marginTop: SPACING.md,
  },
});


