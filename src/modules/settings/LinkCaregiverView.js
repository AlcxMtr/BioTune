import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts } from '../../styles';

export default function LinkCaregiverView({ navigation }) {
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoadingAccount(false);
      return;
    }
    const db = getFirestore();
    getDoc(doc(db, 'users', currentUser.uid))
      .then(snap => {
        const data = snap.data();
        setAccountType(data?.accountType ?? 'patient');
      })
      .catch(() => setAccountType('patient'))
      .finally(() => setLoadingAccount(false));
  }, []);

  useEffect(() => {
    if (accountType !== 'caregiver') return;
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const db = getFirestore();
    const requestsRef = collection(db, 'users', currentUser.uid, 'requests');
    const unsubscribe = onSnapshot(requestsRef, snapshot => {
      const docs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.status !== 'accepted');
      setRequests(docs);
    });
    return unsubscribe;
  }, [accountType]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleAccept = async (request) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const db = getFirestore();
      await updateDoc(
        doc(db, 'users', currentUser.uid, 'requests', request.id),
        { status: 'accepted' },
      );
      await updateDoc(
        doc(db, 'users', request.patientUID, 'caregiver_requests', currentUser.uid),
        { status: 'accepted' },
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request. Please try again.');
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = (request) => {
    Alert.alert(
      'Reject Request',
      `Reject the request from ${request.patientEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const auth = getAuth();
              const currentUser = auth.currentUser;
              const db = getFirestore();
              await deleteDoc(
                doc(db, 'users', currentUser.uid, 'requests', request.id),
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reject request. Please try again.');
              console.error('Error rejecting request:', error);
            }
          },
        },
      ],
    );
  };

  const handleLinkCaregiver = async () => {
    if (!caregiverEmail.trim()) {
      Alert.alert('Error', 'Please enter a caregiver email');
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

      const db = getFirestore();

      // Look up the caregiver by email in the users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', caregiverEmail.trim().toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert('Error', 'Caregiver not found. Please check the email and try again.');
        setLoading(false);
        return;
      }

      const caregiverDoc = snapshot.docs[0];
      const resolvedUID = caregiverDoc.id;

      // Send the request under the current user's subcollection
      await setDoc(
        doc(db, 'users', currentUser.uid, 'caregiver_requests', resolvedUID),
        {
          caregiverUID: resolvedUID,
          caregiverEmail: caregiverEmail.trim().toLowerCase(),
          requestedAt: serverTimestamp(),
          status: 'pending',
          permissions: ['view_medications'],
        },
      );

      // Create the corresponding inbound request for the caregiver
      await setDoc(
        doc(db, 'users', resolvedUID, 'requests', currentUser.uid),
        {
          patientEmail: currentUser.email,
          patientUID: currentUser.uid,
          requestedAt: serverTimestamp(),
          status: 'pending',
          permissions: ['view_medications'],
        },
      );

      Alert.alert(
        'Request Sent',
        'A caregiver access request has been created. The caregiver will need to accept the request to view your medications.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to link caregiver. Please try again.');
      console.error('Error linking caregiver:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAccount) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (accountType === 'caregiver') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Access Requests</Text>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestEmail}>{item.patientEmail}</Text>
                  <Text style={styles.requestDate}>{formatDate(item.requestedAt)}</Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    onPress={() => handleAccept(item)}
                    style={styles.actionButton}
                    accessibilityLabel="Accept request"
                  >
                    <MaterialCommunityIcons name="check-circle" size={38} color="#34C759" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(item)}
                    style={styles.actionButton}
                    accessibilityLabel="Reject request"
                  >
                    <MaterialCommunityIcons name="close-circle" size={38} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Link Caregiver</Text>
          <Text style={styles.description}>
            Enter your caregiver's email address to send them an access request.
            They will need to accept the request in their app to view your medications.
          </Text>
          
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
  centered: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestEmail: {
    fontSize: 16,
    fontFamily: fonts.primarySemiBold,
    color: colors.darkGray,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    fontFamily: fonts.primaryRegular,
    color: colors.gray,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 2,
  },
});