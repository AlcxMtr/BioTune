import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

// --- ACTIONS ---
const SYMPTOMS_LOADING = 'CalendarState/SYMPTOMS_LOADING';
const SYMPTOMS_LOADED = 'CalendarState/SYMPTOMS_LOADED';

function symptomsLoading() {
  return { type: SYMPTOMS_LOADING };
}

function symptomsLoaded(date, symptoms) {
  return {
    type: SYMPTOMS_LOADED,
    payload: { date, symptoms },
  };
}

// --- THUNK (Async Action) ---
export function loadSymptoms(date) {
  return async (dispatch) => {
    dispatch(symptomsLoading());

    const uid = getAuth().currentUser?.uid;
    
    // Safety check: if they aren't logged in, don't try to fetch
    if (!uid) {
      dispatch(symptomsLoaded(date, []));
      return;
    }

    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(uid)
        .collection('calendar')
        .where('date', '==', date)
        .get();

      const fetchedSymptoms = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert the ISO dateTime string into a readable time (e.g., "4:30 PM")
        const dateObj = new Date(data.dateTime);
        let hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // The hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        const formattedTime = `${hours}:${minutesStr} ${ampm}`;

        return {
          id: doc.id,
          time: formattedTime,
          rawDate: dateObj, // Keep this around so we can sort the entries
          symptoms: data.symptoms || [],
        };
      });

      // Sort entries chronologically (oldest logs at the top, newest at the bottom)
      fetchedSymptoms.sort((a, b) => a.rawDate - b.rawDate);

      // Dispatch the mapped, sorted data to the reducer
      dispatch(symptomsLoaded(date, fetchedSymptoms));
      
    } catch (error) {
      console.error("Error fetching symptoms from Firestore: ", error);
      dispatch(symptomsLoaded(date, [])); // Don't leave the app loading forever if it fails
    }
  };
}

// --- REDUCER ---
const defaultState = {
  symptomsByDate: {}, 
  isLoading: false,
};

export default function CalendarStateReducer(state = defaultState, action) {
  switch (action.type) {
    case SYMPTOMS_LOADING:
      return { 
        ...state, 
        isLoading: true 
      };
    case SYMPTOMS_LOADED:
      return {
        ...state,
        isLoading: false,
        symptomsByDate: {
          ...state.symptomsByDate,
          [action.payload.date]: action.payload.symptoms, 
        },
      };
    default:
      return state;
  }
}