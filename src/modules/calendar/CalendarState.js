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
// This is where you will call Firestore!
export function loadSymptoms(date, userId = 'mockUserId') {
  return async (dispatch, getState) => {
    // Optional Optimization: Check if we already have symptoms for this date in Redux to save Firestore reads
    // const existingSymptoms = getState().calendar.symptomsByDate[date];
    // if (existingSymptoms) return;

    dispatch(symptomsLoading());

    try {
      // TODO: ACTUAL FIRESTORE INTEGRATION HERE
      // const snapshot = await db.collection('users').doc(userId).collection('calendar').where('date', '==', date).get();
      // const fetchedSymptoms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // MOCK DATA (Until Firestore is hooked up):
      // Simulating a network delay
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      let fetchedSymptoms = [];
      const today = new Date().toISOString().split('T')[0];
      
      if (date === today) {
        fetchedSymptoms = [
          { id: '1', time: '10:00 AM', symptoms: [{ name: 'Nausea', strength: 4 }, { name: 'Anxiety', strength: 7 }] },
          { id: '2', time: '4:30 PM', symptoms: [{ name: 'Headache', strength: 3 }] }
        ];
      }

      // Dispatch the fetched data to the reducer
      dispatch(symptomsLoaded(date, fetchedSymptoms));
    } catch (error) {
      console.error("Error fetching symptoms from Firestore: ", error);
    }
  };
}

// --- REDUCER ---
const defaultState = {
  // We store symptoms in an object where the key is the date (e.g., '2026-03-08': [...])
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
          // Dynamically add/update the array of symptoms for the specific date
          [action.payload.date]: action.payload.symptoms, 
        },
      };
    default:
      return state;
  }
}