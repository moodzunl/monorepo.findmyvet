import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// Mock Data (in real app, fetch from API)
const CLINIC_DETAILS = {
  id: '1',
  name: 'City Vet Clinic',
  address: '123 Main St, New York, NY 10001',
  rating: 4.8,
  reviewCount: 124,
  image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  description: 'City Vet Clinic provides top-notch veterinary care for your pets. Our team of experienced veterinarians is dedicated to ensuring the health and well-being of your furry friends.',
  services: ['Checkups', 'Vaccinations', 'Surgery', 'Dental Care'],
  hours: 'Mon-Fri: 8am - 6pm',
  isEmergency: true,
};

export default function ClinicDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // In a real app, useQuery(id) here
  const clinic = CLINIC_DETAILS;

  return (
    <>
      <Stack.Screen options={{ 
        headerTitle: '', 
        headerTransparent: true,
        headerTintColor: COLORS.white 
      }} />
      
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: clinic.image }} style={styles.image} />
            <View style={styles.overlay} />
            <View style={styles.headerContent}>
              <Text style={styles.name}>{clinic.name}</Text>
              <View style={styles.badges}>
                <Badge label="Open Now" variant="success" style={{ marginRight: SPACING.sm }} />
                {clinic.isEmergency && <Badge label="24/7 Emergency" variant="error" />}
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            
            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <FontAwesome name="star" size={20} color="#FBBF24" />
                <Text style={styles.statValue}>{clinic.rating}</Text>
                <Text style={styles.statLabel}>{clinic.reviewCount} Reviews</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <FontAwesome name="map-marker" size={20} color={COLORS.primary} />
                <Text style={styles.statValue}>1.2 mi</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.text}>{clinic.address}</Text>
              <Text style={styles.subText}>{clinic.hours}</Text>
            </View>

            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.text}>{clinic.description}</Text>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              <View style={styles.servicesGrid}>
                {clinic.services.map((service, index) => (
                  <View key={index} style={styles.serviceTag}>
                    <Text style={styles.serviceText}>{service}</Text>
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
              <Text style={styles.price}>$50</Text>
            </View>
            <Button 
              title="Book Appointment" 
              onPress={() => router.push('/booking')} 
              size="lg"
              style={{ width: 200 }}
            />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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

