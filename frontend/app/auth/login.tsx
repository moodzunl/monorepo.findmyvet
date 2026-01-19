import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { StatusBar } from 'expo-status-bar';
import { isClerkAPIResponseError, useSSO, useSignIn } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();

  const handleLogin = async () => {
    if (!isLoaded) return;
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status !== 'complete') {
        Alert.alert('Login incomplete', 'Please finish signing in.');
        return;
      }

      await setActive({ session: result.createdSessionId });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert(
          'Login failed',
          err.errors?.[0]?.longMessage ?? 'Please try again.'
        );
      } else {
        Alert.alert('Login failed', 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    try {
      setOauthSubmitting(true);
      const redirectUrl = Linking.createURL('/', { scheme: 'findmyvet' });

      const result = await startSSOFlow({ strategy: 'oauth_google', redirectUrl });
      if (result.createdSessionId) {
        await result.setActive?.({ session: result.createdSessionId });
        // Clerk uses "transferable" to indicate the SSO flow needs to create a user (signup).
        // This is the most reliable signal for "new user" vs "existing user" in one Google button.
        const isNewUser =
          result.signIn?.firstFactorVerification?.status === 'transferable' ||
          Boolean(result.signUp?.createdSessionId);
        router.replace(isNewUser ? '/onboarding/pet-name' : '/(tabs)');
        return;
      }

      Alert.alert('Login incomplete', 'Please finish signing in with Google.');
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert(
          'Google login failed',
          err.errors?.[0]?.longMessage ?? 'Please try again.'
        );
      } else {
        Alert.alert('Google login failed', 'Please try again.');
      }
    } finally {
      setOauthSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style='light' />

        {/* Sophisticated Background */}
        <View style={styles.backgroundContainer}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <FontAwesome
                  name='paw'
                  size={40}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.appName}>FindMyVet</Text>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subtitleText}>Sign in to continue</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome
                    name='envelope-o'
                    size={20}
                    color={COLORS.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder='name@example.com'
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize='none'
                    keyboardType='email-address'
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome
                    name='lock'
                    size={24}
                    color={COLORS.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder='Enter your password'
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title='Log In'
                onPress={handleLogin}
                style={styles.loginButton}
                size='lg'
                loading={submitting}
                disabled={!isLoaded}
              />

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleLogin}
                  disabled={!isLoaded || submitting || oauthSubmitting}
                >
                  <FontAwesome
                    name='google'
                    size={20}
                    color='#DB4437'
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Alert.alert('Coming soon', 'Apple login is not implemented yet.')}
                >
                  <FontAwesome
                    name='apple'
                    size={22}
                    color='#000000'
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => Alert.alert('Coming soon', 'Facebook login is not implemented yet.')}
                >
                  <FontAwesome
                    name='facebook'
                    size={20}
                    color='#4267B2'
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don’t have an account? </Text>
              <Link
                href='/auth/register'
                asChild
              >
                <TouchableOpacity>
                  <Text style={styles.signupText}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backgroundCircle2: {
    position: 'absolute',
    top: 50,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'flex-start',
    paddingTop: height * 0.12,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitleText: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32, // More rounded style
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 4,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full, // Fully rounded inputs
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: SPACING.md,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: RADIUS.full, // Rounded button
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
  },
  signupText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
