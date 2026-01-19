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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { apiFetch } from '../../../lib/api';
import { COLORS, FONT_SIZE, RADIUS, SPACING, SHADOW } from '../../../constants/theme';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
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
  category?: string;
  icon_name?: string;
};

type EarningsStats = {
  total_sessions: number;
  total_earnings_cents: number;
  pending_payout_cents: number;
  last_payout_date?: string;
  last_payout_cents?: number;
  this_month_sessions: number;
  this_month_earnings_cents: number;
  pending_appointments_count?: number;
  total_cash_flow_cents?: number;
};

type PayoutItem = {
  id: string;
  amount_cents: number;
  session_count: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paid_at?: string;
};

type FreelancerSession = {
  id: string;
  session_date: string;
  session_amount_cents: number;
  platform_fee_cents: number;
  vet_payout_cents: number;
  payout_status: 'pending' | 'processing' | 'paid' | 'failed';
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
  const { tab } = useLocalSearchParams();
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'payments'>('services');
  const [application, setApplication] = useState<ProviderApplicationMeResponse['application']>(null);
  const [providerMe, setProviderMe] = useState<ProviderMeResponse | null>(null);

  const [clinicId, setClinicId] = useState<string>('');
  const [clinicIdSaving, setClinicIdSaving] = useState(false);

  const [catalog, setCatalog] = useState<ServiceItem[]>([]);
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [query, setQuery] = useState('');

  // Payments data
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [sessions, setSessions] = useState<FreelancerSession[]>([]);

  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const [durationMin, setDurationMin] = useState<string>('');
  const [priceDollars, setPriceDollars] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [iconName, setIconName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab !== 'payments' && tab !== 'services') return;
    setActiveTab(tab);
  }, [tab]);

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

  const loadPayments = async () => {
    try {
      const [s, p, sess] = await Promise.all([
        apiFetch<EarningsStats>('/api/v1/billing/sessions/stats', tokenOpts),
        apiFetch<{ payouts: PayoutItem[] }>('/api/v1/billing/payouts', tokenOpts),
        apiFetch<{ sessions: FreelancerSession[] }>('/api/v1/billing/sessions', tokenOpts),
      ]);
      setStats(s);
      setPayouts(p.payouts);
      setSessions(sess.sessions);
    } catch (e) {
      console.error('Failed to load payments', e);
    }
  };

  const loadAll = async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      setLoading(true);
      await loadClinicId();
      await loadApplication();
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

      await loadCatalog();

      // Load payments if they are a vet
      if (me.can_manage_vet_services) {
        // Load payments separately to not block main loading if it fails
        void loadPayments();
      }
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

  const categorizedCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = catalog.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q)
    );

    const groups: Record<string, ServiceItem[]> = {};
    filtered.forEach((svc) => {
      const cat = svc.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(svc);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [catalog, query]);

  const myServiceIds = useMemo(() => new Set(myServices.map((s) => s.id)), [myServices]);

  const resetEditor = () => {
    setSelected(null);
    setDurationMin('');
    setPriceDollars('');
    setCategory('');
    setIconName('');
  };

  const openAdd = (svc: ServiceItem) => {
    setSelected(svc);
    setDurationMin(String(svc.duration_min ?? 30));
    setPriceDollars('');
    setCategory(svc.category || '');
    setIconName(svc.icon_name || 'medkit');
  };

  const openEdit = (svc: ServiceItem) => {
    setSelected(svc);
    setDurationMin(String(svc.duration_min ?? 30));
    setPriceDollars(dollarsFromCents(svc.price_cents ?? null));
    setCategory(svc.category || '');
    setIconName(svc.icon_name || 'medkit');
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

  const confirmDisable = (svc: ServiceItem) => {
    Alert.alert('Disable Service', `Are you sure you want to disable ${svc.name}? It will no longer be bookable.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disable', style: 'destructive', onPress: () => disableService(svc) },
    ]);
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

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {activeTab === 'services' ? (
          <>
            {!!providerMe?.has_vet_profile && providerMe.vet_is_verified && !providerMe.vet_is_freelancer && (
              <Card style={{ marginBottom: SPACING.md }}>
                <Text style={styles.sectionTitle}>Vet services not enabled</Text>
                <Text style={styles.helper}>
                  You are a verified vet, but you are not marked as a <Text style={styles.strong}>freelancer</Text>.
                  Freelancer vets manage their own services; otherwise clinic admins manage them.
                </Text>
              </Card>
            )}

            {(application.provider_type === 'clinic' || (providerMe?.clinic_admin_clinics?.length || 0) > 0) && (
              <Card style={{ marginBottom: SPACING.lg }}>
                <Text style={styles.sectionTitle}>Clinic Selection</Text>
                {(providerMe?.clinic_admin_clinics?.length || 0) > 0 ? (
                  <View style={styles.clinicList}>
                    {providerMe!.clinic_admin_clinics.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={async () => {
                          setClinicId(c.id);
                          await SecureStore.setItemAsync(CLINIC_ID_STORE_KEY, c.id);
                        }}
                        style={[styles.clinicChip, clinicId === c.id && styles.activeClinicChip]}
                      >
                        <Text style={[styles.clinicChipText, clinicId === c.id && styles.activeClinicChipText]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <>
                    <Text style={styles.helper}>Enter clinic UUID to manage services.</Text>
                    <TextInput
                      value={clinicId}
                      onChangeText={setClinicId}
                      placeholder="e.g. 770e8400-..."
                      placeholderTextColor={COLORS.textLight}
                      style={styles.input}
                      autoCapitalize="none"
                    />
                    <Button
                      title="Save Clinic ID"
                      onPress={saveClinicId}
                      loading={clinicIdSaving}
                      style={{ marginTop: SPACING.sm }}
                    />
                  </>
                )}
              </Card>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Services</Text>
              <Badge label={String(myServices.length)} variant="info" />
            </View>

            {myServices.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No services active yet.</Text>
                <Text style={styles.helper}>Add services from the catalog below to start accepting bookings.</Text>
              </Card>
            ) : (
              myServices.map((svc) => (
                <Card key={svc.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    <View style={styles.serviceMeta}>
                      <Text style={styles.metaItem}>{svc.duration_min} min</Text>
                      {svc.price_cents != null && <Text style={styles.metaDivider}>•</Text>}
                      {svc.price_cents != null && (
                        <Text style={styles.metaItem}>${(svc.price_cents / 100).toFixed(0)}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity onPress={() => openEdit(svc)} style={styles.iconButton}>
                      <Text style={styles.iconButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDisable(svc)} style={styles.iconButton}>
                      <Text style={[styles.iconButtonText, { color: COLORS.error }]}>Disable</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}

            {selected && (
              <Card style={styles.editorCard}>
                <Text style={styles.editorTitle}>
                  {myServiceIds.has(selected.id) ? 'Update Service' : 'Add to My Services'}
                </Text>
                <Text style={styles.selectedServiceName}>{selected.name}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Duration (minutes)</Text>
                  <TextInput
                    value={durationMin}
                    onChangeText={setDurationMin}
                    keyboardType="number-pad"
                    placeholder="30"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Starting Price (USD)</Text>
                  <TextInput
                    value={priceDollars}
                    onChangeText={setPriceDollars}
                    keyboardType="decimal-pad"
                    placeholder="75"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g. Wellness, Surgery"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Icon Name (Ionicons)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <TextInput
                      value={iconName}
                      onChangeText={setIconName}
                      placeholder="e.g. medkit, shield"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <View style={styles.iconPreview}>
                      <Ionicons name={(iconName as any) || 'help-outline'} size={24} color={COLORS.primary} />
                    </View>
                  </View>
                </View>

                <View style={styles.editorActions}>
                  <Button title="Cancel" variant="outline" onPress={resetEditor} style={{ flex: 1 }} />
                  <Button title="Save Changes" onPress={upsertService} loading={saving} style={{ flex: 1 }} />
                </View>
              </Card>
            )}

            <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
              <Text style={styles.sectionTitle}>Service Catalog</Text>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search catalog…"
              placeholderTextColor={COLORS.textLight}
              style={[styles.input, { marginBottom: SPACING.md }]}
            />

            {categorizedCatalog.map(([category, items]) => (
              <View key={category} style={{ marginBottom: SPACING.lg }}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <Card style={styles.catalogCard}>
                  {items.map((svc, idx) => (
                    <View key={svc.id} style={[styles.catalogRow, idx === 0 && { borderTopWidth: 0 }]}>
                      <View style={styles.catalogIconContainer}>
                        <Ionicons
                          name={(svc.icon_name as any) || 'medkit-outline'}
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catalogName}>{svc.name}</Text>
                        {!!svc.description && (
                          <Text style={styles.catalogDesc} numberOfLines={1}>
                            {svc.description}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => (myServiceIds.has(svc.id) ? openEdit(svc) : openAdd(svc))}
                        style={styles.catalogAction}
                      >
                        <Text style={[styles.catalogActionText, myServiceIds.has(svc.id) && { color: COLORS.textLight }]}>
                          {myServiceIds.has(svc.id) ? 'Manage' : 'Add +'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </Card>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.paymentsTab}>
            {managingAs !== 'vet' ? (
              <Card>
                <Text style={styles.sectionTitle}>Payments</Text>
                <Text style={styles.helper}>
                  Payments are currently available for <Text style={styles.strong}>freelancer vets</Text>.
                </Text>
              </Card>
            ) : stats && (
              <View style={styles.statsGrid}>
                <Card style={styles.statsCard}>
                  <Text style={styles.statsLabel}>Total Earnings</Text>
                  <Text style={styles.statsValue}>${(stats.total_earnings_cents / 100).toLocaleString()}</Text>
                </Card>
                <Card style={styles.statsCard}>
                  <Text style={styles.statsLabel}>Pending Payout</Text>
                  <Text style={[styles.statsValue, { color: COLORS.primary }]}>
                    ${(stats.pending_payout_cents / 100).toLocaleString()}
                  </Text>
                </Card>
              </View>
            )}

            <Text style={styles.sectionTitle}>Payout History</Text>
            {payouts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No payouts yet.</Text>
              </Card>
            ) : (
              payouts.map((p) => (
                <Card key={p.id} style={styles.payoutCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payoutAmount}>${(p.amount_cents / 100).toFixed(2)}</Text>
                    <Text style={styles.payoutDate}>
                      {new Date(p.period_start).toLocaleDateString()} - {new Date(p.period_end).toLocaleDateString()}
                    </Text>
                  </View>
                  <Badge
                    label={p.status.toUpperCase()}
                    variant={p.status === 'completed' ? 'success' : 'warning'}
                  />
                </Card>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Recent Sessions</Text>
            {sessions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No sessions recorded.</Text>
              </Card>
            ) : (
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionDate}>{new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    <Text style={styles.sessionMeta}>
                      Earned: ${(s.vet_payout_cents / 100).toFixed(2)} (Fee: ${(s.platform_fee_cents / 100).toFixed(2)})
                    </Text>
                  </View>
                  <Text style={[styles.sessionStatus, s.payout_status === 'paid' ? { color: COLORS.success } : { color: COLORS.textLight }]}>
                    {s.payout_status}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() =>
            router.replace({
              pathname: '/provider/manage-services',
              params: { tab: 'services' },
            })
          }
          style={styles.bottomNavItem}
          activeOpacity={0.8}
        >
          <View style={styles.bottomNavIconWrap}>
            <Ionicons
              name={activeTab === 'services' ? 'briefcase' : 'briefcase-outline'}
              size={22}
              color={activeTab === 'services' ? COLORS.primary : COLORS.textLight}
            />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{myServices.length}</Text>
            </View>
          </View>
          <Text style={[styles.bottomNavLabel, activeTab === 'services' && styles.bottomNavLabelActive]}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/appointments')} style={styles.bottomNavItem} activeOpacity={0.8}>
          <View style={styles.bottomNavIconWrap}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.textLight} />
            {managingAs === 'vet' && !!stats && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{stats.pending_appointments_count || 0}</Text>
              </View>
            )}
          </View>
          <Text style={styles.bottomNavLabel}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.replace({
              pathname: '/provider/manage-services',
              params: { tab: 'payments' },
            })
          }
          style={[styles.bottomNavItem, managingAs !== 'vet' && { opacity: 0.55 }]}
          activeOpacity={0.8}
        >
          <View style={styles.bottomNavIconWrap}>
            <Ionicons
              name={activeTab === 'payments' ? 'card' : 'card-outline'}
              size={22}
              color={activeTab === 'payments' ? COLORS.primary : COLORS.textLight}
            />
          </View>
          <Text style={[styles.bottomNavLabel, activeTab === 'payments' && styles.bottomNavLabelActive]}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/provider/business')} style={styles.bottomNavItem} activeOpacity={0.8}>
          <View style={styles.bottomNavIconWrap}>
            <Ionicons name="settings-outline" size={22} color={COLORS.textLight} />
          </View>
          <Text style={styles.bottomNavLabel}>Business</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  helper: {
    marginTop: 4,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
  strong: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 110,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  clinicList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  clinicChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeClinicChip: {
    backgroundColor: '#E7F5FF',
    borderColor: COLORS.primary,
  },
  clinicChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeClinicChipText: {
    color: COLORS.primary,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  metaDivider: {
    marginHorizontal: 8,
    color: COLORS.border,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  editorCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#F8F9FA',
  },
  editorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  selectedServiceName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
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
  editorActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  catalogCard: {
    padding: 0,
    overflow: 'hidden',
  },
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  catalogName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  catalogDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  catalogAction: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  catalogActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentsTab: {
    gap: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statsCard: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  statsValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  payoutAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  payoutDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionDate: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sessionStatus: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  catalogIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    ...SHADOW.md,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bottomNavIconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
  },
  bottomNavLabelActive: {
    color: COLORS.primary,
  },
  navBadge: {
    position: 'absolute',
    right: -10,
    top: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
});


