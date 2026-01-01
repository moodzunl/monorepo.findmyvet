import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.surface },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="pet-name" />
      <Stack.Screen name="pet-details" />
      <Stack.Screen name="pet-health" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

