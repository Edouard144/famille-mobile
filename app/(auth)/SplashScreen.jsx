import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Dimensions, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import T from '../../constants/translations';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {

  // ── Animation values ─────────────────────────────
  const sunScale    = useRef(new Animated.Value(0)).current;
  const sunOpacity  = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(40)).current;
  const titleOpacity= useRef(new Animated.Value(0)).current;
  const familyY     = useRef(new Animated.Value(60)).current;
  const familyOpacity=useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const sunPulse    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1 — Sun rises and scales in
    Animated.parallel([
      Animated.spring(sunScale, {
        toValue: 1, tension: 50, friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(sunOpacity, {
        toValue: 1, duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {

      // Step 2 — Title slides up
      Animated.parallel([
        Animated.timing(titleY, {
          toValue: 0, duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1, duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {

        // Step 3 — Family illustration rises
        Animated.parallel([
          Animated.timing(familyY, {
            toValue: 0, duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(familyOpacity, {
            toValue: 1, duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {

          // Step 4 — Button fades in
          Animated.timing(btnOpacity, {
            toValue: 1, duration: 400,
            useNativeDriver: true,
          }).start();

          // Step 5 — Sun pulses forever
          Animated.loop(
            Animated.sequence([
              Animated.timing(sunPulse, {
                toValue: 1.08, duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(sunPulse, {
                toValue: 1, duration: 1500,
                useNativeDriver: true,
              }),
            ])
          ).start();
        });
      });
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.creamDark} />

      {/* ── Background warm circles ── */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* ── Sun ── */}
      <Animated.View style={[
        styles.sunWrap,
        {
          opacity: sunOpacity,
          transform: [
            { scale: Animated.multiply(sunScale, sunPulse) }
          ]
        }
      ]}>
        <View style={styles.sun}>
          {/* House icon inside sun */}
          <Text style={styles.sunIcon}>🏠</Text>
        </View>
        {/* Sun rays */}
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <View
            key={i}
            style={[styles.ray, { transform: [{ rotate: `${deg}deg` }] }]}
          />
        ))}
      </Animated.View>

      {/* ── Title block ── */}
      <Animated.View style={[
        styles.titleBlock,
        { opacity: titleOpacity, transform: [{ translateY: titleY }] }
      ]}>
        <Text style={styles.appName}>{T.appName}</Text>
        <Text style={styles.kiny}>{T.appTagline}</Text>
        <Text style={styles.tagline}>{T.appSubtitle}</Text>
      </Animated.View>

      {/* ── Family illustration ── */}
      <Animated.View style={[
        styles.familyWrap,
        { opacity: familyOpacity, transform: [{ translateY: familyY }] }
      ]}>
        {/* Dad */}
        <FamilyPerson
          headColor="#8B5520"
          bodyColor={Colors.teal}
          headSize={26}
          bodyH={44}
          bodyW={24}
        />
        {/* Mom */}
        <FamilyPerson
          headColor="#C47A3A"
          bodyColor={Colors.coral}
          headSize={24}
          bodyH={38}
          bodyW={28}
          bodyRadius={12}
          offsetY={6}
        />
        {/* Child */}
        <FamilyPerson
          headColor="#A0622A"
          bodyColor="#2A8FB8"
          headSize={20}
          bodyH={32}
          bodyW={20}
          offsetY={12}
        />
        {/* Baby */}
        <FamilyPerson
          headColor="#E8A060"
          bodyColor="#E8C84A"
          headSize={16}
          bodyH={24}
          bodyW={16}
          offsetY={20}
        />
      </Animated.View>

      {/* ── Get Started button ── */}
      <Animated.View style={[styles.btnWrap, { opacity: btnOpacity }]}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{T.getStarted}</Text>
        </TouchableOpacity>

        {/* Already have account link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>{T.alreadyAccount}</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

// ── Small reusable family person component ────────────
function FamilyPerson({
  headColor, bodyColor, headSize,
  bodyH, bodyW, bodyRadius = 6, offsetY = 0
}) {
  // Each person sways slightly using a ref
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1, duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1, duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[
      styles.person,
      {
        marginBottom: offsetY,
        transform: [{
          rotate: sway.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-3deg', '3deg'],
          })
        }]
      }
    ]}>
      {/* Head */}
      <View style={[
        styles.personHead,
        {
          width: headSize, height: headSize,
          borderRadius: headSize / 2,
          backgroundColor: headColor,
        }
      ]} />
      {/* Body */}
      <View style={[
        styles.personBody,
        {
          width: bodyW, height: bodyH,
          backgroundColor: bodyColor,
          borderRadius: bodyRadius,
        }
      ]} />
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Decorative background circles
  bgCircle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: Colors.creamDark,
    top: -width * 0.5,
    opacity: 0.6,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: Colors.amberLight,
    bottom: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.5,
  },

  // Sun
  sunWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sun: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8A020',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sunIcon: {
    fontSize: 38,
  },
  ray: {
    position: 'absolute',
    width: 4,
    height: 20,
    backgroundColor: '#E8C050',
    borderRadius: 2,
    top: -24,         // distance from center
    opacity: 0.7,
    zIndex: 1,
  },

  // Title
  titleBlock: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 32,
  },
  appName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    color: Colors.textPrimary,
    lineHeight: 52,
  },
  kiny: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  // Family illustration
  familyWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 24,
    height: 90,
  },
  person: {
    alignItems: 'center',
    gap: 3,
  },
  personHead: {},
  personBody: {},

  // Button
  btnWrap: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  btn: {
    backgroundColor: Colors.teal,
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 18,
    padding: 8,
  },
  loginLinkText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});clear