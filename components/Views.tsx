
import React, { useMemo, useState, useEffect } from 'react';
import { Activity, TrendingUp, MapPin, ChevronRight, Search, PlusCircle, History, Phone, AlertTriangle, ShieldCheck, Navigation, Hospital, LogIn, LogOut, Clock, CheckCircle2, ClipboardCheck, Calendar, UserCheck, Stethoscope, Map as MapIcon, ExternalLink, Zap, Info, ChevronDown, ChevronUp, Database, RefreshCw, Globe, Server, Check, Shield, Cloud, List, AlertCircle, HardDrive, Code, Loader2, UserPlus, Fingerprint, Sparkles, Link as LinkIcon, Copy, Trash2, DownloadCloud, ToggleLeft, ToggleRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CaseRecord, Gender, UserLog, SessionSummary, SyncStatus, UserSession, StorageMode } from '../types';

export const DashboardView = ({ cases, user, onSelect, onGoToHistory, onLogCase, referralData, onShowReferrals }: any) => {
  const chartData = useMemo(() => {
    const groups: {[key: string]: number} = {};
    [...cases].reverse().forEach(c => {
      const time = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      groups[time] = (groups[time] || 0) + 1;
    });
    return Object.entries(groups).map(([time, count]) => ({ time, count }));
  }, [cases]);

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className={`p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group ${user?.isSimulasi ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
            <ShieldCheck size={10} className="text-emerald-400"/>
            <p className="text-[7px] font-black uppercase tracking-[0.2em]">Live Telemetry @ {user?.checkpoint}</p>
          </div>
          <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em]">KES REKOD AKTIF</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-black italic tracking-tighter leading-none">{cases.length}</h2>
          </div>
        </div>
        <div className="absolute right-4 bottom-4 w-32 h-20 opacity-40">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={chartData}>
               <Area type="monotone" dataKey="count" stroke="#fff" fill="rgba(255,255,255,0.2)" strokeWidth={2} />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>

      {referralData && (
        <button 
          onClick={onShowReferrals}
          className="w-full bg-white rounded-[2rem] border border-slate-100 p-6 flex items-center justify-between group shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Hospital size={20} />
            </div>
            <div className="text-left">
              <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-tight">Rujukan Perubatan</h5>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Lihat {referralData.links.length} fasiliti berdekatan</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-200 group-hover:text-emerald-500 transition-all" />
        </button>
      )}

      <button 
        onClick={onLogCase}
        className={`w-full p-6 rounded-[2.5rem] flex items-center justify-center gap-4 text-white shadow-2xl transition-all active:scale-95 group relative overflow-hidden ring-8 ${user?.isSimulasi ? 'bg-amber-600 shadow-amber-300 ring-amber-500/10' : 'bg-blue-600 shadow-blue-300 ring-blue-500/10'}`}
      >
        <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
        <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform relative z-10">
          <PlusCircle size={32} strokeWidth={3} />
        </div>
        <div className="text-left relative z-10">
          <h4 className="font-black uppercase text-xl tracking-tighter leading-tight">Daftar Kes Baru</h4>
          <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Mula Rekod Perubatan</p>
        </div>
      </button>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: History, label: 'Sejarah', action: onGoToHistory, color: 'text-slate-400' },
          { icon: Phone, label: 'Hubungi', action: () => alert("Dialing 999..."), color: 'text-slate-400' },
          { icon: AlertTriangle, label: 'ALPHA', action: () => alert("Emergency Protocol Alpha Activated"), color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((btn, idx) => (
          <button key={idx} onClick={btn.action} className={`${btn.bg || 'bg-white'} p-4 rounded-[1.5rem] border border-slate-100 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all`}>
            <btn.icon size={18} className={btn.color} />
            <span className={`text-[8px] font-black uppercase tracking-widest text-center ${btn.color}`}>{btn.label}</span>
          </button>
        ))}
      </div>
      
      {cases[0] && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <h5 className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Rekod Terakhir</h5>
            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">{new Date(cases[0].timestamp).toLocaleDateString()}</span>
          </div>
          <div 
            onClick={() => onSelect(cases[0])} 
            className={`bg-white p-4 rounded-3xl border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center gap-4 ${cases[0].isSimulasi ? 'border-amber-500' : 'border-blue-600'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cases[0].p_gender === Gender.MALE ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
              <Activity size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-slate-900 text-sm uppercase truncate leading-none">{cases[0].p_name}</h4>
                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${cases[0].statusAkhir === 'Dirujuk Hospital' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                  {cases[0].statusAkhir}
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{cases[0].idKes} • {new Date(cases[0].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
            <ChevronRight size={18} className="text-slate-200 shrink-0"/>
          </div>
        </div>
      )}
    </div>
  );
};

export const HistoryView = ({ cases, onSelect }: { cases: CaseRecord[], onSelect: (c: CaseRecord) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCases = useMemo(() => {
    return cases.filter(c => 
      c.p_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idKes.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cases, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-black uppercase italic text-lg tracking-tighter text-slate-900">Rekod Sejarah</h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cases.length} Kes</span>
      </div>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/>
        <input 
          placeholder="Cari nama atau ID Kes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pl-12 bg-white rounded-2xl font-bold text-sm border border-slate-100 outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-sm"
        />
      </div>
      <div className="space-y-3">
        {filteredCases.map((c) => (
          <div key={c.id} onClick={() => onSelect(c)} className={`bg-white p-5 rounded-3xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 ${c.isSimulasi ? 'border-amber-500' : 'border-blue-600'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.p_gender === Gender.MALE ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
              <Activity size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-slate-900 text-sm uppercase truncate leading-none">{c.p_name}</h4>
                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${c.statusAkhir === 'Dirujuk Hospital' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                  {c.statusAkhir}
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{c.idKes} • {new Date(c.timestamp).toLocaleDateString()} {new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
            <ChevronRight size={18} className="text-slate-200 shrink-0"/>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DatabaseSettingsView = ({ 
  syncStatus, 
  isDbConnected, 
  onTest, 
  onSync, 
  cloudCasesPreview, 
  attendanceRecords, 
  latency, 
  user,
  setStorageMode,
  clearLocalData,
  cases
}: any) => {
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTest();
    setTesting(false);
  };

  const copyLinkedId = () => {
    const url = localStorage.getItem('responder_sheet_url');
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadLocalBackup = () => {
    const dataStr = JSON.stringify(cases, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ResQ_Backup_${user?.name}_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearData = () => {
    if (window.confirm("Padam semua rekod lokal pada peranti ini? Pastikan data telah disinkronkan ke Cloud terlebih dahulu.")) {
      clearLocalData();
    }
  };

  const currentAttendance = useMemo(() => {
    if (!attendanceRecords || !user) return null;
    return attendanceRecords.find((r: any) => 
      ((r['Nama'] || r['nama']) === user.name) && 
      ((r['Checkpoint'] || r['checkpoint']) === user.checkpoint) &&
      ((r['Status'] || r['status']) === 'Bertugas')
    );
  }, [attendanceRecords, user]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Server size={20}/></div>
          <div>
            <h3 className="font-black uppercase italic text-lg tracking-tighter text-slate-900 leading-none">Pusat Kawalan Data</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sistem Semakan & Diagnostic Cloud</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase ${isDbConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
          {isDbConnected ? 'Cloud Online' : 'Offline'}
        </div>
      </div>

      {/* Storage Mode Toggle */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${user?.mode === StorageMode.CLOUD ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
             {user?.mode === StorageMode.CLOUD ? <Cloud size={20}/> : <HardDrive size={20}/>}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Mod Penyimpanan</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase">{user?.mode === StorageMode.CLOUD ? 'Cloud First (MeccaMal)' : 'Local First (Peranti)'}</p>
          </div>
        </div>
        <button 
          onClick={() => setStorageMode(user?.mode === StorageMode.CLOUD ? StorageMode.LOCAL : StorageMode.CLOUD)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95 ${user?.mode === StorageMode.CLOUD ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-white border-slate-800'}`}
        >
          {user?.mode === StorageMode.CLOUD ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
          <span className="text-[9px] font-black uppercase">Tukar Mod</span>
        </button>
      </div>

      {/* Local Storage Console */}
      <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive size={20} className="text-slate-400" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Local Storage Console</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <button onClick={downloadLocalBackup} className="p-4 bg-white border border-slate-200 rounded-3xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all">
             <DownloadCloud size={18} className="text-blue-500"/>
             <span className="text-[8px] font-black uppercase text-slate-500">Backup JSON</span>
           </button>
           <button onClick={handleClearData} className="p-4 bg-white border border-slate-200 rounded-3xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all">
             <Trash2 size={18} className="text-rose-500"/>
             <span className="text-[8px] font-black uppercase text-slate-500">Padam Lokal</span>
           </button>
        </div>
        <div className="p-4 bg-white/50 rounded-2xl border border-slate-200 text-center">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Jumlah Rekod Tersimpan Lokal</p>
          <p className="text-2xl font-black text-slate-900 italic">{cases.length} Kes</p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><LinkIcon size={120} /></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 mb-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
            <Sparkles size={10} className="text-blue-400"/>
            <p className="text-[7px] font-black uppercase tracking-[0.2em]">Inter-Project Linking Hub</p>
          </div>
          <h4 className="text-sm font-black uppercase tracking-tight">Hubungkan Projek Lain</h4>
          <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
            Untuk menghubungkan projek ini dengan sistem dalam projek AI Studio anda yang lain, salin pautan pangkalan data di bawah dan tampal ke dalam tetapan projek sasaran.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={copyLinkedId}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Copy size={14} className={copied ? 'text-emerald-400' : 'text-blue-400'} />
              <span className="text-[9px] font-black uppercase tracking-widest">{copied ? 'Tersalin!' : 'Salin Database Link'}</span>
            </button>
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              className="p-3 bg-white/10 rounded-xl border border-white/10"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-[2.5rem] border overflow-hidden shadow-xl transition-all ${user?.isSimulasi ? 'border-amber-200' : 'border-slate-100'}`}>
        <div className={`p-6 border-b flex items-center justify-between ${user?.isSimulasi ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${user?.isSimulasi ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
              <Fingerprint size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Semakan Kehadiran (Attendance)</h5>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sistem Log Masuk & Keluar</p>
            </div>
          </div>
          {user?.isSimulasi && <span className="px-3 py-1 bg-amber-500 text-white text-[7px] font-black uppercase rounded-full">Mod Simulasi</span>}
        </div>
        <div className="p-6 space-y-4">
          {currentAttendance ? (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <div>
                  <p className="text-[9px] font-black text-emerald-900 uppercase leading-none mb-1">Kehadiran Disahkan</p>
                  <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest">Berjaya direkod di Google Sheet</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-emerald-900 leading-none mb-1">{currentAttendance['Masa Masuk'] || 'N/A'}</p>
                <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest">Status: BERTUGAS</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-slate-400" />
                <div><p className="text-[9px] font-black text-slate-900 uppercase leading-none mb-1">Rekod Tidak Dijumpai</p><p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Belum direkod / Sesi Tamat</p></div>
              </div>
              <button onClick={handleTest} className="p-2 bg-white border border-slate-200 rounded-lg"><RefreshCw size={12}/></button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center"><p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Masa Masuk</p><p className="text-[10px] font-black text-slate-900 uppercase">{new Date(user?.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center"><p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Status Bertugas</p><p className={`text-[10px] font-black uppercase ${currentAttendance ? 'text-emerald-600' : 'text-amber-600'}`}>{currentAttendance ? 'AKTIF' : 'PENDING'}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={10} className="text-blue-500"/> Capaian API</p>
          <h4 className={`text-xl font-black italic tracking-tighter uppercase ${isDbConnected ? 'text-blue-600' : 'text-slate-300'}`}>{latency ? `${latency}ms` : '---'}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><RefreshCw size={10} className="text-emerald-500"/> SINKRONISASI</p>
          <h4 className="text-xl font-black italic tracking-tighter uppercase text-slate-900">{syncStatus.state === 'idle' ? 'SEDIA' : syncStatus.state.toUpperCase()}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 relative">
          <div className="absolute top-8 right-8 text-blue-100"><Database size={48} /></div>
          <div className="relative z-10">
            <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Diagnostic Pangkalan Data</h5>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDbConnected ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-100 text-slate-300'}`}><Shield size={28} /></div>
              <div><h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">MeccaMal Cloud</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{localStorage.getItem('responder_sheet_url') ? 'Webhook Aktif' : 'Tiada Webhook'}</p></div>
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><List size={12} className="text-blue-500" /> Rekod Awan Live</h5>
            <button onClick={handleTest} disabled={testing} className="p-2 text-blue-600"><RefreshCw size={14} className={testing ? 'animate-spin' : ''} /></button>
          </div>
          <div className="space-y-2">
            {cloudCasesPreview && cloudCasesPreview.length > 0 ? cloudCasesPreview.map((c: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={16}/></div>
                  <div><p className="text-[9px] font-black text-slate-900 uppercase leading-none mb-1">{c['ID Kes'] || c.idKes}</p><p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px]">{c['Nama Pesakit'] || c.p_name}</p></div>
                </div>
                <div className="text-right"><p className="text-[8px] font-black text-slate-900 uppercase leading-none mb-1">{c['Masa'] || 'Live'}</p><div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[6px] font-black uppercase inline-block">Cloud Verified</div></div>
              </div>
            )) : <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl opacity-40"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tiada data awan</p></div>}
          </div>
        </div>
        <div className="p-8 space-y-4">
           <button onClick={onSync} disabled={syncStatus.state === 'syncing' || !isDbConnected} className="w-full p-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
             <RefreshCw size={20} className={syncStatus.state === 'syncing' ? 'animate-spin' : ''} /> {syncStatus.state === 'syncing' ? 'SEDANG MENYINKRON...' : 'SINKRONKAN SEMUA REKOD'}
           </button>
           <div className="flex gap-3">
             <a href={localStorage.getItem('responder_sheet_url')?.replace('/exec', '') || '#'} target="_blank" className="flex-1 p-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] flex items-center justify-center gap-2"><ExternalLink size={16}/> Buka Google Sheet</a>
             <button onClick={() => {}} className="p-5 bg-white border border-slate-200 text-slate-500 rounded-[1.8rem]"><Code size={16}/></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export const LogRecordsView = ({ logs }: { logs: UserLog[] }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2"><h3 className="font-black uppercase italic text-lg tracking-tighter text-slate-900">Log Aktiviti</h3><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{logs.length} Log</span></div>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${log.type === 'LOGIN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.type === 'LOGIN' ? <LogIn size={16}/> : <LogOut size={16}/>}</div>
              <div><p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{log.type} - {log.checkpoint}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.name}</p></div>
            </div>
            <div className="text-right"><p className="text-[9px] font-black text-slate-900">{new Date(log.timestamp).toLocaleTimeString()}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SummaryView = ({ summary, onConfirm }: { summary: SessionSummary | null, onConfirm: () => void }) => {
  if (!summary) return null;
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white relative">
      <div className="w-full max-w-lg space-y-8 relative z-10 animate-in zoom-in-95">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6"><ClipboardCheck size={48}/></div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Tugasan Tamat</h1>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-5 rounded-3xl"><p className="text-[8px] font-black text-white/40 uppercase mb-1">Responder</p><p className="text-sm font-black uppercase text-white truncate">{summary.name}</p></div>
            <div className="bg-white/5 p-5 rounded-3xl"><p className="text-[8px] font-black text-white/40 uppercase mb-1">Checkpoint</p><p className="text-sm font-black uppercase text-white truncate">{summary.checkpoint}</p></div>
          </div>
          <div className="bg-blue-600 p-8 rounded-[2rem] text-center"><p className="text-[10px] font-black uppercase text-blue-200 mb-2">KES DIKENDALI</p><h2 className="text-7xl font-black italic tracking-tighter">{summary.casesCount}</h2></div>
        </div>
        <button onClick={onConfirm} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] active:scale-95 flex items-center justify-center gap-3">Sahkan & Log Keluar <LogOut size={18}/></button>
      </div>
    </div>
  );
};

export const ReferralView = ({ referralData, user }: { referralData: any, user: UserSession | null }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8">
      <div className="flex items-center gap-4 px-2">
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg"><Hospital size={24} /></div>
        <div>
          <h3 className="font-black uppercase italic text-lg tracking-tighter text-slate-900 leading-none">Rujukan Perubatan</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Fasiliti Terdekat & Capaian AI</p>
          {user && <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Petugas: {user.name}</p>}
        </div>
      </div>
      {!referralData ? <div className="bg-white p-12 rounded-[3rem] text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" size={32} /></div> : (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10"><p className="text-xs font-medium leading-relaxed italic text-blue-50">"{referralData.text}"</p></div>
          </div>
          <div className="space-y-3">
            {referralData.links.map((link: any, idx: number) => (
              <a key={idx} href={link.uri} target="_blank" className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><MapPin size={20} /></div><div><h4 className="font-black text-slate-900 text-sm uppercase">{link.title}</h4><p className="text-[8px] font-bold text-slate-400 uppercase">{link.distance.toFixed(1)} KM</p></div></div>
                <Navigation size={16}/>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
