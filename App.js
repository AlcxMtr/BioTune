import { Provider } from 'react-redux';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { PersistGate } from 'redux-persist/integration/react';
import { colors } from './src/styles';
import { NavigationContainer } from '@react-navigation/native';
import { LogBox } from 'react-native';

import { store, persistor } from './src/redux/store';

import AppView from './src/modules/AppViewContainer';

LogBox.ignoreLogs([
  'ViewPropTypes will be removed from React Native',
  'React.createFactory() is deprecated',
  '`new NativeEventEmitter()` was called with a non-null argument',
]);

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <PersistGate
          loading={
            <View style={styles.container}>
              <ActivityIndicator color={colors.red} />
            </View>
          }
          persistor={persistor}
        >
          <AppView />
        </PersistGate>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});
