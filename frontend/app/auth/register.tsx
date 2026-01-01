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
import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';

const { height } = Dimensions.get('window');

function hasMissing(missing: string[], key: string) {
  return (
    missing.includes(key) ||
    missing.includes(key.toLowerCase()) ||
    missing.includes(key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`))
  );
}

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [needsRequirements, setNeedsRequirements] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();

  const resetProgress = () => {
    setPendingVerification(false);
    setNeedsRequirements(false);
    setMissingFields([]);
    setCode('');
    setVerified(false);
  };

  const handleRegister = async () => {
    if (!isLoaded) return;
    if (!firstName || !lastName || !email || !password) {
      Alert.alert(
        'Missing info',
        'Please enter your first name, last name, email, and password.'
      );
      return;
    }

    try {
      setSubmitting(true);
      resetProgress();
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert(
          'Sign up failed',
          err.errors?.[0]?.longMessage ?? 'Please try again.'
        );
      } else {
        Alert.alert('Sign up failed', 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRequirements = async () => {
    if (!isLoaded) return;

    try {
      setSubmitting(true);

      const update: Record<string, string> = {};
      // Always send these if present; Clerk may require them depending on your dashboard config.
      if (firstName) update.firstName = firstName;
      if (lastName) update.lastName = lastName;
      if (email) update.emailAddress = email;

      if (hasMissing(missingFields, 'username')) {
        update.username = username;
      }

      if (missingFields.length > 0 && Object.keys(update).length === 0) {
        Alert.alert(
          'More info required',
          `Clerk requires additional fields: ${missingFields.join(
            ', '
          )}. Please update your Clerk settings or add inputs for these fields.`
        );
        return;
      }

      await signUp.update(update);

      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        setVerified(true);
        setNeedsRequirements(false);
        return;
      }

      setMissingFields(signUp.missingFields ?? []);
      Alert.alert(
        'Almost there',
        `Still missing: ${
          (signUp.missingFields ?? []).join(', ') || 'unknown'
        }.`
      );
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert(
          'Update failed',
          err.errors?.[0]?.longMessage ?? 'Please try again.'
        );
      } else {
        Alert.alert('Update failed', 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    if (!code) {
      Alert.alert(
        'Missing code',
        'Enter the verification code from your email.'
      );
      return;
    }

    try {
      setSubmitting(true);
      await signUp.attemptEmailAddressVerification({ code });
      await signUp.reload?.();

      // Happy path: signup complete -> session exists -> user will appear in Clerk dashboard.
      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        setVerified(true);
        setNeedsRequirements(false);
        return;
      }

      // If Clerk needs more fields, show them explicitly (this is the real reason you won't see a user/session).
      const missing = signUp.missingFields ?? [];
      if (missing.length > 0) {
        setMissingFields(missing);
        setNeedsRequirements(true);
        return;
      }

      Alert.alert(
        'Verification incomplete',
        'Your email code was accepted, but Clerk did not complete signup. Please try again.'
      );
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        Alert.alert(
          'Verification failed',
          err.errors?.[0]?.longMessage ?? 'Please try again.'
        );
      } else {
        Alert.alert('Verification failed', 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToOnboarding = () => {
    router.replace('/onboarding/pet-name');
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <FontAwesome
                name='arrow-left'
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <FontAwesome
                  name={
                    verified
                      ? 'check-circle'
                      : pendingVerification
                      ? 'key'
                      : 'user-plus'
                  }
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.title}>
                {verified
                  ? 'Email Verified!'
                  : pendingVerification
                  ? 'Verify Email'
                  : 'Create Account'}
              </Text>
              <Text style={styles.subtitle}>
                {verified
                  ? 'Your account has been created successfully'
                  : pendingVerification
                  ? `Enter the code sent to ${email}`
                  : 'Join our community of pet lovers'}
              </Text>
            </View>

            <View style={styles.card}>
              {!pendingVerification && !verified && (
                <>
                  <View style={styles.nameRow}>
                    <View
                      style={[
                        styles.inputWrapper,
                        styles.flex1,
                        styles.nameFieldLeft,
                      ]}
                    >
                      <Text style={styles.inputLabel}>First Name</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name='user-o'
                          size={20}
                          color={COLORS.textLight}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder='First'
                          style={styles.input}
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholderTextColor={COLORS.textLight}
                          autoCapitalize='words'
                        />
                      </View>
                    </View>
                    <View style={[styles.inputWrapper, styles.flex1]}>
                      <Text style={styles.inputLabel}>Last Name</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name='user-o'
                          size={20}
                          color={COLORS.textLight}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder='Last'
                          style={styles.input}
                          value={lastName}
                          onChangeText={setLastName}
                          placeholderTextColor={COLORS.textLight}
                          autoCapitalize='words'
                        />
                      </View>
                    </View>
                  </View>

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
                        placeholder='Create a password'
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor={COLORS.textLight}
                      />
                    </View>
                  </View>
                </>
              )}

              {pendingVerification && !verified && !needsRequirements && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <View style={styles.inputContainer}>
                    <FontAwesome
                      name='key'
                      size={20}
                      color={COLORS.textLight}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      placeholder='123456'
                      style={styles.input}
                      value={code}
                      onChangeText={setCode}
                      keyboardType='number-pad'
                      placeholderTextColor={COLORS.textLight}
                      autoFocus
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Check your email for the verification code
                  </Text>
                </View>
              )}

              {needsRequirements && !verified && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Almost there</Text>
                  <Text style={styles.helperText}>
                    Clerk needs a bit more info to finish creating your account.
                  </Text>

                  {hasMissing(missingFields, 'username') && (
                    <View
                      style={[styles.inputWrapper, { marginTop: SPACING.md }]}
                    >
                      <Text style={styles.inputLabel}>Username</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name='at'
                          size={18}
                          color={COLORS.textLight}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          placeholder='yourname'
                          style={styles.input}
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize='none'
                          placeholderTextColor={COLORS.textLight}
                        />
                      </View>
                    </View>
                  )}

                  {hasMissing(missingFields, 'phone_number') && (
                    <Text
                      style={[styles.helperText, { marginTop: SPACING.md }]}
                    >
                      Missing: phone_number. Your Clerk instance is still
                      requiring a phone number. If you want email-only (and
                      Mexico isn’t supported), disable phone number as an
                      identifier/required field in the Clerk Dashboard for this
                      **same** dev instance.
                    </Text>
                  )}

                  {!!missingFields.length && (
                    <Text
                      style={[styles.helperText, { marginTop: SPACING.md }]}
                    >
                      Missing: {missingFields.join(', ')}
                    </Text>
                  )}
                </View>
              )}

              {verified && (
                <View style={styles.successContainer}>
                  <Text style={styles.successTitle}>Account Created!</Text>
                  <Text style={styles.successText}>
                    Welcome to FindMyVet! Let’s set up your pet’s profile.
                  </Text>
                </View>
              )}

              <Button
                title={
                  verified
                    ? 'Continue'
                    : needsRequirements
                    ? 'Continue'
                    : pendingVerification
                    ? 'Verify Email'
                    : 'Sign Up'
                }
                onPress={
                  verified
                    ? handleContinueToOnboarding
                    : needsRequirements
                    ? handleCompleteRequirements
                    : pendingVerification
                    ? handleVerify
                    : handleRegister
                }
                style={styles.signupButton}
                size='lg'
                loading={submitting}
                disabled={!isLoaded}
              />

              {!verified && (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{' '}
                  </Text>
                  <Link
                    href='/auth/login'
                    asChild
                  >
                    <TouchableOpacity>
                      <Text style={styles.loginText}>Log In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              )}
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
    height: height * 0.45,
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
  nameRow: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  nameFieldLeft: {
    marginRight: SPACING.sm,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.xl,
    width: 40,
    height: 40,
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.xl,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
    borderRadius: RADIUS.full,
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
  signupButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: RADIUS.full,
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
  loginText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  helperText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  successText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
