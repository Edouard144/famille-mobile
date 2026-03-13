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
