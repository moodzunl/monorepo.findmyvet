import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { COLORS } from '../constants/theme';
import { ClerkLoaded, ClerkLoading, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in frontend/.env (see frontend/.env.example).'
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoading />
      <ClerkLoaded>
        <AuthGate />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const topLevel = segments[0];
    const isInAuth = topLevel === 'auth';
    const authRoute = segments[1]; // e.g. 'login' | 'register'

    if (!isSignedIn && !isInAuth) {
      router.replace('/auth/login');
      return;
    }

    // Only auto-redirect signed-in users away from the login screen.
    // (Avoids fighting the register -> verified -> onboarding flow.)
    if (isSignedIn && isInAuth && authRoute === 'login') {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, router, segments]);

  // Don't render anything until we know the auth state (prevents flash)
  if (!isLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen 
        name="clinic/[id]" 
        options={{ 
          headerTitle: '',
          headerBackTitleVisible: false,
          headerTransparent: true,
          headerTintColor: COLORS.white,
        }} 
      />
      <Stack.Screen 
        name="booking" 
        options={{ 
          presentation: 'modal',
          headerTitle: 'Book Appointment',
          headerTintColor: COLORS.primary,
        }} 
      />
    </Stack>
  );
}
