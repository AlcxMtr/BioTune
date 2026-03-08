import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors, fonts } from '../../styles';

function MedicationItem({ item }) {
  const name = item.rxMetadata?.medicationName || item.id;
  const dosage = item.rxMetadata?.dosage;
  const frequency = item.rxMetadata?.frequency;

  return (
    <View style={styles.item}>
      <Text style={styles.itemName}>{name}</Text>
      {(dosage || frequency) && (
        <Text style={styles.itemSub}>
          {[dosage, frequency].filter(Boolean).join(' · ')}
        </Text>
      )}
    </View>
  );
}

export default function MedicationView({ medications, loading, navigation }) {
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
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MedicationItem item={item} />}
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
  },
  itemName: {
    fontSize: 16,
    fontFamily: fonts.primaryBold,
    color: colors.darkGray,
  },
  itemSub: {
    fontSize: 13,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
    marginTop: 3,
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
});
