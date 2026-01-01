import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Appointment } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBar } from 'expo-status-bar';
import { MonthCalendar } from '../../components/ui/MonthCalendar';
import { AppointmentCard } from '../../components/ui/AppointmentCard';

// Mock Data
const APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    clinicName: 'City Vet Clinic',
    date: '2023-10-12',
    time: '10:00 AM',
    petName: 'Max',
    status: 'upcoming',
    type: 'Vaccination',
  },
  {
    id: '2',
    clinicName: 'Paws & Claws Care',
    date: '2023-09-15',
    time: '2:30 PM',
    petName: 'Bella',
    status: 'completed',
    type: 'Checkup',
  },
  {
    id: '3',
    clinicName: 'Downtown Pet Hospital',
    date: '2023-08-01',
    time: '11:15 AM',
    petName: 'Max',
    status: 'cancelled',
    type: 'Emergency',
  },
];

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
  const firstApptDate = useMemo(() => {
    const parsed = APPOINTMENTS.map((a) => parseISO(a.date)).filter(
      Boolean
    ) as Date[];
    if (parsed.length === 0) return new Date();
    parsed.sort((a, b) => a.getTime() - b.getTime());
    return parsed[0];
  }, []);

  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(firstApptDate.getFullYear(), firstApptDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markedDates = useMemo(() => APPOINTMENTS.map((a) => a.date), []);

  const visibleAppointments = useMemo(() => {
    const base = [...APPOINTMENTS].sort((a, b) => a.date.localeCompare(b.date));
    if (!selectedDate) return base;
    return base.filter((a) => a.date === selectedDate);
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <PageHeader
        title='Appointments'
        subtitle='Pick a date to filter your schedule'
      />

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
});
