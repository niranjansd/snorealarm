import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {useStorage} from '../services/StorageContext';
import {SleepSession} from '../models/types';
import {RootStackParamList} from '../navigation/AppNavigator';
import {
  formatDuration,
  formatTimeRange,
  formatDate,
  calculateStatistics,
  isToday,
  isYesterday,
  groupSessionsByDate,
} from '../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {sessions, deleteSession, getRecentSessions} = useStorage();

  const recentSessions = useMemo(() => getRecentSessions(7), [getRecentSessions]);
  const groupedSessions = useMemo(
    () => groupSessionsByDate(sessions),
    [sessions],
  );

  const summaryStats = useMemo(() => {
    const totalSessions = recentSessions.length;
    const totalSleepTime = recentSessions.reduce((acc, s) => {
      const stats = calculateStatistics(s);
      return acc + stats.duration;
    }, 0);
    const avgSnoringPercentage =
      recentSessions.length > 0
        ? recentSessions.reduce((acc, s) => {
            const stats = calculateStatistics(s);
            return acc + stats.snoringPercentage;
          }, 0) / recentSessions.length
        : 0;

    return {totalSessions, totalSleepTime, avgSnoringPercentage};
  }, [recentSessions]);

  const handleSessionPress = (session: SleepSession) => {
    navigation.navigate('Analysis', {session});
  };

  const handleDeleteSession = (session: SleepSession) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ],
    );
  };

  const renderSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Last 7 Days</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Icon name="bed" size={24} color="#007AFF" />
          <Text style={styles.summaryValue}>{summaryStats.totalSessions}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="chart-line" size={24} color="#007AFF" />
          <Text style={styles.summaryValue}>
            {summaryStats.avgSnoringPercentage.toFixed(0)}%
          </Text>
          <Text style={styles.summaryLabel}>Avg Snoring</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="clock" size={24} color="#007AFF" />
          <Text style={styles.summaryValue}>
            {formatDuration(summaryStats.totalSleepTime)}
          </Text>
          <Text style={styles.summaryLabel}>Total Sleep</Text>
        </View>
      </View>
    </View>
  );

  const renderSessionItem = ({item}: {item: SleepSession}) => {
    const stats = calculateStatistics(item);
    const snoringColor = getSnoringColor(stats.snoringPercentage);

    return (
      <TouchableOpacity
        style={styles.sessionItem}
        onPress={() => handleSessionPress(item)}
        onLongPress={() => handleDeleteSession(item)}>
        <View style={[styles.snoringIndicator, {backgroundColor: snoringColor}]}>
          <Icon name="sleep" size={20} color="#fff" />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTime}>{formatTimeRange(item.startTime, item.endTime)}</Text>
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={14} color="#666" />
              <Text style={styles.statText}>{formatDuration(stats.duration)}</Text>
            </View>
            <Text style={styles.statDivider}>•</Text>
            <View style={styles.statItem}>
              <Icon name="chart-bar" size={14} color="#666" />
              <Text style={styles.statText}>
                {stats.snoringPercentage.toFixed(0)}% snoring
              </Text>
            </View>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#CCC" />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (date: string) => {
    const timestamp = new Date(date).getTime();
    let label: string;

    if (isToday(timestamp)) {
      label = 'Today';
    } else if (isYesterday(timestamp)) {
      label = 'Yesterday';
    } else {
      label = formatDate(timestamp);
    }

    return <Text style={styles.sectionHeader}>{label}</Text>;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="moon-waning-crescent" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Recordings Yet</Text>
      <Text style={styles.emptyText}>
        Start your first sleep recording to see your history here.
      </Text>
    </View>
  );

  const sortedDates = Array.from(groupedSessions.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        {renderEmpty()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedDates}
        keyExtractor={item => item}
        ListHeaderComponent={renderSummary}
        renderItem={({item: date}) => (
          <View>
            {renderSectionHeader(date)}
            {groupedSessions.get(date)?.map(session => (
              <View key={session.id}>{renderSessionItem({item: session})}</View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const getSnoringColor = (percentage: number): string => {
  if (percentage < 10) return '#4CAF50';
  if (percentage < 25) return '#FFC107';
  if (percentage < 50) return '#FF9800';
  return '#FF4444';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  snoringIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  statDivider: {
    marginHorizontal: 8,
    color: '#CCC',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
