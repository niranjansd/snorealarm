import {SleepSession, SessionStatistics} from '../models/types';

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTimeRange = (startTime: number, endTime?: number): string => {
  const start = new Date(startTime);
  const startStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (endTime) {
    const end = new Date(endTime);
    const endStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${startStr} - ${endStr}`;
  }

  return startStr;
};

export const calculateStatistics = (session: SleepSession): SessionStatistics => {
  const duration = session.endTime
    ? (session.endTime - session.startTime) / 1000
    : 0;

  const snoringEvents = session.soundEvents.filter(e => e.category === 'snoring');
  const snoringDuration = snoringEvents.reduce((acc, e) => acc + e.duration, 0);
  const snoringPercentage = duration > 0 ? (snoringDuration / duration) * 100 : 0;

  const snoringDecibels = snoringEvents.map(e => e.decibels);
  const averageSnoringDecibels =
    snoringDecibels.length > 0
      ? snoringDecibels.reduce((a, b) => a + b, 0) / snoringDecibels.length
      : 0;
  const maxSnoringDecibels =
    snoringDecibels.length > 0 ? Math.max(...snoringDecibels) : 0;

  return {
    duration,
    snoringDuration,
    snoringPercentage,
    averageSnoringDecibels,
    maxSnoringDecibels,
    eventCount: snoringEvents.length,
  };
};

export const normalizeDecibels = (db: number): number => {
  // Convert decibels (-60 to 0) to 0-1 range
  const minDb = -60;
  const maxDb = 0;
  const clamped = Math.max(minDb, Math.min(maxDb, db));
  return (clamped - minDb) / (maxDb - minDb);
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'snoring':
      return '#FF4444';
    case 'talking':
      return '#FF8C00';
    case 'coughing':
      return '#FFD700';
    case 'movement':
      return '#4A90D9';
    case 'ambient':
      return '#4CAF50';
    default:
      return '#888888';
  }
};

export const getCategoryIcon = (category: string): string => {
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

export const isToday = (timestamp: number): boolean => {
  const today = new Date();
  const date = new Date(timestamp);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isYesterday = (timestamp: number): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = new Date(timestamp);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

export const groupSessionsByDate = (
  sessions: SleepSession[],
): Map<string, SleepSession[]> => {
  const grouped = new Map<string, SleepSession[]>();

  sessions.forEach(session => {
    const date = new Date(session.startTime);
    const key = date.toISOString().split('T')[0];

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(session);
  });

  return grouped;
};
