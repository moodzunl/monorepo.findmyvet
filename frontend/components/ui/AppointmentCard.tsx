import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Appointment } from '../../types';
import { Card } from './Card';
import { Badge } from './Badge';

interface AppointmentCardProps {
  appointment: Appointment;
  style?: ViewStyle;
  showStatus?: boolean;
}

function parseISODate(dateStr: string): Date | null {
  // Expecting YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  // Basic validation
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}

function monthShort(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
}

function statusVariant(status: Appointment['status']) {
  switch (status) {
    case 'upcoming':
      return 'info' as const;
    case 'completed':
      return 'success' as const;
    case 'cancelled':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  style,
  showStatus = false,
}) => {
  const dateObj = parseISODate(appointment.date);
  const day = dateObj ? String(dateObj.getDate()) : '--';
  const mon = dateObj ? monthShort(dateObj) : appointment.date.slice(5, 7);

  const title = `${appointment.type} for ${appointment.petName}`;
  const subtitle = `${appointment.clinicName} • ${appointment.time}`;

  return (
    <Card style={[styles.card, style]} padding="md">
      <View style={styles.row}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{mon}</Text>
        </View>

        <View style={styles.main}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {showStatus && (
              <Badge
                label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                variant={statusVariant(appointment.status)}
              />
            )}
          </View>

          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <FontAwesome name="calendar" size={12} color={COLORS.textLight} style={styles.metaIcon} />
              <Text style={styles.metaText}>{appointment.date}</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    minWidth: 56,
  },
  dateDay: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: FONT_SIZE.lg,
    lineHeight: FONT_SIZE.lg + 2,
  },
  dateMonth: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  main: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: FONT_SIZE.md,
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    fontWeight: '600',
  },
});


