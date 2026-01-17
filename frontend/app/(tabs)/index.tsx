import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ClinicCard } from '../../components/ui/ClinicCard';
import { Card } from '../../components/ui/Card';
import { Appointment } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { AppointmentCard } from '../../components/ui/AppointmentCard';
import { useUser } from '@clerk/clerk-expo';
import { useAuth } from '@clerk/clerk-expo';
import { apiFetch } from '../../lib/api';
import type { ClinicSearchResponse, ClinicSummaryResponse } from '../../types/api';

const CATEGORIES = [
  { id: '1', name: 'Veterinary', icon: 'stethoscope' as const, color: '#2E7D32', iconColor: '#2E7D32' },
  { id: '2', name: 'Grooming', icon: 'scissors' as const, color: '#F57C00', iconColor: '#F57C00' },
  { id: '3', name: 'Boarding', icon: 'home' as const, color: '#0284C7', iconColor: '#0284C7' },
  { id: '4', name: 'Pharmacy', icon: 'medkit' as const, color: '#9C27B0', iconColor: '#9C27B0' },
];

const RECENTLY_VIEWED: Array<{ id: string; name: string; image: string; rating: number }> = [];

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const greetingName = user?.firstName ?? user?.fullName ?? 'there';
  const [clinics, setClinics] = useState<ClinicSummaryResponse[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [clinicsError, setClinicsError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingClinics(true);
        setClinicsError(null);
        // NOTE: Until we add real location, default to SF coordinates.
        const res = await apiFetch<ClinicSearchResponse>('/api/v1/clinics/search', {
          method: 'POST',
          body: JSON.stringify({
            latitude: 37.7749,
            longitude: -122.4194,
            radius_km: 50,
            page: 1,
            page_size: 10,
          }),
        });
        if (mounted) setClinics(res.clinics);
      } catch (e: any) {
        if (mounted) setClinicsError(e?.message || 'Failed to load clinics');
      } finally {
        if (mounted) setLoadingClinics(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setUpcoming(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch<any>('/api/v1/appointments?upcoming=true&page=1&page_size=1', {
          method: 'GET',
          getToken: getTokenRef.current,
          tokenTemplate: 'backend',
        });
        const a = res?.appointments?.[0];
        if (!a || !mounted) return;
        setUpcoming({
          id: String(a.id),
          clinicName: a?.clinic?.name || 'Clinic',
          date: String(a.scheduled_date),
          time: String(a.scheduled_start || '').slice(0, 5),
          petName: a?.pet?.name || 'Pet',
          status: 'upcoming',
          type: 'Checkup',
        });
      } catch {
        // ignore on home
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, userId]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PageHeader>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.username}>{greetingName}</Text>
          </View>
          <Button 
            title="SOS" 
            onPress={() => {}} 
            variant="danger" 
            size="sm"
            style={styles.emergencyButton} 
          />
        </View>
      </PageHeader>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        
        {/* Categories (Circles with Icons) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                  <FontAwesome name={cat.icon} size={24} color={COLORS.white} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Appointment */}
        {upcoming && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <AppointmentCard appointment={upcoming} />
          </View>
        )}

        {/* Recently Viewed */}
        <View style={[styles.section, { marginBottom: SPACING.sm }]}>
          <Text style={styles.sectionTitle}>Recently Viewed</Text>
          {RECENTLY_VIEWED.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {RECENTLY_VIEWED.map(item => (
                <TouchableOpacity key={item.id} activeOpacity={0.9}>
                  <Card style={styles.recentCard} padding="none">
                    <Image source={{ uri: item.image }} style={styles.recentImage} />
                    <View style={styles.recentContent}>
                      <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.ratingRow}>
                        <FontAwesome name="star" size={12} color="#FBBF24" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.placeholderCard}>
              <FontAwesome name="history" size={24} color={COLORS.textLight} style={{ opacity: 0.5, marginBottom: SPACING.xs }} />
              <Text style={styles.placeholderText}>
                This area will display your recently viewed clinics
              </Text>
            </View>
          )}
        </View>

        {/* Nearby Clinics */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.nearbyTitle]}>Nearby Clinics</Text>
            <Text style={styles.seeAll}>See All</Text>
          </View>
          {loadingClinics ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading clinics…</Text>
            </View>
          ) : clinicsError ? (
            <Text style={styles.errorText}>{clinicsError}</Text>
          ) : clinics.length === 0 ? (
            <View style={styles.nearbyPlaceholdersContainer}>
              <View style={styles.nearbyPlaceholderCard}>
                <View style={styles.placeholderIconCircle}>
                  <FontAwesome name="user-md" size={24} color={COLORS.textLight} style={{ opacity: 0.6 }} />
                </View>
                <Text style={styles.placeholderTitle}>Nearby Clinics or Doctors</Text>
                <Text style={styles.placeholderSubtitle}>Once we find vets in your area, they'll appear here</Text>
              </View>

              <View style={styles.nearbyPlaceholderCard}>
                <View style={styles.placeholderIconCircle}>
                  <FontAwesome name="plus" size={20} color={COLORS.textLight} style={{ opacity: 0.6 }} />
                </View>
                <Text style={styles.placeholderTitle}>Feeling lonely?</Text>
                <Text style={styles.placeholderSubtitle}>Invite more clinics or vets to join FindMyVet</Text>
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>Invite Vets</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            clinics.map((clinic, index) => (
              <View key={clinic.id} style={[styles.nearbyCardWrap, index === clinics.length - 1 && { marginBottom: 0 }]}>
                <ClinicCard clinic={clinic} />
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    marginTop: -SPACING.xl,
    zIndex: 0,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  greeting: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  username: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.white,
  },
  emergencyButton: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    borderWidth: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minWidth: 64,
    minHeight: 56,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  nearbyTitle: {
    fontSize: FONT_SIZE.xl,
    marginBottom: 0,
  },
  nearbyCardWrap: {
    marginBottom: SPACING.lg,
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  recentCard: {
    width: 140,
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  recentImage: {
    width: '100%',
    height: 90,
    backgroundColor: COLORS.surface,
  },
  recentContent: {
    padding: SPACING.sm,
  },
  recentName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: '#EF4444',
    paddingVertical: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    paddingVertical: SPACING.md,
  },
  placeholderCard: {
    height: 110,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dotted',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.03)',
    marginHorizontal: 2,
    marginTop: SPACING.xs,
  },
  placeholderText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: '80%',
    lineHeight: 20,
  },
  nearbyPlaceholdersContainer: {
    gap: SPACING.md,
  },
  nearbyPlaceholderCard: {
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dotted',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.03)',
  },
  placeholderIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  placeholderTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  inviteButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
  },
  inviteButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
});
