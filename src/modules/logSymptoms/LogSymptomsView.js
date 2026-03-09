import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Alert, TextInput, ActivityIndicator, Modal 
} from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// --- HELPERS ---
const formatReadableDate = (dateString) => {
  if (!dateString || dateString === 'Unknown Date') return dateString;
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  }); 
};

const SYMPTOMS_LIST = [
  'Energy', 'Focus', 'Mood', 'Sleep Quality'
];

const colors = { whiteTwo: '#F5F5F5', primary: '#007AFF' };

const SymptomSliderItem = ({ 
  symptom, 
  initialValue = 0, 
  onFinalChange, 
  isCustom, 
  onDelete, 
  onEdit 
}) => {
  const [localValue, setLocalValue] = useState(initialValue);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.symptomHeader}>
        <View style={styles.symptomNameRow}>
          <Text style={styles.symptomName}>
            {symptom.charAt(0).toUpperCase() + symptom.slice(1)}
          </Text>
          
          {/* Show Edit/Delete only for Custom Symptoms */}
          {isCustom && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => onEdit(symptom)} style={styles.iconButton}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(symptom)} style={styles.iconButton}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.symptomValue}>{localValue}/100</Text>
      </View>
      
      <Slider
        value={localValue}
        minimumValue={0}
        maximumValue={100}
        step={1}
        onValueChange={(val) => setLocalValue(val[0])} 
        onSlidingComplete={(val) => onFinalChange(symptom, val[0])}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor={colors.primary}
      />
    </View>
  );
};

