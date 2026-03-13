import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/colors';
import { childrenAPI, vaccinationsAPI, sleepAPI, medicationsAPI } from '../../services/api';

export default function ChildrenScreen() {

  // ── Data ──────────────────────────────────────────
  const [children,    setChildren]    = useState([]);
  const [selected,    setSelected]    = useState(null); // selected child for detail view
  const [vaccinations,setVaccinations]= useState([]);
  const [sleepRecs,   setSleepRecs]   = useState([]);
  const [medications, setMedications] = useState([]);

  // ── Modal state ───────────────────────────────────
  const [showAddChild,  setShowAddChild]  = useState(false);
  const [showAddSleep,  setShowAddSleep]  = useState(false);
  const [showAddMed,    setShowAddMed]    = useState(false);

  // ── Add child form ────────────────────────────────
  const [childName,     setChildName]     = useState('');
  const [childDob,      setChildDob]      = useState(''); // YYYY-MM-DD
  const [childGender,   setChildGender]   = useState('M');
  const [childWeight,   setChildWeight]   = useState('');

  // ── Add sleep form ────────────────────────────────
  const [sleepStart,    setSleepStart]    = useState('');
  const [sleepEnd,      setSleepEnd]      = useState('');
  const [sleepDate,     setSleepDate]     = useState(today());

  // ── Add medication form ───────────────────────────
  const [medName,       setMedName]       = useState('');
  const [medDose,       setMedDose]       = useState('');
  const [medFreq,       setMedFreq]       = useState('');
  const [medStart,      setMedStart]      = useState(today());
  const [medEnd,        setMedEnd]        = useState('');

  // ── Loading ───────────────────────────────────────
  const [saving,        setSaving]        = useState(false);

  // ── Tab inside child detail (vaccinations/sleep/meds) ──
  const [detailTab,     setDetailTab]     = useState('vaccinations');

  // ── Reload on focus ───────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  // ── Load children list ────────────────────────────
  async function loadChildren() {
    const res = await childrenAPI.getAll();
    if (res.ok) {
      setChildren(res.data);
      // Auto-select first child
      if (res.data.length > 0 && !selected) {
        selectChild(res.data[0]);
      }
    }
  }

  // ── Select child → load their data ────────────────
  async function selectChild(child) {
    setSelected(child);
    setDetailTab('vaccinations');

    const [vacRes, sleepRes, medRes] = await Promise.all([
      vaccinationsAPI.getByChild(child.id),
      sleepAPI.getRecent(child.id),
      medicationsAPI.getActive(child.id),
    ]);

    if (vacRes.ok)   setVaccinations(vacRes.data);
    if (sleepRes.ok) setSleepRecs(sleepRes.data);
    if (medRes.ok)   setMedications(medRes.data);
  }

  // ── Add child ─────────────────────────────────────
  async function handleAddChild() {
    if (!childName.trim() || !childDob.trim()) {
      Alert.alert('Ikosa', 'Injiza izina n\'itariki y\'amavuko.');
      return;
    }
    setSaving(true);
    const res = await childrenAPI.add(
      childName.trim(),
      childDob.trim(),
      childGender,
      childWeight ? parseFloat(childWeight) : null
    );
    setSaving(false);

    if (res.ok) {
      setShowAddChild(false);
      resetChildForm();
      await loadChildren();
      // Select the newly added child
      selectChild(res.data);
    } else {
      Alert.alert('Ikosa', res.data?.error || 'Ntibishobotse.');
    }
  }

  // ── Mark vaccination done ─────────────────────────
  async function handleMarkVacDone(vacId) {
    const res = await vaccinationsAPI.markDone(vacId);
    if (res.ok && selected) {
      // Reload vaccinations for current child
      const vacRes = await vaccinationsAPI.getByChild(selected.id);
      if (vacRes.ok) setVaccinations(vacRes.data);
    }
  }

  // ── Add sleep record ──────────────────────────────
  async function handleAddSleep() {
    if (!sleepStart || !sleepEnd) {
      Alert.alert('Ikosa', 'Injiza igihe cyo kuryama n\'gukanguka.');
      return;
    }
    setSaving(true);
    const res = await sleepAPI.log(
      selected.id,
      sleepDate,
      sleepStart,
      sleepEnd
    );
    setSaving(false);

    if (res.ok) {
      setShowAddSleep(false);
      resetSleepForm();
      const sleepRes = await sleepAPI.getRecent(selected.id);
      if (sleepRes.ok) setSleepRecs(sleepRes.data);
    } else {
      Alert.alert('Ikosa', res.data?.error || 'Ntibishobotse.');
    }
  }

  // ── Add medication ────────────────────────────────
  async function handleAddMed() {
    if (!medName.trim() || !medDose.trim() || !medFreq.trim()) {
      Alert.alert('Ikosa', 'Injiza amakuru yose y\'umuti.');
      return;
    }
    setSaving(true);
    const res = await medicationsAPI.add(
      selected.id,
      medName.trim(),
      medDose.trim(),
      medFreq.trim(),
      medStart,
      medEnd || null
    );
    setSaving(false);

    if (res.ok) {
      setShowAddMed(false);
      resetMedForm();
      const medRes = await medicationsAPI.getActive(selected.id);
      if (medRes.ok) setMedications(medRes.data);
    } else {
      Alert.alert('Ikosa', res.data?.error || 'Ntibishobotse.');
    }
  }

  // ── Delete medication ─────────────────────────────
  async function handleDeleteMed(medId) {
    Alert.alert(
      'Siba Umuti',
      'Urashaka gusiba uyu muti?',
      [
        { text: 'Oya', style: 'cancel' },
        {
          text: 'Yego, siba',
          style: 'destructive',
          onPress: async () => {
            const res = await medicationsAPI.remove(medId);
            if (res.ok && selected) {
              const medRes = await medicationsAPI.getActive(selected.id);
              if (medRes.ok) setMedications(medRes.data);
            }
          }
        }
      ]
    );
  }

  // ── Reset form helpers ────────────────────────────
  function resetChildForm() {
    setChildName(''); setChildDob('');
    setChildGender('M'); setChildWeight('');
  }
  function resetSleepForm() {
    setSleepStart(''); setSleepEnd(''); setSleepDate(today());
  }
  function resetMedForm() {
    setMedName(''); setMedDose(''); setMedFreq('');
    setMedStart(today()); setMedEnd('');
  }

  // ── Render ────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Abana — Children</Text>
          <Text style={styles.headerSub}>
            {children.length} umwana{children.length !== 1 ? '' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddChild(true)}
        >
          <Text style={styles.addBtnText}>＋ Ongeramo</Text>
        </TouchableOpacity>
      </View>

      {/* ── Wave ── */}
      <View style={styles.wave} />

      <View style={styles.body}>

        {/* ── Children horizontal selector ── */}
        {children.length === 0 ? (
          <EmptyState onAdd={() => setShowAddChild(true)} />
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorRow}
            >
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.selectorChip,
                    selected?.id === child.id && styles.selectorChipActive
                  ]}
                  onPress={() => selectChild(child)}
                >
                  <Text style={styles.selectorEmoji}>
                    {child.gender === 'F' ? '👧' : '👦'}
                  </Text>
                  <Text style={[
                    styles.selectorName,
                    selected?.id === child.id && styles.selectorNameActive
                  ]}>
                    {child.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Selected child detail ── */}
            {selected && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
              >
                {/* Child info card */}
                <ChildInfoCard
                  child={selected}
                  onAddSleep={() => setShowAddSleep(true)}
                  onAddMed={() => setShowAddMed(true)}
                />

                {/* Detail tabs */}
                <View style={styles.tabRow}>
                  {['vaccinations', 'sleep', 'medications'].map(tab => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tab,
                        detailTab === tab && styles.tabActive
                      ]}
                      onPress={() => setDetailTab(tab)}
                    >
                      <Text style={[
                        styles.tabText,
                        detailTab === tab && styles.tabTextActive
                      ]}>
                        {tab === 'vaccinations' ? '💉 Inkingo' :
                         tab === 'sleep'        ? '😴 Itiro' :
                                                  '💊 Imiti'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tab content */}
                {detailTab === 'vaccinations' && (
                  <VaccinationsList
                    vaccinations={vaccinations}
                    onMarkDone={handleMarkVacDone}
                  />
                )}
                {detailTab === 'sleep' && (
                  <SleepList
                    records={sleepRecs}
                    recommended={selected.ageInMonths}
                    onAdd={() => setShowAddSleep(true)}
                  />
                )}
                {detailTab === 'medications' && (
                  <MedicationsList
                    medications={medications}
                    onAdd={() => setShowAddMed(true)}
                    onDelete={handleDeleteMed}
                  />
                )}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* ════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════ */}

      {/* ── Add Child Modal ── */}
      <FormModal
        visible={showAddChild}
        title="Ongeramo Umwana"
        subtitle="Add a child"
        onClose={() => { setShowAddChild(false); resetChildForm(); }}
        onSave={handleAddChild}
        saving={saving}
      >
        <Field label="Izina — Name">
          <TextInput
            style={styles.input}
            value={childName}
            onChangeText={setChildName}
            placeholder="Amani Hirwa"
            placeholderTextColor={Colors.textMuted}
          />
        </Field>

        <Field label="Itariki y'amavuko — Date of birth (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            value={childDob}
            onChangeText={setChildDob}
            placeholder="2023-06-15"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </Field>

        <Field label="Igitsina — Gender">
          <View style={styles.genderRow}>
            {['M', 'F'].map(g => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderBtn,
                  childGender === g && styles.genderBtnActive
                ]}
                onPress={() => setChildGender(g)}
              >
                <Text style={styles.genderIcon}>
                  {g === 'M' ? '👦' : '👧'}
                </Text>
                <Text style={[
                  styles.genderText,
                  childGender === g && styles.genderTextActive
                ]}>
                  {g === 'M' ? 'Umuhungu' : 'Umukobwa'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Ibiro (kg) — Weight (optional)">
          <TextInput
            style={styles.input}
            value={childWeight}
            onChangeText={setChildWeight}
            placeholder="7.5"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
        </Field>
      </FormModal>

      {/* ── Add Sleep Modal ── */}
      <FormModal
        visible={showAddSleep}
        title="Injiza Itiro"
        subtitle="Log sleep"
        onClose={() => { setShowAddSleep(false); resetSleepForm(); }}
        onSave={handleAddSleep}
        saving={saving}
      >
        <Field label="Itariki — Date (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            value={sleepDate}
            onChangeText={setSleepDate}
            placeholder={today()}
            placeholderTextColor={Colors.textMuted}
          />
        </Field>
        <Field label="Igihe cyo kuryama — Sleep time (HH:MM)">
          <TextInput
            style={styles.input}
            value={sleepStart}
            onChangeText={setSleepStart}
            placeholder="20:30"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </Field>
        <Field label="Igihe cyo gukanguka — Wake time (HH:MM)">
          <TextInput
            style={styles.input}
            value={sleepEnd}
            onChangeText={setSleepEnd}
            placeholder="06:00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </Field>
      </FormModal>

      {/* ── Add Medication Modal ── */}
      <FormModal
        visible={showAddMed}
        title="Ongeramo Umuti"
        subtitle="Add medication"
        onClose={() => { setShowAddMed(false); resetMedForm(); }}
        onSave={handleAddMed}
        saving={saving}
      >
        <Field label="Izina ry'umuti — Medicine name">
          <TextInput
            style={styles.input}
            value={medName}
            onChangeText={setMedName}
            placeholder="Paracetamol"
            placeholderTextColor={Colors.textMuted}
          />
        </Field>
        <Field label="Ingano — Dosage">
          <TextInput
            style={styles.input}
            value={medDose}
            onChangeText={setMedDose}
            placeholder="5ml"
            placeholderTextColor={Colors.textMuted}
          />
        </Field>
        <Field label="Inshuro — Frequency">
          <TextInput
            style={styles.input}
            value={medFreq}
            onChangeText={setMedFreq}
            placeholder="Inshuro 3 ku munsi"
            placeholderTextColor={Colors.textMuted}
          />
        </Field>
        <Field label="Itariki itangira — Start date">
          <TextInput
            style={styles.input}
            value={medStart}
            onChangeText={setMedStart}
            placeholder={today()}
            placeholderTextColor={Colors.textMuted}
          />
        </Field>
        <Field label="Itariki irangira — End date (optional)">
          <TextInput
            style={styles.input}
            value={medEnd}
            onChangeText={setMedEnd}
            placeholder="2024-02-01"
            placeholderTextColor={Colors.textMuted}
          />
        </Field>
      </FormModal>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────
// ── Sub-components ────────────────────────────────────
// ─────────────────────────────────────────────────────

// ── Child info header card ────────────────────────
function ChildInfoCard({ child, onAddSleep, onAddMed }) {
  const age = child.ageInMonths;
  const ageText = age < 12
    ? `Amezi ${age} — ${age} months`
    : `Imyaka ${Math.floor(age / 12)} — ${Math.floor(age / 12)} years`;

  return (
    <View style={infoStyles.card}>
      {/* Avatar */}
      <View style={infoStyles.avatar}>
        <Text style={infoStyles.avatarIcon}>
          {child.gender === 'F' ? '👧' : '👦'}
        </Text>
      </View>

      <Text style={infoStyles.name}>{child.name}</Text>
      <Text style={infoStyles.age}>{ageText}</Text>

      {child.weight && (
        <Text style={infoStyles.weight}>
          ⚖️ {child.weight} kg
        </Text>
      )}

      {/* Action buttons */}
      <View style={infoStyles.actions}>
        <TouchableOpacity
          style={[infoStyles.actionBtn, { backgroundColor: Colors.blueLight }]}
          onPress={onAddSleep}
        >
          <Text style={infoStyles.actionIcon}>😴</Text>
          <Text style={[infoStyles.actionText, { color: Colors.blue }]}>
            Injiza Itiro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[infoStyles.actionBtn, { backgroundColor: Colors.coralLight }]}
          onPress={onAddMed}
        >
          <Text style={infoStyles.actionIcon}>💊</Text>
          <Text style={[infoStyles.actionText, { color: Colors.coral }]}>
            Ongeramo Umuti
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarIcon: { fontSize: 36 },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  age: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  weight: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionIcon: { fontSize: 16 },
  actionText: { fontFamily: 'DMSans_500Medium', fontSize: 13 },
});

