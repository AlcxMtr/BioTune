import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from '@react-native-firebase/firestore';
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

    const db = getFirestore();
    const medsCol = collection(db, 'users', uid, 'medications');

    const unsubscribe = onSnapshot(
      medsCol,
      snapshot => {
        // Only show active medications (endDate === null)
        const meds = snapshot.docs
          .filter(d => {
            const data = d.data();
            return !data._placeholder && data.endDate === null;
          })
          .map(d => ({ id: d.id, ...d.data() }));
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
      const db = getFirestore();
      await updateDoc(doc(db, 'users', uid, 'medications', medicationId), {
        endDate: Timestamp.now(),
      });
    } catch {
      Alert.alert('Error', 'Could not remove medication. Please try again.');
    }
  }, []);

  // Adds a new dosage history document and updates the denormalized field
  const handleEditDosage = useCallback(async (medicationId, newDosage) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    try {
      const db = getFirestore();
      const medRef = doc(db, 'users', uid, 'medications', medicationId);
      await updateDoc(medRef, { dosage: newDosage });
      await addDoc(collection(db, 'users', uid, 'medications', medicationId, 'dosage'), {
        date: Timestamp.now(),
        dosage: newDosage,
      });
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
