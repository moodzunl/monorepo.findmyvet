import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { apiFetch } from '../../lib/api';

type Stats = {
  users_count: number;
  vets_count: number;
  clinics_count: number;
  pending_applications: number;
};

export default function AdminDashboardScreen() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<Stats>('/api/v1/admin/stats', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const MENU = [
    {
      id: 'users',
      title: 'Users',
      subtitle: 'View registered users',
      icon: 'users',
      iconLibrary: FontAwesome,
      route: '/admin/users',
      color: '#3B82F6',
      badge: stats?.users_count,
    },
    {
      id: 'vets',
      title: 'Vets',
      subtitle: 'Verified veterinarians',
      icon: 'user-md',
      iconLibrary: FontAwesome,
      route: '/admin/vets',
      color: '#8B5CF6',
      badge: stats?.vets_count,
    },
    {
      id: 'clinics',
      title: 'Clinics',
      subtitle: 'Active clinics',
      icon: 'hospital-o',
      iconLibrary: FontAwesome,
      route: '/admin/clinics',
      color: '#F59E0B',
      badge: stats?.clinics_count,
    },
    {
      id: 'approvals',
      title: 'Approvals',
      subtitle: 'Pending applications',
      icon: 'clipboard-check-outline',
      iconLibrary: MaterialCommunityIcons,
      route: '/admin/approvals',
      color: '#10B981',
      badge: stats?.pending_applications,
      badgeColor: COLORS.error,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Welcome, Admin</Text>
      <Text style={styles.headerSubtitle}>Manage your platform from here.</Text>

      {loading && (
        <ActivityIndicator color={COLORS.primary} style={{ marginBottom: SPACING.lg }} />
      )}

      <View style={styles.grid}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
              <item.iconLibrary name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.badge !== undefined && (
                  <View style={[styles.badge, item.badgeColor ? { backgroundColor: item.badgeColor } : {}]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
