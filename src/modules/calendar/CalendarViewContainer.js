import { connect } from 'react-redux';
import { compose } from 'recompose';

import { loadSymptoms } from './CalendarState';
import CalendarScreen from './CalendarView'; 

export default compose(
  connect(
    state => ({
      // Map Redux state to props
      symptomsByDate: state.calendar.symptomsByDate,
      isLoading: state.calendar.isLoading,
    }),
    {
      // Map actions to props
      loadSymptoms,
    },
  ),
)(CalendarScreen);