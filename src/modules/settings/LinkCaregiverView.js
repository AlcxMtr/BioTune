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
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors, fonts } from '../../styles';

export default function LinkCaregiverView({ navigation }) {
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [caregiverUID, setCaregiverUID] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLinkCaregiver = async () => {
    if (!caregiverEmail.trim()) {
      Alert.alert('Error', 'Please enter a caregiver email');
      return;
    }
    
    if (!caregiverUID.trim()) {
      Alert.alert('Error', 'Please enter a caregiver UID');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to link a caregiver');
        return;
      }

      // Validate that the caregiver UID exists and email matches
      const caregiverDoc = await firestore()
        .collection('users')
        .doc(caregiverUID.trim())
        .get();

      if (!caregiverDoc.exists) {
        Alert.alert('Error', 'Caregiver UID not found. Please check the UID and try again.');
        setLoading(false);
        return;
      }

      // Check if the provided email matches the user's email (if available)
      const caregiverData = caregiverDoc.data();
      if (caregiverData && caregiverData.email && caregiverData.email.toLowerCase() !== caregiverEmail.trim().toLowerCase()) {
        Alert.alert('Error', 'The email provided does not match the caregiver\'s registered email.');
        setLoading(false);
        return;
      }
      
      const emailKey = caregiverEmail.trim().toLowerCase().replace(/[.]/g, '_');
      
      const caregiverRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('caregiver_requests')
        .doc(caregiverUID.trim());

      await caregiverRef.set({
        caregiverUID: caregiverUID.trim(),
        caregiverEmail: caregiverEmail.trim().toLowerCase(),
        requestedAt: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        permissions: ['view_medications']
      });

      // Also create a dependent request for the caregiver to see
      const dependentRequestRef = firestore()
        .collection('users')
        .doc(caregiverUID.trim())
        .collection('requests')
        .doc(currentUser.uid);

      await dependentRequestRef.set({
        patientEmail: currentUser.email,
        patientUID: currentUser.uid,
        requestedAt: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        permissions: ['view_medications']
      });

      console.log('Successfully created caregiver request for email:', caregiverEmail);
      
      Alert.alert(
        'Request Sent',
        'A caregiver access request has been created. The caregiver will need to accept the request to view your medications.',
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
            Enter both your caregiver's UID and email address to send them an access request.
            They will need to accept the request in their app to view your medications.
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
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Caregiver Email</Text>
            <TextInput
              style={styles.textInput}
              value={caregiverEmail}
              onChangeText={setCaregiverEmail}
              placeholder="Enter caregiver's email"
              placeholderTextColor={colors.lightGray}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
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