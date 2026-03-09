// @flow
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { setLoggedIn, setAccountType } from '../AppState';
import AuthView from './AuthView';

function AuthViewContainerWrapper({ onLogin, onSetAccountType, accountType }) {
  useEffect(() => {
    // Handles returning users whose Firebase session is restored on app launch.
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) onLogin();
    });
    return unsubscribe;
  }, []);

  // Called by AuthView after Firebase auth succeeds during an active sign-in.
  const handleAuthSuccess = async (user) => {
    const ref = firestore().collection('users').doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.accountType == null) {
      // First sign-in: persist the role the user selected in this session.
      await ref.set({ accountType }, { merge: true });
    } else {
      // Returning user: sync Redux with whatever Firestore has.
      onSetAccountType(snap.data().accountType);
    }
    // setLoggedIn() is dispatched by onAuthStateChanged above.
  };

  return <AuthView onSetAccountType={onSetAccountType} onAuthSuccess={handleAuthSuccess} />;
}

const mapStateToProps = (state) => ({
  accountType: state.app.accountType,
});

const mapDispatchToProps = (dispatch) => ({
  onLogin: () => dispatch(setLoggedIn()),
  onSetAccountType: (type) => dispatch(setAccountType(type)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AuthViewContainerWrapper);
