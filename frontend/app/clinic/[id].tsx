import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiFetch } from '../../lib/api';
import type { ClinicDetailResponse } from '../../types/api';

export default function ClinicDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const clinicId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const [clinic, setClinic] = useState<ClinicDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<ClinicDetailResponse>(`/api/v1/clinics/${clinicId}`);
        if (mounted) setClinic(res);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load clinic');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clinicId]);

  const heroImage = clinic?.logo_url
    ? clinic.logo_url
    : 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=80';

  const address = clinic
    ? `${clinic.address_line1}${clinic.address_line2 ? `, ${clinic.address_line2}` : ''}, ${clinic.city}, ${clinic.state} ${clinic.postal_code}`
    : '';

  const primaryService = clinic?.services?.[0];

  return (
    <>
      <Stack.Screen options={{ 
        headerTitle: '', 
        headerTransparent: true,
        headerTintColor: COLORS.white 
      }} />
      
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading clinic…</Text>
          </View>
        ) : error || !clinic ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>{error || 'Clinic not found'}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: heroImage }} style={styles.image} />
            <View style={styles.overlay} />
            <View style={styles.headerContent}>
              <Text style={styles.name}>{clinic.name}</Text>
              <View style={styles.badges}>
                <Badge label={clinic.is_open_now ? "Open Now" : "Closed"} variant={clinic.is_open_now ? "success" : "neutral"} style={{ marginRight: SPACING.sm }} />
                {clinic.accepts_emergency && <Badge label="24/7 Emergency" variant="error" />}
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            
            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <FontAwesome name="star" size={20} color="#FBBF24" />
                <Text style={styles.statValue}>{(clinic.rating_average ?? 0).toFixed(1)}</Text>
                <Text style={styles.statLabel}>{clinic.review_count} Reviews</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <FontAwesome name="map-marker" size={20} color={COLORS.primary} />
                <Text style={styles.statValue}>—</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.text}>{address}</Text>
              <Text style={styles.subText}>{clinic.timezone}</Text>
            </View>

            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.text}>{clinic.description || '—'}</Text>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              <View style={styles.servicesGrid}>
                {clinic.services.map((service) => (
                  <View key={service.id} style={styles.serviceTag}>
                    <Text style={styles.serviceText}>{service.name}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <SafeAreaView style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.priceLabel}>Consultation</Text>
              <Text style={styles.price}>
                {primaryService?.price_cents ? `$${(primaryService.price_cents / 100).toFixed(0)}` : '—'}
              </Text>
            </View>
            <Button 
              title="Book Appointment" 
              onPress={() =>
                router.push({
                  pathname: '/booking',
                  params: {
                    clinicId: clinic.id,
                    serviceId: primaryService?.id?.toString() || '',
                  },
                })
              } 
              size="lg"
              style={{ width: 200 }}
            />
          </View>
        </SafeAreaView>
      </View>
        )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: '#EF4444',
    textAlign: 'center',
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  badges: {
    flexDirection: 'row',
  },
  content: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    marginTop: -RADIUS.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  subText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  serviceTag: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
  },
  serviceText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  priceLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
});

