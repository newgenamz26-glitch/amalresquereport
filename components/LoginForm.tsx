
import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, Zap, Shield, Settings, Globe, Navigation, 
  RefreshCw, X, Code, Copy, Loader2, ChevronDown, 
  Wifi, WifiOff, Sparkles, Database, User, MapPin, 
  Briefcase, Edit3, Search, Map, HelpCircle, ChevronRight, 
  ChevronLeft, Info, BookOpen, Share2, FileText, Download,
  CheckCircle2, ShieldCheck, Eye, Printer, ShieldCheck as ShieldIcon
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
  onAbout: () => void;
  isOnline: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onAbout, isOnline }) => {
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
  const [showGuide, setShowGuide] = useState(false);
  const [showGuidePreview, setShowGuidePreview] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [dbPingStatus, setDbPingStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'checking' | 'active' | 'inactive'>('idle');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'active' | 'denied' | 'error'>('idle');
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('guide') === 'true') {
      setShowGuide(true);
    }

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

  const handleShareGuideLink = async () => {
    const guideLink = `${window.location.origin}${window.location.pathname}?guide=true`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Panduan Pengguna ResQ Cloud',
          text: 'Klik pautan ini untuk membuka panduan penggunaan sistem ResQ Cloud secara terus.',
          url: guideLink,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(guideLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handlePrintGuide = () => {
    const printContent = document.getElementById('guide-print-view');
    if (!printContent) return;
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    window.location.reload(); 
  };

  const activePrograms = programs.filter(p => !p.locked);
  const filteredPrograms = activePrograms.filter(p => 
    p.nama.toLowerCase().includes(loginData.programName.toLowerCase())
  );

  const guideContent = [
    {
      title: "Selamat Datang ke ResQ Cloud",
      desc: "Sistem pelaporan medik pantas berasaskan Cloud untuk Responder ResQ Amal.",
      icon: <Shield size={48} className="text-blue-600" />,
      steps: ["Pastikan GPS aktif sebelum log masuk.", "Guna butang 'Simulasi' untuk latihan sahaja."]
    },
    {
      title: "Mendaftar Kes Baru",
      desc: "Klik butang (+) besar di Dashboard untuk mula merekod pesakit.",
      icon: <Zap size={48} className="text-amber-500" />,
      steps: ["Guna input suara (AI) untuk mencatat simptom dengan pantas.", "Ambil koordinat GPS secara automatik."]
    },
    {
      title: "Pemantauan Tanda Vital",
      desc: "Rekodkan BP, PR, DXT, dan Suhu dengan teliti untuk rujukan hospital.",
      icon: <RefreshCw size={48} className="text-emerald-500" />,
      steps: ["Status 'Dirujuk Hospital' akan memberi amaran merah pada senarai.", "Pastikan masa mula dan akhir rawatan direkodkan."]
    },
    {
      title: "Perkongsian WhatsApp",
      desc: "Selepas simpan kes, butang kongsi akan menjana laporan teks profesional.",
      icon: <Globe size={48} className="text-blue-600" />,
      steps: ["Laporan WhatsApp mengandungi pautan Google Maps lokasi kejadian.", "Data juga disinkronkan ke Google Sheet (MeccaMal)."]
    }
  ];

  const GuidePDFContent = () => (
    <div className="space-y-10">
      <div className="text-center border-b-4 border-blue-600 pb-8">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">PANDUAN PENGGUNA</h1>
        <h2 className="text-5xl font-black text-blue-600 italic tracking-tighter uppercase">Responder Cloud</h2>
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-4">Sistem Operasi Kecemasan Awan ResQ Amal</p>
      </div>

      <div className="space-y-8">
        {guideContent.map((g, idx) => (
          <div key={idx} className="p-6 border border-slate-200 rounded-3xl bg-slate-50">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2">LANGKAH {idx + 1}: {g.title}</h3>
            <p className="text-[11px] text-slate-600 font-medium mb-4 leading-relaxed">{g.desc}</p>
            <div className="space-y-2">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tindakan Utama:</p>
               {g.steps.map((s, i) => (
                 <div key={i} className="flex gap-3 text-[10px] font-bold text-slate-900">
                    <span className="text-blue-600 shrink-0">[{i+1}]</span>
                    <span>{s}</span>
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 border-t border-slate-100 flex justify-between items-center opacity-50">
         <p className="text-[10px] font-black uppercase italic">ResQ Amal IT Unit</p>
         <p className="text-[9px] font-bold">Dokumen Latihan Rasmi v2.5</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* FLOATING AUTO-HIDE SIDE NAV */}
      <nav className="fixed top-6 left-6 z-[100] flex flex-col gap-1.5 group">
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-default ${isOnline ? 'border-emerald-100' : 'border-rose-100'}`}>
          <div className="shrink-0">{isOnline ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-rose-500" />}</div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div onClick={checkGPS} className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-pointer active:scale-95 ${gpsStatus === 'active' ? 'border-emerald-100' : 'border-amber-100'}`}>
          <div className="shrink-0"><Navigation size={16} className={gpsStatus === 'active' ? 'text-emerald-500' : 'text-amber-500'} /></div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${gpsStatus === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>GP: {gpsStatus === 'active' ? 'Active' : 'Ping...'}</span>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden cursor-default">
          <div className="shrink-0"><Database size={16} className={dbPingStatus === 'ok' ? 'text-blue-500' : 'text-slate-300'} /></div>
          <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${dbPingStatus === 'ok' ? 'text-blue-600' : 'text-slate-400'}`}>DB: {dbPingStatus === 'ok' ? 'Linked' : 'Offline'}</span>
        </div>
        <button onClick={() => setShowGuide(true)} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden hover:bg-blue-50">
          <div className="shrink-0"><BookOpen size={16} className="text-blue-500" /></div>
          <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 text-blue-600">Panduan</span>
        </button>
        <button onClick={onAbout} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden hover:bg-emerald-50">
          <div className="shrink-0"><Info size={16} className="text-emerald-500" /></div>
          <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 text-emerald-600">Tentang</span>
        </button>
        <button onClick={() => setShowSettings(true)} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-lg transition-all duration-300 w-10 group-hover:w-32 overflow-hidden hover:bg-slate-50">
          <div className="shrink-0"><Settings size={16} className="text-slate-400" /></div>
          <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 text-slate-500">Tetapan</span>
        </button>
      </nav>

      {/* MAIN LOGIN FORM */}
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 relative z-10 overflow-hidden">
        <button type="button" onClick={handleAutoFillLogin} className="absolute top-8 right-8 p-3 bg-amber-100 text-amber-600 rounded-2xl hover:bg-amber-500 hover:text-white transition-all active:scale-90 shadow-lg shadow-amber-200/50 group z-20"><Zap size={20} className="group-hover:animate-pulse" /></button>
        <div className="p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-5 shadow-2xl shadow-blue-100 -rotate-3 transition-transform hover:rotate-0"><Shield size={36} /></div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Responder <span className="text-blue-600 italic">ResQ</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 opacity-70">Sistem Operasi Kecemasan</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl relative">
                <button type="button" onClick={() => setLoginData({...loginData, isSimulasi: true, mode: StorageMode.LOCAL})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${loginData.isSimulasi ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}><Zap size={12}/> Simulasi</button>
                <button type="button" onClick={() => setLoginData({...loginData, isSimulasi: false, mode: StorageMode.CLOUD})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${!loginData.isSimulasi ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><Shield size={12}/> Live Mode</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nama Petugas</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/><input required placeholder="Nama penuh anda" value={loginData.name} onChange={e => setLoginData({...loginData, name: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none focus:ring-4 ring-blue-500/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <div className="flex justify-between items-center ml-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Program</label>
                  {loginData.mode === StorageMode.LOCAL && <span className="text-[7px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1"><Edit3 size={8}/> Manual Entry</span>}
                </div>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/><input required autoComplete="off" placeholder={loginData.mode === StorageMode.LOCAL ? "Taip nama program..." : "Cari nama program cloud..."} value={loginData.programName} onFocus={() => setShowDropdown(true)} onChange={e => { setLoginData({...loginData, programName: e.target.value}); setShowDropdown(true); }} className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none focus:ring-4 ring-blue-500/10 transition-all" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoadingPrograms && <Loader2 className="animate-spin text-blue-500" size={14} />}
                    <ChevronDown className={`text-slate-300 transition-transform ${showDropdown ? 'rotate-180' : ''}`} size={18} />
                  </div>
                </div>
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-3xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredPrograms.length > 0 ? filteredPrograms.map((p) => (
                        <button key={p.id} type="button" onClick={() => { setLoginData({ ...loginData, programName: p.nama, checkpoint: p.lokasi || '' }); setShowDropdown(false); }} className="w-full p-4 text-left hover:bg-blue-50 rounded-2xl transition-colors flex items-center justify-between group">
                          <div className="min-w-0 flex-1"><h4 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate">{p.nama}</h4><p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.lokasi || 'Umum'}</p></div>
                          <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 ml-2 shrink-0"><span className="text-[6px] font-black uppercase">Cloud</span></div>
                        </button>
                      )) : <div className="p-6 text-center"><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tiada program cloud ditemui</p>{loginData.mode === StorageMode.LOCAL && loginData.programName && <button type="button" onClick={() => setShowDropdown(false)} className="mt-3 w-full py-2 bg-amber-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">Gunakan "{loginData.programName}"</button>}</div>}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Lokasi Checkpoint</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18}/><input required placeholder="Contoh: CP Utama / Sektor 1" value={loginData.checkpoint} onChange={e => setLoginData({...loginData, checkpoint: e.target.value})} className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold text-sm border-none outline-none focus:ring-4 ring-blue-500/10 transition-all" />
                </div>
              </div>
            </div>
            <button type="submit" className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loginData.isSimulasi ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-slate-900 text-white shadow-slate-200'}`}>Mula Bertugas <Navigation size={18} /></button>
          </form>
          
          {/* Enhanced Center Bottom Buttons */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <button 
              onClick={() => setShowGuide(true)} 
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 transition-all group"
            >
              <BookOpen size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Panduan</span>
            </button>
            <button 
              onClick={onAbout} 
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl border border-slate-100 transition-all group"
            >
              <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Tentang</span>
            </button>
          </div>
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em] text-center mt-6">ResQ Amal Malaysia IT Unit</p>
        </div>
      </div>

      {/* INTERACTIVE GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-4xl animate-in zoom-in-95 flex flex-col min-h-[600px] relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><HelpCircle size={20} /></div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Panduan Interaktif</h3>
              </div>
              <button onClick={() => { setShowGuide(false); setGuideStep(0); }} className="text-slate-300 hover:text-slate-900"><X size={24}/></button>
            </div>

            {/* Global Actions for Guide */}
            <div className="flex gap-2 mb-8 animate-in slide-in-from-top-2">
               <button onClick={handleShareGuideLink} className="flex-1 p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  {copySuccess ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
                  <span className="text-[9px] font-black uppercase tracking-widest">{copySuccess ? 'Pautan Disalin' : 'Kongsi Pautan Sistem'}</span>
               </button>
               <button onClick={() => setShowGuidePreview(true)} className="flex-1 p-3 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Eye size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Previu Panduan PDF</span>
               </button>
            </div>

            <div className="flex-1 flex flex-col items-center text-center space-y-6 animate-in slide-in-from-bottom-4">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">{guideContent[guideStep].icon}</div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{guideContent[guideStep].title}</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">{guideContent[guideStep].desc}</p>
              </div>
              <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Tindakan Utama:</p>
                <ul className="space-y-3">
                  {guideContent[guideStep].steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-slate-700">
                      <div className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-black">{i + 1}</div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <div className="flex gap-1.5">
                {guideContent.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === guideStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`}></div>
                ))}
              </div>
              <div className="flex gap-3">
                {guideStep > 0 && (
                  <button onClick={() => setGuideStep(prev => prev - 1)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl active:scale-90 transition-all"><ChevronLeft size={20}/></button>
                )}
                <button 
                  onClick={() => guideStep === guideContent.length - 1 ? setShowGuide(false) : setGuideStep(prev => prev + 1)} 
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 active:scale-90 transition-all"
                >
                  {guideStep === guideContent.length - 1 ? 'Mula Sekarang' : 'Seterusnya'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW FOR GUIDE */}
      {showGuidePreview && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowGuidePreview(false)}></div>
          <div className="bg-slate-100 w-full max-w-2xl h-full max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-4xl relative z-10 flex flex-col animate-in zoom-in-95">
            <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg"><Eye size={18} /></div>
                  <h3 className="font-black uppercase italic tracking-tighter text-slate-900">Previu Panduan</h3>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={handlePrintGuide} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all">
                     <Printer size={14} /> Cetak / Simpan PDF
                  </button>
                  <button onClick={() => setShowGuidePreview(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-12 custom-scrollbar bg-slate-200/50">
               <div className="bg-white shadow-2xl mx-auto min-h-[100%] w-full max-w-[210mm] p-8 sm:p-16 text-slate-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-30deg]">
                     <Shield size={400} />
                  </div>
                  <div className="relative z-10">
                     <GuidePDFContent />
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT VIEW FOR GUIDE PDF */}
      <div id="guide-print-view" className="hidden">
         <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
            <GuidePDFContent />
         </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-4xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black uppercase italic tracking-tighter">Tetapan Pangkalan Data</h3><button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-900"><X size={24}/></button></div>
            <div className="space-y-6">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">URL Google Apps Script</label><input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs border border-slate-100 outline-none" placeholder="https://script.google.com/macros/s/.../exec"/></div>
              <button onClick={() => { localStorage.setItem('responder_sheet_url', sheetUrl); setShowSettings(false); handleLoadPrograms(); testDatabase(); }} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Simpan Tetapan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
