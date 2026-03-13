import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, StatusBar, Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/colors';
import { pregnancyAPI, remindersAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function PregnancyScreen() {

  // ── Data ──────────────────────────────────────────
  const [pregnancy,    setPregnancy]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  // ── Register form ─────────────────────────────────
  const [showRegister, setShowRegister] = useState(false);
  const [dueDate,      setDueDate]      = useState('');
  const [motherName,   setMotherName]   = useState('');
  const [saving,       setSaving]       = useState(false);

  // ── Reminder form ─────────────────────────────────
  const [showReminder, setShowReminder] = useState(false);
  const [remMessage,   setRemMessage]   = useState('');
  const [remDate,      setRemDate]      = useState('');
  const [remTime,      setRemTime]      = useState('09:00');
  const [remSaving,    setRemSaving]    = useState(false);

  // ── Animations ────────────────────────────────────
  const ringScale  = useRef(new Animated.Value(0.7)).current;
  const ringOp     = useRef(new Animated.Value(0)).current;
  const contentY   = useRef(new Animated.Value(40)).current;
  const contentOp  = useRef(new Animated.Value(0)).current;

  // ── Load pregnancy on focus ───────────────────────
  useFocusEffect(
    useCallback(() => {
      loadPregnancy();
    }, [])
  );

  async function loadPregnancy() {
    setLoading(true);
    const res = await pregnancyAPI.get();
    setLoading(false);

    if (res.ok && res.data) {
      setPregnancy(res.data);
      playEntranceAnimation();
    }
  }

  // ── Entrance animation ────────────────────────────
  function playEntranceAnimation() {
    Animated.parallel([
      Animated.spring(ringScale, {
        toValue: 1, tension: 50, friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(ringOp, {
        toValue: 1, duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0, duration: 600, delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOp, {
        toValue: 1, duration: 600, delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ── Register pregnancy ────────────────────────────
  async function handleRegister() {
    if (!dueDate.trim()) {
      Alert.alert('Ikosa', 'Injiza itariki y\'inzaruro.');
      return;
    }
    // Basic date format check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      Alert.alert('Ikosa', 'Shyira itariki mu buryo bwa YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    const res = await pregnancyAPI.register(
      dueDate.trim(),
      motherName.trim() || null
    );
    setSaving(false);

    if (res.ok) {
      setShowRegister(false);
      setDueDate('');
      setMotherName('');
      loadPregnancy();
    } else {
      Alert.alert('Ikosa', res.data?.error || 'Ntibishobotse.');
    }
  }

  // ── Schedule reminder ─────────────────────────────
  async function handleScheduleReminder() {
    if (!remMessage.trim() || !remDate.trim()) {
      Alert.alert('Ikosa', 'Injiza ubutumwa n\'itariki.');
      return;
    }

    setRemSaving(true);
    const scheduledAt = `${remDate.trim()}T${remTime}:00`;

    const res = await remindersAPI.schedule(
      'PRENATAL_CHECKUP',
      remMessage.trim(),
      scheduledAt
    );
    setRemSaving(false);

    if (res.ok) {
      setShowReminder(false);
      setRemMessage('');
      setRemDate('');
      setRemTime('09:00');
      Alert.alert(
        'Ibutsa ryashyizwe! 🔔',
        'Uzabona ubutumwa ku itariki wahisemo.',
        [{ text: 'Sawa' }]
      );
    } else {
      Alert.alert('Ikosa', res.data?.error || 'Ntibishobotse.');
    }
  }

  // ── Helpers ───────────────────────────────────────
  function trimesterInfo(week) {
    if (week <= 13) return {
      name: 'Igice cya 1',
      sub: '1st Trimester',
      color: Colors.blue,
      bg: Colors.blueLight,
      emoji: '🔵',
      tip: 'Umwana agera ku bunini bwa pome nto. Irinde kurya imifungurwa idakomeye.',
      tipEn: 'Baby is the size of a small plum. Avoid heavy foods and rest well.',
    };
    if (week <= 26) return {
      name: 'Igice cya 2',
      sub: '2nd Trimester',
      color: Colors.amber,
      bg: Colors.amberLight,
      emoji: '🟡',
      tip: 'Umwana atangira gutera intambwe. Ushobora kumva akinira.',
      tipEn: 'Baby starts moving. You may begin to feel kicks — enjoy this!',
    };
    return {
      name: 'Igice cya 3',
      sub: '3rd Trimester',
      color: Colors.coral,
      bg: Colors.coralLight,
      emoji: '🟠',
      tip: 'Witegure inzaruro. Hari ibintu bikomeye byo gutegura.',
      tipEn: 'Prepare for delivery. Pack your hospital bag and finalize your birth plan.',
    };
  }

  function daysUntilDue(dueDateStr) {
    const due  = new Date(dueDateStr);
    const now  = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  function weeklyTip(week) {
    // Selected tips per milestone week
    const tips = {
      4:  { rw: 'Tangira gufata inzabibu za folik asidi.',        en: 'Start taking folic acid supplements.' },
      8:  { rw: 'Sura inzabibu na dogiteri wa mbere.',            en: 'Schedule your first prenatal checkup.' },
      12: { rw: 'Ultrason ya mbere ishobora gukorwa.',            en: 'First ultrasound scan may be done now.' },
      16: { rw: 'Fata inzabibu za fer n\'iron.',                  en: 'Take iron supplements to prevent anaemia.' },
      20: { rw: 'Ultrason nzima igaragaza igitsina cy\'umwana.',  en: 'Anatomy scan can reveal baby\'s sex.' },
      24: { rw: 'Tangira gutegura ibikoresho by\'umwana.',        en: 'Start preparing baby items and clothes.' },
      28: { rw: 'Sura dogiteri buri cyumweru 2.',                 en: 'See your doctor every 2 weeks now.' },
      32: { rw: 'Tegura amasaho y\'ibitaro.',                     en: 'Pack your hospital bag.' },
      36: { rw: 'Umwana ari mu mwanya we nziza.',                 en: 'Baby is in optimal position for birth.' },
      40: { rw: 'Witegure gusama kwa mbere!',                     en: 'Ready to meet your baby soon!' },
    };

    // Find nearest tip week
    const milestones = Object.keys(tips).map(Number);
    const nearest = milestones.reduce((prev, curr) =>
      Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
    );
    return tips[nearest];
  }

  // ── Loading state ─────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ── No pregnancy registered yet ───────────────────
  if (!pregnancy) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inda — Pregnancy</Text>
          <Text style={styles.headerSub}>Track your journey</Text>
        </View>

        <View style={styles.wave} />

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🤰</Text>
          <Text style={styles.emptyTitle}>Nta makuru y'inda</Text>
          <Text style={styles.emptySub}>
            Ongeramo amakuru y'inda yawe{'\n'}
            Register your pregnancy to start tracking
          </Text>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => setShowRegister(true)}
          >
            <Text style={styles.registerBtnText}>
              ＋ Ongeramo Inda
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register modal */}
        <RegisterModal
          visible={showRegister}
          dueDate={dueDate}
          setDueDate={setDueDate}
          motherName={motherName}
          setMotherName={setMotherName}
          saving={saving}
          onClose={() => setShowRegister(false)}
          onSave={handleRegister}
        />
      </SafeAreaView>
    );
  }

  // ── Pregnancy data available ──────────────────────
  const week    = pregnancy.currentWeek || 1;
  const info    = trimesterInfo(week);
  const days    = daysUntilDue(pregnancy.dueDate);
  const tip     = weeklyTip(week);
  const progress= Math.min(week / 40, 1);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingBottom: 48 }]}>
          {/* Background decorative circle */}
          <View style={styles.headerDeco} />

          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Inda — Pregnancy</Text>
              {pregnancy.motherName && (
                <Text style={styles.headerSub}>{pregnancy.motherName}</Text>
              )}
            </View>
            {/* Add reminder button */}
            <TouchableOpacity
              style={styles.reminderBtn}
              onPress={() => setShowReminder(true)}
            >
              <Text style={styles.reminderBtnText}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* ── Big progress ring ── */}
          <Animated.View style={[
            styles.ringWrap,
            {
              opacity: ringOp,
              transform: [{ scale: ringScale }]
            }
          ]}>
            <BigProgressRing
              progress={progress}
              color={info.color}
              week={week}
              size={180}
            />
          </Animated.View>
        </View>

        {/* ── Wave ── */}
        <View style={styles.wave} />

        {/* ── Content ── */}
        <Animated.View style={[
          styles.content,
          {
            opacity: contentOp,
            transform: [{ translateY: contentY }]
          }
        ]}>

          {/* ── Trimester badge + days left ── */}
          <View style={styles.badgeRow}>
            <View style={[styles.trimBadge, { backgroundColor: info.bg }]}>
              <Text style={styles.trimBadgeEmoji}>{info.emoji}</Text>
              <View>
                <Text style={[styles.trimBadgeName, { color: info.color }]}>
                  {info.name}
                </Text>
                <Text style={styles.trimBadgeSub}>{info.sub}</Text>
              </View>
            </View>

            <View style={styles.daysBadge}>
              <Text style={styles.daysNum}>{days}</Text>
              <Text style={styles.daysLabel}>
                {days === 1 ? 'umunsi' : 'iminsi'}{'\n'}usigaye
              </Text>
            </View>
          </View>

          {/* ── Progress bar ── */}
          <View style={styles.section}>
            <View style={styles.progressBarWrap}>
              <View style={styles.progressTrack}>
                <Animated.View style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: info.color,
                  }
                ]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Icyumweru 1</Text>
                <Text style={[styles.progressLabel, { color: info.color, fontFamily: 'DMSans_500Medium' }]}>
                  W{week}
                </Text>
                <Text style={styles.progressLabel}>Icyumweru 40</Text>
              </View>
            </View>
          </View>

          {/* ── Trimester description ── */}
          <View style={[styles.tipCard, { borderLeftColor: info.color }]}>
            <Text style={styles.tipTitle}>
              Iki cyumweru cya {week} — Week {week}
            </Text>
            <Text style={styles.tipText}>{info.tip}</Text>
            <Text style={styles.tipTextEn}>{info.tipEn}</Text>
          </View>

          {/* ── Weekly tip ── */}
          <View style={styles.weeklyTipCard}>
            <Text style={styles.weeklyTipHeader}>
              💡 Inama ya Iki Cyumweru — Weekly Tip
            </Text>
            <Text style={styles.weeklyTipRw}>{tip.rw}</Text>
            <Text style={styles.weeklyTipEn}>{tip.en}</Text>
          </View>

          {/* ── Key dates ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amatariki Ingenzi — Key Dates</Text>

            <DateRow
              icon="📅"
              label="Itariki y'inzaruro — Due date"
              value={new Date(pregnancy.dueDate).toLocaleDateString('fr-RW', {
                weekday: 'long', year: 'numeric',
                month: 'long',  day: 'numeric'
              })}
              color={info.color}
            />

            <DateRow
              icon="🗓️"
              label="Itariki ikoze — Registered"
              value={pregnancy.createdAt
                ? new Date(pregnancy.createdAt).toLocaleDateString('fr-RW')
                : '—'}
              color={Colors.textMuted}
            />
          </View>

          {/* ── Trimester milestones ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Inzira y'Inda — Pregnancy Journey
            </Text>
            <MilestoneTimeline currentWeek={week} />
          </View>

          {/* ── Schedule reminder button ── */}
          <TouchableOpacity
            style={[styles.scheduleBtn, { backgroundColor: info.color }]}
            onPress={() => setShowReminder(true)}
          >
            <Text style={styles.scheduleBtnText}>
              🔔 Shyira Ibutsa — Schedule Reminder
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Register Modal ── */}
      <RegisterModal
        visible={showRegister}
        dueDate={dueDate}
        setDueDate={setDueDate}
        motherName={motherName}
        setMotherName={setMotherName}
        saving={saving}
        onClose={() => setShowRegister(false)}
        onSave={handleRegister}
      />

      {/* ── Reminder Modal ── */}
      <Modal
        visible={showReminder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReminder(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Shyira Ibutsa</Text>
                <Text style={styles.modalSub}>Schedule a reminder</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowReminder(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <Field label="Ubutumwa — Message">
                <TextInput
                  style={styles.input}
                  value={remMessage}
                  onChangeText={setRemMessage}
                  placeholder="Kujya kwa muganga — Doctor visit"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </Field>

              <Field label="Itariki — Date (YYYY-MM-DD)">
                <TextInput
                  style={styles.input}
                  value={remDate}
                  onChangeText={setRemDate}
                  placeholder="2024-03-15"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </Field>

              <Field label="Isaha — Time (HH:MM)">
                <TextInput
                  style={styles.input}
                  value={remTime}
                  onChangeText={setRemTime}
                  placeholder="09:00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </Field>

              <TouchableOpacity
                style={[styles.saveBtn, remSaving && { opacity: 0.6 }]}
                onPress={handleScheduleReminder}
                disabled={remSaving}
              >
                {remSaving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>
                      🔔 Bika Ibutsa — Save Reminder
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────
// ── Sub-components ────────────────────────────────────
// ─────────────────────────────────────────────────────

// ── Big circular progress ring ────────────────────
function BigProgressRing({ progress, color, week, size }) {
  const strokeWidth = 10;
  const radius      = (size - strokeWidth) / 2;
  const clamp       = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{
      width: size, height: size,
      alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Track circle */}
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'rgba(255,255,255,0.2)',
      }} />

      {/* Fill arc — using border rotation trick ── */}
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'white',
        borderTopColor: 'transparent',
        borderRightColor: clamp > 0.25 ? 'white' : 'transparent',
        borderBottomColor: clamp > 0.5  ? 'white' : 'transparent',
        borderLeftColor:  clamp > 0.75 ? 'white' : 'transparent',
        transform: [{ rotate: `${clamp * 360 - 90}deg` }],
        opacity: 0.9,
      }} />

      {/* Center content */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 42,
          color: 'white',
          lineHeight: 46,
        }}>
          {week}
        </Text>
        <Text style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 13,
          color: 'rgba(255,255,255,0.8)',
        }}>
          / 40 ibyumweru
        </Text>
        <Text style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 11,
          color: 'rgba(255,255,255,0.6)',
          marginTop: 2,
        }}>
          weeks
        </Text>
      </View>
    </View>
  );
}

