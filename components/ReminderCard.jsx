import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import T from '../../constants/translations';
import HeaderWave from '../../components/HeaderWave';
import ReminderCard from '../../components/ReminderCard';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Mugabo'); // This will come from storage/API later

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Add logic to fetch latest family data from Java backend here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Teal Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{T.hello}, {userName}</Text>
          <Text style={styles.subGreeting}>Muraho neza uyu munsi? (How is everyone today?)</Text>
        </View>
      </View>

      {/* Organic Wave Transition */}
      <HeaderWave color={Colors.teal} />

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Pregnancy Quick Glance (If applicable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{T.pregnancyStatus}</Text>
          <TouchableOpacity style={styles.pregnancyCard} activeOpacity={0.9}>
            <View style={styles.progressCircle}>
               <Text style={styles.weekNum}>18</Text>
               <Text style={styles.weekLabel}>Icyumweru</Text>
            </View>
            <View style={styles.pregnancyInfo}>
              <Text style={styles.pregnancyMain}>Ingano y'umwana: Inkeri</Text>
              <Text style={styles.pregnancySub}>Amashyushyu: Iminsi 154 isigaye</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Urgent Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{T.reminders}</Text>
          
          <ReminderCard 
            type="vaccination"
            title="Inkingo: Keza"
            time="Ejo saa 09:00"
            urgency="high"
          />
          
          <ReminderCard 
            type="medication"
            title="Ibinini: Mugisha"
            time="Uyu munsi saa 18:00"
            urgency="medium"
          />
        </View>

        <View style={{ height: 100 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { backgroundColor: Colors.teal, paddingTop: 20, paddingHorizontal: 24, height: 120 },
  headerContent: { marginTop: 10 },
  greeting: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.white },
  subGreeting: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { flex: 1, marginTop: -10, paddingHorizontal: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'DMSans_500Medium', fontSize: 18, color: Colors.textPrimary, marginBottom: 12 },
  pregnancyCard: { 
    backgroundColor: Colors.white, 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 
  },
  progressCircle: { 
    width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: Colors.amber,
    alignItems: 'center', justifyContent: 'center', marginRight: 20
  },
  weekNum: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  weekLabel: { fontSize: 8, color: Colors.textMuted, textTransform: 'uppercase' },
  pregnancyMain: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  pregnancySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 }
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function ReminderCard({ type, title, time, urgency }) {
  const dotColor = urgency === 'high' ? Colors.danger : Colors.amber;
  
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border 
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  time: { fontSize: 13, color: Colors.textMuted, marginTop: 2 }
});