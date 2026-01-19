import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { apiFetch } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import type { ProviderMeResponse } from '../../types/providers';
import type { ClinicDetailResponse } from '../../types/api';

export default function ProviderBusinessScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const tokenOpts = useMemo(
    () => ({
      getToken: (opts: any) => getTokenRef.current(opts),
      tokenTemplate: 'backend',
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [providerMe, setProviderMe] = useState<ProviderMeResponse | null>(null);
  const [clinicId, setClinicId] = useState<string>('');
  const [clinic, setClinic] = useState<ClinicDetailResponse | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setProviderMe(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const me = await apiFetch<ProviderMeResponse>('/api/v1/providers/me', tokenOpts);
        if (!mounted) return;
        setProviderMe(me);
        const firstClinicId = me.clinic_admin_clinics?.[0]?.id || '';
        setClinicId(firstClinicId);
      } catch {
        if (mounted) setProviderMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!clinicId) {
      setClinic(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch<ClinicDetailResponse>(`/api/v1/clinics/${clinicId}`);
        if (mounted) setClinic(res);
      } catch {
        if (mounted) setClinic(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clinicId]);

  const address = clinic
    ? `${clinic.address_line1}${clinic.address_line2 ? `, ${clinic.address_line2}` : ''}, ${clinic.city}, ${clinic.state} ${clinic.postal_code}`
    : '';

  if (!isLoaded || !isSignedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>Sign in to manage business settings.</Text>
        <Button title="Go to Profile" onPress={() => router.push('/profile')} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.helper}>Loading business…</Text>
      </View>
    );
  }

  const clinics = providerMe?.clinic_admin_clinics || [];
  const isFreelancerVet = !!providerMe?.can_manage_vet_services;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            onPress={() => router.push('/provider/manage-services')}
            style={styles.quickAction}
            activeOpacity={0.85}
          >
            <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/appointments')}
            style={styles.quickAction}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/provider/manage-services',
                params: { tab: 'payments' },
              })
            }
            style={[styles.quickAction, !isFreelancerVet && styles.quickActionDisabled]}
            activeOpacity={0.85}
          >
            <Ionicons name="card-outline" size={18} color={isFreelancerVet ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.quickActionText, !isFreelancerVet && { color: COLORS.textLight }]}>Payments</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Business profile</Text>
        {clinics.length > 0 ? <Badge label={`${clinics.length} clinic${clinics.length === 1 ? '' : 's'}`} variant="info" /> : null}
      </View>

      {clinics.length === 0 ? (
        <Card>
          <Text style={styles.helper}>
            Business configuration (logo, location, hours) is available for clinic admins. If you believe you should have access, contact support.
          </Text>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: SPACING.lg }}>
            <Text style={styles.subTitle}>Select clinic</Text>
            <View style={styles.clinicList}>
              {clinics.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setClinicId(c.id)}
                  style={[styles.clinicChip, clinicId === c.id && styles.activeClinicChip]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.clinicChipText, clinicId === c.id && styles.activeClinicChipText]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.subTitle}>Current info</Text>
            {!clinic ? (
              <Text style={styles.helper}>Couldn’t load clinic details.</Text>
            ) : (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Name</Text>
                  <Text style={styles.rowValue}>{clinic.name}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Location</Text>
                  <Text style={styles.rowValue}>{address}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Phone</Text>
                  <Text style={styles.rowValue}>{clinic.phone}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Logo</Text>
                  <Text style={styles.rowValue}>{clinic.logo_url || '—'}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                  <Button title="View public page" variant="outline" onPress={() => router.push(`/clinic/${clinicId}`)} style={{ flex: 1 }} />
                  <Button title="Edit (coming soon)" onPress={() => {}} style={{ flex: 1, opacity: 0.55 }} />
                </View>
              </>
            )}
          </Card>
        </>
      )}
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
    paddingBottom: SPACING.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  helper: {
    marginTop: 4,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  subTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionDisabled: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  quickActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.text,
  },
  clinicList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  clinicChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeClinicChip: {
    backgroundColor: '#E7F5FF',
    borderColor: COLORS.primary,
  },
  clinicChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeClinicChipText: {
    color: COLORS.primary,
  },
  row: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rowValue: {
    marginTop: 2,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
});

