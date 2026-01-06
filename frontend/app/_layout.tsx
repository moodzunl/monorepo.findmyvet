import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { COLORS } from '../constants/theme';
import { ClerkLoaded, ClerkLoading, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Only needed for web auth sessions.
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  // Start on tabs; signed-out users will be redirected to /auth/login by AuthGate.
  // (Tabs screens are already gated from firing authed API calls when signed out.)
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in frontend/.env.'
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

  const topLevel = segments[0];
  const isInAuth = topLevel === 'auth';

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn && !isInAuth) {
      router.replace('/auth/login');
      return;
    }
  }, [isLoaded, isSignedIn, isInAuth, router]);

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
