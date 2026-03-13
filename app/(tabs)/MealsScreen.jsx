import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/colors';
import { childrenAPI, mealsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function MealsScreen() {

  // ── Data ──────────────────────────────────────────
  const [children,     setChildren]     = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [meals,        setMeals]        = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);

  // ── Modal ─────────────────────────────────────────
  const [showAdd,      setShowAdd]      = useState(false);
  const [saving,       setSaving]       = useState(false);

  // ── Meal form ─────────────────────────────────────
  const [mealDate,     setMealDate]     = useState(today());
  const [breakfast,    setBreakfast]    = useState('');
  const [lunch,        setLunch]        = useState('');
  const [dinner,       setDinner]       = useState('');
  const [snacks,       setSnacks]       = useState('');
  const [notes,        setNotes]        = useState('');

  // ── Load on screen focus ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  async function loadChildren() {
    const res = await childrenAPI.getAll();
    if (res.ok && res.data.length > 0) {
      setChildren(res.data);
      // Auto select first child
      if (!selected) selectChild(res.data[0]);
    }
  }

  // ── Select child → load meals + suggestions ───────
  async function selectChild(child) {
    setSelected(child);

    const [mealRes, sugRes] = await Promise.all([
      mealsAPI.getRecent(child.id),
      mealsAPI.getSuggestions(child.id),
    ]);

    if (mealRes.ok) setMeals(mealRes.data);
    if (sugRes.ok)  setSuggestions(sugRes.data);
  }

  // ── Save meal ─────────────────────────────────────
  async function handleSave() {
    // At least one meal must be filled
    if (!breakfast && !lunch && !dinner) {
      Alert.alert('Ikosa', 'Injiza nibura ifunguro rimwe.');
      return;
    }

    setSaving(true);
    const res = await mealsAPI.save(
      selected.id,
      mealDate,
      breakfast.trim() || null,
      lunch.trim()     || null,
      dinner.trim()    || null,
      snacks.trim()    || null,
      notes.trim()     || null
    );
    setSaving(false);

    if (res.ok) {
      setShowAdd(false);
      resetForm();
      // Reload meals for this child
      const mealRes = await mealsAPI.getRecent(selected.id);
      if (mealRes.ok) setMeals(mealRes.data);
    } else {
      Alert.alert('Ikosa', res.data?.error || 'Ntibishobotse.');
    }
  }

  function resetForm() {
    setMealDate(today());
    setBreakfast(''); setLunch('');
    setDinner('');    setSnacks('');
    setNotes('');
  }

  // ── Fill form from suggestion ─────────────────────
  function useSuggestion(sug) {
    // Pre-fill the form with the suggestion text
    setBreakfast(sug);
    setShowAdd(true);
  }

  // ── Render ────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ifunguro — Meals</Text>
          <Text style={styles.headerSub}>
            Kurikirana ifunguro ry'umwana
          </Text>
        </View>
        {selected && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Text style={styles.addBtnText}>＋ Injiza</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Wave ── */}
      <View style={styles.wave} />

      <View style={styles.body}>

        {/* ── No children at all ── */}
        {children.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>👶</Text>
            <Text style={styles.emptyTitle}>Nta mwana</Text>
            <Text style={styles.emptySub}>
              Banza wongeramo umwana mu gice cy'Abana
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >

            {/* ── Child selector ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorRow}
            >
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.chip,
                    selected?.id === child.id && styles.chipActive
                  ]}
                  onPress={() => selectChild(child)}
                >
                  <Text style={styles.chipEmoji}>
                    {child.gender === 'F' ? '👧' : '👦'}
                  </Text>
                  <Text style={[
                    styles.chipName,
                    selected?.id === child.id && styles.chipNameActive
                  ]}>
                    {child.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selected && (
              <>
                {/* ── Age-based suggestions ── */}
                {suggestions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      💡 Inama z'Ifunguro — Suggestions
                    </Text>
                    <Text style={styles.sectionSub}>
                      Hashingiwe ku myaka ya {selected.name.split(' ')[0]}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestionsRow}
                    >
                      {suggestions.map((sug, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.sugChip}
                          onPress={() => useSuggestion(sug)}
                        >
                          <Text style={styles.sugChipText}>{sug}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* ── Recent meals ── */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    📋 Amatariki 7 Ashize — Last 7 Days
                  </Text>

                  {meals.length === 0 ? (
                    <TouchableOpacity
                      style={styles.emptyMealCard}
                      onPress={() => setShowAdd(true)}
                    >
                      <Text style={styles.emptyMealIcon}>🍽️</Text>
                      <Text style={styles.emptyMealText}>
                        Nta makuru y'ifunguro{'\n'}
                        Tangira kwandika uyu munsi
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    meals.map((meal, i) => (
                      <MealCard key={i} meal={meal} />
                    ))
                  )}
                </View>

                {/* ── Nutrition tips by age ── */}
                <NutritionTips ageInMonths={selected.ageInMonths} />
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* ════════════════════════════════════════════
          ADD MEAL MODAL
      ════════════════════════════════════════════ */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Injiza Ifunguro</Text>
                <Text style={styles.modalSub}>
                  Log meal — {selected?.name?.split(' ')[0]}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => { setShowAdd(false); resetForm(); }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >

              {/* Date */}
              <Field label="Itariki — Date (YYYY-MM-DD)">
                <TextInput
                  style={styles.input}
                  value={mealDate}
                  onChangeText={setMealDate}
                  placeholder={today()}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </Field>

              {/* Breakfast */}
              <Field label="🌅 Ifunguro rya mu gitondo — Breakfast">
                <TextInput
                  style={styles.input}
                  value={breakfast}
                  onChangeText={setBreakfast}
                  placeholder="Porridge, indimu..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </Field>

              {/* Lunch */}
              <Field label="☀️ Isaha sita — Lunch">
                <TextInput
                  style={styles.input}
                  value={lunch}
                  onChangeText={setLunch}
                  placeholder="Ibijumba, ibishyimbo..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </Field>

              {/* Dinner */}
              <Field label="🌙 Ijoro — Dinner">
                <TextInput
                  style={styles.input}
                  value={dinner}
                  onChangeText={setDinner}
                  placeholder="Ubugali, isombe..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </Field>

              {/* Snacks */}
              <Field label="🍌 Ibindi — Snacks (optional)">
                <TextInput
                  style={styles.input}
                  value={snacks}
                  onChangeText={setSnacks}
                  placeholder="Indimu, inyanya..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </Field>

              {/* Notes */}
              <Field label="📝 Ibisobanuro — Notes (optional)">
                <TextInput
                  style={[styles.input, styles.inputTall]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Umwana yararyohewe cyane..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </Field>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>
                      Bika Ifunguro — Save ✓
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

// ── Single meal day card ──────────────────────────
function MealCard({ meal }) {
  const [expanded, setExpanded] = useState(false);

  const mealRows = [
    { icon: '🌅', label: 'Breakfast', value: meal.breakfast },
    { icon: '☀️', label: 'Lunch',     value: meal.lunch },
    { icon: '🌙', label: 'Dinner',    value: meal.dinner },
    { icon: '🍌', label: 'Snacks',    value: meal.snacks },
  ].filter(r => r.value); // only show rows that have data

  return (
    <TouchableOpacity
      style={mealStyles.card}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.9}
    >
      {/* Card header */}
      <View style={mealStyles.cardHeader}>
        <View style={mealStyles.dateWrap}>
          <Text style={mealStyles.dateDay}>
            {new Date(meal.date).toLocaleDateString('fr-RW', { weekday: 'short' })}
          </Text>
          <Text style={mealStyles.dateNum}>
            {new Date(meal.date).getDate()}
          </Text>
        </View>

        <View style={mealStyles.preview}>
          {/* Show first filled meal as preview */}
          {mealRows.slice(0, 2).map((r, i) => (
            <Text key={i} style={mealStyles.previewText} numberOfLines={1}>
              {r.icon} {r.value}
            </Text>
          ))}
        </View>

        <Text style={mealStyles.chevron}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={mealStyles.detail}>
          <View style={mealStyles.divider} />
          {mealRows.map((r, i) => (
            <View key={i} style={mealStyles.mealRow}>
              <Text style={mealStyles.mealIcon}>{r.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={mealStyles.mealLabel}>{r.label}</Text>
                <Text style={mealStyles.mealValue}>{r.value}</Text>
              </View>
            </View>
          ))}
          {meal.notes && (
            <View style={mealStyles.notesWrap}>
              <Text style={mealStyles.notesText}>
                📝 {meal.notes}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const mealStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  dateWrap: {
    alignItems: 'center',
    backgroundColor: Colors.tealLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 44,
  },
  dateDay: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.teal,
    textTransform: 'uppercase',
  },
  dateNum: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: Colors.teal,
  },
  preview:     { flex: 1, gap: 3 },
  previewText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 4,
  },
  detail:  { paddingHorizontal: 14, paddingBottom: 14 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  mealIcon:  { fontSize: 18, marginTop: 2 },
  mealLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealValue: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 20,
  },
  notesWrap: {
    backgroundColor: Colors.creamDark,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  notesText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

// ── Nutrition tips by age ─────────────────────────
function NutritionTips({ ageInMonths }) {
  const tips = getNutritionTips(ageInMonths);

  return (
    <View style={tipStyles.wrap}>
      <Text style={tipStyles.title}>
        🥗 Inama z'Indyo — Nutrition Guide
      </Text>
      <Text style={tipStyles.ageLine}>
        Imyaka: {ageInMonths < 12
          ? `Amezi ${ageInMonths}`
          : `${Math.floor(ageInMonths / 12)} imyaka`}
      </Text>

      {tips.map((tip, i) => (
        <View key={i} style={tipStyles.tipRow}>
          <Text style={tipStyles.tipBullet}>•</Text>
          <Text style={tipStyles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

function getNutritionTips(months) {
  if (months < 6) return [
    'Amata nkaka gusa — Breast milk only until 6 months.',
    'Ntukaze umwana amazi cyangwa ibindi biribwa.',
    'Ohereza umwana kwa muganga buri kwezi.',
  ];
  if (months < 12) return [
    'Tangira indyo yuzuye amezi 6 — Start soft foods at 6 months.',
    'Porridge, ibijumba, inyanya — ugaze buhoro buhoro.',
    'Komeza gutunga amata nkaka na nyuma y\'indyo.',
    'Irinde inyama, amagi, indimu — shyira buhoro buhoro.',
  ];
  if (months < 24) return [
    'Imfungurwa nyinshi — Variety of foods every day.',
    'Amagi, inyama, ibishyimbo — inzuzi za proteini nziza.',
    'Indimu n\'imbuto — vitamini n\'ibiryo bikwiye.',
    'Irinde isukari n\'ubuyi bwinshi.',
  ];
  if (months < 60) return [
    'Imfungurwa 3 ku munsi + snack 1-2.',
    'Shyira inyama/amagi buri munsi niba bishoboka.',
    'Amata yakonje asabwa kugeza imyaka 5.',
    'Irinde iminsi y\'imburagihe w\'ifunguro.',
  ];
  return [
    'Ifunguro ry\'ishuri — Tegura ukamuhe imburagihe.',
    'Amata, imbuto, inyama, ibishyimbo buri munsi.',
    'Irinde ibiribwa bya siporo n\'isukari nyinshi.',
    'Umwana akeneye amazi menshi — nibura glasi 6 ku munsi.',
  ];
}

const tipStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.tealLight,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.teal + '30',
  },
  title: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: Colors.teal,
    marginBottom: 4,
  },
  ageLine: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.teal,
    marginBottom: 12,
    opacity: 0.7,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: Colors.teal,
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.teal,
    lineHeight: 20,
  },
});

// ── Reusable field wrapper ────────────────────────
function Field({ label, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Date helper ───────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
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
    fontSize: 26, color: Colors.white,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  addBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.white,
  },

  wave: {
    height: 32, backgroundColor: Colors.creamDark,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    marginTop: -2,
  },

  body: { flex: 1, backgroundColor: Colors.creamDark },

  // Child selector
  selectorRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, borderColor: Colors.border,
  },
  chipActive: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealLight,
  },
  chipEmoji: { fontSize: 18 },
  chipName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.textMuted,
  },
  chipNameActive: { color: Colors.teal },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.textPrimary, marginBottom: 4,
  },
  sectionSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12, color: Colors.textMuted, marginBottom: 10,
  },

  // Suggestions row
  suggestionsRow: {
    gap: 8, paddingBottom: 4,
  },
  sugChip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: Colors.amber + '60',
  },
  sugChipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: Colors.amber,
  },

  // Empty meal card
  emptyMealCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  emptyMealIcon: { fontSize: 36, marginBottom: 10 },
  emptyMealText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },

  // Empty state (no children)
  emptyWrap: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: 40,
  },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22, color: Colors.textPrimary, marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
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
  fieldWrap:  { marginBottom: 18 },
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
  inputTall: { minHeight: 80, textAlignVertical: 'top' },

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