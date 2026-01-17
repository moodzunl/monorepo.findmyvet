import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

export default function PaymentMethodsScreen() {
  const MOCK_CARDS = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '12/24', isDefault: true },
    { id: '2', type: 'Mastercard', last4: '8888', expiry: '09/25', isDefault: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Payment Methods</Text>
      <Text style={styles.subtitle}>Manage your saved cards for faster checkout.</Text>

      <View style={styles.cardsContainer}>
        {MOCK_CARDS.map((card) => (
          <View key={card.id} style={styles.cardItem}>
            <View style={styles.cardLeft}>
              <View style={styles.cardIcon}>
                <FontAwesome 
                  name={card.type === 'Visa' ? 'cc-visa' : 'cc-mastercard'} 
                  size={24} 
                  color={COLORS.text} 
                />
              </View>
              <View>
                <Text style={styles.cardText}>
                  {card.type} ending in {card.last4}
                </Text>
                <Text style={styles.cardSubtext}>Expires {card.expiry}</Text>
              </View>
            </View>
            {card.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <Button 
        title="Add Payment Method" 
        variant="outline"
        onPress={() => {}}
        style={styles.addButton}
      />
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
  cardsContainer: {
    marginBottom: SPACING.lg,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 30,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  defaultBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  defaultText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addButton: {
    marginTop: SPACING.md,
  },
});

