import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigator} from './src/navigation/AppNavigator';
import {StorageProvider} from './src/services/StorageContext';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StorageProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </StorageProvider>
    </SafeAreaProvider>
  );
};

export default App;
