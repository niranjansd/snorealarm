import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {v4 as uuidv4} from 'uuid';

import {AudioService} from '../services/AudioService';
import {SoundClassifier, ClassificationResult} from '../services/SoundClassifier';
import {useStorage} from '../services/StorageContext';
import {S3UploadService} from '../services/S3UploadService';
import {SleepSession, SoundEvent, SoundCategory} from '../models/types';
import {formatTime, getCategoryColor, normalizeDecibels} from '../utils/helpers';

export const RecordingScreen: React.FC = () => {
  const {saveSession, updateSession} = useStorage();

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentDecibels, setCurrentDecibels] = useState(-60);
  const [lastDetectedSound, setLastDetectedSound] =
    useState<SoundCategory>('ambient');
  const [batteryLevel] = useState(100); // Would come from native module

  const currentSession = useRef<SleepSession | null>(null);
  const soundEvents = useRef<SoundEvent[]>([]);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Setup audio level listener
    const unsubscribeAudio = AudioService.onAudioLevel(db => {
      setCurrentDecibels(db);
    });

    // Setup sound classification listener
    const unsubscribeClassifier = SoundClassifier.onClassification(result => {
      handleClassification(result);
    });

    return () => {
      unsubscribeAudio();
      unsubscribeClassifier();
      stopRecordingCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handleClassification = useCallback(
    (result: ClassificationResult) => {
      setLastDetectedSound(result.category);

      if (currentSession.current) {
        const event = SoundClassifier.createSoundEvent(
          result,
          currentSession.current.startTime,
        );
        if (event) {
          soundEvents.current.push(event);
        }
      }
    },
    [],
  );

  const startRecording = async () => {
    console.log('[RecordingScreen] startRecording called');
    try {
      const audioPath = await AudioService.startRecording();
      console.log('[RecordingScreen] AudioService.startRecording succeeded:', audioPath);
      await SoundClassifier.startAnalyzing();

      currentSession.current = {
        id: uuidv4(),
        startTime: Date.now(),
        audioFilePath: audioPath,
        tags: [],
        soundEvents: [],
      };
      soundEvents.current = [];

      setIsRecording(true);
      setDuration(0);

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('[RecordingScreen] Recording error:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      stopRecordingCleanup();

      if (currentSession.current) {
        currentSession.current.endTime = Date.now();
        currentSession.current.soundEvents = [...soundEvents.current];

        // Save locally first
        await saveSession(currentSession.current);

        // Always upload to S3
        uploadToS3(currentSession.current);

        currentSession.current = null;
        soundEvents.current = [];
      }

      setIsRecording(false);
      setDuration(0);
      setLastDetectedSound('ambient');
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording.');
      console.error('Stop recording error:', error);
    }
  };

  const uploadToS3 = async (session: SleepSession) => {
    // Don't crash if S3 upload fails - just log it
    try {
      console.log('[RecordingScreen] Starting S3 upload for session:', session.id);

      // Update session status
      const updatedSession = {...session, uploadStatus: 'uploading' as const};
      await updateSession(updatedSession);

      // Upload audio file
      if (session.audioFilePath) {
        const audioUrl = await S3UploadService.uploadAudioFile(
          session.audioFilePath,
          session.id,
          progress => {
            console.log(`[S3Upload] Progress: ${progress.percentage.toFixed(1)}%`);
          },
        );

        // Upload metadata
        const metadataUrl = await S3UploadService.uploadSessionMetadata(
          session.id,
          {
            sessionId: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.endTime
              ? (session.endTime - session.startTime) / 1000
              : 0,
            soundEvents: session.soundEvents,
            tags: session.tags,
          },
        );

        // Update session with S3 URLs
        const finalSession = {
          ...updatedSession,
          s3Url: audioUrl,
          s3MetadataUrl: metadataUrl,
          uploadStatus: 'success' as const,
        };
        await updateSession(finalSession);

        console.log('[RecordingScreen] S3 upload complete:', audioUrl);
      }
    } catch (error) {
      console.error('[RecordingScreen] S3 upload failed:', error);
      const failedSession = {
        ...session,
        uploadStatus: 'failed' as const,
        uploadError: error instanceof Error ? error.message : 'Unknown error',
      };
      await updateSession(failedSession);
    }
  };

  const stopRecordingCleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    AudioService.stopRecording();
    SoundClassifier.stopAnalyzing();
  };

  const toggleRecording = () => {
    console.log('[RecordingScreen] toggleRecording called, isRecording:', isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const normalizedLevel = normalizeDecibels(currentDecibels);
  const levelColor = getCategoryColor(lastDetectedSound);

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            {backgroundColor: isRecording ? '#FF4444' : '#888'},
          ]}
        />
        <Text style={[styles.statusText, {opacity: isRecording ? 1 : 0.5}]}>
          {isRecording ? 'Recording' : 'Ready to Record'}
        </Text>
      </View>

      {/* Duration display */}
      <Text style={[styles.duration, {opacity: isRecording ? 1 : 0.5}]}>
        {formatTime(duration)}
      </Text>

      {/* Sound level meter */}
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <View
            style={[
              styles.meterFill,
              {
                width: `${normalizedLevel * 100}%`,
                backgroundColor: levelColor,
              },
            ]}
          />
        </View>
        <Text style={styles.decibelText}>{currentDecibels.toFixed(0)} dB</Text>
      </View>

      {/* Detected sound indicator */}
      <View style={[styles.detectedContainer, {opacity: isRecording ? 1 : 0.5}]}>
        <Icon
          name={getIconForCategory(lastDetectedSound)}
          size={20}
          color={levelColor}
        />
        <Text style={styles.detectedText}>
          {getLabelForCategory(lastDetectedSound)}
        </Text>
      </View>

      {/* Record button */}
      <TouchableOpacity
        style={styles.recordButtonContainer}
        onPress={toggleRecording}
        activeOpacity={0.8}>
        <View style={styles.recordButtonOuter}>
          <Animated.View
            style={[
              styles.recordButtonInner,
              {
                transform: [{scale: isRecording ? pulseAnim : 1}],
                backgroundColor: isRecording ? '#FF4444' : '#FF6B6B',
                borderRadius: isRecording ? 8 : 40,
                width: isRecording ? 30 : 60,
                height: isRecording ? 30 : 60,
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Battery indicator */}
      <View style={styles.batteryContainer}>
        <Icon
          name={getBatteryIcon(batteryLevel)}
          size={20}
          color={batteryLevel < 20 ? '#FF4444' : '#4CAF50'}
        />
        <Text style={styles.batteryText}>{batteryLevel}%</Text>
      </View>
    </View>
  );
};

const getIconForCategory = (category: SoundCategory): string => {
  switch (category) {
    case 'snoring':
      return 'sleep';
    case 'talking':
      return 'waveform';
    case 'coughing':
      return 'medical-bag';
    case 'movement':
      return 'walk';
    case 'ambient':
      return 'volume-low';
    default:
      return 'help-circle';
  }
};

const getLabelForCategory = (category: SoundCategory): string => {
  switch (category) {
    case 'snoring':
      return 'Snoring Detected';
    case 'talking':
      return 'Talking Detected';
    case 'coughing':
      return 'Coughing Detected';
    case 'movement':
      return 'Movement Detected';
    case 'ambient':
      return 'Ambient Sound';
    default:
      return 'Unknown Sound';
  }
};

const getBatteryIcon = (level: number): string => {
  if (level < 25) return 'battery-20';
  if (level < 50) return 'battery-50';
  if (level < 75) return 'battery-70';
  return 'battery';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  duration: {
    fontSize: 64,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    color: '#333',
    marginBottom: 40,
  },
  meterContainer: {
    width: '80%',
    marginBottom: 20,
  },
  meterBackground: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 10,
  },
  decibelText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  detectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 60,
  },
  detectedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  recordButtonContainer: {
    marginBottom: 40,
  },
  recordButtonOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
});
