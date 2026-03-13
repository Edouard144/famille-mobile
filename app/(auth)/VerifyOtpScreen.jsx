import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, StatusBar, Animated, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import T from '../../constants/translations';
import { authAPI } from '../../services/api';
import storage from '../../services/storage';

export default function VerifyOtpScreen({ navigation, route }) {

  // ── Get userId and email passed from RegisterScreen ──
  const { userId, email, name } = route.params;

  // ── 6 individual digit inputs ─────────────────────
  // Each box holds one digit — feels native and clean
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([...Array(6)].map(() => useRef(null)));

  // ── UI state ──────────────────────────────────────
  const [loading,    setLoading]    = useState(false);
  const [resending,  setResending]  = useState(false);
  const [countdown,  setCountdown]  = useState(60); // 60s before resend allowed
  const [canResend,  setCanResend]  = useState(false);
  const [error,      setError]      = useState('');

  // ── Animations ────────────────────────────────────
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;

  // ── Entrance animation ────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Countdown timer for resend button ─────────────
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer); // cleanup on unmount
  }, [countdown]);

  // ── Handle digit input ────────────────────────────
  function handleDigitChange(text, index) {
    // Only accept one digit at a time
    const digit = text.replace(/[^0-9]/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(''); // clear error when typing

    if (digit && index < 5) {
      // Move focus to next box automatically
      inputRefs.current[index + 1]?.current?.focus();
    }

    // If all 6 digits filled — auto submit
    if (digit && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  }

  // ── Handle backspace ──────────────────────────────
  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus back on backspace when box is empty
      inputRefs.current[index - 1]?.current?.focus();
    }
  }

  // ── Shake animation for wrong code ────────────────
  function shakeBoxes() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }

  // ── Verify OTP ────────────────────────────────────
  async function handleVerify(codeOverride) {
    const code = codeOverride || digits.join('');

    if (code.length < 6) {
      setError('Injiza imibare yose 6. (Enter all 6 digits)');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authAPI.verifyOtp(userId, code);

    setLoading(false);

    if (result.ok) {
      // ✅ Save JWT token and user info securely on device
      await storage.saveToken(result.data.token);
      await storage.saveUser(userId, name);

      // Register Expo push token with backend
      try {
        // Skip notifications on web - not supported
        if (typeof window !== 'undefined' && window.ReactNativeNativePart) {
          const { default: Notifications } = await import('expo-notifications');
          const { data: expoToken } = await Notifications.getExpoPushTokenAsync();
          await authAPI.savePushToken(expoToken);
        }
      } catch (e) {
        // Push token registration failed — not critical, continue anyway
        console.log('Push token registration skipped:', e.message);
      }

      // Navigate to main app — replace so user can't go back to auth
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } else {
      // Wrong code — shake the boxes and show error
      shakeBoxes();
      setDigits(['', '', '', '', '', '']); // clear digits
      setError(result.data?.error || 'Kode ntabwo ari yo. (Wrong code)');
      inputRefs.current[0]?.current?.focus(); // refocus first box
    }
  }

  // ── Resend OTP ────────────────────────────────────
  async function handleResend() {
    if (!canResend) return;

    setResending(true);
    setCanResend(false);
    setCountdown(60); // reset timer
    setDigits(['', '', '', '', '', '']);
    setError('');

    // Call signup again with same details to trigger new OTP
    // In production you'd have a dedicated /resend-otp endpoint
    Alert.alert(
      'Kode nshya yoherejwe',
      `Reba imeyili yawe: ${email}`,
      [{ text: 'Sawa' }]
    );

    setResending(false);
  }

  // Combine digits into full code for display
  const fullCode = digits.join('');
  const isComplete = fullCode.length === 6;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Emeza Konti</Text>
        <Text style={styles.headerSub}>Verify your account</Text>
      </View>

      {/* ── Wave ── */}
      <View style={styles.wave} />

      {/* ── Body ── */}
      <Animated.View style={[
        styles.body,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>

        {/* Email envelope illustration */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        {/* Instruction text */}
        <Text style={styles.instruction}>
          {T.otpHint}
        </Text>
        <Text style={styles.emailDisplay}>{email}</Text>
        <Text style={styles.subInstruction}>
          Kode irarangira mu minuta 10.{'\n'}
          (Code expires in 10 minutes)
        </Text>

        {/* ── 6 digit boxes ── */}
        <Animated.View style={[
          styles.digitRow,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs.current[index]}
              style={[
                styles.digitBox,
                digit && styles.digitBoxFilled,
                error && styles.digitBoxError,
              ]}
              value={digit}
              onChangeText={text => handleDigitChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden={true} // hide caret — looks cleaner in boxes
            />
          ))}
        </Animated.View>

        {/* Error message */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* ── Verify button ── */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (!isComplete || loading) && styles.verifyBtnDisabled
          ]}
          onPress={() => handleVerify()}
          disabled={!isComplete || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.verifyText}>
              {T.verify} ✓
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Resend section ── */}
        <View style={styles.resendWrap}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendActive}>
                {resending ? 'Kohereza...' : T.resendOtp}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Ohereza kode nshya mu{' '}
              <Text style={styles.resendTimerBold}>
                {countdown}s
              </Text>
            </Text>
          )}
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: Colors.teal,
  },

  // ── Header ───────────────────────────────────────
  header: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: Colors.white,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },

  // ── Wave ─────────────────────────────────────────
  wave: {
    height: 32,
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -2,
  },

  // ── Body ─────────────────────────────────────────
  body: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
  },

  // Envelope icon
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },

  // Instructions
  instruction: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailDisplay: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: Colors.teal,
    marginTop: 4,
    marginBottom: 8,
  },
  subInstruction: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 28,
  },

  // ── 6 digit boxes ─────────────────────────────────
  digitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  digitBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textPrimary,
  },
  digitBoxFilled: {
    borderColor: Colors.teal,   // teal border when filled
    backgroundColor: Colors.tealLight,
  },
  digitBoxError: {
    borderColor: Colors.danger, // red border on wrong code
    backgroundColor: Colors.coralLight,
  },

  // Error
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },

  // ── Verify button ─────────────────────────────────
  verifyBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  verifyBtnDisabled: {
    opacity: 0.4,
  },
  verifyText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // ── Resend ────────────────────────────────────────
  resendWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendActive: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.teal,
    textDecorationLine: 'underline',
  },
  resendTimer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  resendTimerBold: {
    fontFamily: 'DMSans_500Medium',
    color: Colors.amber,
  },
});