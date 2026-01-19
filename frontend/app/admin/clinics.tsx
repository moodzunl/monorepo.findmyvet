import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { apiFetch } from '../../lib/api';

type ClinicSummary = {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  created_at: string;
};

export default function AdminClinicsScreen() {
  const { getToken } = useAuth();
  const [clinics, setClinics] = useState<ClinicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<ClinicSummary[]>('/api/v1/admin/clinics', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setClinics(data);
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
        data={clinics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No active clinics found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>
              {item.city}, {item.state}
            </Text>
            <Text style={styles.detail}>{item.phone}</Text>
            <Text style={styles.date}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
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
  name: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    marginBottom: 4,
  },
  detail: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
  },
  date: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
});

