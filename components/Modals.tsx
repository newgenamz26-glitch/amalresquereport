
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ClipboardList, Send, User, MapPin, Activity, Heart, 
  CheckCircle, MessageSquare, Zap, ShieldAlert, Clock, Info, 
  Thermometer, Droplets, Navigation, RefreshCw, Map as MapIcon, 
  UserCheck, CheckCircle2, Mic, MicOff, Share2, AlertCircle, 
  ShieldEllipsis, AlertTriangle, FileText, Download, ShieldCheck, 
  Globe, Database, Sparkles, ZapOff, Server, Cloud, Hospital, 
  Eye, Printer, Shield, ChevronRight, Layout, Cpu
} from 'lucide-react';
import { Gender, CaseRecord } from '../types';
import { startLiveAssistant } from '../services/geminiService';

// Manual Base64 encoding as per guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to create PCM blob for Live API
function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const InputLabel = ({ children, required, onMicClick, isListening, isDenied }: { children?: React.ReactNode, required?: boolean, onMicClick?: () => void, isListening?: boolean, isDenied?: boolean }) => (
  <div className="flex justify-between items-center mb-1.5 ml-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
    {onMicClick && (
      <button 
        type="button" 
        onClick={onMicClick}
        title={isDenied ? "Akses Mikrofon Disekat" : (isListening ? "Berhenti Merakam" : "Guna Suara (AI)")}
        className={`p-1.5 rounded-lg transition-all active:scale-90 ${
          isListening ? 'bg-blue-600 text-white animate-pulse shadow-lg shadow-blue-200' : 
          isDenied ? 'bg-rose-100 text-rose-500 border border-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
        }`}
      >
        {isDenied ? <MicOff size={12} /> : <Mic size={12} />}
      </button>
    )}
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 mb-3 px-1 mt-3 first:mt-0">
    <div className="p-1 bg-blue-600 rounded-md text-white">
      <Icon size={12} />
    </div>
    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h4>
  </div>
);

const inputClasses = "w-full p-3 bg-white rounded-xl font-bold border border-slate-100 outline-none transition-all focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 text-xs shadow-sm placeholder:font-medium placeholder:text-slate-300";

