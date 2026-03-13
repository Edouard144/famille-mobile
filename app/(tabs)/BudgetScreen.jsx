import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/colors';

const { width } = Dimensions.get('window');

// ── Budget categories ─────────────────────────────
const CATEGORIES = [
  { key: 'food',      label: 'Ibiryo',      labelEn: 'Food',          icon: '🍽️', color: Colors.amber  },
  { key: 'health',    label: 'Ubuzima',     labelEn: 'Health',         icon: '🏥', color: Colors.coral  },
  { key: 'clothing',  label: 'Imyenda',     labelEn: 'Clothing',       icon: '👗', color: Colors.blue   },
  { key: 'school',    label: 'Ishuri',      labelEn: 'School',         icon: '📚', color: Colors.teal   },
  { key: 'transport', label: 'Gutwara',     labelEn: 'Transport',      icon: '🚌', color: '#8B5CF6'     },
  { key: 'other',     label: 'Ibindi',      labelEn: 'Other',          icon: '📦', color: Colors.textMuted },
];

export default function BudgetScreen() {

  // ── Data ──────────────────────────────────────────
  // We store entries locally — no backend for budget yet
  // This is the correct pattern: start local, add API later
  const [entries,    setEntries]    = useState(SAMPLE_DATA);
  const [showAdd,    setShowAdd]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  // ── Selected month ────────────────────────────────
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month

  // ── Form state ────────────────────────────────────
  const [formAmount,   setFormAmount]   = useState('');
  const [formCategory, setFormCategory] = useState('food');
  const [formDesc,     setFormDesc]     = useState('');
  const [formDate,     setFormDate]     = useState(today());
  const [formType,     setFormType]     = useState('expense'); // or 'income'

  // ── Computed values ───────────────────────────────
  const currentMonth  = getMonthLabel(monthOffset);
  const filtered      = filterByMonth(entries, monthOffset);
  const totalIncome   = filtered
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense  = filtered
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance       = totalIncome - totalExpense;
  const byCategory    = groupByCategory(filtered.filter(e => e.type === 'expense'));

  // ── Save entry ────────────────────────────────────
  function handleSave() {
    if (!formAmount || isNaN(parseFloat(formAmount))) {
      Alert.alert('Ikosa', 'Injiza amafaranga.');
      return;
    }
    if (parseFloat(formAmount) <= 0) {
      Alert.alert('Ikosa', 'Amafaranga agomba kuba arenga 0.');
      return;
    }

    setSaving(true);

    const newEntry = {
      id:       Date.now(),
      amount:   parseFloat(formAmount),
      category: formCategory,
      desc:     formDesc.trim() || getCategoryLabel(formCategory),
      date:     formDate,
      type:     formType,
    };

    // Add to top of list
    setEntries(prev => [newEntry, ...prev]);

    setSaving(false);
    setShowAdd(false);
    resetForm();
  }

  // ── Delete entry ──────────────────────────────────
  function handleDelete(id) {
    Alert.alert(
      'Siba Urutonde',
      'Urashaka gusiba iri shuri?',
      [
        { text: 'Oya', style: 'cancel' },
        {
          text: 'Yego, Siba',
          style: 'destructive',
          onPress: () => setEntries(prev => prev.filter(e => e.id !== id))
        }
      ]
    );
  }

  function resetForm() {
    setFormAmount('');
    setFormCategory('food');
    setFormDesc('');
    setFormDate(today());
    setFormType('expense');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Amafaranga — Budget</Text>
          <Text style={styles.headerSub}>
            Gucunga amafaranga y'umuryango
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAdd(true)}
        >
          <Text style={styles.addBtnText}>＋ Injiza</Text>
        </TouchableOpacity>
      </View>

      {/* ── Wave ── */}
      <View style={styles.wave} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ── Month navigator ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => setMonthOffset(m => m - 1)}
          >
            <Text style={styles.monthArrowText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{currentMonth}</Text>

          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => setMonthOffset(m => Math.min(m + 1, 0))}
            disabled={monthOffset === 0}
          >
            <Text style={[
              styles.monthArrowText,
              monthOffset === 0 && { opacity: 0.3 }
            ]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Summary cards ── */}
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="💚"
            label="Winjiye"
            labelEn="Income"
            amount={totalIncome}
            color={Colors.teal}
            bg={Colors.tealLight}
          />
          <SummaryCard
            icon="🔴"
            label="Wasohotse"
            labelEn="Expenses"
            amount={totalExpense}
            color={Colors.danger}
            bg={Colors.coralLight}
          />
        </View>

        {/* ── Balance card ── */}
        <View style={[
          styles.balanceCard,
          { borderLeftColor: balance >= 0 ? Colors.teal : Colors.danger }
        ]}>
          <Text style={styles.balanceLabel}>
            Usigaranye — Balance
          </Text>
          <Text style={[
            styles.balanceAmount,
            { color: balance >= 0 ? Colors.teal : Colors.danger }
          ]}>
            {balance >= 0 ? '+' : ''}{formatRWF(balance)}
          </Text>
          {balance < 0 && (
            <Text style={styles.balanceWarning}>
              ⚠️ Usohotse kurenza winjiye uyu kwezi
            </Text>
          )}
        </View>

        {/* ── Spending by category ── */}
        {totalExpense > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📊 Gukwirakwiza — By Category
            </Text>
            {CATEGORIES.map(cat => {
              const spent = byCategory[cat.key] || 0;
              if (spent === 0) return null;
              const pct = totalExpense > 0
                ? Math.round((spent / totalExpense) * 100)
                : 0;

              return (
                <View key={cat.key} style={styles.catRow}>
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catLabelRow}>
                      <Text style={styles.catName}>{cat.label}</Text>
                      <Text style={[styles.catAmount, { color: cat.color }]}>
                        {formatRWF(spent)}
                      </Text>
                    </View>
                    {/* Progress bar */}
                    <View style={styles.catBarTrack}>
                      <View style={[
                        styles.catBarFill,
                        { width: `${pct}%`, backgroundColor: cat.color }
                      ]} />
                    </View>
                    <Text style={styles.catPct}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Transaction list ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 Urutonde — Transactions
          </Text>

          {filtered.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => setShowAdd(true)}
            >
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>
                Nta makuru uyu kwezi{'\n'}
                Tangira guandika amafaranga
              </Text>
            </TouchableOpacity>
          ) : (
            filtered.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onDelete={() => handleDelete(entry.id)}
              />
            ))
          )}
        </View>

        {/* ── Family finance tips ── */}
        <FinanceTips />

      </ScrollView>

      {/* ════════════════════════════════════════════
          ADD ENTRY MODAL
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

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Injiza Amafaranga</Text>
                <Text style={styles.modalSub}>Add transaction</Text>
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

              {/* ── Income / Expense toggle ── */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    formType === 'expense' && styles.typeBtnExpense
                  ]}
                  onPress={() => setFormType('expense')}
                >
                  <Text style={[
                    styles.typeBtnText,
                    formType === 'expense' && { color: Colors.white }
                  ]}>
                    🔴 Asohotse — Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    formType === 'income' && styles.typeBtnIncome
                  ]}
                  onPress={() => setFormType('income')}
                >
                  <Text style={[
                    styles.typeBtnText,
                    formType === 'income' && { color: Colors.white }
                  ]}>
                    💚 Winjiye — Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Amount ── */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Amafaranga (RWF) — Amount
                </Text>
                <View style={styles.amountWrap}>
                  <Text style={styles.amountPrefix}>RWF</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={formAmount}
                    onChangeText={setFormAmount}
                    placeholder="5,000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* ── Category (only for expenses) ── */}
              {formType === 'expense' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>
                    Icyiciro — Category
                  </Text>
                  <View style={styles.catGrid}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.catBtn,
                          formCategory === cat.key && {
                            borderColor: cat.color,
                            backgroundColor: cat.color + '15',
                          }
                        ]}
                        onPress={() => setFormCategory(cat.key)}
                      >
                        <Text style={styles.catBtnIcon}>{cat.icon}</Text>
                        <Text style={[
                          styles.catBtnText,
                          formCategory === cat.key && { color: cat.color }
                        ]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Description ── */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Ibisobanuro — Description (optional)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formDesc}
                  onChangeText={setFormDesc}
                  placeholder="Inzoga z'umwana, ibijumba..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* ── Date ── */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Itariki — Date (YYYY-MM-DD)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formDate}
                  onChangeText={setFormDate}
                  placeholder={today()}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* ── Save button ── */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>
                      Bika — Save ✓
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

