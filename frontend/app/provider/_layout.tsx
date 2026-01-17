import { Stack } from 'expo-router';
import { ProviderApplicationProvider } from '../../lib/provider-application';
import { SimpleHeader } from '../../components/ui/SimpleHeader';

export default function ProviderLayout() {
  return (
    <ProviderApplicationProvider>
      <Stack
        screenOptions={{
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
        }}
      >
        <Stack.Screen name="apply" options={{ title: 'Become a Provider' }} />
        <Stack.Screen name="vet-details" options={{ title: 'Vet Details' }} />
        <Stack.Screen name="clinic-details" options={{ title: 'Clinic Details' }} />
        <Stack.Screen name="review" options={{ title: 'Review & Submit' }} />
        <Stack.Screen name="status" options={{ title: 'Application Status' }} />
        <Stack.Screen name="manage-services/index" options={{ title: 'Manage Services' }} />
      </Stack>
    </ProviderApplicationProvider>
  );
}


