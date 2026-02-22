import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Switch,
} from 'react-native';
import Slider from '../components/Slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {useStorage} from '../services/StorageContext';
import {S3UploadService} from '../services/S3UploadService';

export const SettingsScreen: React.FC = () => {
  const {settings, updateSettings, clearAllSessions, sessions} = useStorage();
  const [showAbout, setShowAbout] = useState(false);
  const [showS3Config, setShowS3Config] = useState(false);
  const [testingS3, setTestingS3] = useState(false);

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

  const handleTestS3Connection = async () => {
    if (!settings.s3 || !settings.s3.bucket || !settings.s3.accessKeyId) {
      Alert.alert('Missing Configuration', 'Please fill in all S3 settings first.');
      return;
    }

    setTestingS3(true);
    try {
      S3UploadService.configure({
        region: settings.s3.region,
        bucket: settings.s3.bucket,
        accessKeyId: settings.s3.accessKeyId,
        secretAccessKey: settings.s3.secretAccessKey,
        folder: settings.s3.folder,
      });

      const success = await S3UploadService.testConnection();
      if (success) {
        Alert.alert('Success', 'S3 connection test successful!');
      } else {
        Alert.alert('Failed', 'Could not connect to S3. Check your credentials.');
      }
    } catch (error) {
      Alert.alert('Error', `S3 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingS3(false);
    }
  };

  const updateS3Setting = (key: string, value: any) => {
    updateSettings({
      s3: {
        ...settings.s3!,
        [key]: value,
      },
    });
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
        'AWS S3 Upload',
        <>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Icon name="cloud-upload" size={22} color="#007AFF" />
              <Text style={styles.settingTitle}>Enable S3 Upload</Text>
            </View>
            <Switch
              value={settings.s3?.enabled || false}
              onValueChange={value => updateS3Setting('enabled', value)}
            />
          </View>
          {settings.s3?.enabled && (
            <>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setShowS3Config(!showS3Config)}>
                <Text style={styles.expandButtonText}>
                  {showS3Config ? 'Hide' : 'Show'} S3 Configuration
                </Text>
                <Icon
                  name={showS3Config ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#007AFF"
                />
              </TouchableOpacity>
              
              {showS3Config && (
                <View style={styles.s3Config}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Region</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="us-east-1"
                      value={settings.s3?.region || ''}
                      onChangeText={text => updateS3Setting('region', text)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bucket Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="my-snorealarm-bucket"
                      value={settings.s3?.bucket || ''}
                      onChangeText={text => updateS3Setting('bucket', text)}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Access Key ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="AKIA..."
                      value={settings.s3?.accessKeyId || ''}
                      onChangeText={text => updateS3Setting('accessKeyId', text)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Secret Access Key</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={settings.s3?.secretAccessKey || ''}
                      onChangeText={text => updateS3Setting('secretAccessKey', text)}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Folder (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="snorealarm-recordings"
                      value={settings.s3?.folder || ''}
                      onChangeText={text => updateS3Setting('folder', text)}
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.testButton, testingS3 && styles.testButtonDisabled]}
                    onPress={handleTestS3Connection}
                    disabled={testingS3}>
                    <Icon name="connection" size={18} color="#fff" />
                    <Text style={styles.testButtonText}>
                      {testingS3 ? 'Testing...' : 'Test Connection'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.switchRow}>
                <Text style={styles.settingTitle}>Auto-Upload After Recording</Text>
                <Switch
                  value={settings.s3?.autoUpload || false}
                  onValueChange={value => updateS3Setting('autoUpload', value)}
                />
              </View>

              <Text style={styles.settingHint}>
                When enabled, recordings will automatically upload to your S3
                bucket after stopping the recording. Your AWS credentials are
                stored locally and never shared.
              </Text>
            </>
          )}
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  s3Config: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
