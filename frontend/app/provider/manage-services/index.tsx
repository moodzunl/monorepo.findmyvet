import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';

import { apiFetch } from '../../../lib/api';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../../constants/theme';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { ProviderApplicationMeResponse } from '../../../types/provider';
import type { ProviderMeResponse } from '../../../types/providers';

type ServiceItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  duration_min: number;
  price_cents?: number | null;
  is_emergency: boolean;
  supports_home_visit: boolean;
};

const CLINIC_ID_STORE_KEY = 'provider.clinic_id';

function centsFromDollarsInput(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function dollarsFromCents(cents?: number | null): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(0);
}

export default function ManageServicesScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ProviderApplicationMeResponse['application']>(null);
  const [providerMe, setProviderMe] = useState<ProviderMeResponse | null>(null);

  const [clinicId, setClinicId] = useState<string>('');
  const [clinicIdSaving, setClinicIdSaving] = useState(false);

  const [catalog, setCatalog] = useState<ServiceItem[]>([]);
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [query, setQuery] = useState('');

  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const [durationMin, setDurationMin] = useState<string>('');
  const [priceDollars, setPriceDollars] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const tokenOpts = useMemo(
    () => ({
      getToken: (opts: any) => getTokenRef.current(opts),
      tokenTemplate: 'backend',
    }),
    []
  );

  const canManageVetServices = !!providerMe?.can_manage_vet_services;
  const canManageClinicServices = (providerMe?.clinic_admin_clinics?.length || 0) > 0;

  // Decide which provider type to manage. IMPORTANT: do not call vet endpoints unless allowed.
  const managingAs: 'vet' | 'clinic' | null = canManageVetServices
    ? 'vet'
    : canManageClinicServices
    ? 'clinic'
    : null;

  const loadClinicId = async () => {
    const stored = await SecureStore.getItemAsync(CLINIC_ID_STORE_KEY);
    if (stored) setClinicId(stored);
  };

  const loadApplication = async () => {
    const res = await apiFetch<ProviderApplicationMeResponse>('/api/v1/provider-applications/me', tokenOpts);
    setApplication(res.application);
  };

  const loadProviderMe = async () => {
    const me = await apiFetch<ProviderMeResponse>('/api/v1/providers/me', tokenOpts);
    setProviderMe(me);
    // If clinic admin, default to first clinic unless user already has a stored clinic id.
    if ((me.clinic_admin_clinics?.length || 0) > 0) {
      const stored = await SecureStore.getItemAsync(CLINIC_ID_STORE_KEY);
      const preferred =
        stored && me.clinic_admin_clinics.some((c) => c.id === stored) ? stored : me.clinic_admin_clinics[0].id;
      if (!clinicId) setClinicId(preferred);
      await SecureStore.setItemAsync(CLINIC_ID_STORE_KEY, preferred);
    }
  };

  const loadCatalog = async () => {
    const res = await apiFetch<ServiceItem[]>('/api/v1/services');
    setCatalog(res);
  };

  const loadMyServices = async (providerType: 'vet' | 'clinic') => {
    if (providerType === 'vet') {
      const res = await apiFetch<ServiceItem[]>('/api/v1/vets/me/services', tokenOpts);
      setMyServices(res);
      return;
    }
    if (!clinicId) {
      setMyServices([]);
      return;
    }
    const res = await apiFetch<ServiceItem[]>(`/api/v1/clinics/${clinicId}/services`);
    setMyServices(res);
  };

  const loadAll = async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      setLoading(true);
      await loadClinicId();
      await loadApplication();
      await loadProviderMe();
      await loadCatalog();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    // Prefer application (if approved) but fall back to capability endpoint for verified accounts
    // NOTE: we intentionally ignore application.provider_type for vet management,
    // because a user can have an approved vet application but NOT be a freelancer vet.
    if (managingAs) void loadMyServices(managingAs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, managingAs]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
    );
  }, [catalog, query]);

  const myServiceIds = useMemo(() => new Set(myServices.map((s) => s.id)), [myServices]);

  const resetEditor = () => {
    setSelected(null);
    setDurationMin('');
    setPriceDollars('');
  };

  const openAdd = (svc: ServiceItem) => {
    setSelected(svc);
    setDurationMin(String(svc.duration_min ?? 30));
    setPriceDollars('');
  };

  const openEdit = (svc: ServiceItem) => {
    setSelected(svc);
    setDurationMin(String(svc.duration_min ?? 30));
    setPriceDollars(dollarsFromCents(svc.price_cents ?? null));
  };

  const saveClinicId = async () => {
    const trimmed = clinicId.trim();
    if (!trimmed) {
      Alert.alert('Missing clinic ID', 'Paste your clinic UUID (from admin) to manage services.');
      return;
    }
    try {
      setClinicIdSaving(true);
      await SecureStore.setItemAsync(CLINIC_ID_STORE_KEY, trimmed);
      setClinicId(trimmed);
      Alert.alert('Saved', 'Clinic ID saved on this device.');
    } finally {
      setClinicIdSaving(false);
    }
  };

  const upsertService = async () => {
    if (!managingAs) return;
    if (!selected) return;

    const duration = Number(durationMin);
    if (!Number.isFinite(duration) || duration < 5) {
      Alert.alert('Invalid duration', 'Duration must be a number (min 5 minutes).');
      return;
    }
    const priceCents = centsFromDollarsInput(priceDollars);
    if (priceDollars.trim() && priceCents == null) {
      Alert.alert('Invalid price', 'Price must be a valid number (e.g. 75).');
      return;
    }

    const body = {
      service_id: selected.id,
      duration_min: duration,
      price_cents: priceCents,
      is_active: true,
    };

    try {
      setSaving(true);
      if (managingAs === 'vet') {
        try {
          await apiFetch('/api/v1/vets/me/services', {
            method: 'POST',
            body: JSON.stringify(body),
            ...tokenOpts,
          });
        } catch (e: any) {
          if ((e?.message || '').toLowerCase().includes('already exists')) {
            await apiFetch(`/api/v1/vets/me/services/${selected.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ duration_min: duration, price_cents: priceCents, is_active: true }),
              ...tokenOpts,
            });
          } else {
            throw e;
          }
        }
        await loadMyServices('vet');
        resetEditor();
        return;
      }

      // clinic
      if (!clinicId) {
        Alert.alert('Clinic ID required', 'Enter your clinic UUID to manage clinic services.');
        return;
      }

      try {
        await apiFetch(`/api/v1/clinics/${clinicId}/services`, {
          method: 'POST',
          body: JSON.stringify(body),
          ...tokenOpts,
        });
      } catch (e: any) {
        if ((e?.message || '').toLowerCase().includes('already exists')) {
          await apiFetch(`/api/v1/clinics/${clinicId}/services/${selected.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ duration_min: duration, price_cents: priceCents, is_active: true }),
            ...tokenOpts,
          });
        } else {
          throw e;
        }
      }

      await loadMyServices('clinic');
      resetEditor();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const disableService = async (svc: ServiceItem) => {
    if (!managingAs) return;
    try {
      if (managingAs === 'vet') {
        await apiFetch(`/api/v1/vets/me/services/${svc.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: false }),
          ...tokenOpts,
        });
        await loadMyServices('vet');
        return;
      }
      if (!clinicId) return;
      await apiFetch(`/api/v1/clinics/${clinicId}/services/${svc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: false }),
        ...tokenOpts,
      });
      await loadMyServices('clinic');
    } catch (e: any) {
      Alert.alert('Update failed', e?.message || 'Please try again');
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>Sign in to manage services.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.helper}>Loading…</Text>
      </View>
    );
  }

  if (!application) {
    const canManageVet = !!providerMe?.can_manage_vet_services;
    const canManageClinic = (providerMe?.clinic_admin_clinics?.length || 0) > 0;

    if (!canManageVet && !canManageClinic) {
      return (
        <View style={styles.container}>
          <Card>
            <Text style={styles.title}>No provider access</Text>
            <Text style={styles.helper}>
              You need to be a <Text style={styles.strong}>verified freelancer vet</Text> or a{' '}
              <Text style={styles.strong}>clinic admin</Text> to manage services.
            </Text>
            <Button title="Start Application" onPress={() => router.push('/provider/apply')} style={{ marginTop: SPACING.md }} />
          </Card>
        </View>
      );
    }

    // Verified account without application row → allow manage services
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Manage Services</Text>
        <Text style={styles.helper}>Your account is verified. You can manage services below.</Text>
      </ScrollView>
    );
  }

  if (application.status !== 'approved' && !(providerMe?.can_manage_vet_services || (providerMe?.clinic_admin_clinics?.length || 0) > 0)) {
    return (
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Not approved yet</Text>
          <Text style={styles.helper}>
            Your application is currently <Text style={styles.strong}>{application.status}</Text>. You can manage services once approved.
          </Text>
          <Button title="View Status" variant="outline" onPress={() => router.push('/provider/status')} style={{ marginTop: SPACING.md }} />
        </Card>
      </View>
    );
  }

  const providerTypeLabel = managingAs === 'vet' ? 'Freelancer Vet' : managingAs === 'clinic' ? 'Clinic' : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manage Services</Text>
      <Text style={styles.helper}>Provider type: <Text style={styles.strong}>{providerTypeLabel}</Text></Text>

      {!!providerMe?.has_vet_profile && providerMe.vet_is_verified && !providerMe.vet_is_freelancer && (
        <Card style={{ marginTop: SPACING.md }}>
          <Text style={styles.sectionTitle}>Vet services not enabled</Text>
          <Text style={styles.helper}>
            You are a verified vet, but you are not marked as a <Text style={styles.strong}>freelancer</Text>.
            In this model, freelancer vets manage their own services; otherwise the clinic admin manages services.
          </Text>
        </Card>
      )}

      {(application.provider_type === 'clinic' || (providerMe?.clinic_admin_clinics?.length || 0) > 0) && (
        <Card style={{ marginTop: SPACING.md }}>
          <Text style={styles.sectionTitle}>Clinic</Text>
          {(providerMe?.clinic_admin_clinics?.length || 0) > 0 ? (
            <>
              <Text style={styles.helper}>Pick the clinic you manage.</Text>
              {providerMe!.clinic_admin_clinics.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={async () => {
                    setClinicId(c.id);
                    await SecureStore.setItemAsync(CLINIC_ID_STORE_KEY, c.id);
                  }}
                  style={styles.clinicPickRow}
                >
                  <Text style={[styles.rowTitle, clinicId === c.id && { color: COLORS.primary }]}>{c.name}</Text>
                  <Text style={styles.rowMeta}>{clinicId === c.id ? 'Selected' : ''}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.helper}>
                Enter your clinic UUID (temporary fallback until we link a clinic to your account).
              </Text>
              <TextInput
                value={clinicId}
                onChangeText={setClinicId}
                placeholder="e.g. 770e8400-e29b-41d4-a716-446655440002"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button title="Save Clinic ID" onPress={saveClinicId} loading={clinicIdSaving} style={{ marginTop: SPACING.sm }} />
            </>
          )}
        </Card>
      )}

      <Card style={{ marginTop: SPACING.lg }}>
        <Text style={styles.sectionTitle}>My Services</Text>
        {myServices.length === 0 ? (
          <Text style={styles.helper}>No services yet. Add one from the catalog below.</Text>
        ) : (
          myServices.map((svc) => (
            <View key={svc.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{svc.name}</Text>
                <Text style={styles.rowMeta}>
                  {svc.duration_min} min
                  {svc.price_cents != null ? ` • $${(svc.price_cents / 100).toFixed(0)}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(svc)} style={styles.rowAction}>
                <Text style={styles.rowActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => disableService(svc)} style={styles.rowAction}>
                <Text style={[styles.rowActionText, { color: COLORS.error }]}>Disable</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      {selected && (
        <Card style={{ marginTop: SPACING.lg }}>
          <Text style={styles.sectionTitle}>{myServiceIds.has(selected.id) ? 'Edit Service' : 'Add Service'}</Text>
          <Text style={styles.rowTitle}>{selected.name}</Text>
          {!!selected.description && <Text style={styles.helper}>{selected.description}</Text>}

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
          />

          <Text style={styles.label}>Starting price (USD)</Text>
          <TextInput
            value={priceDollars}
            onChangeText={setPriceDollars}
            keyboardType="decimal-pad"
            placeholder="75"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
            <Button title="Cancel" variant="outline" onPress={resetEditor} style={{ flex: 1 }} />
            <Button title="Save" onPress={upsertService} loading={saving} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      <Card style={{ marginTop: SPACING.lg, marginBottom: SPACING.xl }}>
        <Text style={styles.sectionTitle}>Service Catalog</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search services…"
          placeholderTextColor={COLORS.textLight}
          style={styles.input}
        />

        {filteredCatalog.slice(0, 50).map((svc) => (
          <View key={svc.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{svc.name}</Text>
              {!!svc.description && <Text style={styles.rowMeta}>{svc.description}</Text>}
            </View>
            <TouchableOpacity onPress={() => openAdd(svc)} style={styles.rowAction}>
              <Text style={[styles.rowActionText, { color: COLORS.primary }]}>
                {myServiceIds.has(svc.id) ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        {filteredCatalog.length > 50 && (
          <Text style={styles.helper}>Showing first 50 results. Refine search to narrow down.</Text>
        )}
      </Card>
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
  center: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  strong: {
    fontWeight: '800',
    color: COLORS.text,
  },
  helper: {
    marginTop: SPACING.xs,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  label: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  rowTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  rowAction: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  rowActionText: {
    fontWeight: '800',
    color: COLORS.textLight,
  },
  clinicPickRow: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
  },
});


