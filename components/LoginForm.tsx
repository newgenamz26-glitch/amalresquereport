
import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, Zap, Shield, Settings, Globe, Navigation, 
  RefreshCw, X, Code, Copy, Loader2, ChevronDown, 
  Wifi, WifiOff, Sparkles, Database, User, MapPin, 
  Briefcase, Edit3, Search, Map
} from 'lucide-react';
import { StorageMode, ProgramData } from '../types';
import { fetchFromSheet } from '../services/googleSheetService';
import { pingGemini } from '../services/geminiService';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzJEUmkNIkmFGiBQiBrtpEVEn3ZZIFsM0ynVUrBbqkfOIA3Oh1mFa5qwoQGAubkaoju1g/exec';

const DEFAULT_PROGRAMS: ProgramData[] = [
  { id: '1', nama: 'Program Latihan ResQ Amal', tarikh: '2024-12-01', masa: '08:00', lokasi: 'Taman Tasik Titiwangsa', status: 'Aktif', lastUpdate: new Date().toISOString(), locked: false },
  { id: '2', nama: 'Misi Bantuan Banjir Pantai Timur', tarikh: '2024-12-15', masa: '07:30', lokasi: 'Kelantan/Terengganu', status: 'Aktif', lastUpdate: new Date().toISOString(), locked: false },
];

