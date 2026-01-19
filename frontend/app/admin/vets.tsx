import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { apiFetch } from '../../lib/api';

type VetSummary = {
  id: string;
  license_number: string;
  specialty: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

export default function AdminVetsScreen() {
  const { getToken } = useAuth();
  const [vets, setVets] = useState<VetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<VetSummary[]>('/api/v1/admin/vets', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setVets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
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
        data={vets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No verified vets found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>
                Dr. {item.first_name} {item.last_name || ''}
              </Text>
              <Text style={styles.specialty}>{item.specialty || 'General'}</Text>
            </View>
            <Text style={styles.detail}>License: {item.license_number}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
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
  empty: {
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
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  specialty: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  detail: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
  },
  email: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
  },
});

