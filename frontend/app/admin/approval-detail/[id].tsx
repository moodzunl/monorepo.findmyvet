import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { ProviderApplication } from '../../../types/provider';

export default function AdminApprovalDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [app, setApp] = useState<ProviderApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    const load = async () => {
      try {
        // We can reuse the filter endpoint for now, or fetch by ID if we exposed one.
        // Actually, fetching the list and finding by ID is okay for MVP since volume is low,
        // but let's assume we can fetch detail. For now, I'll filter the list since I didn't make a GET /:id endpoint.
        // Wait, I can just use the list endpoint and filter client-side for MVP speed.
        const list = await apiFetch<ProviderApplication[]>('/api/v1/admin/provider-applications', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        const found = list.find((a) => a.id === id);
        setApp(found || null);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDecide = async (decision: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      await apiFetch(`/api/v1/admin/provider-applications/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          rejection_reason: decision === 'rejected' ? 'Does not meet criteria (Admin Action)' : undefined,
        }),
        getToken: (opts) => getTokenRef.current(opts),
        tokenTemplate: 'backend',
      });
      Alert.alert('Success', `Application ${decision}`);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  if (!app) return <View style={styles.center}><Text>Application not found.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>
        {app.provider_type === 'vet' ? 'Vet Application' : 'Clinic Application'}
      </Text>
      <Text style={styles.headerSubtitle}>ID: {app.id}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Application Data</Text>
        {Object.entries(app.data).map(([key, val]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{key.replace(/_/g, ' ')}</Text>
            <Text style={styles.value}>{String(val)}</Text>
          </View>
        ))}
        
        <View style={[styles.row, { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md }]}>
          <Text style={styles.label}>Submitted At</Text>
          <Text style={styles.value}>{new Date(app.submitted_at).toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { fontWeight: 'bold' }]}>{app.status.toUpperCase()}</Text>
        </View>
      </View>

      {app.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            title="Reject"
            variant="danger"
            onPress={() => handleDecide('rejected')}
            loading={processing}
            style={styles.actionBtn}
          />
          <Button
            title="Approve"
            variant="primary"
            onPress={() => handleDecide('approved')}
            loading={processing}
            style={styles.actionBtn}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    fontFamily: 'Courier',
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  value: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    flex: 1,
  },
});

