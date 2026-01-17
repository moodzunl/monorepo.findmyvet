import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { apiFetch } from '../../lib/api';
import { ProviderApplication } from '../../types/provider';

export default function AdminApprovalsScreen() {
  const { getToken } = useAuth();
  const [apps, setApps] = useState<ProviderApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ProviderApplication[]>('/api/v1/admin/provider-applications?status=pending', {
        getToken: (opts) => getTokenRef.current(opts),
        tokenTemplate: 'backend',
      });
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={apps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending applications.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/admin/approval-detail/${item.id}`)}
          >
            <View style={styles.row}>
              <Text style={styles.type}>
                {item.provider_type === 'vet' ? 'Vet Application' : 'Clinic Application'}
              </Text>
              <Text style={styles.date}>{new Date(item.submitted_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.detail}>
              {item.provider_type === 'vet'
                ? `License: ${item.data.license_number} (${item.data.license_state})`
                : `Clinic: ${item.data.clinic_name}`}
            </Text>
            <Text style={styles.status}>Status: Pending</Text>
          </TouchableOpacity>
        )}
      />
    </View>
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
  list: {
    padding: SPACING.md,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  type: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  date: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
  },
  detail: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginBottom: 4,
  },
  status: {
    color: COLORS.secondary, // Orange/Yellow
    fontWeight: '600',
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
});

