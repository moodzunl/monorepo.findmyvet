import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { useClerk, useUser, useAuth } from '@clerk/clerk-expo';
import { apiFetch } from '../../lib/api';
import { PetListResponse, PetOut } from '../../types/api';

const MENU_ITEMS = [
  { id: '1', label: 'Account Settings', icon: 'user-o' as const, route: '/profile/account-settings' },
  { id: '2', label: 'Notifications', icon: 'bell-o' as const, route: '/profile/notifications' },
  { id: '3', label: 'Payment Methods', icon: 'credit-card' as const, route: '/profile/payment-methods' },
  { id: '4', label: 'Help & Support', icon: 'question-circle-o' as const, route: '/profile/help-support' },
];

const ADMIN_EMAIL = 'ferarersunl@hotmail.com';

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [pets, setPets] = useState<PetOut[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // Prevent infinite loops if Clerk's getToken function identity changes between renders.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const response = await apiFetch<PetListResponse>('/api/v1/pets', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setPets(response.pets);
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };

    fetchPets();
  }, [isLoaded, isSignedIn]);

  const displayName =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    'Account';

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;
  
  const isAdmin = email === ADMIN_EMAIL;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const getPetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dog': return 'dog';
      case 'cat': return 'cat';
      case 'bird': return 'bird';
      case 'rabbit': return 'rabbit';
      default: return 'paw';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PageHeader>
        <View style={styles.headerProfile}>
          <Image 
            source={{
              uri:
                avatarUrl ??
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            }} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>{displayName}</Text>
          {!!email && <Text style={styles.email}>{email}</Text>}
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/account-settings')}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </PageHeader>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        
        {/* Admin Dashboard Link */}
        {isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.adminCard}
              onPress={() => router.push('/admin/dashboard')}
            >
              <View style={styles.adminIconBox}>
                <MaterialCommunityIcons name="shield-account" size={24} color={COLORS.white} />
              </View>
              <View style={styles.adminTextContainer}>
                <Text style={styles.adminTitle}>Admin Dashboard</Text>
                <Text style={styles.adminSubtitle}>Manage users and applications</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* My Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            <TouchableOpacity onPress={() => router.push('/onboarding/pet-name')}>
              <Text style={styles.addPetText}>+ Add Pet</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll}>
            {loadingPets ? (
              <View style={styles.loadingPetsContainer}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : pets.length > 0 ? (
              pets.map(pet => (
                <Card key={pet.id} style={styles.petCard} padding="sm">
                  <View style={styles.petIconPlaceholder}>
                    <MaterialCommunityIcons 
                      name={getPetIcon(pet.species.name)} 
                      size={24} 
                      color={COLORS.primary} 
                    />
                  </View>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetail}>{pet.breed?.name || pet.species.name}</Text>
                </Card>
              ))
            ) : (
              <TouchableOpacity 
                style={styles.emptyPetsCard} 
                onPress={() => router.push('/onboarding/pet-name')}
              >
                <View style={styles.placeholderIconCircle}>
                  <MaterialCommunityIcons name="paw" size={24} color={COLORS.textLight} style={{ opacity: 0.6 }} />
                </View>
                <Text style={styles.emptyPetsTitle}>No pets yet</Text>
                <Text style={styles.emptyPetsSubtitle}>Tap to add your first furry friend</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.settingsTitle]}>Settings</Text>
          <View style={styles.menuContainer}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.menuItem,
                  index === MENU_ITEMS.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconBox}>
                    <FontAwesome name={item.icon} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>FindMyVet v1.0.0</Text>

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
  headerProfile: {
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  name: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.md,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  editButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    fontWeight: '600',
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
  },
  settingsTitle: {
    marginBottom: SPACING.md,
  },
  addPetText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  petsScroll: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  petCard: {
    width: 120,
    marginRight: SPACING.md,
    alignItems: 'center',
    padding: SPACING.md,
  },
  petIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  petName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  petDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loadingPetsContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  emptyPetsCard: {
    width: 200,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dotted',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.03)',
    marginLeft: 2,
  },
  placeholderIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyPetsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  emptyPetsSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    opacity: 0.8,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    padding: SPACING.md,
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
  },
  // Admin Styles
  adminCard: {
    backgroundColor: '#374151', // Dark Gray
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  adminIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  adminSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.7)',
  },
});
