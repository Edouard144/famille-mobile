import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

import storage from './services/storage';
import Colors from './constants/colors';

// ── Auth screens (not logged in) ─────────────────
import SplashScreen    from './app/(auth)/SplashScreen';
import LoginScreen     from './app/(auth)/LoginScreen';
import RegisterScreen  from './app/(auth)/RegisterScreen';
import VerifyOtpScreen from './app/(auth)/VerifyOtpScreen';

// ── App screens (logged in) ───────────────────────
import DashboardScreen  from './app/(tabs)/DashboardScreen';
import ChildrenScreen   from './app/(tabs)/ChildrenScreen';
import PregnancyScreen  from './app/(tabs)/PregnancyScreen';
import MealsScreen      from './app/(tabs)/MealsScreen';
import BudgetScreen     from './app/(tabs)/BudgetScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Bottom tab navigator (shown when logged in) ───
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor:  Colors.border,
          borderTopWidth:  1,
          paddingBottom:   14,
          paddingTop:      10,
          height:          65,
        },
        tabBarActiveTintColor:   Colors.teal,
        tabBarInactiveTintColor: Colors.amber,
        tabBarLabelStyle: {
          fontSize:      9,
          fontWeight:    '500',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Children"
        component={ChildrenScreen}
        options={{
          tabBarLabel: 'ABANA',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👶</Text>,
        }}
      />
      <Tab.Screen
        name="Pregnancy"
        component={PregnancyScreen}
        options={{
          tabBarLabel: 'INDA',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🤰</Text>,
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{
          tabBarLabel: 'IFUNGURO',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍽️</Text>,
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'AMAFARANGA',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root app component ────────────────────────────
export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  // Check if user already has a saved token (auto-login)
  useEffect(() => {
    async function checkAuth() {
      const loggedIn = await storage.isLoggedIn();
      setIsLoggedIn(loggedIn);
    }
    checkAuth();
  }, []);

  // Show spinner while fonts and auth check load
  if (!fontsLoaded || isLoggedIn === null) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: Colors.cream }}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {isLoggedIn ? (
          // ── Logged in → show main tabs ──────────
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          // ── Not logged in → show auth flow ──────
          <>
            <Stack.Screen name="Splash"    component={SplashScreen} />
            <Stack.Screen name="Login"     component={LoginScreen} />
            <Stack.Screen name="Register"  component={RegisterScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}