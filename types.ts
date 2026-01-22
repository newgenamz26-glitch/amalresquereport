
export enum Gender {
  MALE = 'Lelaki',
  FEMALE = 'Perempuan'
}

export enum AppState {
  LOADING = 'loading',
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  SUMMARY = 'summary'
}

export enum StorageMode {
  LOCAL = 'local',
  CLOUD = 'cloud'
}

export interface UserSession {
  uid: string;
  name: string;
  checkpoint: string;
  programName: string;
  isSimulasi: boolean;
  mode: StorageMode;
  startTime: number;
}

export interface UserLog {
  id: string;
  name: string;
  type: 'LOGIN' | 'LOGOUT';
  timestamp: number;
  checkpoint: string;
}

export interface CaseRecord {
  id: string;
  idKes: string; 
  p_name: string;
  p_age: string;
  p_gender: Gender;
  symptoms: string;
  kesedaran: string;
  vitalBP: string;
  vitalPR: string;
  vitalDXT: string;
  vitalTemp: string;
  treatment: string;
  statusAkhir: string;
  timestamp: number;
  checkpoint: string;
  programCP: string;
  recordedBy: string;
  namaPerawat: string;
  masaMula: string;
  masaAkhir: string;
  isSimulasi: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  lastSync?: number;
}

export interface SessionSummary {
  name: string;
  checkpoint: string;
  programName: string;
  casesCount: number;
  startTime: string;
  endTime: string;
}

export interface ProgramData {
  id: string;
  nama: string;
  tarikh: string;
  masa: string;
  lokasi: string;
  status: string; // "Aktif" or "Tamat"
  lastUpdate: string;
  locked: boolean;
}
