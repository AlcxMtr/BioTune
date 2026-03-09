import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';

// Import Firebase to fetch the dates for the dots
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const colors = { whiteTwo: '#F5F5F5', primary: '#007AFF' }; 

// 1. Helper to safely get today's YYYY-MM-DD
const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 2. Helper to convert '2026-03-08' into 'Sunday, March 8'
const formatReadableDate = (dateString) => {
  if (!dateString) return '';
  // We split it to avoid JS converting it back to a weird UTC timezone!
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  }); 
};

const CalendarScreen = ({ navigation, loadSymptoms, symptomsByDate = {}, isLoading }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  
  // NEW: State to hold all the dates that should have a dot
  const [markedDatesObj, setMarkedDatesObj] = useState({});

  useEffect(() => {
    loadSymptoms(selectedDate);

    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadSymptoms(selectedDate);
    });

    return unsubscribeFocus;
  }, [selectedDate, navigation, loadSymptoms]);

  // NEW: Real-time Firebase listener to populate the dots
  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    // onSnapshot automatically updates the dots whenever data changes in Firebase
    const unsubscribeSnapshot = firestore()
      .collection('users')
      .doc(uid)
      .collection('calendar')
      .onSnapshot((snapshot) => {
        const newMarkedDates = {};
        
        snapshot.docs.forEach(doc => {
          const dateStr = doc.data().date;
          if (dateStr) {
            // Tell the calendar to put a dot on this date
            newMarkedDates[dateStr] = { marked: true, dotColor: colors.primary };
          }
        });
        
        setMarkedDatesObj(newMarkedDates);
      }, (error) => {
        console.error("Error fetching marked dates: ", error);
      });

    return () => unsubscribeSnapshot();
  }, []);

  const dailySymptoms = symptomsByDate[selectedDate] || [];

  // NEW: Function to combine the indicator dots with the currently selected blue circle
  const getCombinedMarkedDates = () => {
    const combined = { ...markedDatesObj };
    
    if (combined[selectedDate]) {
      // If the selected date already has a dot, keep the dot AND add the blue selection circle
      combined[selectedDate] = { ...combined[selectedDate], selected: true, selectedColor: colors.primary };
    } else {
      // If it doesn't have a dot, just add the blue selection circle
      combined[selectedDate] = { selected: true, selectedColor: colors.primary };
    }
    
    return combined;
  };

  const renderSymptomEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <Text style={styles.entryTime}>{item.time}</Text>
      {item.symptoms.map((symp, index) => (
        <Text key={index} style={styles.symptomText}>
          • {symp.name.charAt(0).toUpperCase() + symp.name.slice(1)} (Strength: {symp.strength}/100)
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <CalendarProvider
        date={selectedDate}
        onDateChanged={(date) => setSelectedDate(date)}
        showTodayButton
      >
        <ExpandableCalendar
          // Pass our dynamically compiled dates into the calendar
          markedDates={getCombinedMarkedDates()}
          theme={{
            calendarBackground: '#ffffff',
            selectedDayBackgroundColor: colors.primary,
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            dotColor: colors.primary, // Default dot color
          }}
          initialPosition={'month'} 
        />

        <View style={styles.listContainer}>
          {/* Use our new formatting function for the header! */}
          <Text style={styles.listHeader}>Symptoms for {formatReadableDate(selectedDate)}</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : dailySymptoms.length === 0 ? (
            <Text style={styles.emptyText}>No symptoms logged for this day.</Text>
          ) : (
            <FlatList
              data={dailySymptoms}
              keyExtractor={(item) => item.id}
              renderItem={renderSymptomEntry}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </CalendarProvider>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.logButton}
          onPress={() => navigation.navigate('LogSymptomsScreen', { date: selectedDate })}
        >
          <Text style={styles.logButtonText}>Log Symptoms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ... keep your exact same StyleSheet from before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.whiteTwo},
  listContainer: { flex: 1, padding: 20 },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  entryCard: {
    backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  entryTime: { fontSize: 15, color: colors.primary, fontWeight: 'bold', marginBottom: 8 },
  symptomText: { fontSize: 16, color: '#444', marginLeft: 5, marginTop: 3 },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  buttonContainer: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  logButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  logButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default CalendarScreen;