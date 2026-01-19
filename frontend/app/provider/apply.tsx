import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { useProviderApplication } from '../../lib/provider-application';

export default function ProviderApplyScreen() {
  const { setProviderType, reset } = useProviderApplication();

  const pick = (type: 'vet' | 'clinic') => {
    reset();
    setProviderType(type);
    router.push(type === 'vet' ? '/provider/vet-details' : '/provider/clinic-details');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apply to become a provider</Text>
      <Text style={styles.subtitle}>
        Submit your details for review. Once approved, you’ll get access to provider tools.
      </Text>

      <TouchableOpacity style={styles.card} onPress={() => pick('vet')} activeOpacity={0.85}>
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <FontAwesome name="stethoscope" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>I’m a Vet</Text>
            <Text style={styles.cardSubtitle}>License + professional details</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => pick('clinic')} activeOpacity={0.85}>
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <FontAwesome name="hospital-o" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>I manage a Clinic</Text>
            <Text style={styles.cardSubtitle}>Clinic name + contact + address</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/provider/status')} style={styles.statusLink}>
        <Text style={styles.statusLinkText}>Already applied? View application status</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
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
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  statusLinkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});


