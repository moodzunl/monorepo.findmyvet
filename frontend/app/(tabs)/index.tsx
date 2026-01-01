import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ClinicCard } from '../../components/ui/ClinicCard';
import { Card } from '../../components/ui/Card';
import { Clinic, Appointment } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { AppointmentCard } from '../../components/ui/AppointmentCard';
import { useUser } from '@clerk/clerk-expo';

// Mock Data
const NEARBY_CLINICS: Clinic[] = [
  {
    id: '1',
    name: 'City Vet Clinic',
    address: '123 Main St, New York',
    rating: 4.8,
    reviewCount: 124,
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isOpen: true,
    nextAvailable: 'Today, 2:00 PM',
    isEmergency: true,
  },
  {
    id: '2',
    name: 'Paws & Claws Care',
    address: '456 Park Ave, Brooklyn',
    rating: 4.5,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isOpen: true,
    nextAvailable: 'Tomorrow, 10:00 AM',
    isEmergency: false,
  },
];

const CATEGORIES = [
  { id: '1', name: 'Veterinary', icon: 'stethoscope' as const, color: '#2E7D32', iconColor: '#2E7D32' },
  { id: '2', name: 'Grooming', icon: 'scissors' as const, color: '#F57C00', iconColor: '#F57C00' },
  { id: '3', name: 'Boarding', icon: 'home' as const, color: '#0284C7', iconColor: '#0284C7' },
  { id: '4', name: 'Pharmacy', icon: 'medkit' as const, color: '#9C27B0', iconColor: '#9C27B0' },
];

const RECENTLY_VIEWED = [
  { id: '3', name: 'Happy Tails', image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', rating: 4.9 },
  { id: '4', name: 'Downtown Vet', image: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', rating: 4.2 },
  { id: '5', name: 'Pet Wellness', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', rating: 4.6 },
];

const UPCOMING_APPOINTMENT: Appointment = {
  id: 'home-upcoming',
  clinicName: 'City Vet Clinic',
  date: '2023-10-12',
  time: '10:00 AM',
  petName: 'Max',
  status: 'upcoming',
  type: 'Vaccination',
};

export default function HomeScreen() {
  const { user } = useUser();
  const greetingName = user?.firstName ?? user?.fullName ?? 'there';

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          <AppointmentCard appointment={UPCOMING_APPOINTMENT} />
        </View>

        {/* Recently Viewed */}
        <View style={[styles.section, { marginBottom: SPACING.sm }]}>
          <Text style={styles.sectionTitle}>Recently Viewed</Text>
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
        </View>

        {/* Nearby Clinics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.nearbyTitle]}>Nearby Clinics</Text>
            <Text style={styles.seeAll}>See All</Text>
          </View>
          {NEARBY_CLINICS.map((clinic) => (
            <View key={clinic.id} style={styles.nearbyCardWrap}>
              <ClinicCard clinic={clinic} />
            </View>
          ))}
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
    paddingBottom: SPACING.xl,
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
});