// ── Vaccinations list ─────────────────────────────
function VaccinationsList({ vaccinations, onMarkDone }) {
  const done     = vaccinations.filter(v => v.done);
  const upcoming = vaccinations.filter(v => !v.done);

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {upcoming.length === 0 && done.length === 0 && (
        <Text style={listStyles.empty}>Nta makuru ya inkingo.</Text>
      )}

      {upcoming.length > 0 && (
        <>
          <Text style={listStyles.groupLabel}>
            Izitegerezwa — Upcoming ({upcoming.length})
          </Text>
          {upcoming.map((v, i) => (
            <View key={i} style={listStyles.vacRow}>
              <View style={listStyles.vacLeft}>
                <View style={[listStyles.vacDot, { backgroundColor: Colors.amber }]} />
                <View>
                  <Text style={listStyles.vacName}>{v.vaccineName}</Text>
                  <Text style={listStyles.vacDate}>
                    {v.scheduledDate
                      ? new Date(v.scheduledDate).toLocaleDateString('fr-RW')
                      : '—'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={listStyles.doneBtn}
                onPress={() => onMarkDone(v.id)}
              >
                <Text style={listStyles.doneBtnText}>✓ Koze</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {done.length > 0 && (
        <>
          <Text style={listStyles.groupLabel}>
            Zarakoze — Done ({done.length})
          </Text>
          {done.map((v, i) => (
            <View key={i} style={[listStyles.vacRow, listStyles.vacRowDone]}>
              <View style={listStyles.vacLeft}>
                <View style={[listStyles.vacDot, { backgroundColor: Colors.success }]} />
                <View>
                  <Text style={[listStyles.vacName, { color: Colors.textMuted }]}>
                    {v.vaccineName}
                  </Text>
                  <Text style={listStyles.vacDate}>✅ Yarakoze</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ── Sleep list ────────────────────────────────────
function SleepList({ records, recommended, onAdd }) {
  const recHours = getRecommendedHours(recommended);

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Recommended banner */}
      <View style={listStyles.recBanner}>
        <Text style={listStyles.recText}>
          🌙 Amasaha yifuzwa: {recHours}h/iro — Recommended: {recHours}h/night
        </Text>
      </View>

      {records.length === 0 ? (
        <TouchableOpacity style={listStyles.addDashed} onPress={onAdd}>
          <Text style={listStyles.addDashedText}>
            ＋ Injiza itiro rya mbere
          </Text>
        </TouchableOpacity>
      ) : (
        records.map((r, i) => {
          const hours = r.totalSleepHours?.toFixed(1) || '—';
          const ok = r.totalSleepHours >= recHours;
          return (
            <View key={i} style={listStyles.sleepRow}>
              <Text style={listStyles.sleepDate}>
                {new Date(r.date).toLocaleDateString('fr-RW')}
              </Text>
              <View style={listStyles.sleepTimes}>
                <Text style={listStyles.sleepTime}>
                  😴 {r.sleepTime} → 🌅 {r.wakeTime}
                </Text>
              </View>
              <View style={[
                listStyles.sleepBadge,
                { backgroundColor: ok ? Colors.tealLight : Colors.coralLight }
              ]}>
                <Text style={[
                  listStyles.sleepBadgeText,
                  { color: ok ? Colors.teal : Colors.danger }
                ]}>
                  {hours}h {ok ? '✓' : '↓'}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ── Medications list ──────────────────────────────
function MedicationsList({ medications, onAdd, onDelete }) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      {medications.length === 0 ? (
        <TouchableOpacity style={listStyles.addDashed} onPress={onAdd}>
          <Text style={listStyles.addDashedText}>
            ＋ Ongeramo umuti wa mbere
          </Text>
        </TouchableOpacity>
      ) : (
        medications.map((m, i) => (
          <View key={i} style={listStyles.medRow}>
            <View style={listStyles.medLeft}>
              <Text style={listStyles.medIcon}>💊</Text>
              <View>
                <Text style={listStyles.medName}>{m.medicationName}</Text>
                <Text style={listStyles.medDose}>
                  {m.dosage} · {m.frequency}
                </Text>
                <Text style={listStyles.medDate}>
                  {new Date(m.startDate).toLocaleDateString('fr-RW')}
                  {m.endDate
                    ? ` → ${new Date(m.endDate).toLocaleDateString('fr-RW')}`
                    : ' → Ntirengwa'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={listStyles.deleteBtn}
              onPress={() => onDelete(m.id)}
            >
              <Text style={listStyles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const listStyles = StyleSheet.create({
  empty: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: 24,
  },
  groupLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  // Vaccination
  vacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vacRowDone: { opacity: 0.6 },
  vacLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  vacDot: { width: 10, height: 10, borderRadius: 5 },
  vacName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary },
  vacDate: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  doneBtn: {
    backgroundColor: Colors.tealLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.teal,
  },
  // Sleep
  recBanner: {
    backgroundColor: Colors.blueLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.blue,
  },
  sleepRow: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sleepDate: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    width: 76,
  },
  sleepTimes: { flex: 1 },
  sleepTime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  sleepBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sleepBadgeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  // Medications
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  medIcon: { fontSize: 24 },
  medName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary },
  medDose: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  medDate: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },
  // Dashed add card
  addDashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginVertical: 8,
  },
  addDashedText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
});

// ── Reusable form modal ───────────────────────────
function FormModal({ visible, title, subtitle, onClose, onSave, saving, children }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modalStyles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal header */}
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.title}>{title}</Text>
              <Text style={modalStyles.sub}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Text style={modalStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={modalStyles.body}
            keyboardShouldPersistTaps="handled"
          >
            {children}

            {/* Save button */}
            <TouchableOpacity
              style={[modalStyles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={modalStyles.saveBtnText}>Bika — Save ✓</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.textPrimary },
  sub:   { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.creamDark,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: Colors.textMuted },
  body: { padding: 24, paddingBottom: 40 },
  saveBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  saveBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: Colors.white,
  },
});

// ── Field wrapper ─────────────────────────────────
function Field({ label, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// ── Empty state ───────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
      <Text style={styles.emptyTitle}>Nta mwana</Text>
      <Text style={styles.emptySub}>
        Ongeramo umwana wawe wa mbere{'\n'}Add your first child
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>＋ Ongeramo Umwana</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getRecommendedHours(ageInMonths) {
  if (ageInMonths < 4)  return 17;
  if (ageInMonths < 12) return 15;
  if (ageInMonths < 36) return 13;
  if (ageInMonths < 72) return 11;
  return 10;
}

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: Colors.teal,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.white,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.white,
  },

  wave: {
    height: 32,
    backgroundColor: Colors.creamDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -2,
  },

  body: { flex: 1, backgroundColor: Colors.creamDark },

  selectorRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  selectorChip: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: 6,
  },
  selectorChipActive: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealLight,
  },
  selectorEmoji: { fontSize: 18 },
  selectorName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  selectorNameActive: { color: Colors.teal },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: { backgroundColor: Colors.teal },
  tabText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'DMSans_500Medium',
    color: Colors.white,
  },

  // Form fields
  fieldWrap: { marginBottom: 18 },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
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

  // Gender selector
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  genderBtnActive: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealLight,
  },
  genderIcon: { fontSize: 20 },
  genderText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  genderTextActive: { color: Colors.teal },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  emptyBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: Colors.white,
  },
});