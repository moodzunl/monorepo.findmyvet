import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../lib/api';
import type { AvailabilityResponse, SlotResponse } from '../types/api';
import { useAuth } from '@clerk/clerk-expo';

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTimeHHMM(time: string) {
  // "09:30:00" -> "09:30"
  return time.slice(0, 5);
}

export default function BookingScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { clinicId, serviceId } = useLocalSearchParams();
  const clinic_id = typeof clinicId === 'string' ? clinicId : Array.isArray(clinicId) ? clinicId[0] : '';
  const service_id_str = typeof serviceId === 'string' ? serviceId : Array.isArray(serviceId) ? serviceId[0] : '';
  const service_id = Number(service_id_str || 0);

  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | null>(null);
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const start = new Date();
        start.setDate(start.getDate() + 1);
        const end = new Date();
        end.setDate(end.getDate() + 7);

        const res = await apiFetch<AvailabilityResponse>('/api/v1/availability/slots', {
          method: 'POST',
          body: JSON.stringify({
            clinic_id,
            service_id,
            start_date: toISODate(start),
            end_date: toISODate(end),
            slot_type: 'in_person',
          }),
        });
        if (mounted) setAvailability(res);

        const petsRes = await apiFetch<any>('/api/v1/pets', {
          method: 'GET',
          getToken,
          tokenTemplate: 'backend',
        });
        const list = (petsRes?.pets || []).map((p: any) => ({ id: String(p.id), name: String(p.name) }));
        if (mounted) {
          setPets(list);
          setSelectedPetId(list[0]?.id || null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load availability');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clinic_id, service_id]);

  const flatSlots = useMemo(() => {
    const days = availability?.days ?? [];
    return days.flatMap((d) => d.slots.map((s) => ({ ...s, slot_date: d.date })));
  }, [availability]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Select a Time</Text>
        <Text style={styles.subtitle}>
          {availability ? `${availability.clinic_name} • ${availability.service_name}` : 'Loading…'}
        </Text>

        {pets.length > 0 && (
          <View style={styles.petPicker}>
            <Text style={styles.petPickerLabel}>Pet</Text>
            <View style={styles.petRow}>
              {pets.map((p) => (
                <Button
                  key={p.id}
                  title={p.name}
                  onPress={() => setSelectedPetId(p.id)}
                  variant={selectedPetId === p.id ? 'primary' : 'outline'}
                  style={styles.petButton}
                />
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading available slots…</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : flatSlots.length === 0 ? (
          <Text style={styles.errorText}>No available slots in the next week.</Text>
        ) : (
          <View style={styles.grid}>
            {flatSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <Button
                  key={slot.id}
                  title={`${slot.slot_date} • ${formatTimeHHMM(slot.start_time)}`}
                  onPress={() => setSelectedSlot(slot)}
                  variant={isSelected ? 'primary' : 'outline'}
                  style={styles.slotButton}
                />
              );
            })}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Appointment Details</Text>
          <Text style={styles.infoText}>
            {availability ? `${availability.service_name}` : '—'}
          </Text>
          <Text style={styles.infoText}>
            {selectedSlot?.vet_name ? selectedSlot.vet_name : 'Any available vet'}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Confirm Booking" 
          onPress={async () => {
            if (!selectedSlot || !selectedPetId) return;
            try {
              setSubmitting(true);
              await apiFetch('/api/v1/appointments', {
                method: 'POST',
                getToken,
                tokenTemplate: 'backend',
                body: JSON.stringify({
                  clinic_id,
                  slot_id: selectedSlot.id,
                  pet_id: selectedPetId,
                  service_id,
                  appointment_type: 'in_person',
                }),
              });
              Alert.alert('Booked!', 'Your appointment was booked successfully.');
              router.replace('/(tabs)/appointments');
            } catch (e: any) {
              Alert.alert('Booking failed', e?.message || 'Please try again.');
            } finally {
              setSubmitting(false);
            }
          }} 
          disabled={!selectedSlot || !selectedPetId || submitting}
          size="lg"
          loading={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  slotButton: {
    width: '48%',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  petPicker: {
    marginBottom: SPACING.lg,
  },
  petPickerLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  petRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  petButton: {
    width: '48%',
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

