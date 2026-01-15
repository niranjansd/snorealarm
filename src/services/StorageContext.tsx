import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SleepSession, AppSettings, DEFAULT_SETTINGS} from '../models/types';

const SESSIONS_KEY = '@snorealarm_sessions';
const SETTINGS_KEY = '@snorealarm_settings';

interface StorageContextType {
  sessions: SleepSession[];
  settings: AppSettings;
  isLoading: boolean;
  saveSession: (session: SleepSession) => Promise<void>;
  updateSession: (session: SleepSession) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  getSession: (sessionId: string) => SleepSession | undefined;
  getRecentSessions: (days: number) => SleepSession[];
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({children}) => {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const [sessionsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(SESSIONS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      if (sessionsData) {
        const parsedSessions = JSON.parse(sessionsData) as SleepSession[];
        // Sort by start time, newest first
        parsedSessions.sort((a, b) => b.startTime - a.startTime);
        setSessions(parsedSessions);
      }

      if (settingsData) {
        setSettings({...DEFAULT_SETTINGS, ...JSON.parse(settingsData)});
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessions = async (newSessions: SleepSession[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  };

  const saveSession = useCallback(
    async (session: SleepSession): Promise<void> => {
      const newSessions = [session, ...sessions];
      await saveSessions(newSessions);
    },
    [sessions],
  );

  const updateSession = useCallback(
    async (updatedSession: SleepSession): Promise<void> => {
      const newSessions = sessions.map(s =>
        s.id === updatedSession.id ? updatedSession : s,
      );
      await saveSessions(newSessions);
    },
    [sessions],
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      const newSessions = sessions.filter(s => s.id !== sessionId);
      await saveSessions(newSessions);
    },
    [sessions],
  );

  const clearAllSessions = useCallback(async (): Promise<void> => {
    await saveSessions([]);
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>): Promise<void> => {
      try {
        const updated = {...settings, ...newSettings};
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        setSettings(updated);
      } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
    },
    [settings],
  );

  const getSession = useCallback(
    (sessionId: string): SleepSession | undefined => {
      return sessions.find(s => s.id === sessionId);
    },
    [sessions],
  );

  const getRecentSessions = useCallback(
    (days: number): SleepSession[] => {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      return sessions.filter(s => s.startTime >= cutoff);
    },
    [sessions],
  );

  const value: StorageContextType = {
    sessions,
    settings,
    isLoading,
    saveSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    updateSettings,
    getSession,
    getRecentSessions,
  };

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
