import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { useClerk, useUser } from '@clerk/clerk-expo';

// Mock pets (until we store pets server-side)
const PETS = [
  { id: '1', name: 'Max', type: 'Dog', breed: 'Golden Retriever' },
  { id: '2', name: 'Bella', type: 'Cat', breed: 'Siamese' },
];

const MENU_ITEMS = [
  { id: '1', label: 'Account Settings', icon: 'user-o' as const },
  { id: '2', label: 'Notifications', icon: 'bell-o' as const },
  { id: '3', label: 'Payment Methods', icon: 'credit-card' as const },
  { id: '4', label: 'Help & Support', icon: 'question-circle-o' as const },
];

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const displayName =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    'Account';

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

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
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </PageHeader>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        
        {/* My Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            <TouchableOpacity>
              <Text style={styles.addPetText}>+ Add Pet</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll}>
            {PETS.map(pet => (
              <Card key={pet.id} style={styles.petCard} padding="sm">
                <View style={styles.petIconPlaceholder}>
                  <MaterialCommunityIcons 
                    name={getPetIcon(pet.type)} 
                    size={24} 
                    color={COLORS.primary} 
                  />
                </View>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petDetail}>{pet.breed}</Text>
              </Card>
            ))}
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
});
