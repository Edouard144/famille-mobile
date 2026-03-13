import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/colors';
import T from '../../constants/translations';
import storage from '../../services/storage';
import { childrenAPI, pregnancyAPI, vaccinationsAPI, remindersAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {

  // ── Data state ────────────────────────────────────
  const [userName,     setUserName]     = useState('');
  const [children,     setChildren]     = useState([]);
  const [pregnancy,    setPregnancy]    = useState(null);
  const [vaccinations, setVaccinations] = useState([]);  // upcoming only
  const [refreshing,   setRefreshing]   = useState(false);

  // ── Animations ────────────────────────────────────
  const headerY     = useRef(new Animated.Value(-20)).current;
  const headerOp    = useRef(new Animated.Value(0)).current;
  const cardsY      = useRef(new Animated.Value(30)).current;
  const cardsOp     = useRef(new Animated.Value(0)).current;

  // ── Load data every time screen is focused ────────
  // useFocusEffect re-runs when you tab back to dashboard
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  // ── Entrance animation (runs once) ────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY,  { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardsY,   { toValue: 0, duration: 600, delay: 150, useNativeDriver: true }),
      Animated.timing(cardsOp,  { toValue: 1, duration: 600, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fetch everything from backend ─────────────────
  async function loadAll() {
    const name = await storage.getUserName();
    setUserName(name || 'Mubyeyi');  // fallback = "Parent" in Kinyarwanda

    const [childRes, pregRes] = await Promise.all([
      childrenAPI.getAll(),
      pregnancyAPI.get(),
    ]);

    if (childRes.ok) {
      setChildren(childRes.data);

      // Load upcoming vaccinations for first child only on dashboard
      if (childRes.data.length > 0) {
        const vacRes = await vaccinationsAPI.getByChild(childRes.data[0].id);
        if (vacRes.ok) {
          // Only show vaccinations not yet done
          const upcoming = vacRes.data
            .filter(v => !v.done)
            .slice(0, 3); // show max 3 on dashboard
          setVaccinations(upcoming);
        }
      }
    }

    if (pregRes.ok) setPregnancy(pregRes.data);
  }

  // ── Pull to refresh ───────────────────────────────
  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  // ── Greeting based on time of day ─────────────────
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Mwaramutse';   // Good morning
    if (hour < 17) return 'Mwiriwe';      // Good afternoon
    return 'Muraho';                        // Good evening
  }

  // ── Pregnancy progress color ──────────────────────
  function trimesterColor(week) {
    if (week <= 13) return Colors.blue;    // 1st trimester
    if (week <= 26) return Colors.amber;   // 2nd trimester
    return Colors.coral;                   // 3rd trimester
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.teal}
          />
        }
      >

        {/* ── Header ── */}
        <Animated.View style={[
          styles.header,
          {
            opacity: headerOp,
            transform: [{ translateY: headerY }]
          }
        ]}>
          {/* Decorative circle */}
          <View style={styles.headerCircle} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()} 👋
              </Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* Notification bell */}
            <TouchableOpacity style={styles.bellBtn}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Quick summary strip */}
          <View style={styles.summaryStrip}>
            <SummaryPill
              icon="👶"
              value={children.length}
              label={T.children}
              color={Colors.blue}
            />
            {pregnancy && (
              <SummaryPill
                icon="🤰"
                value={`W${pregnancy.currentWeek}`}
                label={T.pregnancy}
                color={Colors.coral}
              />
            )}
            <SummandPill
              icon="💉"
              value={vaccinations.length}
              label="Inkingo"
              color={Colors.amber}
            />
          </View>
        </Animated.View>

        {/* ── Wave transition ── */}
        <View style={styles.wave} />

        {/* ── Cards ── */}
        <Animated.View style={[
          styles.cards,
          {
            opacity: cardsOp,
            transform: [{ translateY: cardsY }]
          }
        ]}>

          {/* ── Pregnancy card ── */}
          {pregnancy ? (
            <TouchableOpacity
              style={styles.pregnancyCard}
              onPress={() => navigation.navigate('Pregnancy')}
              activeOpacity={0.9}
            >
              {/* Progress ring background */}
              <View style={styles.pregContent}>
                <View>
                  <Text style={styles.pregLabel}>Inda — Pregnancy</Text>
                  <Text style={styles.pregWeek}>
                    Icyumweru {pregnancy.currentWeek}
                  </Text>
                  <Text style={styles.pregWeekSub}>
                    Week {pregnancy.currentWeek} of 40
                  </Text>
                  <Text style={styles.pregTrimester}>
                    {getTrimesterName(pregnancy.currentWeek)}
                  </Text>
                </View>

                {/* Progress ring */}
                <ProgressRing
                  progress={pregnancy.currentWeek / 40}
                  color={trimesterColor(pregnancy.currentWeek)}
                  size={80}
                  week={pregnancy.currentWeek}
                />
              </View>

              {/* Progress bar */}
              <View style={styles.pregBar}>
                <View style={[
                  styles.pregBarFill,
                  {
                    width: `${(pregnancy.currentWeek / 40) * 100}%`,
                    backgroundColor: trimesterColor(pregnancy.currentWeek),
                  }
                ]} />
              </View>
            </TouchableOpacity>
          ) : (
            // No pregnancy — show add button
            <TouchableOpacity
              style={styles.addPregnancyCard}
              onPress={() => navigation.navigate('Pregnancy')}
            >
              <Text style={styles.addPregnancyIcon}>🤰</Text>
              <Text style={styles.addPregnancyText}>
                Ongeramo Inda{'\n'}
                <Text style={styles.addPregnancyTextSub}>
                  Add pregnancy info
                </Text>
              </Text>
              <Text style={styles.addArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* ── Children section ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Abana — Children</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Children')}>
              <Text style={styles.seeAll}>Reba bose →</Text>
            </TouchableOpacity>
          </View>

          {children.length === 0 ? (
            <EmptyCard
              icon="👶"
              title="Nta mwana"
              sub="Add your first child"
              onPress={() => navigation.navigate('Children')}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childrenRow}
            >
              {children.map(child => (
                <ChildChip key={child.id} child={child} />
              ))}

              {/* Add child chip */}
              <TouchableOpacity
                style={styles.addChildChip}
                onPress={() => navigation.navigate('Children')}
              >
                <Text style={styles.addChildChipIcon}>＋</Text>
                <Text style={styles.addChildChipText}>Ongeramo</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Upcoming vaccinations ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inkingo Ziri Imbere</Text>
            <Text style={styles.sectionSub}>Upcoming vaccines</Text>
          </View>

          {vaccinations.length === 0 ? (
            <View style={styles.allDoneCard}>
              <Text style={styles.allDoneIcon}>✅</Text>
              <Text style={styles.allDoneText}>
                Inkingo zose zarakoze!{'\n'}
                <Text style={styles.allDoneTextSub}>
                  All vaccinations up to date
                </Text>
              </Text>
            </View>
          ) : (
            vaccinations.map((vac, i) => (
              <VaccinationRow key={i} vaccination={vac} />
            ))
          )}

          {/* ── Quick actions ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ibikorwa Byihuse</Text>
            <Text style={styles.sectionSub}>Quick actions</Text>
          </View>

          <View style={styles.quickGrid}>
            <QuickAction
              icon="🍽️"
              label="Ifunguro"
              sub="Meals"
              color={Colors.amber}
              onPress={() => navigation.navigate('Meals')}
            />
            <QuickAction
              icon="😴"
              label="Itiro"
              sub="Sleep"
              color={Colors.blue}
              onPress={() => navigation.navigate('Children')}
            />
            <QuickAction
              icon="💊"
              label="Imiti"
              sub="Medications"
              color={Colors.coral}
              onPress={() => navigation.navigate('Children')}
            />
            <QuickAction
              icon="💰"
              label="Amafaranga"
              sub="Budget"
              color={Colors.teal}
              onPress={() => navigation.navigate('Budget')}
            />
          </View>

          {/* Bottom padding */}
          <View style={{ height: 32 }} />

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────
// ── Small reusable components ─────────────────────────
// ─────────────────────────────────────────────────────

// Summary pill in header strip
function SummaryPill({ icon, value, label, color }) {
  return (
    <View style={[pillStyles.wrap, { borderColor: color + '40' }]}>
      <Text style={pillStyles.icon}>{icon}</Text>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}
// Alias (typo guard)
const SummandPill = SummaryPill;

const pillStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    minWidth: 72,
  },
  icon:  { fontSize: 18, marginBottom: 2 },
  value: { fontFamily: 'DMSans_500Medium', fontSize: 16, color: Colors.white },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.75)' },
});

// ── Pregnancy progress ring (SVG-free, pure View) ──
function ProgressRing({ progress, color, size, week }) {
  // We fake a ring using border + rotation trick
  const clamp = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[ringStyles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[ringStyles.track, { width: size, height: size, borderRadius: size / 2 }]} />
      {/* Fill arc — rotated overlay */}
      <View style={[
        ringStyles.fill,
        {
          width: size, height: size, borderRadius: size / 2,
          borderColor: color,
          transform: [{ rotate: `${clamp * 360}deg` }],
        }
      ]} />
      {/* Center label */}
      <View style={ringStyles.center}>
        <Text style={[ringStyles.weekNum, { color }]}>{week}</Text>
        <Text style={ringStyles.weekLabel}>wks</Text>
      </View>
    </View>
  );
}
const ringStyles = StyleSheet.create({
  outer:  { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  track:  { position: 'absolute', borderWidth: 6, borderColor: '#E8E0D4' },
  fill:   { position: 'absolute', borderWidth: 6, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' },
  center: { alignItems: 'center', justifyContent: 'center' },
  weekNum: { fontFamily: 'DMSans_500Medium', fontSize: 20 },
  weekLabel: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted },
});

// ── Child chip (horizontal scroll) ────────────────
function ChildChip({ child }) {
  const age = child.ageInMonths;
  const ageText = age < 12
    ? `${age}mo`
    : `${Math.floor(age / 12)}yr`;

  // Color per child index
  const chipColors = [Colors.blue, Colors.coral, Colors.amber, Colors.teal];
  const color = chipColors[child.id % chipColors.length];

  return (
    <View style={[chipStyles.wrap, { borderColor: color + '50' }]}>
      <View style={[chipStyles.avatar, { backgroundColor: color + '25' }]}>
        <Text style={chipStyles.avatarIcon}>
          {child.gender === 'F' ? '👧' : '👦'}
        </Text>
      </View>
      <Text style={chipStyles.name} numberOfLines={1}>
        {child.name.split(' ')[0]}
      </Text>
      <Text style={[chipStyles.age, { color }]}>{ageText}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    marginRight: 10,
    borderWidth: 1.5,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarIcon: { fontSize: 22 },
  name: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textPrimary, maxWidth: 70 },
  age:  { fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 2 },
});