// ── Summary card (income / expense) ──────────────
function SummaryCard({ icon, label, labelEn, amount, color, bg }) {
  return (
    <View style={[sumStyles.card, { backgroundColor: bg, borderColor: color + '30' }]}>
      <Text style={sumStyles.icon}>{icon}</Text>
      <Text style={[sumStyles.amount, { color }]}>{formatRWF(amount)}</Text>
      <Text style={sumStyles.label}>{label}</Text>
      <Text style={sumStyles.labelEn}>{labelEn}</Text>
    </View>
  );
}
const sumStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  icon:    { fontSize: 22, marginBottom: 6 },
  amount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18, marginBottom: 2,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12, color: Colors.textPrimary,
  },
  labelEn: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10, color: Colors.textMuted,
  },
});

// ── Single transaction row ────────────────────────
function EntryRow({ entry, onDelete }) {
  const cat   = CATEGORIES.find(c => c.key === entry.category) || CATEGORIES[5];
  const isInc = entry.type === 'income';

  return (
    <TouchableOpacity
      style={entryStyles.row}
      onLongPress={onDelete}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      {/* Category icon circle */}
      <View style={[
        entryStyles.iconCircle,
        { backgroundColor: isInc ? Colors.tealLight : cat.color + '18' }
      ]}>
        <Text style={entryStyles.icon}>
          {isInc ? '💚' : cat.icon}
        </Text>
      </View>

      {/* Description + date */}
      <View style={{ flex: 1 }}>
        <Text style={entryStyles.desc}>{entry.desc}</Text>
        <Text style={entryStyles.date}>
          {new Date(entry.date).toLocaleDateString('fr-RW', {
            day: 'numeric', month: 'short'
          })}
          {!isInc && ` · ${cat.label}`}
        </Text>
      </View>

      {/* Amount */}
      <Text style={[
        entryStyles.amount,
        { color: isInc ? Colors.teal : Colors.danger }
      ]}>
        {isInc ? '+' : '-'}{formatRWF(entry.amount)}
      </Text>
    </TouchableOpacity>
  );
}
const entryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  icon:   { fontSize: 20 },
  desc:   {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.textPrimary,
  },
  date:   {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12, color: Colors.textMuted, marginTop: 2,
  },
  amount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
  },
});