// --- PDF Preview Modal Component ---
const PDFPreviewOverlay = ({ isOpen, onClose, onPrint, title, children }: { isOpen: boolean, onClose: () => void, onPrint: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-slate-100 w-full max-w-2xl h-full max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-4xl relative z-10 flex flex-col animate-in zoom-in-95">
        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg"><Eye size={18} /></div>
            <h3 className="font-black uppercase italic tracking-tighter text-slate-900">Previu Dokumen</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all">
              <Printer size={14} /> Cetak / PDF
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-12 custom-scrollbar bg-slate-200/50">
          <div className="bg-white shadow-2xl mx-auto min-h-[100%] w-full max-w-[210mm] p-8 sm:p-16 text-slate-900 relative">
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-30deg]">
                <Shield size={400} />
             </div>
             <div className="relative z-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- About Modal ---
export const AboutModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'features' | 'tech'>('info');

  if (!isOpen) return null;

  const features = [
    { icon: <Mic size={18} />, title: "Input Suara AI", desc: "Transkripsi simptom pesakit secara langsung menggunakan Gemini Live API." },
    { icon: <Cloud size={18} />, title: "Sinkronisasi Cloud", desc: "Data dihantar secara masa nyata ke Google Sheets (Pangkalan Data MeccaMal)." },
    { icon: <FileText size={18} />, title: "Laporan PDF", desc: "Penjanaan dokumen laporan kes yang profesional untuk rujukan hospital." },
    { icon: <MessageSquare size={18} />, title: "WhatsApp Template", desc: "Format mesej laporan yang tersusun lengkap dengan koordinat GPS." },
    { icon: <Hospital size={18} />, title: "Rujukan Fasiliti", desc: "Carian hospital dan klinik terdekat berasaskan lokasi GPS semasa." },
    { icon: <Zap size={18} />, title: "Mod Simulasi", desc: "Sistem latihan khas untuk responder tanpa menjejaskan data rasmi." }
  ];

  const handlePrint = () => {
    const printContent = document.getElementById('about-print-view');
    if (!printContent) return;
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    window.location.reload(); 
  };

  const AboutPDFContent = () => (
    <div className="space-y-10 font-sans">
      <div className="text-center border-b-4 border-emerald-600 pb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">PROFIL TEKNIKAL & OPERASI</h1>
        <h2 className="text-6xl font-black text-emerald-600 italic tracking-tighter leading-none">ResQ CLOUD</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mt-6">Sistem Pelaporan Medik Pintar - ResQ Amal Malaysia</p>
      </div>

      <div className="grid grid-cols-2 gap-10 text-[11px] font-bold py-6 border-b border-slate-100">
         <div className="space-y-4">
            <h4 className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">I. SUMBER SISTEM</h4>
            <div className="space-y-1">
              <p className="text-slate-900">Unit Teknologi Maklumat (IT)</p>
              <p className="text-slate-900">ResQ Amal Malaysia</p>
              <p className="text-slate-500 font-medium">it-unit@resqamal.org.my</p>
            </div>
         </div>
         <div className="text-right space-y-4">
            <h4 className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">II. VERSI & STATUS</h4>
            <div className="space-y-1">
              <p className="text-slate-900">v2.5.0-PRO (Hybrid Edition)</p>
              <p className="text-slate-900">{new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-emerald-600 uppercase font-black">Status: Aktif & Rasmi</p>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
          <div className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center text-[10px]">1</div>
          Ringkasan Eksekutif
        </h3>
        <p className="text-sm leading-relaxed text-slate-700 font-medium italic border-l-4 border-emerald-100 pl-6 py-2">
          "ResQ Cloud merupakan satu inovasi digital dalam pengurusan rawatan kecemasan lapangan (Pre-Hospital Care). Dengan menyepadukan Kecerdasan Buatan (AI) Google Gemini, sistem ini membolehkan Responder merekod data pesakit dengan kelajuan optimum, memastikan setiap maklumat klinikal terpelihara dalam pangkalan data awan untuk tindakan susulan bilik gerakan."
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
          <div className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center text-[10px]">2</div>
          Kefungsian Utama
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          {features.map((f, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] font-black uppercase text-emerald-700">{f.title}</p>
              <p className="text-[9px] font-medium text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-4">Pematuhan Integriti Data</h3>
        <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
          Setiap rekod yang dijana melalui ResQ Cloud dilengkapi dengan cap masa (timestamp) unik dan pengesahan responder. Data dihantar secara selamat ke MeccaMal Core (Google Sheets Enterprise) untuk tujuan audit medik dan penyelidikan kualiti rawatan ResQ Amal Malaysia.
        </p>
      </div>

      <div className="pt-10 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
         <p>Inovasi untuk Kemanusiaan</p>
         <p>ResQ Amal Malaysia © 2025</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl animate-in fade-in" onClick={onClose}></div>
        <div className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl relative z-10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-10 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12"><ShieldCheck size={180} /></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="px-3 py-1 bg-white/20 rounded-full border border-white/10 w-fit mb-4">
                    <p className="text-[8px] font-black uppercase tracking-widest">Version 2.5.0-PRO</p>
                  </div>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9]">Responder<br/><span className="text-emerald-300">ResQ Cloud</span></h3>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={24}/></button>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex px-8 bg-slate-50 border-b border-slate-100">
             {[
               { id: 'info', label: 'Ringkasan', icon: Info },
               { id: 'features', label: 'Ciri-Ciri', icon: Sparkles },
               { id: 'tech', label: 'Teknologi', icon: Cpu }
             ].map((tab) => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex-1 py-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
               >
                 <tab.icon size={14} /> {tab.label}
               </button>
             ))}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-white">
            
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <section className="space-y-4">
                  <SectionHeader icon={Info} title="Evolusi Operasi" />
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    "Sistem ini direka untuk mengurangkan beban dokumentasi responder semasa di zon merah, membolehkan fokus penuh diberikan kepada perawatan pesakit."
                  </p>
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-2">Misi Pembangunan</h5>
                    <p className="text-[9px] font-bold text-emerald-700 leading-relaxed">
                      Menyediakan alat pelaporan medik yang pantas, kalis gangguan talian (offline capable), dan berintegrasi tinggi dengan bilik gerakan pusat ResQ Amal.
                    </p>
                  </div>
                </section>
                <button onClick={() => setShowPreview(true)} className="w-full p-5 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all group">
                   <Eye size={20} className="group-hover:animate-pulse" />
                   <span className="text-[11px] font-black uppercase tracking-widest">Previu & Simpan Spec PDF</span>
                </button>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-right-4">
                {features.map((f, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-colors">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-1">{f.title}</h5>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-normal">{f.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-200 ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tech' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                 <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-4 opacity-5"><Server size={80} /></div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl"><Database size={18} className="text-blue-400" /></div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest">MeccaMal Core v4</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase border-b border-white/5 pb-2">
                        <span className="text-slate-400">Database Engine</span>
                        <span className="text-blue-400">Google Apps Script</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase border-b border-white/5 pb-2">
                        <span className="text-slate-400">AI Intelligence</span>
                        <span className="text-emerald-400">Gemini 2.5 Flash</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span className="text-slate-400">Geolocation</span>
                        <span className="text-rose-400">Real-time Geotag</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Architecture</p>
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter italic">PWA Hybrid</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Latency Avg</p>
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter italic">~250ms</p>
                    </div>
                 </div>
              </div>
            )}
            
            <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-3 pb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Dikembangkan secara eksklusif oleh</p>
              <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl text-emerald-600">ResQ Amal IT Unit</h4>
              <p className="text-[9px] font-bold text-slate-400">© 2025 All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>

      <PDFPreviewOverlay 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        onPrint={handlePrint}
        title="Dokumen Spesifikasi ResQ Cloud"
      >
        <AboutPDFContent />
      </PDFPreviewOverlay>

      <div id="about-print-view" className="hidden">
         <AboutPDFContent />
      </div>
    </>
  );
};

// --- Form Entry Modal ---
export const CaseEntryModal = ({ isOpen, onClose, onSubmit, isSimulasi, responderName }: any) => {
  const initialForm = {
    p_name: '',
    p_age: '',
    p_gender: Gender.MALE,
    symptoms: '',
    kesedaran: 'Sedar Sepenuhnya',
    vitalBP: '',
    vitalPR: '',
    vitalDXT: '',
    vitalTemp: '',
    treatment: '',
    statusAkhir: 'Selesai',
    namaPerawat: responderName || '',
    masaMula: ''
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [isListeningSymptoms, setIsListeningSymptoms] = useState(false);
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
      checkMicPermission();
      const now = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
      setFormData(prev => ({ ...prev, masaMula: now, namaPerawat: responderName || prev.namaPerawat }));
    } else {
      stopVoice();
      setLocError(null);
      setMicStatus('prompt');
    }
  }, [isOpen, responderName]);

  const checkMicPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        setMicStatus(result.state as any);
        
        result.onchange = () => {
          setMicStatus(result.state as any);
        };
      }
    } catch (e) {
      console.warn("Permission API not fully supported, will rely on getUserMedia catch.");
    }
  };

  const fetchLocation = () => {
    setIsLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        let msg = "Ralat GPS";
        switch(err.code) {
          case err.PERMISSION_DENIED: msg = "Akses Lokasi Ditolak"; break;
          case err.POSITION_UNAVAILABLE: msg = "Info Lokasi Tiada"; break;
          case err.TIMEOUT: msg = "GPS Timeout"; break;
        }
        setLocError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startVoice = async () => {
    if (micStatus === 'denied') {
      alert("Akses mikrofon telah disekat. Sila benarkan akses dalam tetapan pelayar anda (klik ikon mangga di bar alamat) untuk membolehkan input suara AI.");
      return;
    }
    if (isListeningSymptoms) { stopVoice(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListeningSymptoms(true);
      setMicStatus('granted');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
      const sessionPromise = startLiveAssistant({
        onopen: () => console.debug('Live session opened'),
        onmessage: (message: any) => {
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            setFormData(prev => ({ ...prev, symptoms: prev.symptoms + text }));
          }
        },
        onerror: (e: any) => { console.error("Live session error", e); stopVoice(); },
        onclose: () => { console.debug('Live session closed'); stopVoice(); },
      });
      const session = await sessionPromise;
      sessionRef.current = session;
      const source = inputAudioContext.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise.then((activeSession) => activeSession.sendRealtimeInput({ media: pcmBlob }));
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);
      (window as any)._voiceResources = { stream, inputAudioContext, scriptProcessor };
    } catch (error: any) {
      console.error("Mic error:", error);
      setIsListeningSymptoms(false);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') setMicStatus('denied');
      else alert("Ralat teknikal mikrofon.");
    }
  };

  const stopVoice = () => {
    setIsListeningSymptoms(false);
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    const res = (window as any)._voiceResources;
    if (res) {
      res.stream?.getTracks().forEach((t: any) => t.stop());
      res.scriptProcessor?.disconnect();
      res.inputAudioContext?.close();
      delete (window as any)._voiceResources;
    }
  };

  if (!isOpen) return null;

  const handleAutoFill = () => {
    const samples = [
      { p_name: 'Muhammad Ali', p_age: '24', p_gender: Gender.MALE, symptoms: 'Sakit dada berterusan selepas larian 5km, sesak nafas.', kesedaran: 'Sedar Sepenuhnya', vitalBP: '145/95', vitalPR: '110', vitalDXT: '5.6', vitalTemp: '37.2', treatment: 'Diberikan Rehat & Bantuan Oksigen 4LPM.', statusAkhir: 'Dirujuk Hospital' }
    ];
    setFormData(prev => ({ ...prev, ...samples[0] }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.p_name || !formData.p_age || !formData.symptoms || !formData.treatment) { alert("Sila isi medan wajib."); return; }
    stopVoice();
    const masaAkhir = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    await onSubmit({ ...formData, location, masaAkhir });
    setFormData(initialForm);
    setLocation(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={onClose}></div>
      <form onSubmit={handleFormSubmit} className="bg-slate-50 w-full max-w-lg rounded-[3.5rem] p-8 sm:p-10 z-10 animate-in slide-in-from-bottom-20 space-y-6 overflow-y-auto max-h-[92vh] relative custom-scrollbar shadow-3xl border border-white">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isSimulasi ? 'bg-amber-100 text-amber-600' : 'bg-blue-600 text-white shadow-lg'}`}><ClipboardList size={24}/></div>
            <div><h3 className="font-black uppercase italic text-2xl tracking-tighter leading-none">Borang Kes</h3><p className="text-[9px] font-black text-slate-400 uppercase mt-1">Responder ResQ Amal</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleAutoFill} className="p-2.5 bg-white text-amber-500 rounded-xl hover:bg-amber-50 border border-slate-100 shadow-sm transition-all active:scale-90"><Zap size={20}/></button>
            <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={28}/></button>
          </div>
        </div>
        <div className="space-y-6">
          <SectionHeader icon={Navigation} title="Auto Location Pin" />
          <div className={`p-4 rounded-[1.5rem] border flex items-center justify-between ${location ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${location ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}><MapPin size={16} /></div><div><p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">Koordinat Semasa</p><p className="text-[11px] font-bold text-slate-900 font-mono">{isLocating ? 'Mencari Satelit...' : location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : (locError || 'Gagal Dikesan')}</p></div></div>
            <button type="button" onClick={fetchLocation} className="p-2 bg-white rounded-lg active:scale-90"><RefreshCw size={14} className={isLocating ? 'animate-spin' : ''} /></button>
          </div>
          <SectionHeader icon={User} title="Data Pesakit" />
          <div className="bg-white p-5 rounded-[2rem] space-y-3 shadow-sm border border-slate-100">
            <InputLabel required>Nama Pesakit</InputLabel><input required placeholder="Nama penuh" value={formData.p_name} onChange={e => setFormData({...formData, p_name: e.target.value})} className={inputClasses} />
            <div className="grid grid-cols-2 gap-3"><div><InputLabel required>Umur</InputLabel><input required type="number" placeholder="Tahun" value={formData.p_age} onChange={e => setFormData({...formData, p_age: e.target.value})} className={inputClasses} /></div><div><InputLabel required>Jantina</InputLabel><select value={formData.p_gender} onChange={e => setFormData({...formData, p_gender: e.target.value as Gender})} className={inputClasses}><option value={Gender.MALE}>Lelaki</option><option value={Gender.FEMALE}>Perempuan</option></select></div></div>
          </div>
          <SectionHeader icon={ShieldAlert} title="Maklumat Perubatan" />
          <div className="bg-white p-5 rounded-[2rem] space-y-3 shadow-sm border border-slate-100">
            <InputLabel required onMicClick={startVoice} isListening={isListeningSymptoms} isDenied={micStatus === 'denied'}>Aduan / Simptom</InputLabel>
            <textarea required placeholder="Nyatakan aduan pesakit..." value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} className={`${inputClasses} h-20 resize-none`} />
            <InputLabel required>Kesedaran</InputLabel><select value={formData.kesedaran} onChange={e => setFormData({...formData, kesedaran: e.target.value})} className={inputClasses}><option>Sedar Sepenuhnya</option><option>Keliru / Disorientasi</option><option>Unresponsive</option></select>
          </div>
          <SectionHeader icon={Activity} title="Tanda Vital" />
          <div className="bg-white p-5 rounded-[2rem] grid grid-cols-2 gap-3 shadow-sm border border-slate-100">
            <div><InputLabel>BP</InputLabel><input placeholder="120/80" value={formData.vitalBP} onChange={e => setFormData({...formData, vitalBP: e.target.value})} className={`${inputClasses} text-center`} /></div>
            <div><InputLabel>PR</InputLabel><input placeholder="80" value={formData.vitalPR} onChange={e => setFormData({...formData, vitalPR: e.target.value})} className={`${inputClasses} text-center`} /></div>
          </div>
          <button type="submit" className={`w-full text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 text-[11px] ${isSimulasi ? 'bg-amber-600' : 'bg-blue-600'}`}><Send size={16}/> Simpan Laporan Kes</button>
        </div>
      </form>
    </div>
  );
};

