import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { ClinicCard } from '../../components/ui/ClinicCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { apiFetch } from '../../lib/api';
import type { ClinicSearchResponse, ClinicSummaryResponse } from '../../types/api';

const FILTERS = ['All', 'Open Now', 'Emergency', 'Highest Rated'];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [clinics, setClinics] = useState<ClinicSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<ClinicSearchResponse>('/api/v1/clinics/search', {
          method: 'POST',
          body: JSON.stringify({
            latitude: 37.7749,
            longitude: -122.4194,
            radius_km: 100,
            page: 1,
            page_size: 50,
          }),
        });
        if (mounted) setClinics(res.clinics);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load clinics');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredClinics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clinics.filter((clinic) => {
      const address = `${clinic.address_line1} ${clinic.city} ${clinic.state} ${clinic.postal_code}`.toLowerCase();
      const matchesSearch = !q || clinic.name.toLowerCase().includes(q) || address.includes(q);
      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'Open Now':
          return clinic.is_open_now;
        case 'Emergency':
          return clinic.accepts_emergency;
        case 'Highest Rated':
          return (clinic.rating_average ?? 0) >= 4.8;
        default:
          return true;
      }
    });
  }, [activeFilter, clinics, searchQuery]);

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
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading clinics…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <FontAwesome name="warning" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Couldn’t load clinics</Text>
            <Text style={styles.emptySubtext}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClinics}
            keyExtractor={(item) => item.id}
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
        )}
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
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
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
