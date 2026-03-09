import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts } from '../../styles';

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', icon: 'weather-sunset-up' },
  { key: 'noon',    label: 'Noon',    icon: 'weather-sunny' },
  { key: 'evening', label: 'Evening', icon: 'weather-night' },
];

export default function ScanConfirmView({ route, navigation, onSubmit }) {
  const parsed = route?.params?.parsed ?? {};
  const medicationName = parsed.medicationName ?? 'Medication';

  const [dosage, setDosage] = useState(parsed.dosage ?? '');
  const [instructions, setInstructions] = useState(parsed.instructions ?? '');
  const [timeOfDay, setTimeOfDay] = useState(null);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Top bar with back arrow */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="arrow-left" size={18} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Medication name — read-only header */}
          <Text style={styles.medName} numberOfLines={3}>{medicationName}</Text>
          <View style={styles.divider} />

          {/* Dosage */}
          <Text style={styles.fieldLabel}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 500 mg Tablet"
            placeholderTextColor={colors.lightGray}
            returnKeyType="next"
          />

          {/* Instructions */}
          <Text style={styles.fieldLabel}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g. Take 1 tablet by mouth twice daily"
            placeholderTextColor={colors.lightGray}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Time of day */}
          <Text style={styles.fieldLabel}>Time of Day</Text>
          <View style={styles.timeRow}>
            {TIME_SLOTS.map(slot => {
              const active = timeOfDay === slot.key;
              return (
                <TouchableOpacity
                  key={slot.key}
                  style={[styles.timeTile, active && styles.timeTileActive]}
                  onPress={() => setTimeOfDay(active ? null : slot.key)}
                  activeOpacity={0.75}>
                  <MCIcon
                    name={slot.icon}
                    size={28}
                    color={active ? colors.white : colors.primary}
                  />
                  <Text style={[styles.tileLabel, active && styles.tileLabelActive]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => onSubmit({ dosage, instructions, timeOfDay })}
            activeOpacity={0.8}>
            <Text style={styles.submitText}>Save Medication</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1 },
  topBar: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  medName: {
    fontSize: 28,
    fontFamily: fonts.primaryBold,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 34,
  },
  divider: {
    height: 1,
    backgroundColor: colors.bluish,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.primaryBold,
    color: colors.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.bluish,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.primaryRegular,
    color: colors.darkGray,
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  timeTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.bluish,
    backgroundColor: colors.white,
    gap: 6,
  },
  timeTileActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tileLabel: {
    fontSize: 11,
    fontFamily: fonts.primarySemiBold,
    color: colors.primary,
    textAlign: 'center',
  },
  tileLabelActive: {
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontFamily: fonts.primaryBold,
    color: colors.white,
  },
});
