import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MedicationView from './MedicationView';

export default function MedicationViewContainer({ navigation }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('users')
      .doc(uid)
      .collection('medications')
      .onSnapshot(
        snapshot => {
          // Only show active medications (endDate === null)
          const meds = snapshot.docs
            .filter(doc => {
              const d = doc.data();
              return !d._placeholder && d.endDate === null;
            })
            .map(doc => ({ id: doc.id, ...doc.data() }));
          setMedications(meds);
          setLoading(false);
        },
        () => setLoading(false),
      );

    return unsubscribe;
  }, []);

  // Sets endDate to mark the medication as ended (soft-delete)
  const handleDelete = useCallback(async (medicationId) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('medications')
        .doc(medicationId)
        .update({ endDate: firestore.Timestamp.now() });
    } catch {
      Alert.alert('Error', 'Could not remove medication. Please try again.');
    }
  }, []);

  // Adds a new dosage history document and updates the denormalized field
  const handleEditDosage = useCallback(async (medicationId, newDosage) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    try {
      const now = firestore.Timestamp.now();
      const medRef = firestore()
        .collection('users')
        .doc(uid)
        .collection('medications')
        .doc(medicationId);
      await medRef.update({ dosage: newDosage });
      await medRef.collection('dosage').add({ date: now, dosage: newDosage });
    } catch {
      Alert.alert('Error', 'Could not update dosage. Please try again.');
    }
  }, []);

  return (
    <MedicationView
      medications={medications}
      loading={loading}
      navigation={navigation}
      onDelete={handleDelete}
      onEditDosage={handleEditDosage}
    />
  );
}
