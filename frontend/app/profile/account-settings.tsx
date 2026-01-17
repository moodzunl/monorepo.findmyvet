import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';
import { ProviderApplicationMeResponse } from '../../types/provider';
import type { ProviderMeResponse } from '../../types/providers';

export default function AccountSettingsScreen() {
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [loading, setLoading] = useState(false);
  const [loadingApp, setLoadingApp] = useState(true);
  const [application, setApplication] = useState<ProviderApplicationMeResponse['application']>(null);
  const [providerMe, setProviderMe] = useState<ProviderMeResponse | null>(null);

  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const load = async () => {
      try {
        setLoadingApp(true);
        const res = await apiFetch<ProviderApplicationMeResponse>('/api/v1/provider-applications/me', {
          getToken: (opts) => getTokenRef.current(opts),
          tokenTemplate: 'backend',
        });
        setApplication(res.application);

        // Provider capabilities (verified accounts may not have an application row)
        try {
          const me = await apiFetch<ProviderMeResponse>('/api/v1/providers/me', {
            getToken: (opts) => getTokenRef.current(opts),
            tokenTemplate: 'backend',
          });
          setProviderMe(me);
        } catch {
          setProviderMe(null);
        }
      } catch (e) {
        // Silent fail; this is optional UI.
        console.warn('Failed to load provider application:', e);
      } finally {
        setLoadingApp(false);
      }
    };

    void load();
  }, [isLoaded, isSignedIn]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await user?.update({
        firstName,
        lastName,
      });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.input, styles.disabledInput]}>
          <Text style={styles.inputText}>{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>
        <Text style={styles.helperText}>Email cannot be changed directly.</Text>
      </View>

      <Button 
        title="Save Changes" 
        onPress={handleSave} 
        loading={loading}
        style={styles.saveButton}
      />

      <View style={styles.providerCard}>
        <Text style={styles.providerTitle}>Become a Vet / Clinic</Text>
        <Text style={styles.providerSubtitle}>
          Apply for provider access. Your application will be reviewed by our team.
        </Text>

        {loadingApp ? (
          <View style={styles.providerRow}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.providerMeta}>Checking application status…</Text>
          </View>
        ) : application ? (
          <>
            <View style={styles.providerRow}>
              <Text style={styles.providerMeta}>
                Status:{' '}
                <Text style={styles.providerMetaStrong}>
                  {application.status === 'pending'
                    ? 'Pending'
                    : application.status === 'approved'
                    ? 'Approved'
                    : 'Rejected'}
                </Text>
              </Text>
            </View>
            <Button
              title="View Application"
              variant="outline"
              onPress={() => router.push('/provider/status')}
              style={{ marginTop: SPACING.sm }}
            />
            {(application.status === 'approved' ||
              providerMe?.can_manage_vet_services ||
              (providerMe?.clinic_admin_clinics?.length || 0) > 0) && (
              <Button
                title="Manage Services"
                onPress={() => router.push('/provider/manage-services')}
                style={{ marginTop: SPACING.sm }}
              />
            )}
            {application.status === 'rejected' && (
              <TouchableOpacity onPress={() => router.push('/provider/apply')} style={styles.providerLink}>
                <Text style={styles.providerLinkText}>Fix details and resubmit</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {(providerMe?.can_manage_vet_services || (providerMe?.clinic_admin_clinics?.length || 0) > 0) ? (
              <Button
                title="Manage Services"
                onPress={() => router.push('/provider/manage-services')}
                style={{ marginTop: SPACING.sm }}
              />
            ) : (
              <Button
                title="Apply Now"
                onPress={() => router.push('/provider/apply')}
                style={{ marginTop: SPACING.sm }}
              />
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  inputText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  disabledInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  helperText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
  providerCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  providerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  providerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  providerMeta: {
    marginLeft: SPACING.sm,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
  providerMetaStrong: {
    color: COLORS.text,
    fontWeight: '800',
  },
  providerLink: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  providerLinkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
});

