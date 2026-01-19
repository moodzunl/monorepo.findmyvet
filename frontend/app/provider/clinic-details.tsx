import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useProviderApplication } from '../../lib/provider-application';

export default function ClinicDetailsScreen() {
  const { draft, updateData } = useProviderApplication();

  const [clinicName, setClinicName] = useState<string>(draft.data?.clinic_name || '');
  const [phone, setPhone] = useState<string>(draft.data?.phone || '');
  const [email, setEmail] = useState<string>(draft.data?.email || '');
  const [address1, setAddress1] = useState<string>(draft.data?.address_line1 || '');
  const [city, setCity] = useState<string>(draft.data?.city || '');
  const [state, setState] = useState<string>(draft.data?.state || '');
  const [postal, setPostal] = useState<string>(draft.data?.postal_code || '');

  const handleNext = () => {
    updateData({
      clinic_name: clinicName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      address_line1: address1.trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postal.trim(),
    });
    router.push('/provider/review');
  };

  const disabled =
    !clinicName.trim() || !phone.trim() || !address1.trim() || !city.trim() || !state.trim() || !postal.trim();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Clinic details</Text>
      <Text style={styles.subtitle}>
        Provide your clinic’s info so our team can verify it.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Clinic Name *</Text>
        <TextInput
          style={styles.input}
          value={clinicName}
          onChangeText={setClinicName}
          placeholder="e.g. Happy Paws Veterinary"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Clinic Phone *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. +1 555 123 4567"
          placeholderTextColor={COLORS.textLight}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Clinic Email (optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. hello@clinic.com"
          placeholderTextColor={COLORS.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Address Line 1 *</Text>
        <TextInput
          style={styles.input}
          value={address1}
          onChangeText={setAddress1}
          placeholder="e.g. 123 Main St"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.section, styles.flex1, styles.rowLeft]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={[styles.section, styles.flex1]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            placeholder="State"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Postal Code *</Text>
        <TextInput
          style={styles.input}
          value={postal}
          onChangeText={setPostal}
          placeholder="e.g. 94105"
          placeholderTextColor={COLORS.textLight}
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
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  rowLeft: {
    marginRight: SPACING.sm,
  },
  button: {
    marginTop: SPACING.md,
  },
});


