import { Stack } from 'expo-router';
import { SimpleHeader } from '../../components/ui/SimpleHeader';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => <SimpleHeader title={options.title || ''} />,
      }}
    >
      <Stack.Screen name="account-settings" options={{ title: 'Account Settings' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="payment-methods" options={{ title: 'Payment Methods' }} />
      <Stack.Screen name="help-support" options={{ title: 'Help & Support' }} />
    </Stack>
  );
}
