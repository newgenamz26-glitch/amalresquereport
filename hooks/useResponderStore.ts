
import { useState, useEffect } from 'react';
import { AppState, StorageMode, CaseRecord, UserSession, SyncStatus, SessionSummary, UserLog } from '../types';
import { callSheetApi, pingDatabase, fetchFromSheet } from '../services/googleSheetService';

const APP_ID = 'responder-cloud-v20-pro';
const BASE_STORAGE_KEY = `responder_v2_${APP_ID}`;
const LOGS_STORAGE_KEY = `${BASE_STORAGE_KEY}_user_logs`;

export const useResponderStore = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [cloudCasesPreview, setCloudCasesPreview] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' });
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const getUserDataKey = (u: UserSession) => `${BASE_STORAGE_KEY}_data_${u.name.replace(/\s+/g, '_')}_${u.checkpoint.replace(/\s+/g, '_')}`;

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const savedSession = localStorage.getItem(`${BASE_STORAGE_KEY}_session`);
    const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    
    if (savedSession) {
      const parsedUser = JSON.parse(savedSession) as UserSession;
      setUser(parsedUser);
      const userKey = getUserDataKey(parsedUser);
      const savedData = localStorage.getItem(userKey);
      if (savedData) setCases(JSON.parse(savedData));
      setAppState(AppState.DASHBOARD);
      
      if (navigator.onLine) {
        testConnection();
      }
    } else {
      setTimeout(() => setAppState(AppState.LOGIN), 1000);
    }

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const testConnection = async () => {
    const url = localStorage.getItem('responder_sheet_url');
    if (!url) return false;
    
    const start = Date.now();
    const result = await pingDatabase(url);
    const end = Date.now();
    
    setLatency(end - start);
    setIsDbConnected(result);
    
    if (result) {
      fetchCloudPreview();
      fetchAttendanceRecords();
    }
    return result;
  };

  const fetchCloudPreview = async () => {
    const url = localStorage.getItem('responder_sheet_url');
    if (!url || !isOnline) return;
    const response = await fetchFromSheet(url, 'getRecentCases');
    const data = response?.data || response;
    if (data && Array.isArray(data)) {
      setCloudCasesPreview(data);
    }
  };

  const fetchAttendanceRecords = async () => {
    const url = localStorage.getItem('responder_sheet_url');
    if (!url || !isOnline) return;
    const response = await fetchFromSheet(url, 'getAttendance');
    const data = response?.data || response;
    if (data && Array.isArray(data)) {
      setAttendanceRecords(data);
    }
  };

  const login = async (data: { name: string; checkpoint: string; programName: string; isSimulasi: boolean; mode: StorageMode }) => {
    const session: UserSession = {
      uid: Math.random().toString(36).substr(2, 9),
      ...data,
      startTime: Date.now()
    };
    
    setUser(session);
    localStorage.setItem(`${BASE_STORAGE_KEY}_session`, JSON.stringify(session));
    
    const userKey = getUserDataKey(session);
    const savedData = localStorage.getItem(userKey);
    setCases(savedData ? JSON.parse(savedData) : []);
    
    setAppState(AppState.DASHBOARD);
    showNotification(`Tugasan Bermula: ${session.checkpoint}`, "success");
    
    if (isOnline) {
      const sheetUrl = localStorage.getItem('responder_sheet_url');
      if (sheetUrl) {
        await callSheetApi(sheetUrl, 'startSession', { 
          name: session.name, 
          programName: session.programName, 
          checkpoint: session.checkpoint 
        });
        fetchAttendanceRecords();
      }
      testConnection();
    }
  };

  const setStorageMode = (mode: StorageMode) => {
    if (user) {
      const updatedUser = { ...user, mode };
      setUser(updatedUser);
      localStorage.setItem(`${BASE_STORAGE_KEY}_session`, JSON.stringify(updatedUser));
      showNotification(`Storage Mode: ${mode.toUpperCase()}`, "info");
    }
  };

  const clearLocalData = () => {
    if (user) {
      localStorage.removeItem(getUserDataKey(user));
      setCases([]);
      showNotification("Local Data Cleared", "success");
    }
  };

  const logout = () => {
    if (user) {
      const summary: SessionSummary = {
        name: user.name,
        checkpoint: user.checkpoint,
        programName: user.programName,
        casesCount: cases.length,
        startTime: new Date(user.startTime).toLocaleString(),
        endTime: new Date().toLocaleString()
      };
      setLastSummary(summary);
      setAppState(AppState.SUMMARY);
    }
  };

  const confirmLogout = async () => {
    if (user && isOnline) {
      const sheetUrl = localStorage.getItem('responder_sheet_url');
      if (sheetUrl) {
        await callSheetApi(sheetUrl, 'endSession', {
          name: user.name,
          checkpoint: user.checkpoint
        });
        fetchAttendanceRecords();
      }
    }

    localStorage.removeItem(`${BASE_STORAGE_KEY}_session`);
    setUser(null);
    setCases([]);
    setAppState(AppState.LOGIN);
    setLastSummary(null);
  };

  const addCase = async (formData: any): Promise<CaseRecord | null> => {
    if (!user) return null;

    const datePrefix = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7);
    const randomSuffix = Math.floor(1000 + Math.random() * 8999);
    
    const newCase: CaseRecord = {
      id: Date.now().toString(),
      idKes: `RESQ-${datePrefix}-${randomSuffix}`,
      ...formData,
      timestamp: Date.now(),
      checkpoint: user.checkpoint,
      programCP: `${user.programName} / ${user.checkpoint}`,
      recordedBy: user.name,
      isSimulasi: user.isSimulasi,
    };

    const updated = [newCase, ...cases];
    setCases(updated);
    localStorage.setItem(getUserDataKey(user), JSON.stringify(updated));
    
    if (user.mode === StorageMode.CLOUD && isOnline) {
      const sheetUrl = localStorage.getItem('responder_sheet_url');
      if (sheetUrl) {
        const result = await callSheetApi(sheetUrl, 'addCase', newCase);
        if (result.success) {
          showNotification("Berjaya Disimpan ke Cloud", "success");
          setIsDbConnected(true);
          fetchCloudPreview();
        } else {
          showNotification("Disimpan Lokal (Gagal Cloud)", "info");
          setIsDbConnected(false);
        }
      }
    }
    
    return newCase;
  };

  const sync = async () => {
    if (!isOnline || !user) return;
    setSyncStatus({ state: 'syncing' });
    
    const sheetUrl = localStorage.getItem('responder_sheet_url');
    if (!sheetUrl) {
      setSyncStatus({ state: 'error' });
      return;
    }

    try {
      for (const c of cases) {
        await callSheetApi(sheetUrl, 'addCase', c);
      }
      setSyncStatus({ state: 'success', lastSync: Date.now() });
      showNotification("Data Berjaya Disinkronkan");
      setIsDbConnected(true);
      fetchCloudPreview();
    } catch {
      setSyncStatus({ state: 'error' });
    } finally {
      setTimeout(() => setSyncStatus({ state: 'idle' }), 2000);
    }
  };

  return {
    appState, user, isOnline, cases, cloudCasesPreview, attendanceRecords, logs, syncStatus, notification, lastSummary, isDbConnected, latency,
    login, logout, confirmLogout, addCase, sync, testConnection, fetchCloudPreview, fetchAttendanceRecords, setStorageMode, clearLocalData
  };
};
