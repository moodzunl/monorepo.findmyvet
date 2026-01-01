import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Card } from './Card';
import { Badge } from './Badge';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../constants/theme';
import { Clinic } from '../../types';

interface ClinicCardProps {
  clinic: Clinic;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  return (
    <Link href={`/clinic/${clinic.id}`} asChild>
      <TouchableOpacity activeOpacity={0.9}>
        <Card padding="none" style={styles.card}>
          <Image source={{ uri: clinic.image }} style={styles.image} />
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>{clinic.name}</Text>
              {clinic.isEmergency && <Badge label="24/7" variant="error" />}
            </View>
            
            <Text style={styles.address} numberOfLines={1}>
              <FontAwesome name="map-marker" size={12} color={COLORS.textLight} /> {clinic.address}
            </Text>

            <View style={styles.footer}>
              <View style={styles.rating}>
                <FontAwesome name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>{clinic.rating} ({clinic.reviewCount})</Text>
              </View>
              <Badge 
                label={clinic.isOpen ? "Open Now" : "Closed"} 
                variant={clinic.isOpen ? "success" : "neutral"} 
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