// ── Finance tips card ─────────────────────────────
function FinanceTips() {
  const tips = [
    { rw: 'Shyira 10% y\'umushahara mu kiziba cya ngombwa.', en: 'Save 10% of income for emergencies.' },
    { rw: 'Tegura bajeti y\'ishuri mbere y\'Mutarama.',       en: 'Plan school fees budget before January.' },
    { rw: 'Andika amafaranga yose — nto na nto.',             en: 'Track every expense, big and small.' },
    { rw: 'Bura ubuzima bwo mu ngoro kurenza ibiribwa.',       en: 'Prioritize health over entertainment.' },
  ];

  return (
    <View style={ftStyles.wrap}>
      <Text style={ftStyles.title}>
        💡 Inama z'Amafaranga — Finance Tips
      </Text>
      {tips.map((t, i) => (
        <View key={i} style={ftStyles.row}>
          <Text style={ftStyles.bullet}>•</Text>
          <View style={{ flex: 1 }}>
            <Text style={ftStyles.rw}>{t.rw}</Text>
            <Text style={ftStyles.en}>{t.en}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
const ftStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.amberLight,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.amber + '40',
  },
  title: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.amber, marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8, marginBottom: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16, color: Colors.amber, lineHeight: 20,
  },
  rw: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: Colors.textPrimary, lineHeight: 20,
  },
  en: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11, color: Colors.textMuted,
    lineHeight: 16, fontStyle: 'italic',
  },
});

