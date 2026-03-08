import React, { useState, useEffect } from 'react';
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
          const meds = snapshot.docs
            .filter(doc => !doc.data()._placeholder)
            .map(doc => ({ id: doc.id, ...doc.data() }));
          setMedications(meds);
          setLoading(false);
        },
        () => setLoading(false),
      );

    return unsubscribe;
  }, []);

  return (
    <MedicationView
      medications={medications}
      loading={loading}
      navigation={navigation}
    />
  );
}
