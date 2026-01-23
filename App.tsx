
import React, { useState, useEffect } from 'react';
import { Plus, Activity, History, CheckCircle2, Clock, Shield, X, Hospital, Settings, Database } from 'lucide-react';
import { AppState, CaseRecord } from './types';
import { useResponderStore } from './hooks/useResponderStore';
import { Header, Sidebar } from './components/Layout';
import { DashboardView, HistoryView, LogRecordsView, SummaryView, ReferralView, DatabaseSettingsView } from './components/Views';
import { CaseEntryModal, CaseDetailModal, SubmissionSuccessModal, WhatsAppPreviewModal, AboutModal } from './components/Modals';
import LoginForm from './components/LoginForm';
import { getNearbyMedicalFacilities } from './services/geminiService';

const App: React.FC = () => {
  const store = useResponderStore();
  const [activeTab, setActiveTab] = useState<'main' | 'history' | 'logs' | 'referral' | 'settings'>('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [referralData, setReferralData] = useState<any>(null);
  
  // Post-Submission Flow
  const [lastSubmittedCase, setLastSubmittedCase] = useState<CaseRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWAPreview, setShowWAPreview] = useState(false);

  useEffect(() => {
    if (store.appState === AppState.DASHBOARD && store.isOnline) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const data = await getNearbyMedicalFacilities(pos.coords.latitude, pos.coords.longitude);
          setReferralData(data);
        },
        (err) => {
          console.warn("Initial Geolocation Error:", err.message || "Unknown error");
        },
        { timeout: 10000 }
      );
    }
  }, [store.appState, store.isOnline]);

  const handleCaseSubmit = async (formData: any) => {
    const result = await store.addCase(formData);
    setIsEntryModalOpen(false);
    if (result) {
      setLastSubmittedCase(result);
      setShowSuccessModal(true);
    }
  };

  if (store.appState === AppState.LOADING) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-8 animate-in fade-in duration-1000">
      <div className="relative">
        <div className="w-24 h-24 border-8 border-slate-200 rounded-[2.5rem]"></div>
        <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-[2.5rem] animate-spin absolute top-0"></div>
        <Shield size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
          Responder <span className="text-blue-600">ResQ Amal</span>
        </h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );

  if (store.appState === AppState.LOGIN) return <LoginForm onLogin={store.login} onAbout={() => setIsAboutModalOpen(true)} isOnline={store.isOnline} />;

  if (store.appState === AppState.SUMMARY) return <SummaryView summary={store.lastSummary} onConfirm={store.confirmLogout} />;

  const tabs = [
    { id: 'main', icon: <Activity size={16}/>, label: 'DASHBOARD' },
    { id: 'history', icon: <History size={16}/>, label: 'HISTORY' },
    { id: 'referral', icon: <Hospital size={16}/>, label: 'RUJUKAN' }
  ];

  if (store.user?.isSimulasi) {
    tabs.push({ id: 'logs', icon: <Clock size={16}/>, label: 'LOG' });
  }

  tabs.push({ id: 'settings', icon: <Settings size={16}/>, label: 'SISTEM' });

  return (
    <div className="min-h-screen max-w-2xl mx-auto bg-white flex flex-col shadow-2xl relative font-sans overflow-hidden border-x border-slate-100">
      {store.notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 transition-all border ${store.notification.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-white border-slate-700'}`}>
          <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 size={16}/></div>
          <p className="font-black uppercase text-[10px] tracking-widest">{store.notification.message}</p>
        </div>
      )}

      <Header 
        user={store.user} 
        isOnline={store.isOnline} 
        syncStatus={store.syncStatus} 
        onSync={store.sync} 
        isDbConnected={store.isDbConnected}
        onMenu={() => setIsMenuOpen(true)} 
      />

      <nav className="flex px-6 bg-white/50 border-b border-slate-50 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap px-4 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-6 pb-32 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {activeTab === 'main' && (
          <DashboardView 
            cases={store.cases} 
            user={store.user} 
            referralData={referralData}
            onSelect={setSelectedCase} 
            onGoToHistory={() => setActiveTab('history')} 
            onLogCase={() => setIsEntryModalOpen(true)}
            onShowReferrals={() => setActiveTab('referral')}
          />
        )}
        {activeTab === 'history' && <HistoryView cases={store.cases} onSelect={setSelectedCase} />}
        {activeTab === 'referral' && <ReferralView referralData={referralData} user={store.user} />}
        {activeTab === 'logs' && <LogRecordsView logs={store.logs} />}
        {activeTab === 'settings' && (
          <DatabaseSettingsView 
            syncStatus={store.syncStatus} 
            isDbConnected={store.isDbConnected} 
            onTest={store.testConnection} 
            onSync={store.sync} 
            cases={store.cases}
            user={store.user}
            setStorageMode={store.setStorageMode}
            clearLocalData={store.clearLocalData}
            attendanceRecords={store.attendanceRecords}
            cloudCasesPreview={store.cloudCasesPreview}
            latency={store.latency}
          />
        )}
      </main>

      {/* Action Bar - Floating Plus Only */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <button onClick={() => setIsEntryModalOpen(true)} 
          className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white shadow-3xl active:scale-90 transition-all hover:scale-110 ${store.user?.isSimulasi ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-300'}`}>
          <Plus size={40} strokeWidth={3} />
        </button>
      </div>

      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={store.user} 
        onLogout={store.logout} 
        onAbout={() => setIsAboutModalOpen(true)}
      />

      <CaseEntryModal 
        isOpen={isEntryModalOpen} 
        onClose={() => setIsEntryModalOpen(false)} 
        onSubmit={handleCaseSubmit} 
        isSimulasi={store.user?.isSimulasi || false}
        responderName={store.user?.name}
      />

      <CaseDetailModal 
        selectedCase={selectedCase} 
        onClose={() => setSelectedCase(null)} 
      />

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      
      <SubmissionSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} onShare={() => { setShowSuccessModal(false); setShowWAPreview(true); }} />
      <WhatsAppPreviewModal isOpen={showWAPreview} selectedCase={lastSubmittedCase} onClose={() => setShowWAPreview(false)} />
    </div>
  );
};

export default App;
