import CalendarScreen from '../calendar/CalendarViewContainer';
import MedicationScreen from '../medication/MedicationViewContainer';
import SettingsScreen from '../settings/SettingsViewContainer';
import Icon from 'react-native-vector-icons/FontAwesome5';
import React from 'react';

const iconCalendar = require('../../../assets/images/tabbar/calendar.png');
const iconSettings = require('../../../assets/images/drawer/settings.png');

const tabNavigationData = [
  {
    name: 'Calendar',
    component: CalendarScreen,
    icon: iconCalendar,
  },
  {
    name: 'Medications',
    component: MedicationScreen,
    iconComponent: (focused) => (
      <Icon
        name="prescription-bottle-alt"
        size={23}
        color={focused ? '#555CC4' : '#5f5f5f'}
        solid
      />
    ),
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    icon: iconSettings,
  },
];

export default tabNavigationData;