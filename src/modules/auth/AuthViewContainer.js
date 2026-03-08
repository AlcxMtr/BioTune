// @flow
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { setLoggedIn, setAccountType } from '../AppState';
import AuthView from './AuthView';

function AuthViewContainerWrapper({ onLogin, onSetAccountType }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) onLogin();
    });
    return unsubscribe;
  }, []);

  return <AuthView onLogin={onLogin} onSetAccountType={onSetAccountType} />;
}

const mapDispatchToProps = (dispatch) => ({
  onLogin: () => dispatch(setLoggedIn()),
  onSetAccountType: (type) => dispatch(setAccountType(type)),
});

export default connect(null, mapDispatchToProps)(AuthViewContainerWrapper);
