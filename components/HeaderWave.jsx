import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function HeaderWave({ color }) {
  return (
    <View style={[styles.waveContainer, { backgroundColor: color }]}>
      <View style={styles.waveLower} />
    </View>
  );
}

const styles = StyleSheet.create({
  waveContainer: { height: 40, width: '100%', overflow: 'hidden' },
  waveLower: { 
    position: 'absolute', bottom: -40, width: '100%', height: 80, 
    backgroundColor: '#FFFDF8', // Colors.cream
    borderTopLeftRadius: 50, borderTopRightRadius: 50 
  }
});