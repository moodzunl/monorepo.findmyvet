import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Card } from './Card';
import { Badge } from './Badge';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../constants/theme';
import type { ClinicSummaryResponse } from '../../types/api';

interface ClinicCardProps {
  clinic: ClinicSummaryResponse;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  const address = `${clinic.address_line1}, ${clinic.city}`;
  const imageUri =
    clinic.logo_url ||
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80';

  return (
    <Link href={`/clinic/${clinic.id}`} asChild>
      <TouchableOpacity activeOpacity={0.9}>
        <Card padding="none" style={styles.card}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>{clinic.name}</Text>
              {clinic.accepts_emergency && <Badge label="24/7" variant="error" />}
            </View>
            
            <Text style={styles.address} numberOfLines={1}>
              <FontAwesome name="map-marker" size={12} color={COLORS.textLight} /> {address}
            </Text>

            <View style={styles.footer}>
              <View style={styles.rating}>
                <FontAwesome name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>
                  {(clinic.rating_average ?? 0).toFixed(1)} ({clinic.review_count})
                </Text>
              </View>
              <Badge 
                label={clinic.is_open_now ? "Open Now" : "Closed"} 
                variant={clinic.is_open_now ? "success" : "neutral"} 
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  address: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 4,
  },
});

