import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Appointment } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { MonthCalendar } from '../../components/ui/MonthCalendar';
import { AppointmentCard } from '../../components/ui/AppointmentCard';
import { apiFetch } from '../../lib/api';
import { useAuth } from '@clerk/clerk-expo';

function parseISO(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d)
    return null;
  return dt;
}

export default function AppointmentsScreen() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Avoid firing authenticated requests before Clerk is ready; otherwise we churn 401s and re-renders.
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAppointments([]);
      setLoading(false);
      setError('Please sign in to view appointments.');
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<any>('/api/v1/appointments?upcoming=false&page=1&page_size=50', {
          method: 'GET',
          getToken: getTokenRef.current,
          tokenTemplate: 'backend',
        });

        const mapped: Appointment[] = (res.appointments || []).map((a: any) => {
          const statusRaw = String(a.status || '');
          const status: Appointment['status'] =
            statusRaw === 'completed'
              ? 'completed'
              : statusRaw.startsWith('cancelled')
              ? 'cancelled'
              : 'upcoming';

          return {
            id: String(a.id),
            clinicName: a?.clinic?.name || 'Clinic',
            date: String(a.scheduled_date),
            time: String(a.scheduled_start || '').slice(0, 5),
            petName: a?.pet?.name || 'Pet',
            status,
            type: 'Checkup',
          };
        });

        if (mounted) setAppointments(mapped);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load appointments');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, userId]);

  const firstApptDate = useMemo(() => {
    const parsed = appointments.map((a) => parseISO(a.date)).filter(
      Boolean
    ) as Date[];
    if (parsed.length === 0) return new Date();
    parsed.sort((a, b) => a.getTime() - b.getTime());
    return parsed[0];
  }, [appointments]);

  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(firstApptDate.getFullYear(), firstApptDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markedDates = useMemo(() => appointments.map((a) => a.date), [appointments]);

  const visibleAppointments = useMemo(() => {
    const base = [...appointments].sort((a, b) => a.date.localeCompare(b.date));
    if (!selectedDate) return base;
    return base.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <PageHeader
        title='Appointments'
        subtitle='Pick a date to filter your schedule'
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading appointments…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <FontAwesome name='warning' size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Couldn’t load appointments</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleAppointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            showStatus
            style={styles.item}
          />
        )}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListHeaderComponent={
          <View style={styles.calendarWrap}>
            <MonthCalendar
              monthCursor={monthCursor}
              onChangeMonth={setMonthCursor}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              markedDates={markedDates}
            />

            <View style={styles.filterRow}>
              <Text style={styles.filterText}>
                {selectedDate
                  ? `Showing ${selectedDate}`
                  : 'Showing all appointments'}
              </Text>
              {selectedDate && (
                <TouchableOpacity
                  onPress={() => setSelectedDate(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome
              name='calendar-o'
              size={48}
              color={COLORS.border}
            />
            <Text style={styles.emptyText}>No appointments for this date</Text>
            <Text style={styles.emptySubtext}>
              Try another day on the calendar.
            </Text>
          </View>
        }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  list: {
    marginTop: -SPACING.xl,
    zIndex: 0,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.xl,
  },
  calendarWrap: {
    marginBottom: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: 2,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  clearText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '800',
  },
  item: {
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
});
