import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { Button } from '../components/ui/Button';

// Mock Slots
const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '11:30 AM', 
  '02:00 PM', '03:30 PM', '04:00 PM'
];

export default function BookingScreen() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Select a Time</Text>
        <Text style={styles.subtitle}>Tomorrow, Oct 12</Text>

        <View style={styles.grid}>
          {TIME_SLOTS.map((time) => (
            <Button
              key={time}
              title={time}
              onPress={() => setSelectedTime(time)}
              variant={selectedTime === time ? 'primary' : 'outline'}
              style={styles.slotButton}
            />
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Appointment Details</Text>
          <Text style={styles.infoText}>Consultation • 30 mins</Text>
          <Text style={styles.infoText}>Dr. Sarah Smith</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Confirm Booking" 
          onPress={() => {
            alert('Booking Confirmed!');
            router.dismiss();
          }} 
          disabled={!selectedTime}
          size="lg"
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

