import { Stack } from 'expo-router';
import { SimpleHeader } from '../../components/ui/SimpleHeader';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          headerShown: true, 
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
          title: 'Admin Dashboard' 
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          headerShown: true, 
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
          title: 'Manage Users' 
        }} 
      />
      <Stack.Screen 
        name="vets" 
        options={{ 
          headerShown: true, 
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
          title: 'Verified Vets' 
        }} 
      />
      <Stack.Screen 
        name="clinics" 
        options={{ 
          headerShown: true, 
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
          title: 'Active Clinics' 
        }} 
      />
      <Stack.Screen 
        name="approvals" 
        options={{ 
          headerShown: true, 
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
          title: 'Pending Approvals' 
        }} 
      />
      <Stack.Screen 
        name="approval-detail/[id]" 
        options={{ 
          headerShown: true, 
          header: ({ options }) => <SimpleHeader title={options.title || ''} />,
          title: 'Application Details' 
        }} 
      />
    </Stack>
  );
}
