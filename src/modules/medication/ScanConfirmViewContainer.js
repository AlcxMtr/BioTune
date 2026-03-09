import React from 'react';
import { Alert } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import ScanConfirmView from './ScanConfirmView';

export default function ScanConfirmViewContainer({ route, navigation }) {
  const handleSubmit = async ({ dosage, instructions, timeOfDay }) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      const now = firestore.Timestamp.now();
      const medicationName = route?.params?.parsed?.medicationName ?? '';

      // Create the medication document
      const medRef = await firestore()
        .collection('users')
        .doc(uid)
        .collection('medications')
        .add({
          medicationName,
          dosage,
          instructions,
          timeOfDay,
          startDate: now,
          endDate: null,
        });

      // Record first dosage history entry
      await medRef.collection('dosage').add({ date: now, dosage });

      navigation.goBack();
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
