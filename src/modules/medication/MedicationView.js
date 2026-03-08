import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../styles';

export default function MedicationView() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medications</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.primaryBold,
    color: colors.darkGray,
  },
});
