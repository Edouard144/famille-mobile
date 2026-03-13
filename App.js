import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

// ── Auth screens ──────────────────────────────────
import SplashScreen     from './app/(auth)/SplashScreen';
import RegisterScreen   from './app/(auth)/RegisterScreen';
import VerifyOtpScreen  from './app/(auth)/VerifyOtpScreen';
import LoginScreen      from './app/(auth)/LoginScreen';

// ── Tab screens ───────────────────────────────────
import DashboardScreen  from './app/(tabs)/DashboardScreen';
import ChildrenScreen   from './app/(tabs)/ChildrenScreen';
import PregnancyScreen  from './app/(tabs)/PregnancyScreen';
import MealsScreen      from './app/(tabs)/MealsScreen';
import BudgetScreen     from './app/(tabs)/BudgetScreen';

// ── Services + Colors ─────────────────────────────
import storage  from './services/storage';
import Colors   from './constants/colors';

// ── Navigators ────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ─────────────────────────────────────────────────────
// ── Bottom Tab Navigator ──────────────────────────────
// This is the MAIN app — shown after login
// ─────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({

        // ── Hide the default header — we draw our own ──
        headerShown: false,

        // ── Tab bar style ──────────────────────────
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },

        // ── Active / inactive colors ───────────────
        tabBarActiveTintColor:   Colors.teal,
        tabBarInactiveTintColor: Colors.textMuted,

        // ── Label style ───────────────────────────
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 10,
          marginTop: -2,
        },

        // ── Icon per tab ──────────────────────────
        // We use emoji icons — no icon library needed
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home:      focused ? '🏠' : '🏡',
            Children:  focused ? '👶' : '🍼',
            Pregnancy: focused ? '🤰' : '🌸',
            Meals:     focused ? '🍽️' : '🥗',
            Budget:    focused ? '💰' : '💵',
          };
          return (
            <View style={tabStyles.iconWrap}>
              <TabIcon
                emoji={icons[route.name] || '●'}
                focused={focused}
              />
            </View>
          );
        },
      })}
    >
      {/* Each screen + its tab label in Kinyarwanda */}
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Children"
        component={ChildrenScreen}
        options={{ tabBarLabel: 'Abana' }}
      />
      <Tab.Screen
        name="Pregnancy"
        component={PregnancyScreen}
        options={{ tabBarLabel: 'Inda' }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{ tabBarLabel: 'Ifunguro' }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ tabBarLabel: 'Amafaranga' }}
      />
    </Tab.Navigator>
  );
}

// ── Small tab icon component ──────────────────────
// Focused tab gets a teal background pill
function TabIcon({ emoji, focused }) {
  return (
    <View style={[
      tabStyles.iconPill,
      focused && tabStyles.iconPillActive
    ]}>
      <View style={focused ? tabStyles.iconActive : null}>
        <View style={{ opacity: focused ? 1 : 0.7 }}>
          {/* Emoji rendered as Text is more reliable cross-platform */}
          <View>
            <View style={{ alignItems: 'center' }}>
              {/* Use Text directly inside a View for emoji */}
              <EmojiIcon emoji={emoji} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// Simple emoji Text wrapper
import { Text } from 'react-native';
function EmojiIcon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: Colors.tealLight,
  },
  iconActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─────────────────────────────────────────────────────
// ── Root App ──────────────────────────────────────────
// ─────────────────────────────────────────────────────
export default function App() {

  // ── Load custom fonts ─────────────────────────────
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  // ── Check if user is already logged in ───────────
  // true  = go straight to MainTabs (skip auth)
  // false = show auth stack
  // null  = still checking (show spinner)
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    checkLogin();
  }, []);

  async function checkLogin() {
    const loggedIn = await storage.isLoggedIn();
    setIsLoggedIn(loggedIn);
  }

  // ── Show spinner while fonts load or login check ──
  if (!fontsLoaded || isLoggedIn === null) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingEmoji}>🏠</Text>
        </View>
        <ActivityIndicator
          color={Colors.teal}
          size="large"
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {isLoggedIn ? (
            // ── Already logged in → go to main app ──
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            // ── Not logged in → show auth flow ──────
            <>
              {/* Splash is the first screen */}
              <Stack.Screen
                name="Splash"
                component={SplashScreen}
                options={{ animation: 'fade' }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="VerifyOtp"
                component={VerifyOtpScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </>
          )}

          {/* ── Main is always available so reset() works ── */}
          {/* After login from auth screens, we reset to Main */}
          {!isLoggedIn && (
            <Stack.Screen name="Main" component={MainTabs} />
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8A020',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8A020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingEmoji: {
    fontSize: 36,
  },
});