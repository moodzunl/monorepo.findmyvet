import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { ClinicCard } from '../../components/ui/ClinicCard';
import { Clinic } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';

// Mock Data (Extended)
const ALL_CLINICS: Clinic[] = [
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
  {
    id: '3',
    name: 'Happy Tails Veterinary',
    address: '789 Broadway, New York',
    rating: 4.9,
    reviewCount: 210,
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isOpen: false,
    nextAvailable: 'Mon, 9:00 AM',
    isEmergency: true,
  },
  {
    id: '4',
    name: 'Downtown Pet Hospital',
    address: '101 5th Ave, New York',
    rating: 4.2,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isOpen: true,
    nextAvailable: 'Today, 4:30 PM',
    isEmergency: false,
  },
];

const FILTERS = ['All', 'Open Now', 'Emergency', 'Highest Rated'];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredClinics = ALL_CLINICS.filter(clinic => {
    const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          clinic.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'Open Now': return clinic.isOpen;
      case 'Emergency': return clinic.isEmergency;
      case 'Highest Rated': return clinic.rating >= 4.8;
      default: return true;
    }
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PageHeader
        title="Search"
        subtitle="Find the best care for your pet"
        style={styles.header}
      >
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search clinics, vets, services..." 
            style={styles.searchInput}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </PageHeader>

      <View style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContainer}
          >
            {FILTERS.map(filter => (
              <TouchableOpacity 
                key={filter}
                style={[
                  styles.filterChip, 
                  activeFilter === filter && styles.activeFilterChip
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText
                ]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results */}
        <FlatList
          data={filteredClinics}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <ClinicCard clinic={item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="search" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No clinics found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    paddingBottom: SPACING.md,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  filtersWrapper: {
    paddingVertical: SPACING.sm,
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  activeFilterText: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  cardContainer: {
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
