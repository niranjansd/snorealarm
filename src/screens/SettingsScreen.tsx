import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {useStorage} from '../services/StorageContext';

export const SettingsScreen: React.FC = () => {
  const {settings, updateSettings, clearAllSessions, sessions} = useStorage();
  const [showAbout, setShowAbout] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your sleep recordings. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearAllSessions(),
        },
      ],
    );
  };

  const getSensitivityLabel = (): string => {
    if (settings.minConfidenceThreshold < 0.4) return 'High';
    if (settings.minConfidenceThreshold < 0.6) return 'Medium';
    return 'Low';
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSliderSetting = (
    title: string,
    value: number,
    min: number,
    max: number,
    step: number,
    displayValue: string,
    onValueChange: (value: number) => void,
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingValue}>{displayValue}</Text>
      </View>
      <Slider
        style={styles.slider}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#007AFF"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderSection(
        'Recording',
        <>
          {renderSliderSetting(
            'Max Recording Duration',
            settings.maxRecordingHours,
            1,
            12,
            1,
            `${settings.maxRecordingHours} hours`,
            value => updateSettings({maxRecordingHours: value}),
          )}
          {renderSliderSetting(
            'Low Battery Threshold',
            settings.lowBatteryThreshold,
            5,
            25,
            5,
            `${settings.lowBatteryThreshold}%`,
            value => updateSettings({lowBatteryThreshold: value}),
          )}
          <Text style={styles.settingHint}>
            Recording will automatically stop when battery drops below this
            level.
          </Text>
        </>,
      )}

      {renderSection(
        'Sound Detection',
        <>
          {renderSliderSetting(
            'Detection Sensitivity',
            settings.minConfidenceThreshold,
            0.2,
            0.8,
            0.1,
            getSensitivityLabel(),
            value => updateSettings({minConfidenceThreshold: value}),
          )}
          <Text style={styles.settingHint}>
            Lower sensitivity detects more sounds but may include false
            positives. Higher sensitivity is more accurate but may miss some
            snoring events.
          </Text>
        </>,
      )}

      {renderSection(
        'Data',
        <>
          <TouchableOpacity
            style={styles.buttonItem}
            onPress={handleClearData}>
            <Icon name="trash-can-outline" size={22} color="#FF4444" />
            <Text style={[styles.buttonText, {color: '#FF4444'}]}>
              Clear All Recordings
            </Text>
          </TouchableOpacity>
          <View style={styles.storageInfo}>
            <Icon name="database" size={18} color="#666" />
            <Text style={styles.storageText}>
              {sessions.length} recordings stored locally
            </Text>
          </View>
        </>,
      )}

      {renderSection(
        'About',
        <>
          <TouchableOpacity
            style={styles.buttonItem}
            onPress={() => setShowAbout(!showAbout)}>
            <Icon name="information-outline" size={22} color="#007AFF" />
            <Text style={styles.buttonText}>About SnoreAlarm</Text>
            <Icon
              name={showAbout ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#CCC"
            />
          </TouchableOpacity>
          {showAbout && (
            <View style={styles.aboutContent}>
              <View style={styles.appIcon}>
                <Icon name="sleep" size={40} color="#fff" />
              </View>
              <Text style={styles.appName}>SnoreAlarm</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutText}>
                SnoreAlarm helps you understand your sleep by recording and
                analyzing sounds throughout the night.
              </Text>
              <View style={styles.featureList}>
                <FeatureItem icon="microphone" text="Record up to 11 hours of sleep" />
                <FeatureItem icon="waveform" text="ML-powered snore detection" />
                <FeatureItem icon="chart-bar" text="Detailed sleep statistics" />
                <FeatureItem icon="shield-lock" text="100% private - all data stays on device" />
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.buttonItem}
            onPress={() => Linking.openURL('https://apple.com/privacy')}>
            <Icon name="shield-account" size={22} color="#007AFF" />
            <Text style={styles.buttonText}>Privacy Policy</Text>
            <Icon name="open-in-new" size={18} color="#CCC" />
          </TouchableOpacity>
        </>,
      )}

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          SnoreAlarm is not a medical device and is intended for informational
          purposes only. It does not provide medical advice, diagnosis, or
          treatment.
        </Text>
      </View>
    </ScrollView>
  );
};

const FeatureItem: React.FC<{icon: string; text: string}> = ({icon, text}) => (
  <View style={styles.featureItem}>
    <Icon name={icon} size={18} color="#007AFF" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  settingHint: {
    fontSize: 13,
    color: '#888',
    marginTop: -8,
    marginBottom: 8,
    lineHeight: 18,
  },
  buttonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  storageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    marginTop: 16,
    paddingHorizontal: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