export const CaseDetailModal = ({ selectedCase, onClose }: { selectedCase: CaseRecord | null, onClose: () => void }) => {
  const [showPreview, setShowPreview] = useState(false);
  if (!selectedCase) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('case-print-view');
    if (!printContent) return;
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    window.location.reload(); 
  };

  const CasePDFContent = () => (
    <div className="space-y-8 font-sans">
      <div className="text-center border-b-2 border-blue-600 pb-6 mb-8">
        <h1 className="text-2xl font-black text-slate-900 mb-1">LAPORAN KES MEDIK AMAL</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ResQ Amal Malaysia - Official Record</p>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-6">
        <div className="space-y-4">
           <h4 className="text-[8px] font-black uppercase tracking-widest text-blue-600">I. MAKLUMAT REKOD</h4>
           <div className="grid grid-cols-1 gap-2 text-[11px]">
              <p><strong>ID KES:</strong> {selectedCase.idKes}</p>
              <p><strong>TARIKH:</strong> {new Date(selectedCase.timestamp).toLocaleDateString('ms-MY')}</p>
              <p><strong>PROGRAM:</strong> {selectedCase.programCP}</p>
              <p><strong>RESPONDER:</strong> {selectedCase.recordedBy}</p>
           </div>
        </div>
        <div className="space-y-4 text-right">
           <h4 className="text-[8px] font-black uppercase tracking-widest text-blue-600">II. STATUS SEMASA</h4>
           <div className="inline-block px-4 py-2 border-2 border-slate-900 font-black uppercase tracking-tighter text-lg">
              {selectedCase.statusAkhir}
           </div>
           <p className="text-[9px] mt-2 italic text-slate-400">Dicetak pada {new Date().toLocaleString('ms-MY')}</p>
        </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-slate-100">
         <h4 className="text-[8px] font-black uppercase tracking-widest text-blue-600">III. PROFIL PESAKIT</h4>
         <div className="grid grid-cols-1 gap-3 text-[12px]">
            <p className="text-xl font-black uppercase">{selectedCase.p_name}</p>
            <div className="flex gap-10 font-bold text-slate-600">
               <p>UMUR: {selectedCase.p_age} Tahun</p>
               <p>JANTINA: {selectedCase.p_gender}</p>
            </div>
         </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-slate-100">
         <h4 className="text-[8px] font-black uppercase tracking-widest text-blue-600">IV. PEMERIKSAAN MEDIK</h4>
         <div className="p-6 border border-slate-200 bg-slate-50 rounded-lg">
            <p className="text-[8px] font-black uppercase mb-2 text-slate-400">ADUAN UTAMA / SIMPTOM</p>
            <p className="text-sm italic leading-relaxed font-medium">"{selectedCase.symptoms}"</p>
            <div className="mt-6 flex gap-12">
               <div><p className="text-[8px] font-black uppercase mb-1 text-slate-400">TAHAP KESEDARAN</p><p className="font-black uppercase text-sm">{selectedCase.kesedaran}</p></div>
               <div><p className="text-[8px] font-black uppercase mb-1 text-slate-400">NAMA PERAWAT</p><p className="font-black uppercase text-sm">{selectedCase.namaPerawat}</p></div>
            </div>
         </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-slate-100">
         <h4 className="text-[8px] font-black uppercase tracking-widest text-blue-600">V. TANDA VITAL</h4>
         <div className="grid grid-cols-4 gap-4">
            {[{l:'BP',v:selectedCase.vitalBP,u:'mmHg'},{l:'PR',v:selectedCase.vitalPR,u:'bpm'},{l:'DXT',v:selectedCase.vitalDXT,u:'mmol/L'},{l:'TEMP',v:selectedCase.vitalTemp,u:'°C'}].map((v, i) => (
              <div key={i} className="text-center p-3 border border-slate-200 rounded-lg">
                <p className="text-[8px] font-black text-slate-400 mb-1">{v.l}</p>
                <p className="text-sm font-black text-slate-900">{v.v || '-'}</p>
                <p className="text-[7px] text-slate-400">{v.u}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-slate-100">
         <h4 className="text-[8px] font-black uppercase tracking-widest text-blue-600">VI. RAWATAN & TINDAKAN</h4>
         <div className="p-6 border border-slate-200 rounded-lg min-h-[100px]">
            <p className="text-sm leading-relaxed font-medium">{selectedCase.treatment}</p>
         </div>
      </div>

      <div className="pt-20 text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">
         DOKUMEN INI ADALAH REKOD RASMI RESQ AMAL MALAYSIA
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-lg" onClick={onClose}></div>
        <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-4xl relative z-10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          <div className={`p-8 ${selectedCase.isSimulasi ? 'bg-amber-500' : 'bg-blue-600'} text-white shrink-0`}>
            <div className="flex justify-between items-start">
              <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{selectedCase.idKes}</p><h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedCase.p_name}</h3></div>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(true)} title="Previu PDF" className="p-2 bg-white/10 rounded-full hover:bg-white/20"><FileText size={20}/></button>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Pesakit</p><p className="text-xs font-bold text-slate-900 uppercase">{selectedCase.p_age} Tahun • {selectedCase.p_gender}</p></div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Masa</p><p className="text-xs font-bold text-slate-900 uppercase">{selectedCase.masaMula} - {selectedCase.masaAkhir}</p></div>
            </div>
            <div><SectionHeader icon={ShieldAlert} title="Aduan & Kesedaran" /><div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4"><div><p className="text-[8px] font-black text-blue-500 uppercase mb-1">Simptom</p><p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{selectedCase.symptoms}"</p></div><div><p className="text-[8px] font-black text-blue-500 uppercase mb-1">Tahap Kesedaran</p><p className="text-xs font-bold text-slate-900 uppercase">{selectedCase.kesedaran}</p></div></div></div>
            <div><SectionHeader icon={Activity} title="Tanda Vital" /><div className="grid grid-cols-4 gap-2">{[{ label: 'BP', value: selectedCase.vitalBP, icon: Heart, color: 'text-rose-500' },{ label: 'PR', value: selectedCase.vitalPR, icon: Activity, color: 'text-blue-500' },{ label: 'DXT', value: selectedCase.vitalDXT, icon: Droplets, color: 'text-amber-500' },{ label: 'TEMP', value: selectedCase.vitalTemp, icon: Thermometer, color: 'text-orange-500' }].map((v, i) => (<div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center"><v.icon size={12} className={`mx-auto mb-1 ${v.color}`} /><p className="text-[7px] font-black text-slate-400 uppercase">{v.label}</p><p className="text-[10px] font-black text-slate-900">{v.value || '-'}</p></div>))}</div></div>
            {selectedCase.location && (<div><SectionHeader icon={MapPin} title="Lokasi Geotag" /><a href={`https://www.google.com/maps?q=${selectedCase.location.lat},${selectedCase.location.lng}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 group transition-all"><div className="flex items-center gap-3"><MapIcon size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Lihat Koordinat di Peta</span></div><Navigation size={14} className="group-hover:translate-x-1 transition-transform" /></a></div>)}
          </div>
        </div>
      </div>

      <PDFPreviewOverlay 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        onPrint={handlePrint}
        title={`Laporan Kes: ${selectedCase.idKes}`}
      >
        <CasePDFContent />
      </PDFPreviewOverlay>

      <div id="case-print-view" className="hidden">
         <CasePDFContent />
      </div>
    </>
  );
};

export const SubmissionSuccessModal = ({ isOpen, onClose, onShare }: { isOpen: boolean, onClose: () => void, onShare: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-sm rounded-[3rem] p-10 shadow-4xl relative z-10 animate-in zoom-in-95 text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={48} strokeWidth={2.5} /></div>
        <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter mb-2">Laporan Berjaya</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Data kes telah selamat disimpan ke awan.</p>
        <div className="space-y-3">
          <button onClick={onShare} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3"><Share2 size={18} /> Kongsi ke WhatsApp</button>
          <button onClick={onClose} className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Tutup</button>
        </div>
      </div>
    </div>
  );
};

export const WhatsAppPreviewModal = ({ isOpen, selectedCase, onClose }: { isOpen: boolean, selectedCase: CaseRecord | null, onClose: () => void }) => {
  if (!isOpen || !selectedCase) return null;
  const getWAMessage = () => {
    const formattedDate = new Date(selectedCase.timestamp).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    const [progName, cpName] = selectedCase.programCP.split(' / ');
    const loc = selectedCase.location ? `https://www.google.com/maps?q=${selectedCase.location.lat},${selectedCase.location.lng}` : 'N/A';
    return `🚨 *LAPORAN KES MEDIK AMAL* 🚨\n*ID KES:* ${selectedCase.idKes}\n*STATUS:* ${selectedCase.statusAkhir.toUpperCase()}\nTarikh : ${formattedDate}\n----------------------------------\n📌 *MAKLUMAT PENUGASAN*\n• *Responder:* ${selectedCase.recordedBy}\n• *Program:* ${progName}\n• *Cekpoint :* ${cpName}\n👤 *PROFIL PESAKIT*\n• *Nama:* ${selectedCase.p_name}\n• *Umur:* ${selectedCase.p_age}\n🩺 *TANDA VITAL*\n• *BP:* ${selectedCase.vitalBP} mmHg | *PR:* ${selectedCase.vitalPR} bpm\n✅ *RAWATAN:*\n${selectedCase.treatment}\n📍 *LOKASI:* ${loc}`;
  };
  const handleSendWA = () => { const text = encodeURIComponent(getWAMessage()); window.open(`https://wa.me/?text=${text}`, '_blank'); onClose(); };
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden relative z-10 animate-in zoom-in-95 flex flex-col">
        <div className="p-8 bg-[#25D366] text-white flex justify-between items-center"><div className="flex items-center gap-3"><MessageSquare size={24}/><h3 className="text-xl font-black uppercase italic tracking-tighter">WhatsApp Preview</h3></div><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button></div>
        <div className="p-8"><div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 max-h-[50vh] overflow-y-auto"><pre className="text-[10px] font-bold text-slate-700 whitespace-pre-wrap font-sans">{getWAMessage()}</pre></div><button onClick={handleSendWA} className="w-full py-6 bg-[#25D366] text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3"><Send size={18}/> Hantar WhatsApp</button></div>
      </div>
    </div>
  );
};
