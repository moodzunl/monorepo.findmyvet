import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [promoEnabled, setPromoEnabled] = useState(false);

  const ToggleItem = ({ label, description, value, onValueChange }: { label: string, description?: string, value: boolean, onValueChange: (val: boolean) => void }) => (
    <View style={styles.item}>
      <View style={styles.textContainer}>
        <Text style={styles.itemLabel}>{label}</Text>
        {description && <Text style={styles.itemDescription}>{description}</Text>}
      </View>
      <Switch
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.white}
        ios_backgroundColor={COLORS.border}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Notifications</Text>
        <View style={styles.card}>
          <ToggleItem 
            label="Push Notifications" 
            description="Receive alerts about appointments and updates"
            value={pushEnabled} 
            onValueChange={setPushEnabled} 
          />
          <View style={styles.divider} />
          <ToggleItem 
            label="Email Notifications" 
            description="Receive appointment confirmations via email"
            value={emailEnabled} 
            onValueChange={setEmailEnabled} 
          />
          <View style={styles.divider} />
          <ToggleItem 
            label="SMS Notifications" 
            description="Receive text reminders for upcoming visits"
            value={smsEnabled} 
            onValueChange={setSmsEnabled} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Marketing</Text>
        <View style={styles.card}>
          <ToggleItem 
            label="Promotional Emails" 
            description="Tips, offers, and news from FindMyVet"
            value={promoEnabled} 
            onValueChange={setPromoEnabled} 
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  textContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  itemLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
  },
});

