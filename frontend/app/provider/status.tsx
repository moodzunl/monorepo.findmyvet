import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';
import { ProviderApplicationMeResponse } from '../../types/provider';
import type { ProviderMeResponse } from '../../types/providers';

export default function ProviderStatusScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ProviderApplicationMeResponse['application']>(null);
  const [providerMe, setProviderMe] = useState<ProviderMeResponse | null>(null);

  const load = async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      setLoading(true);
      const res = await apiFetch<ProviderApplicationMeResponse>('/api/v1/provider-applications/me', {
        getToken: (opts) => getTokenRef.current(opts),
        tokenTemplate: 'backend',
      });
      setApplication(res.application);

      // Capabilities for verified accounts without an application row
      try {
        const me = await apiFetch<ProviderMeResponse>('/api/v1/providers/me', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setProviderMe(me);
      } catch {
        setProviderMe(null);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load application status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>No application yet</Text>
          <Text style={styles.subtitle}>Start an application to become a Vet or Clinic provider.</Text>
          {(providerMe?.can_manage_vet_services || (providerMe?.clinic_admin_clinics?.length || 0) > 0) ? (
            <Button title="Manage Services" onPress={() => router.push('/provider/manage-services')} style={{ marginTop: SPACING.md }} />
          ) : (
            <Button title="Start Application" onPress={() => router.push('/provider/apply')} style={{ marginTop: SPACING.md }} />
          )}
        </View>
      </View>
    );
  }

  const statusColor =
    application.status === 'approved'
      ? COLORS.success
      : application.status === 'rejected'
      ? COLORS.error
      : COLORS.secondary;

  const statusLabel =
    application.status === 'approved'
      ? 'Approved'
      : application.status === 'rejected'
      ? 'Rejected'
      : 'Pending Review';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Application</Text>
          <View style={[styles.badge, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}40` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          Type: <Text style={styles.metaStrong}>{application.provider_type === 'vet' ? 'Vet' : 'Clinic'}</Text>
        </Text>
        <Text style={styles.meta}>
          Submitted: <Text style={styles.metaStrong}>{new Date(application.submitted_at).toLocaleString()}</Text>
        </Text>

        {application.status === 'rejected' && !!application.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionTitle}>Reason</Text>
            <Text style={styles.rejectionText}>{application.rejection_reason}</Text>
          </View>
        )}

        <Button title="Refresh Status" variant="outline" onPress={load} style={{ marginTop: SPACING.md }} />

        {(application.status === 'approved' ||
          providerMe?.can_manage_vet_services ||
          (providerMe?.clinic_admin_clinics?.length || 0) > 0) && (
          <Button
            title="Manage Services"
            onPress={() => router.push('/provider/manage-services')}
            style={{ marginTop: SPACING.sm }}
          />
        )}

        {application.status === 'rejected' && (
          <TouchableOpacity onPress={() => router.push('/provider/apply')} style={styles.resubmitLink}>
            <Text style={styles.resubmitText}>Fix details and resubmit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textLight,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  meta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: 6,
  },
  metaStrong: {
    color: COLORS.text,
    fontWeight: '700',
  },
  rejectionBox: {
    marginTop: SPACING.md,
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  rejectionTitle: {
    fontWeight: '800',
    color: COLORS.error,
    marginBottom: 4,
  },
  rejectionText: {
    color: COLORS.text,
    lineHeight: 20,
  },
  resubmitLink: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  resubmitText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});


