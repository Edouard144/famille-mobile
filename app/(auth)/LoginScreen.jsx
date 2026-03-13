import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, StatusBar, Animated,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import T from '../../constants/translations';
import { authAPI } from '../../services/api';
import storage from '../../services/storage';

export default function LoginScreen({ navigation }) {

  // ── Form state ────────────────────────────────────
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  // ── Refs ──────────────────────────────────────────
  const passwordRef = useRef();

  // ── Animations ────────────────────────────────────
  const logoScale   = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formY       = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;

  // ── Entrance animation ────────────────────────────
  useEffect(() => {
    // Logo pops in first
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1, tension: 60, friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Then form slides up
    Animated.parallel([
      Animated.timing(formY, {
        toValue: 0, duration: 500, delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1, duration: 500, delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Shake animation for wrong credentials ─────────
  function shakeForm() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }

  // ── Validate ──────────────────────────────────────
  function validate() {
    const e = {};
    if (!email.includes('@'))  e.email    = T.errorEmail;
    if (password.length < 6)   e.password = T.errorPassword;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Login ─────────────────────────────────────────
  async function handleLogin() {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const result = await authAPI.login(
      email.trim().toLowerCase(),
      password
    );

    setLoading(false);

    if (result.ok) {
      // Save token + user info securely
      await storage.saveToken(result.data.token);
      await storage.saveUser(result.data.userId, result.data.name);

      // Register Expo push token
      try {
        const { default: Notifications } =
          await import('expo-notifications');
        const { data: expoToken } =
          await Notifications.getExpoPushTokenAsync();
        await authAPI.savePushToken(expoToken);
      } catch (e) {
        console.log('Push token skipped:', e.message);
      }

      // Go to main app — clear auth stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } else {
      // Wrong credentials — shake and show error
      shakeForm();
      const msg = result.data?.error || T.errorServer;

      // Show the error on the right field
      if (msg.toLowerCase().includes('verified')) {
        // Account not verified — send them to OTP screen
        setErrors({
          general: 'Konti yawe ntiyemejwe. Reba imeyili yawe.'
        });
      } else {
        setErrors({ general: msg });
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Logo area ── */}
          <Animated.View style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}>
            {/* Sun logo */}
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>🏠</Text>
            </View>
            <Text style={styles.appName}>{T.appName}</Text>
            <Text style={styles.kiny}>{T.appTagline}</Text>
          </Animated.View>

          {/* ── Form card ── */}
          <Animated.View style={[
            styles.card,
            {
              opacity: formOpacity,
              transform: [
                { translateY: formY },
                { translateX: shakeAnim },
              ]
            }
          ]}>

            <Text style={styles.cardTitle}>Injira — Login</Text>
            <Text style={styles.cardSub}>
              Murakaza neze ugarutse 👋
            </Text>

            {/* General error */}
            {errors.general ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  {errors.general}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Imeyili — Email</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError
                ]}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  setErrors(e => ({ ...e, email: null, general: null }));
                }}
                placeholder="consolee@gmail.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Ijambo banga — Password</Text>
              <View>
                <TextInput
                  ref={passwordRef}
                  style={[
                    styles.input,
                    errors.password && styles.inputError
                  ]}
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    setErrors(e => ({ ...e, password: null, general: null }));
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                {/* Show / hide password */}
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(v => !v)}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* ── Login button ── */}
            <TouchableOpacity
              style={[
                styles.loginBtn,
                loading && styles.loginBtnDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.loginBtnText}>
                  {T.login} →
                </Text>
              )}
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>cyangwa</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Register link ── */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLinkText}>
                {T.noAccount}
              </Text>
            </TouchableOpacity>

          </Animated.View>

          {/* ── Bottom decoration ── */}
          <View style={styles.bottomDeco}>
            <Text style={styles.bottomText}>
              Famille — Umuryango w'u Rwanda 🇷🇼
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: Colors.creamDark,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  // ── Logo area ─────────────────────────────────────
  logoWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8A020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#E8A020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  kiny: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Form card ─────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },

  // Error banner (general errors)
  errorBanner: {
    backgroundColor: Colors.coralLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorBannerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 18,
  },

  // Fields
  fieldWrap: {
    marginBottom: 18,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },

  // Eye button
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  eyeText: {
    fontSize: 18,
  },

  // ── Login button ──────────────────────────────────
  loginBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // ── Divider ───────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ── Register link ─────────────────────────────────
  registerLink: {
    alignItems: 'center',
    padding: 8,
  },
  registerLinkText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.teal,
    textDecorationLine: 'underline',
  },

  // ── Bottom decoration ─────────────────────────────
  bottomDeco: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  bottomText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});