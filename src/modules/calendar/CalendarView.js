import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
// Import CalendarProvider and ExpandableCalendar
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';

const colors = { whiteTwo: '#F5F5F5', primary: '#007AFF' }; // Mocked styles

const CalendarScreen = ({ navigation, loadSymptoms, symptomsByDate = {} }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  // const [dailySymptoms, setDailySymptoms] = useState([]);

  useEffect(() => {
    // Call the Redux action when the date changes
    loadSymptoms(selectedDate);
  }, [selectedDate]);

  // To get the data for your FlatList:
  const dailySymptoms = symptomsByDate[selectedDate] || [];

  const renderSymptomEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <Text style={styles.entryTime}>{item.time}</Text>
      {item.symptoms.map((symp, index) => (
        <Text key={index} style={styles.symptomText}>
         {symp.name} (Strength: {symp.strength}/10)
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* CalendarProvider acts as the context for the expandable calendar */}
      <CalendarProvider
        date={selectedDate}
        onDateChanged={(date) => setSelectedDate(date)}
        showTodayButton
      >
        {/* ExpandableCalendar replaces the standard Calendar */}
        <ExpandableCalendar
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: colors.primary }
          }}
          theme={{
            calendarBackground: '#ffffff',
            selectedDayBackgroundColor: colors.primary,
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
          }}
          // You can set initial position to 'week' or 'month'
          initialPosition={'month'} 
        />

        {/* MIDDLE SECTION: SYMPTOM LIST */}
        {/* Notice we changed flex: 5 to flex: 1 so it just fills available space */}
        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Symptoms for {selectedDate}</Text>
          
          {dailySymptoms.length === 0 ? (
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

      {/* BOTTOM SECTION: ACTION BUTTON */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteTwo,
    // Added a small top padding to account for hiding the header
  },
  listContainer: {
    flex: 1, // Now it dynamically takes up remaining space below the calendar
    padding: 20,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  entryTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  symptomText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    marginTop: 2,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Extra padding for the bottom of the screen
    paddingTop: 10,
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;