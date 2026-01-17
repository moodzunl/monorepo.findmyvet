import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { apiFetch } from '../../lib/api';

type UserSummary = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

export default function AdminUsersScreen() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<UserSummary[]>('/api/v1/admin/users', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setUsers(data);
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
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.name}>
              {item.first_name} {item.last_name || ''}
            </Text>
            <Text style={styles.id}>ID: {item.id}</Text>
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
    marginBottom: 4,
  },
  email: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  date: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
  },
  name: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginBottom: 4,
  },
  id: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Courier',
  },
});