// ─────────────────────────────────────────────────────
// ── Helpers ───────────────────────────────────────────
// ─────────────────────────────────────────────────────

// Format number as Rwandan Francs
function formatRWF(amount) {
  return `${Math.abs(amount).toLocaleString('fr-RW')} RWF`;
}

// Today's date as YYYY-MM-DD
function today() {
  return new Date().toISOString().split('T')[0];
}

// Get human-readable month label from offset
// 0 = current month, -1 = last month, etc.
function getMonthLabel(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('fr-RW', {
    month: 'long', year: 'numeric'
  });
}

// Filter entries to only show entries from the offset month
function filterByMonth(entries, offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const year  = d.getFullYear();
  const month = d.getMonth();

  return entries.filter(e => {
    const ed = new Date(e.date);
    return ed.getFullYear() === year && ed.getMonth() === month;
  });
}

// Group expenses by category key → sum amounts
function groupByCategory(entries) {
  return entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
}

// Get label from category key
function getCategoryLabel(key) {
  return CATEGORIES.find(c => c.key === key)?.label || 'Ibindi';
}

// ── Sample data so the screen isn't empty on first open ──
const SAMPLE_DATA = [
  { id: 1, amount: 150000, category: 'food',     desc: 'Ibiribwa bya Ukwezi',      date: today(), type: 'income'  },
  { id: 2, amount: 25000,  category: 'food',     desc: 'Ibiribwa bya Supermarche', date: today(), type: 'expense' },
  { id: 3, amount: 15000,  category: 'health',   desc: 'Indyo za Amani',           date: today(), type: 'expense' },
  { id: 4, amount: 8000,   category: 'clothing', desc: 'Imyenda ya Neza',          date: today(), type: 'expense' },
];

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

  // Month navigator
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  monthArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  monthArrowText: {
    fontSize: 22, color: Colors.textPrimary,
    lineHeight: 26,
  },
  monthLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15, color: Colors.textPrimary,
    textTransform: 'capitalize',
    minWidth: 160, textAlign: 'center',
  },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },

  // Balance card
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  balanceLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12, color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
  },
  balanceWarning: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12, color: Colors.danger,
    marginTop: 6,
  },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.textPrimary, marginBottom: 12,
  },

  // Category bar rows
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  catIcon: { fontSize: 20, width: 28 },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: Colors.textPrimary,
  },
  catAmount: {
    fontFamily: 'DMSans_500Medium', fontSize: 13,
  },
  catBarTrack: {
    height: 6, backgroundColor: Colors.creamDark,
    borderRadius: 3, overflow: 'hidden',
  },
  catBarFill: { height: 6, borderRadius: 3 },
  catPct: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10, color: Colors.textMuted, marginTop: 2,
  },

  // Empty card
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: {
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

  // Type toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.creamDark,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeBtnExpense: { backgroundColor: Colors.danger },
  typeBtnIncome:  { backgroundColor: Colors.teal },
  typeBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13, color: Colors.textMuted,
  },

  // Amount field
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, overflow: 'hidden',
  },
  amountPrefix: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14, color: Colors.textMuted,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 14,
    backgroundColor: Colors.creamDark,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textPrimary,
  },

  // Category grid in form
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  catBtnIcon: { fontSize: 16 },
  catBtnText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13, color: Colors.textMuted,
  },

  // Form fields
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

  // Save button
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