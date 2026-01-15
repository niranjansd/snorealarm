import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {LineChart} from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList} from '../navigation/AppNavigator';
import {SoundEvent} from '../models/types';
import {
  formatDuration,
  formatTimeRange,
  calculateStatistics,
  getCategoryColor,
} from '../utils/helpers';

type AnalysisRouteProp = RouteProp<RootStackParamList, 'Analysis'>;

const screenWidth = Dimensions.get('window').width;

export const AnalysisScreen: React.FC = () => {
  const route = useRoute<AnalysisRouteProp>();
  const {session} = route.params;
  const [selectedEvent, setSelectedEvent] = useState<SoundEvent | null>(null);

  const stats = useMemo(() => calculateStatistics(session), [session]);

  const chartData = useMemo(() => {
    // Create timeline data for the chart
    const events = session.soundEvents;
    if (events.length === 0) {
      return {
        labels: ['0m'],
        datasets: [{data: [0]}],
      };
    }

    // Group events into time buckets
    const bucketSize = Math.max(1, Math.floor(stats.duration / 12)); // ~12 data points
    const buckets: number[] = [];
    const labels: string[] = [];

    for (let i = 0; i <= stats.duration; i += bucketSize) {
      const bucketEvents = events.filter(e => {
        const offset = (e.timestamp - session.startTime) / 1000;
        return offset >= i && offset < i + bucketSize;
      });

      const avgDb =
        bucketEvents.length > 0
          ? bucketEvents.reduce((acc, e) => acc + e.decibels, 0) /
            bucketEvents.length
          : -60;

      buckets.push(Math.abs(avgDb));

      const hours = Math.floor(i / 3600);
      const mins = Math.floor((i % 3600) / 60);
      labels.push(hours > 0 ? `${hours}h` : `${mins}m`);
    }

    return {
      labels: labels.slice(0, 12),
      datasets: [{data: buckets.slice(0, 12)}],
    };
  }, [session, stats]);

  const renderStatCard = (
    title: string,
    value: string,
    icon: string,
    color: string,
  ) => (
    <View style={styles.statCard}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderEventItem = (event: SoundEvent) => {
    const offset = (event.timestamp - session.startTime) / 1000;
    const offsetStr = formatDuration(offset);
    const color = getCategoryColor(event.category);

    return (
      <TouchableOpacity
        key={event.id}
        style={[
          styles.eventItem,
          selectedEvent?.id === event.id && styles.eventItemSelected,
        ]}
        onPress={() => setSelectedEvent(event)}>
        <Icon
          name={getIconForCategory(event.category)}
          size={18}
          color={color}
        />
        <Text style={styles.eventTime}>{offsetStr}</Text>
        <Text style={styles.eventCategory}>
          {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
        </Text>
        <Text style={styles.eventDecibels}>{event.decibels.toFixed(0)} dB</Text>
        <Icon name="play" size={16} color="#007AFF" />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Statistics</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Sleep Duration',
            formatDuration(stats.duration),
            'bed',
            '#007AFF',
          )}
          {renderStatCard(
            'Snoring Duration',
            formatDuration(stats.snoringDuration),
            'sleep',
            '#FF4444',
          )}
          {renderStatCard(
            'Snoring Rate',
            `${stats.snoringPercentage.toFixed(1)}%`,
            'percent',
            '#FF9800',
          )}
          {renderStatCard(
            'Avg Loudness',
            `${stats.averageSnoringDecibels.toFixed(0)} dB`,
            'volume-medium',
            '#9C27B0',
          )}
          {renderStatCard(
            'Max Loudness',
            `${stats.maxSnoringDecibels.toFixed(0)} dB`,
            'volume-high',
            '#E91E63',
          )}
          {renderStatCard(
            'Events',
            `${stats.eventCount}`,
            'format-list-bulleted',
            '#4CAF50',
          )}
        </View>
      </View>

      {/* Timeline Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Timeline</Text>
        <Text style={styles.timeRange}>
          {formatTimeRange(session.startTime, session.endTime)}
        </Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
              style: {
                borderRadius: 12,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#FF4444',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#FF4444'}]} />
            <Text style={styles.legendText}>Snoring</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#FF9800'}]} />
            <Text style={styles.legendText}>Talking</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#888'}]} />
            <Text style={styles.legendText}>Other</Text>
          </View>
        </View>
      </View>

      {/* Event List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sound Events</Text>
          <Text style={styles.eventCount}>{session.soundEvents.length} total</Text>
        </View>
        <View style={styles.eventList}>
          {session.soundEvents.slice(0, 20).map(renderEventItem)}
          {session.soundEvents.length > 20 && (
            <Text style={styles.moreEvents}>
              + {session.soundEvents.length - 20} more events
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const getIconForCategory = (category: string): string => {
  switch (category) {
    case 'snoring':
      return 'sleep';
    case 'talking':
      return 'waveform';
    case 'coughing':
      return 'medical-bag';
    default:
      return 'volume-medium';
  }
};

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeRange: {
    fontSize: 13,
    color: '#666',
    marginTop: -8,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  eventCount: {
    fontSize: 13,
    color: '#666',
  },
  eventList: {
    marginTop: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 6,
  },
  eventItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  eventTime: {
    fontSize: 13,
    color: '#666',
    width: 60,
    marginLeft: 8,
  },
  eventCategory: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  eventDecibels: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  moreEvents: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    paddingVertical: 12,
  },
});
