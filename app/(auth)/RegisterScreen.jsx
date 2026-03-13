import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import T from '../../constants/translations';
import { authAPI } from '../../services/api';

export default function RegisterScreen({ navigation }) {

  // ── Form fields ───────────────────────────────────
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [phone,         setPhone]         = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showPassword,  setShowPassword]  = useState(false);

  // ── UI state ──────────────────────────────────────
  const [loading,       setLoading]       = useState(false);
  const [captchaKey,    setCaptchaKey]    = useState(Date.now()); // changing this reloads captcha
  const [errors,        setErrors]        = useState({});

  // ── Input refs (for keyboard next button) ─────────
  const emailRef    = useRef();
  const passwordRef = useRef();
  const phoneRef    = useRef();
  const captchaRef  = useRef();

  // ── Reload CAPTCHA image ──────────────────────────
  function reloadCaptcha() {
    setCaptchaKey(Date.now()); // new timestamp = new image from server
    setCaptchaAnswer('');
  }

  // ── Validate form before submitting ──────────────
  function validate() {
    const e = {};
    if (!name.trim())               e.name     = 'Injiza amazina yawe.';
    if (!email.includes('@'))       e.email    = T.errorEmail;
    if (password.length < 6)        e.password = T.errorPassword;
    if (!phone.trim())              e.phone    = 'Injiza numero ya telefoni.';
    if (!captchaAnswer.trim())      e.captcha  = 'Injiza inyuguti ubona.';
    setErrors(e);
    return Object.keys(e).length === 0; // true = no errors
  }

  // ── Submit signup ─────────────────────────────────
  async function handleSignup() {
    if (!validate()) return;

    setLoading(true);

    const result = await authAPI.signup(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      phone.trim(),
      captchaAnswer.trim()
    );

    setLoading(false);

    if (result.ok) {
      // Signup worked — go to OTP screen with userId
      navigation.navigate('VerifyOtp', {
        userId: result.data.userId,
        email:  email.trim().toLowerCase(),
        name:   name.trim(),
      });
    } else {
      // Show error from server
      const msg = result.data?.error || T.errorServer;

      if (msg.toLowerCase().includes('captcha')) {
        // Wrong CAPTCHA — reload image and clear answer
        reloadCaptcha();
        setErrors({ captcha: 'CAPTCHA ntabwo ari yo. Ongera ugerageze.' });
      } else if (msg.toLowerCase().includes('imeyili isanzwe')) {
        setErrors({ email: 'Iyi meyili isanzwe ikoreshwa.' });
      } else {
        Alert.alert('Ikosa', msg);
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Iyandikishe</Text>
            <Text style={styles.headerSub}>Create your family account</Text>
          </View>

          {/* ── Wave divider ── */}
          <View style={styles.wave} />

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Full name */}
            <InputField
              label="Amazina yose — Full name"
              value={name}
              onChangeText={setName}
              placeholder="Consolée Uwimana"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={errors.name}
            />

            {/* Email */}
            <InputField
              ref={emailRef}
              label="Imeyili — Email"
              value={email}
              onChangeText={setEmail}
              placeholder="consolee@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
            />

            {/* Password */}
            <View>
              <InputField
                ref={passwordRef}
                label="Ijambo banga — Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Nibura inyuguti 6"
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                error={errors.password}
              />
              {/* Show/hide password toggle */}
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
              >
                <Text style={styles.eyeText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phone */}
            <InputField
              ref={phoneRef}
              label="Telefoni — Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+250788000000"
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => captchaRef.current?.focus()}
              error={errors.phone}
            />

            {/* ── CAPTCHA section ── */}
            <View style={styles.captchaSection}>
              <Text style={styles.label}>
                Emeza ko uri muntu — Prove you are human
              </Text>

              <View style={styles.captchaImageRow}>
                {/* Captcha image from Java backend */}
                <Image
                  key={captchaKey} // changing key forces reload
                  source={{ uri: authAPI.getCaptchaUrl() }}
                  style={styles.captchaImage}
                  resizeMode="contain"
                />

                {/* Reload button */}
                <TouchableOpacity
                  style={styles.reloadBtn}
                  onPress={reloadCaptcha}
                >
                  <Text style={styles.reloadText}>🔄</Text>
                  <Text style={styles.reloadLabel}>Hindura</Text>
                </TouchableOpacity>
              </View>

              {/* Answer input */}
              <TextInput
                ref={captchaRef}
                style={[
                  styles.captchaInput,
                  errors.captcha && styles.inputError
                ]}
                value={captchaAnswer}
                onChangeText={setCaptchaAnswer}
                placeholder={T.captchaHint}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters" // force uppercase to match
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
              {errors.captcha && (
                <Text style={styles.errorText}>{errors.captcha}</Text>
              )}
            </View>

            {/* ── Submit button ── */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitText}>
                  Komeza — Continue →
                </Text>
              )}
            </TouchableOpacity>

            {/* ── Already have account ── */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                {T.alreadyAccount}
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Reusable input field component ───────────────────
// forwardRef lets parent pass a ref to focus from keyboard "next"
import { forwardRef } from 'react';

const InputField = forwardRef(({
  label, error, ...props
}, ref) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      ref={ref}
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={Colors.textMuted}
      autoCorrect={false}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
));

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: Colors.teal,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // ── Header (teal background) ──────────────────────
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

  // ── Wave transition ───────────────────────────────
  wave: {
    height: 32,
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -2,
  },

  // ── Form ─────────────────────────────────────────
  form: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  fieldWrap: {
    marginBottom: 18,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.white,
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
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
    fontFamily: 'DMSans_400Regular',
  },

  // Eye button sits over the password input
  eyeBtn: {
    position: 'absolute',
    right: 16,
    bottom: 14,
  },
  eyeText: {
    fontSize: 18,
  },

  // ── CAPTCHA ───────────────────────────────────────
  captchaSection: {
    marginBottom: 24,
  },
  captchaImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  captchaImage: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  reloadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 8,
  },
  reloadText: {
    fontSize: 22,
  },
  reloadLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'DMSans_400Regular',
  },
  captchaInput: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,         // bigger — easier to type the distorted code
    fontFamily: 'DMSans_500Medium',
    color: Colors.textPrimary,
    letterSpacing: 6,     // spread letters out like the captcha image
    textAlign: 'center',
  },

  // ── Submit button ─────────────────────────────────
  submitBtn: {
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // ── Login link ────────────────────────────────────
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
  loginLinkText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});