import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';

interface MonthCalendarProps {
  monthCursor: Date; // any date within the month to render
  onChangeMonth: (nextMonthCursor: Date) => void;
  selectedDate?: string | null; // YYYY-MM-DD
  onSelectDate?: (iso: string) => void;
  markedDates?: string[]; // list of YYYY-MM-DD
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  monthCursor,
  onChangeMonth,
  selectedDate,
  onSelectDate,
  markedDates = [],
}) => {
  const first = startOfMonth(monthCursor);
  const monthLabel = first.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const marked = useMemo(() => new Set(markedDates), [markedDates]);

  // 0=Sun..6=Sat
  const firstWeekday = first.getDay();
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: Array<{ date: Date | null; iso?: string; inMonth: boolean }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null, inMonth: false });
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(first.getFullYear(), first.getMonth(), day);
    cells.push({ date: d, iso: toISODate(d), inMonth: true });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, inMonth: false });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onChangeMonth(addMonths(first, -1))}
          style={styles.navBtn}
          activeOpacity={0.8}
        >
          <FontAwesome name="chevron-left" size={14} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <TouchableOpacity
          onPress={() => onChangeMonth(addMonths(first, 1))}
          style={styles.navBtn}
          activeOpacity={0.8}
        >
          <FontAwesome name="chevron-right" size={14} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((cell, ci) => {
              const iso = cell.iso;
              const isSelected = !!iso && iso === selectedDate;
              const isMarked = !!iso && marked.has(iso);
              const disabled = !cell.inMonth || !iso;

              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    disabled && styles.dayCellDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => onSelectDate?.(iso!)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {cell.date ? cell.date.getDate() : ''}
                  </Text>
                  {isMarked && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  monthLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  weekday: {
    width: 36,
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    fontWeight: '700',
  },
  grid: {},
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayCell: {
    width: 36,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  dayTextDisabled: {
    color: COLORS.textLight,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },
  dotSelected: {
    backgroundColor: COLORS.white,
  },
});


