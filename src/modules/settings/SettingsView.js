import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../styles';

const settingsItems = [
  { label: 'Link Caregiver' },
  { label: 'Link Device' },
  { label: 'Theme' },
  { label: 'Sign Out' },
  { label: 'Delete Account' },
];

export default function SettingsView() {
  return (
    <ScrollView style={styles.container}>
      {settingsItems.map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    color: colors.darkGray,
  },
});
