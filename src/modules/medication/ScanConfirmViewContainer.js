import React from 'react';
import { Alert } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  Timestamp,
} from '@react-native-firebase/firestore';
import ScanConfirmView from './ScanConfirmView';

export default function ScanConfirmViewContainer({ route, navigation }) {
  const handleSubmit = async ({ dosage, instructions, timeOfDay }) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      const db = getFirestore();
      const now = Timestamp.now();
      const medicationName = route?.params?.parsed?.medicationName ?? '';

      // Create the medication document
      const medsCol = collection(db, 'users', uid, 'medications');
      const medRef = await addDoc(medsCol, {
        medicationName,
        dosage,
        instructions,
        timeOfDay,
        startDate: now,
        endDate: null,
      });

      // Record first dosage history entry
      await addDoc(collection(db, 'users', uid, 'medications', medRef.id, 'dosage'), {
        date: now,
        dosage,
      });

      // Navigate back to the Medications tab.
      // ScanConfirmMedication and ScanMedication are stack-level siblings of
      // the 'BioTune' tab navigator, so we must target the tab via its stack
      // route name rather than getParent().
      navigation.navigate('BioTune', { screen: 'Medications' });
    } catch (e) {
      Alert.alert('Error', 'Could not save medication. Please try again.');
    }
  };

  return (
    <ScanConfirmView
      route={route}
      navigation={navigation}
      onSubmit={handleSubmit}
    />
  );
}