interface LoginFormProps {
  onLogin: (data: { name: string; checkpoint: string; programName: string; isSimulasi: boolean; mode: StorageMode }) => void;
  isOnline: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isOnline }) => {
  const [loginData, setLoginData] = useState({ 
    name: '', 
    checkpoint: '', 
    programName: '', 
    isSimulasi: true, 
    mode: StorageMode.LOCAL 
  });

  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('responder_sheet_url') || DEFAULT_API_URL);
  const [programs, setPrograms] = useState<ProgramData[]>(DEFAULT_PROGRAMS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [dbPingStatus, setDbPingStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'checking' | 'active' | 'inactive'>('idle');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'active' | 'denied' | 'error'>('idle');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOnline) {
      handleLoadPrograms();
      checkGeminiAvailability();
      testDatabase();
    }
    checkGPS();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOnline]);

  const checkGPS = () => {
    setGpsStatus('checking');
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus('active'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGpsStatus('denied');
        else setGpsStatus('error');
      },
      { timeout: 5000 }
    );
  };

  const checkGeminiAvailability = async () => {
    setGeminiStatus('checking');
    const result = await pingGemini();
    setGeminiStatus(result ? 'active' : 'inactive');
  };

  const handleLoadPrograms = async () => {
    if (!isOnline) return;
    setIsLoadingPrograms(true);
    try {
      const response = await fetchFromSheet(sheetUrl, 'getPrograms');
      const data = response?.data || (Array.isArray(response) ? response : null);
      if (data && Array.isArray(data)) {
        const mapped = data.map((item: any) => ({
          id: item['ID Program'] || 'N/A',
          nama: item['Nama Program'] || 'Unknown',
          tarikh: item['Tarikh Program'] || 'N/A',
          lokasi: item['Lokasi Program'] || '',
          status: item['Status'] || 'Aktif',
          masa: '08:00 AM', 
          lastUpdate: 'Live',
          locked: (item['Status'] || 'Aktif').toLowerCase() !== 'aktif'
        }));
        setPrograms(mapped);
      }
    } catch (err) {
      console.error("Fetch programs failed:", err);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const testDatabase = async () => {
    if (!isOnline) return;
    setDbPingStatus('testing');
    try {
      const response = await fetchFromSheet(sheetUrl, 'ping');
      const isOk = response?.data?.message === 'pong' || response?.message === 'pong';
      setDbPingStatus(isOk ? 'ok' : 'fail');
    } catch {
      setDbPingStatus('fail');
    }
  };

  const handleAutoFillLogin = () => {
    const samples = [
      { name: 'Ahmad Faiz', checkpoint: 'CP Utama (Entry)', programName: 'Program Latihan ResQ Amal', isSimulasi: true, mode: StorageMode.LOCAL },
      { name: 'Siti Sarah', checkpoint: 'Sektor B (Padang)', programName: 'Misi Bantuan Banjir Pantai Timur', isSimulasi: true, mode: StorageMode.LOCAL },
      { name: 'Responder Admin', checkpoint: 'Pusat Kawalan Medikal', programName: 'Protokol Kecemasan 2025', isSimulasi: false, mode: StorageMode.CLOUD }
    ];
    const random = samples[Math.floor(Math.random() * samples.length)];
    setLoginData(random);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.name || !loginData.checkpoint || !loginData.programName) {
      alert("Sila isi semua maklumat mandatori.");
      return;
    }
    onLogin(loginData);
  };

  const activePrograms = programs.filter(p => !p.locked);
  const filteredPrograms = activePrograms.filter(p => 
    p.nama.toLowerCase().includes(loginData.programName.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* FLOATING AUTO-HIDE SIDE NAV (TOP-LEFT) - COMPACT VERSION */}
      <nav className="fixed top-6 left-6 z-[100] flex flex-col gap-1.5 group">
        
        {/* Network Status Item */}
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-default ${isOnline ? 'border-emerald-100' : 'border-rose-100'}`}>
          <div className="shrink-0">
            {isOnline ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-rose-500" />}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* GPS Status Item */}
        <div 
          onClick={checkGPS}
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-pointer active:scale-95 ${gpsStatus === 'active' ? 'border-emerald-100' : gpsStatus === 'denied' ? 'border-rose-100' : 'border-amber-100'}`}
        >
          <div className="shrink-0">
            <Navigation size={16} className={gpsStatus === 'active' ? 'text-emerald-500' : gpsStatus === 'denied' ? 'text-rose-500' : 'text-amber-500'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${gpsStatus === 'active' ? 'text-emerald-600' : gpsStatus === 'denied' ? 'text-rose-600' : 'text-amber-600'}`}>
            GP: {gpsStatus === 'active' ? 'Active' : gpsStatus === 'checking' ? 'Ping...' : (gpsStatus === 'denied' ? 'Blocked' : 'Error')}
          </span>
        </div>

        {/* Database Status Item */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-default">
          <div className="shrink-0">
            <Database size={16} className={dbPingStatus === 'ok' ? 'text-blue-500' : 'text-slate-300'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${dbPingStatus === 'ok' ? 'text-blue-600' : 'text-slate-400'}`}>
            DB: {dbPingStatus === 'ok' ? 'Linked' : (dbPingStatus === 'testing' ? 'Ping...' : 'Offline')}
          </span>
        </div>

        {/* AI Status Item */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-default">
          <div className="shrink-0">
            <Sparkles size={16} className={geminiStatus === 'active' ? 'text-blue-500' : 'text-slate-300'} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${geminiStatus === 'active' ? 'text-blue-600' : 'text-slate-400'}`}>
            AI: {geminiStatus === 'active' ? 'Active' : 'Pending'}
          </span>
        </div>

        {/* Settings Action Item */}
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden hover:bg-slate-50 active:scale-90"
        >
          <div className="shrink-0">
            <Settings size={16} className="text-slate-400" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 text-slate-500">
            Tetapan
          </span>
        </button>
      </nav>

      {/* MAIN LOGIN FORM */}
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 relative z-10 overflow-hidden">
        {/* Floating Auto-Fill Action */}
        <button 
          type="button"
          onClick={handleAutoFillLogin}
          className="absolute top-8 right-8 p-3 bg-amber-100 text-amber-600 rounded-2xl hover:bg-amber-500 hover:text-white transition-all active:scale-90 shadow-lg shadow-amber-200/50 group z-20"
          title="Auto-Fill Login Data"
        >
          <Zap size={20} className="group-hover:animate-pulse" />
        </button>

        <div className="p-10">
          
          {/* Branding Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-5 shadow-2xl shadow-blue-100 -rotate-3 transition-transform hover:rotate-0">
              <Shield size={36} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Responder <span className="text-blue-600 italic">ResQ</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 opacity-70">
              Sistem Operasi Kecemasan
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
               {/* Mode Selection */}
               <div className="flex bg-slate-100 p-1.5 rounded-2xl relative">
                <button type="button" onClick={() => setLoginData({...loginData, isSimulasi: true, mode: StorageMode.LOCAL})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${loginData.isSimulasi ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}><Zap size={12}/> Simulasi</button>
                <button type="button" onClick={() => setLoginData({...loginData, isSimulasi: false, mode: StorageMode.CLOUD})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${!loginData.isSimulasi ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><Shield size={12}/> Live Mode</button>
              </div>

              {/* Responder Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nama Petugas</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
                  <input required placeholder="Nama penuh anda" value={loginData.name} onChange={e => setLoginData({...loginData, name: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none focus:ring-4 ring-blue-500/10 transition-all" />
                </div>
              </div>

              {/* Program Name with Manual Entry Support */}
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <div className="flex justify-between items-center ml-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Program</label>
                  {loginData.mode === StorageMode.LOCAL && (
                    <span className="text-[7px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                      <Edit3 size={8}/> Manual Entry
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
                  <input 
                    required 
                    autoComplete="off"
                    placeholder={loginData.mode === StorageMode.LOCAL ? "Taip nama program..." : "Cari nama program cloud..."}
                    value={loginData.programName} 
                    onFocus={() => setShowDropdown(true)}
                    onChange={e => {
                      setLoginData({...loginData, programName: e.target.value});
                      setShowDropdown(true);
                    }} 
                    className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none focus:ring-4 ring-blue-500/10 transition-all" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoadingPrograms && <Loader2 className="animate-spin text-blue-500" size={14}/>}
                    <ChevronDown className={`text-slate-300 transition-transform ${showDropdown ? 'rotate-180' : ''}`} size={18} />
                  </div>
                </div>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-3xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredPrograms.length > 0 ? (
                        filteredPrograms.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setLoginData({
                                ...loginData, 
                                programName: p.nama, 
                                checkpoint: p.lokasi || '' 
                              });
                              setShowDropdown(false);
                            }}
                            className="w-full p-4 text-left hover:bg-blue-50 rounded-2xl transition-colors flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate">{p.nama}</h4>
                              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.lokasi || 'Umum'}</p>
                            </div>
                            <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 ml-2 shrink-0">
                               <span className="text-[6px] font-black uppercase">Cloud</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tiada program cloud ditemui</p>
                          {loginData.mode === StorageMode.LOCAL && loginData.programName && (
                            <button 
                              type="button" 
                              onClick={() => setShowDropdown(false)}
                              className="mt-3 w-full py-2 bg-amber-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest"
                            >
                              Gunakan "{loginData.programName}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkpoint */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Lokasi Checkpoint</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
                  <input 
                    required 
                    placeholder="Contoh: CP Utama / Sektor 1" 
                    value={loginData.checkpoint} 
                    onChange={e => setLoginData({...loginData, checkpoint: e.target.value})} 
                    className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none focus:ring-4 ring-blue-500/10 transition-all" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loginData.isSimulasi ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
            >
              Mula Bertugas <Navigation size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Settings Modal (Webhook Config) */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-4xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Tetapan Pangkalan Data</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-900"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Google Apps Script</label>
                <input 
                  value={sheetUrl} 
                  onChange={e => setSheetUrl(e.target.value)} 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs border border-slate-100 outline-none" 
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
              <button 
                onClick={() => {
                  localStorage.setItem('responder_sheet_url', sheetUrl);
                  setShowSettings(false);
                  handleLoadPrograms();
                  testDatabase();
                }}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Simpan Tetapan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
