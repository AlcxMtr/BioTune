import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors, fonts } from '../../styles';

function EditDosageModal({ visible, currentDosage, onSave, onClose }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(currentDosage ?? '');
  }, [visible, currentDosage]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Dosage</Text>
          <TextInput
            style={styles.modalInput}
            value={value}
            onChangeText={setValue}
            placeholder="e.g. 500 mg Tablet"
            placeholderTextColor={colors.lightGray}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => { if (value.trim()) onSave(value.trim()); }}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, !value.trim() && styles.modalSaveBtnDisabled]}
              onPress={() => { if (value.trim()) onSave(value.trim()); }}
              disabled={!value.trim()}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MedicationItem({ item, onDelete, onRequestEdit }) {
  const name = item.medicationName || item.id;
  const dosage = item.dosage;
  const instructions = item.instructions;

  const handleDelete = () => {
    Alert.alert(
      'Remove Medication',
      `Stop tracking ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
    );
  };

  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{name}</Text>
        {dosage ? (
          <View style={styles.dosageRow}>
            <Text style={styles.itemSub}>{dosage}</Text>
            <TouchableOpacity
              onPress={() => onRequestEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.editIconBtn}>
              <Icon name="pen" size={11} color={colors.lightGray} />
            </TouchableOpacity>
          </View>
        ) : null}
        {instructions ? (
          <Text style={styles.itemInstructions} numberOfLines={2}>
            {instructions}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="trash" size={14} color={colors.lightGray} />
      </TouchableOpacity>
    </View>
  );
}

export default function MedicationView({ medications, loading, navigation, onDelete, onEditDosage }) {
  // { id, dosage } of the item currently being edited, or null
  const [editTarget, setEditTarget] = useState(null);

  const handleSaveDosage = (newDosage) => {
    onEditDosage(editTarget.id, newDosage);
    setEditTarget(null);
  };
  const handleScan = () => {
    navigation.getParent()?.navigate('ScanMedication');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EditDosageModal
        visible={editTarget !== null}
        currentDosage={editTarget?.dosage}
        onSave={handleSaveDosage}
        onClose={() => setEditTarget(null)}
      />
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MedicationItem
            item={item}
            onDelete={onDelete}
            onRequestEdit={(med) => setEditTarget({ id: med.id, dosage: med.dosage })}
          />
        )}
        contentContainerStyle={
          medications.length === 0 ? styles.emptyContent : styles.listContent
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {'No medications yet.\nTap + to scan a prescription.'}
          </Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleScan} activeOpacity={0.8}>
        <Icon name="plus" size={22} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#F4F5FB',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: { flex: 1 },
  itemName: {
    fontSize: 16,
    fontFamily: fonts.primaryBold,
    color: colors.darkGray,
  },
  dosageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  editIconBtn: { padding: 2 },
  deleteBtn: { padding: 8 },
  itemSub: {
    fontSize: 13,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
  },
  itemInstructions: {
    fontSize: 12,
    fontFamily: fonts.primaryRegular,
    color: colors.lightGray,
    marginTop: 3,
    lineHeight: 17,
  },
  empty: {
    fontSize: 15,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Edit dosage modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.primaryBold,
    color: colors.darkGray,
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.bluish,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: fonts.primaryRegular,
    color: colors.darkGray,
    backgroundColor: '#FAFAFA',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: { padding: 8 },
  modalCancelText: {
    fontSize: 14,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveBtnDisabled: { opacity: 0.4 },
  modalSaveText: {
    fontSize: 14,
    fontFamily: fonts.primaryBold,
    color: colors.white,
  },
});
