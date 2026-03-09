import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts } from '../../styles';

export default function LinkCaregiverView({ navigation }) {
  const [caregiverUID, setCaregiverUID] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLinkCaregiver = async () => {
    if (!caregiverUID.trim()) {
      Alert.alert('Error', 'Please enter a caregiver UID');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement Firebase function to grant caregiver permissions
      // so:
      // 1. Validating the caregiver UID exists
      // 2. Adding the caregiver to the user's permissions list
      // 3. Notifying the caregiver of the new permissions
      
      // Placeholder for now
      console.log('Linking caregiver with UID:', caregiverUID);
      
      Alert.alert(
        'Success',
        'Caregiver has been granted access to view your medications',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to link caregiver. Please try again.');
      console.error('Error linking caregiver:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Link Caregiver</Text>
          <Text style={styles.description}>
            Enter your caregiver's unique ID to grant them permission to view your medications.
            Your caregiver can find their UID in their app settings.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Caregiver UID</Text>
            <TextInput
              style={styles.textInput}
              value={caregiverUID}
              onChangeText={setCaregiverUID}
              placeholder="Enter caregiver's UID"
              placeholderTextColor={colors.lightGray}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.linkButton, loading && styles.linkButtonDisabled]}
            onPress={handleLinkCaregiver}
            disabled={loading}
          >
            <Text style={styles.linkButtonText}>
              {loading ? 'Linking...' : 'Grant Access'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Important Information:</Text>
            <Text style={styles.infoText}>
              • Your caregiver will be able to view your medication schedules and history
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.primarySemiBold,
    color: colors.darkGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: fonts.primarySemiBold,
    color: colors.darkGray,
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: fonts.primaryRegular,
    color: colors.darkGray,
    backgroundColor: colors.white,
  },
  linkButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  linkButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  linkButtonText: {
    fontSize: 16,
    fontFamily: fonts.primarySemiBold,
    color: colors.white,
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: fonts.primarySemiBold,
    color: colors.darkGray,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
    marginBottom: 8,
    lineHeight: 20,
  },
});