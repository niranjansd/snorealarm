console.log('[index.web] Starting...');

import {AppRegistry} from 'react-native';
import App from './App';

console.log('[index.web] Imports loaded');

// Register the app
AppRegistry.registerComponent('SnoreAlarm', () => App);

console.log('[index.web] Component registered');

// Run the app on web
try {
  const rootTag = document.getElementById('root');
  console.log('[index.web] Root element:', rootTag);
  
  AppRegistry.runApplication('SnoreAlarm', {
    rootTag: rootTag,
  });
  
  console.log('[index.web] App started successfully');
} catch (error) {
  console.error('[index.web] Failed to start app:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Error starting app</h1>
      <pre>${error.message}\n${error.stack}</pre>
    </div>
  `;
}
