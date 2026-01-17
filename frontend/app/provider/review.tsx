import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';
import { useProviderApplication } from '../../lib/provider-application';

export default function ProviderReviewScreen() {
  const { getToken } = useAuth();
  const { draft } = useProviderApplication();
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    const d = draft.data || {};
    if (draft.provider_type === 'vet') {
      return [
        { label: 'Type', value: 'Vet' },
        { label: 'License Number', value: d.license_number || '-' },
        { label: 'License State', value: d.license_state || '-' },
        { label: 'Specialty', value: d.specialty || '-' },
        { label: 'Years Experience', value: d.years_experience?.toString?.() || '-' },
      ];
    }
    if (draft.provider_type === 'clinic') {
      return [
        { label: 'Type', value: 'Clinic' },
        { label: 'Clinic Name', value: d.clinic_name || '-' },
        { label: 'Phone', value: d.phone || '-' },
        { label: 'Email', value: d.email || '-' },
        { label: 'Address', value: `${d.address_line1 || ''}, ${d.city || ''}, ${d.state || ''} ${d.postal_code || ''}`.trim() || '-' },
      ];
    }
    return [{ label: 'Type', value: '-' }];
  }, [draft.data, draft.provider_type]);

  const canSubmit = !!draft.provider_type;

  const submit = async () => {
    if (!draft.provider_type) {
      Alert.alert('Missing info', 'Please select Vet or Clinic and fill out the form.');
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch('/api/v1/provider-applications', {
        method: 'POST',
        body: JSON.stringify({
          provider_type: draft.provider_type,
          data: draft.data || {},
        }),
        getToken,
        tokenTemplate: 'backend',
      });
      router.replace('/provider/status');
    } catch (e: any) {
      Alert.alert('Submit failed', e?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review your application</Text>
      <Text style={styles.subtitle}>Confirm everything looks correct before submitting.</Text>

      <View style={styles.card}>
        {summary.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <Button title="Submit for Review" onPress={submit} loading={submitting} disabled={!canSubmit} style={styles.button} />
      <Text style={styles.helper}>
        After submission, our team will review your application. You’ll see updates on the status screen.
      </Text>
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
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  row: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  rowLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  button: {
    marginTop: SPACING.lg,
  },
  helper: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});


