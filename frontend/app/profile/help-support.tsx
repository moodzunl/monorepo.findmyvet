import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';

export default function HelpSupportScreen() {
  const FAQ_ITEMS = [
    { id: '1', question: 'How do I book an appointment?', answer: 'Navigate to the Home tab and use the search bar or quick categories to find a clinic. Select a clinic, choose a service, and pick a time slot.' },
    { id: '2', question: 'How do I cancel my appointment?', answer: 'Go to the Appointments tab, select the upcoming appointment, and tap "Cancel Appointment". Please note cancellation policies vary by clinic.' },
    { id: '3', question: 'Is my payment information secure?', answer: 'Yes, we use industry-standard encryption and do not store your full card details on our servers.' },
  ];

  const handleContact = () => {
    Linking.openURL('mailto:support@findmyvet.com');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>How can we help?</Text>
        <Text style={styles.subtitle}>Find answers to common questions or contact our support team.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_ITEMS.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Still need help?</Text>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <FontAwesome name="envelope-o" size={20} color={COLORS.primary} />
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactTitle}>Contact Support</Text>
            <Text style={styles.contactSubtitle}>We usually respond within 24 hours</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
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
  header: {
    marginBottom: SPACING.xl,
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
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  question: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  answer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
});