// ── Milestone timeline ────────────────────────────
function MilestoneTimeline({ currentWeek }) {
  const milestones = [
    { week: 1,  rw: 'Inda itangira',        en: 'Pregnancy begins' },
    { week: 13, rw: 'Igice cya 2 gitangira', en: '2nd trimester begins' },
    { week: 20, rw: 'Ultrason nzima',        en: 'Anatomy scan' },
    { week: 27, rw: 'Igice cya 3 gitangira', en: '3rd trimester begins' },
    { week: 36, rw: 'Umwana ameze neza',     en: 'Baby fully developed' },
    { week: 40, rw: 'Itariki y\'inzaruro',   en: 'Due date' },
  ];

  return (
    <View style={timelineStyles.wrap}>
      {milestones.map((m, i) => {
        const passed  = currentWeek >= m.week;
        const current = currentWeek >= m.week &&
          (i === milestones.length - 1 || currentWeek < milestones[i + 1].week);

        return (
          <View key={i} style={timelineStyles.row}>
            {/* Dot + line */}
            <View style={timelineStyles.dotCol}>
              <View style={[
                timelineStyles.dot,
                passed  && timelineStyles.dotDone,
                current && timelineStyles.dotCurrent,
              ]}>
                {passed && (
                  <Text style={timelineStyles.dotCheck}>✓</Text>
                )}
              </View>
              {i < milestones.length - 1 && (
                <View style={[
                  timelineStyles.line,
                  passed && timelineStyles.lineDone,
                ]} />
              )}
            </View>

            {/* Text */}
            <View style={timelineStyles.textCol}>
              <View style={timelineStyles.textRow}>
                <Text style={[
                  timelineStyles.week,
                  current && { color: Colors.teal }
                ]}>
                  W{m.week}
                </Text>
                <Text style={[
                  timelineStyles.name,
                  !passed && { color: Colors.textMuted }
                ]}>
                  {m.rw}
                </Text>
              </View>
              <Text style={timelineStyles.sub}>{m.en}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
const timelineStyles = StyleSheet.create({
  wrap:    { paddingHorizontal: 20, paddingBottom: 8 },
  row:     { flexDirection: 'row', minHeight: 56 },
  dotCol:  { alignItems: 'center', width: 32, marginRight: 12 },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.creamDark,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  dotDone: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  dotCurrent: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dotCheck: { fontSize: 12, color: Colors.white },
  line: {
    flex: 1, width: 2,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  lineDone: { backgroundColor: Colors.teal },
  textCol:  { flex: 1, paddingBottom: 16 },
  textRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  week: {
    fontFamily: 'DMSans_500Medium', fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.creamDark,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  name:    { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary },
  sub:     { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});

// ── Date row ──────────────────────────────────────
function DateRow({ icon, label, value, color }) {
  return (
    <View style={dateStyles.row}>
      <Text style={dateStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={dateStyles.label}>{label}</Text>
        <Text style={[dateStyles.value, { color }]}>{value}</Text>
      </View>
    </View>
  );
}
const dateStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon:  { fontSize: 22 },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  value: { fontFamily: 'DMSans_500Medium', fontSize: 14 },
});

// ── Register modal ────────────────────────────────
function RegisterModal({
  visible, dueDate, setDueDate,
  motherName, setMotherName,
  saving, onClose, onSave
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Ongeramo Inda</Text>
              <Text style={styles.modalSub}>Register pregnancy</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <Field label="Itariki y'inzaruro — Due date (YYYY-MM-DD)">
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2024-08-20"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </Field>

            <Field label="Izina rya mama — Mother's name (optional)">
              <TextInput
                style={styles.input}
                value={motherName}
                onChangeText={setMotherName}
                placeholder="Consolée Uwimana"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxIcon}>ℹ️</Text>
              <Text style={styles.infoBoxText}>
                Icyumweru gitangwa bigenga hashingiwe ku itariki y'inzaruro.
                {'\n'}
                Week is automatically calculated from your due date.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.saveBtnText}>Bika — Save ✓</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Field wrapper ─────────────────────────────────
function Field({ label, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal },

  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cream,
  },

  // Header
  header: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerDeco: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80, right: -40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26, color: Colors.white,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  reminderBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  reminderBtnText: { fontSize: 20 },
  ringWrap: { marginTop: 8 },

  // Wave
  wave: {
    height: 32,
    backgroundColor: Colors.creamDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -2,
  },

  // Content
  content: {
    backgroundColor: Colors.creamDark,
    paddingTop: 12,
  },

  // Badge row
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  trimBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 14,
  },
  trimBadgeEmoji: { fontSize: 22 },
  trimBadgeName: {
    fontFamily: 'DMSans_500Medium', fontSize: 14,
  },
  trimBadgeSub: {
    fontFamily: 'DMSans_400Regular', fontSize: 11,
    color: Colors.textMuted, marginTop: 2,
  },
  daysBadge: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  daysNum: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28, color: Colors.textPrimary,
  },
  daysLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11, color: Colors.textMuted,
    textAlign: 'center', marginTop: 2,
  },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.textPrimary,
    marginBottom: 12,
  },

  // Progress bar
  progressBarWrap: { gap: 8 },
  progressTrack: {
    height: 10, backgroundColor: Colors.white,
    borderRadius: 5, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  progressFill: { height: 10, borderRadius: 5 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11, color: Colors.textMuted,
  },

  // Tip card
  tipCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12, color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: Colors.textPrimary,
    lineHeight: 20, marginBottom: 6,
  },
  tipTextEn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12, color: Colors.textMuted,
    lineHeight: 18, fontStyle: 'italic',
  },

  // Weekly tip
  weeklyTipCard: {
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  weeklyTipHeader: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13, color: Colors.amber,
    marginBottom: 8,
  },
  weeklyTipRw: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: Colors.textPrimary,
    lineHeight: 20, marginBottom: 4,
  },
  weeklyTipEn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12, color: Colors.textMuted,
    lineHeight: 18, fontStyle: 'italic',
  },

  // Schedule button
  scheduleBtn: {
    marginHorizontal: 20,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15, color: Colors.white,
  },

  // Empty state
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.creamDark,
    padding: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22, color: Colors.textPrimary, marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  registerBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  registerBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15, color: Colors.white,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.cream },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22, color: Colors.textPrimary,
  },
  modalSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: Colors.textMuted, marginTop: 2,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.creamDark,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: Colors.textMuted },
  modalBody: { padding: 24, paddingBottom: 40 },

  // Form
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11, color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.blueLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxIcon: { fontSize: 16 },
  infoBoxText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: Colors.blue,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 999, paddingVertical: 18,
    alignItems: 'center', marginTop: 8,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12,
    elevation: 5,
  },
  saveBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16, color: Colors.white,
  },
});