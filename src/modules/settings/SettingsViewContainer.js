import React from 'react';
import { connect } from 'react-redux';
import { signOut, getAuth } from '@react-native-firebase/auth';
import { setLoggedOut } from '../AppState';
import SettingsView from './SettingsView';

function SettingsContainer({ onSignOut }) {
  const handleSignOut = async () => {
    await signOut(getAuth());
    onSignOut();
  };

  return <SettingsView onSignOut={handleSignOut} />;
}

const mapDispatchToProps = (dispatch) => ({
  onSignOut: () => dispatch(setLoggedOut()),
});

export default connect(null, mapDispatchToProps)(SettingsContainer);