// ── Vaccination row ───────────────────────────────
function VaccinationRow({ vaccination }) {
  return (
    <View style={vacStyles.row}>
      <View style={vacStyles.dot} />
      <View style={{ flex: 1 }}>
        <Text style={vacStyles.name}>{vaccination.vaccineName}</Text>
        <Text style={vacStyles.date}>
          {vaccination.scheduledDate
            ? new Date(vaccination.scheduledDate).toLocaleDateString('fr-RW')
            : 'Itariki ntizwi'}
        </Text>
      </View>
      <View style={vacStyles.badge}>
        <Text style={vacStyles.badgeText}>Itegerezwa</Text>
      </View>
    </View>
  );
}
const vacStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.amber },
  name: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { backgroundColor: Colors.amberLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.amber },
});

// ── Quick action grid button ───────────────────────
function QuickAction({ icon, label, sub, color, onPress }) {
  return (
    <TouchableOpacity
      style={[qaStyles.btn, { borderColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[qaStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <Text style={qaStyles.icon}>{icon}</Text>
      </View>
      <Text style={qaStyles.label}>{label}</Text>
      <Text style={qaStyles.sub}>{sub}</Text>
    </TouchableOpacity>
  );
}
const qaStyles = StyleSheet.create({
  btn: {
    width: (width - 60) / 2,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  icon:  { fontSize: 22 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary },
  sub:   { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});

// ── Empty state card ──────────────────────────────
function EmptyCard({ icon, title, sub, onPress }) {
  return (
    <TouchableOpacity style={emptyStyles.card} onPress={onPress}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.sub}>{sub}</Text>
    </TouchableOpacity>
  );
}
const emptyStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  icon:  { fontSize: 32, marginBottom: 8 },
  title: { fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.textPrimary },
  sub:   { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});

// ── Trimester name helper ─────────────────────────
function getTrimesterName(week) {
  if (week <= 13) return '🔵 Igice cya 1 — 1st Trimester';
  if (week <= 26) return '🟡 Igice cya 2 — 2nd Trimester';
  return '🟠 Igice cya 3 — 3rd Trimester';
}

// ── Main styles ───────────────────────────────────
const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: Colors.teal },

  // Header
  header: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.white,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: { fontSize: 18 },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    gap: 10,
  },

  // Wave
  wave: {
    height: 32,
    backgroundColor: Colors.creamDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -2,
  },

  // Cards area
  cards: {
    backgroundColor: Colors.creamDark,
    paddingTop: 8,
  },

  // Pregnancy card
  pregnancyCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pregContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pregLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  pregWeek: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  pregWeekSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pregTrimester: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  pregBar: {
    height: 6,
    backgroundColor: '#E8E0D4',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pregBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Add pregnancy card
  addPregnancyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 12,
  },
  addPregnancyIcon: { fontSize: 28 },
  addPregnancyText: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  addPregnancyTextSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  addArrow: {
    fontSize: 20,
    color: Colors.textMuted,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  seeAll: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.teal,
  },

  // Children horizontal row
  childrenRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    marginBottom: 20,
  },

  // Add child chip
  addChildChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.teal + '12',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.teal + '40',
    borderStyle: 'dashed',
    minWidth: 80,
  },
  addChildChipIcon: {
    fontSize: 22,
    color: Colors.teal,
    marginBottom: 4,
  },
  addChildChipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.teal,
  },

  // All vaccinations done card
  allDoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  allDoneIcon: { fontSize: 24 },
  allDoneText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  allDoneTextSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Quick action grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
});