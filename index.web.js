import {AppRegistry} from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('SnoreAlarm', () => App);

// Run the app on web
AppRegistry.runApplication('SnoreAlarm', {
  rootTag: document.getElementById('root'),
});