const LogSymptomsScreen = ({ route, navigation }) => {
  const { date } = route.params || { date: 'Unknown Date' };

  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [newSymptomText, setNewSymptomText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState(null); // Tracks which symptom is being edited

  const [symptomValues, setSymptomValues] = useState(
    SYMPTOMS_LIST.reduce((acc, symptom) => { acc[symptom] = 0; return acc; }, {})
  );

  useEffect(() => {
    const fetchCustomSymptoms = async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await firestore().collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data().customSymptoms) {
          const fetchedSymptoms = userDoc.data().customSymptoms;
          setCustomSymptoms(fetchedSymptoms);
          
          setSymptomValues(prev => {
            const updatedValues = { ...prev };
            fetchedSymptoms.forEach(symp => {
              if (updatedValues[symp] === undefined) updatedValues[symp] = 0;
            });
            return updatedValues;
          });
        }
      } catch (error) {
        console.error("Error fetching custom symptoms: ", error);
      }
      setIsLoading(false);
    };

    fetchCustomSymptoms();
  }, []);

  const handleValueChange = (symptom, value) => {
    setSymptomValues(prevState => ({
      ...prevState,
      [symptom]: value
    }));
  };

  const handleAddCustomSymptom = async () => {
    const formattedSymptom = newSymptomText.trim().toLowerCase();
    
    if (!formattedSymptom) {
      setIsModalVisible(false);
      return;
    }
    
    if (SYMPTOMS_LIST.includes(formattedSymptom) || customSymptoms.includes(formattedSymptom)) {
      Alert.alert("Already exists", "This symptom is already in your list.");
      setNewSymptomText('');
      return;
    }

    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      await firestore().collection('users').doc(uid).set({
        customSymptoms: firestore.FieldValue.arrayUnion(formattedSymptom)
      }, { merge: true });

      setCustomSymptoms(prev => [formattedSymptom, ...prev]);
      setSymptomValues(prev => ({ ...prev, [formattedSymptom]: 0 }));
      setNewSymptomText('');
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Could not save custom symptom.");
    }
  };

  const handleOpenEdit = (symptom) => {
    setEditingSymptom(symptom);
    setNewSymptomText(symptom);
    setIsModalVisible(true);
  };

  const handleDeleteSymptom = (symptom) => {
    Alert.alert(
      "Delete Symptom",
      `Are you sure you want to remove "${symptom}" from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const uid = getAuth().currentUser?.uid;
            try {
              await firestore().collection('users').doc(uid).update({
                customSymptoms: firestore.FieldValue.arrayRemove(symptom)
              });
              setCustomSymptoms(prev => prev.filter(s => s !== symptom));
            } catch (e) { Alert.alert("Error", "Could not delete."); }
          }
        }
      ]
    );
  };

  const handleSaveCustomSymptom = async () => {
    const formattedSymptom = newSymptomText.trim().toLowerCase();
    const uid = getAuth().currentUser?.uid;
    if (!formattedSymptom || !uid) return setIsModalVisible(false);

    try {
      if (editingSymptom) {
        // --- EDIT LOGIC ---
        // 1. Remove old, add new in Firestore
        await firestore().collection('users').doc(uid).update({
          customSymptoms: firestore.FieldValue.arrayRemove(editingSymptom)
        });
        await firestore().collection('users').doc(uid).update({
          customSymptoms: firestore.FieldValue.arrayUnion(formattedSymptom)
        });

        // 2. Update local state
        setCustomSymptoms(prev => prev.map(s => s === editingSymptom ? formattedSymptom : s));
        setSymptomValues(prev => {
          const newVals = { ...prev };
          newVals[formattedSymptom] = prev[editingSymptom] || 0;
          delete newVals[editingSymptom];
          return newVals;
        });
      } else {
        // --- ADD LOGIC ---
        await firestore().collection('users').doc(uid).set({
          customSymptoms: firestore.FieldValue.arrayUnion(formattedSymptom)
        }, { merge: true });
        setCustomSymptoms(prev => [formattedSymptom, ...prev]);
        setSymptomValues(prev => ({ ...prev, [formattedSymptom]: 0 }));
      }

      setNewSymptomText('');
      setEditingSymptom(null);
      setIsModalVisible(false);
    } catch (e) { Alert.alert("Error", "Could not save."); }
  };

  const handleSubmit = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    const activeSymptoms = Object.entries(symptomValues)
      .filter(([name, strength]) => strength > 0)
      .map(([name, strength]) => ({ name, strength }));

    if (activeSymptoms.length === 0) {
      return Alert.alert("No Symptoms", "Please move at least one slider to log a symptom.");
    }

    const payload = {
      date: date, // Keep original YYYY-MM-DD for querying
      dateTime: new Date().toISOString(),
      symptoms: activeSymptoms
    };

    try {
      await firestore().collection('users').doc(uid).collection('calendar').add(payload);
      navigation.goBack(); 
    } catch (error) {
      Alert.alert("Upload Failed", "There was an error saving your symptoms.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
<View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Log Symptoms</Text>
          <Text style={styles.headerSubtitle}>{formatReadableDate(date)}</Text>
        </View>
        <TouchableOpacity style={styles.headerAddButton} onPress={() => { setEditingSymptom(null); setIsModalVisible(true); }}>
          <Text style={styles.headerAddButtonText}>+ Add Custom</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingSymptom ? 'Edit Symptom' : 'Add Custom Symptom'}</Text>
            <TextInput
              style={styles.modalInput}
              value={newSymptomText}
              onChangeText={setNewSymptomText}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleSaveCustomSymptom}>
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.listContainer}>
        {customSymptoms.length > 0 && (
          <View>
            {customSymptoms.map((symptom) => (
              <SymptomSliderItem
                key={`custom-${symptom}`}
                symptom={symptom}
                initialValue={symptomValues[symptom]}
                onFinalChange={handleValueChange}
                isCustom
                onDelete={handleDeleteSymptom}
                onEdit={handleOpenEdit}
              />
            ))}
            <View style={styles.divider} />
          </View>
        )}
        {SYMPTOMS_LIST.map((symptom) => (
          <SymptomSliderItem
            key={`default-${symptom}`}
            symptom={symptom}
            initialValue={symptomValues[symptom]}
            onFinalChange={handleValueChange}
          />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.whiteTwo },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20, 
    paddingHorizontal: 20,
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E0E0E0',
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  headerAddButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  headerAddButtonText: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  symptomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  iconButton: {
    padding: 5,
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  modalInput: {
    backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 15,
    paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#D0D0D0', marginBottom: 20,
  },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E0E0E0', marginRight: 10 },
  confirmButton: { backgroundColor: colors.primary, marginLeft: 10 },
  cancelButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  confirmButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  customSection: { marginBottom: 0 },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 15 },
  sliderContainer: {
    backgroundColor: 'white', padding: 15, borderRadius: 10,
    marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  symptomName: { fontSize: 18, fontWeight: '600', color: '#333' },
  symptomValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  footer: { padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  submitButton: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default LogSymptomsScreen;