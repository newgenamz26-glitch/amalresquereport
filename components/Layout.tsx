
import React from 'react';
import { Activity, Menu, RefreshCw, Cloud, LogOut, History, TrendingUp, Flag, Wifi, WifiOff, CloudOff, ShieldCheck, Clock, Hospital, Database, Settings } from 'lucide-react';
import { UserSession, SyncStatus, StorageMode } from '../types';

export const Header = ({ user, isOnline, syncStatus, onSync, onMenu, isDbConnected }: { user: UserSession | null, isOnline: boolean, syncStatus: SyncStatus, onSync: () => void, onMenu: () => void, isDbConnected?: boolean | null }) => (
  <header className="sticky top-0 z-50 px-4 pt-2 pb-4 bg-white/90 backdrop-blur-2xl border-b border-slate-100 flex flex-col gap-2">
    {/* Network Status Indicator Bar */}
    <div className={`mx-4 py-1 px-3 rounded-full flex items-center justify-between transition-all duration-500 border ${isOnline ? 'bg-emerald-500/10 border-emerald-100' : 'bg-rose-500/10 border-rose-100'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
        <div className="flex items-center gap-1.5">
          {isOnline ? <Wifi size={10} className="text-emerald-600" /> : <WifiOff size={10} className="text-rose-600" />}
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
            Sistem {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-blue-500 animate-pulse' : (isDbConnected === false ? 'bg-rose-400' : 'bg-slate-300')}`}></div>
        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDbConnected ? 'text-blue-700' : 'text-slate-400'}`}>
          DB: {isDbConnected ? 'Connected' : (isDbConnected === false ? 'Failed' : 'Ready')}
        </span>
      </div>
    </div>

    {/* Brand & Menu Row */}
    <div className="flex justify-between items-center px-4 mt-1">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${user?.isSimulasi ? 'bg-amber-500' : 'bg-blue-600'} rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100`}>
          <Activity size={20}/>
        </div>
        <div>
          <h2 className="font-black text-[11px] uppercase text-slate-900 tracking-tight leading-none mb-1 flex items-center gap-1.5">
            {user?.programName} <span className="text-slate-300">/</span> {user?.checkpoint}
          </h2>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            ID: {user?.name}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {user?.mode === StorageMode.CLOUD && (
          <button onClick={onSync} className={`p-2.5 rounded-xl transition-all ${syncStatus.state === 'syncing' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:text-blue-500'}`}>
            <RefreshCw className={syncStatus.state === 'syncing' ? 'animate-spin' : ''} size={18}/>
          </button>
        )}
        <button onClick={onMenu} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 transition-colors">
          <Menu size={22} className="text-slate-600"/>
        </button>
      </div>
    </div>

    {/* Secondary Info Pills */}
    <div className="flex items-center gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shrink-0 ${user?.mode === StorageMode.CLOUD ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        {user?.mode === StorageMode.CLOUD ? <Cloud size={10} /> : <CloudOff size={10} />}
        <span className="text-[7px] font-black uppercase tracking-widest">
          {user?.mode === StorageMode.CLOUD 
            ? (syncStatus.state === 'syncing' ? 'Syncing...' : 'MeccaMal Sync') 
            : 'Local Storage'}
        </span>
      </div>

      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-100 bg-white shrink-0`}>
        <div className={`w-1 h-1 rounded-full ${user?.isSimulasi ? 'bg-amber-500' : 'bg-blue-600'}`}></div>
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">{user?.isSimulasi ? 'Simulasi' : 'Protokol Live'}</span>
      </div>
    </div>
  </header>
);

export const Sidebar = ({ isOpen, onClose, activeTab, onTabChange, user, onLogout }: any) => {
  if (!isOpen) return null;
  const menuItems = [
    { id: 'main', icon: <Activity size={20}/>, label: 'Dashboard' },
    { id: 'history', icon: <History size={20}/>, label: 'Rekod Sejarah' },
    { id: 'referral', icon: <Hospital size={20}/>, label: 'Rujukan Perubatan' },
    { id: 'settings', icon: <Settings size={20}/>, label: 'Sistem & Database' }
  ];

  if (user?.isSimulasi) {
    menuItems.push({ id: 'logs', icon: <Clock size={20}/>, label: 'Log Rekod' });
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-80 h-full relative z-10 p-12 shadow-3xl flex flex-col animate-in slide-in-from-right-20">
        <div className="flex items-center gap-4 mb-16">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><ShieldCheck size={24}/></div>
           <h3 className="text-2xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">ResQ<br/><span className="text-blue-600">Amal</span></h3>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { onTabChange(item.id); onClose(); }} 
              className={`w-full flex items-center gap-5 p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="mt-auto space-y-4 pt-8">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Flag size={10}/> Penugasan</p>
            <p className="font-bold text-sm text-slate-800 truncate uppercase tracking-tight">{user?.programName}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-4 p-6 bg-rose-50 text-rose-600 font-black uppercase text-[11px] tracking-[0.2em] rounded-3xl hover:bg-rose-100 transition-colors active:scale-95">
            <LogOut size={20}/> Tamat Tugas
          </button>
        </div>
      </div>
    </div>
  );
};
