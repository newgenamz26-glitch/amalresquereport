
import React, { useState, useEffect, useRef } from 'react';
import { X, ClipboardList, Send, User, MapPin, Activity, Heart, CheckCircle, MessageSquare, Zap, ShieldAlert, Clock, Info, Thermometer, Droplets, Navigation, RefreshCw, Map as MapIcon, UserCheck, CheckCircle2, Mic, MicOff, Share2, AlertCircle, ShieldEllipsis, AlertTriangle } from 'lucide-react';
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
      } else {
        // Fallback for browsers that don't support query for microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicStatus('granted');
      }
    } catch (e) {
      console.warn("Permission check failed or not supported:", e);
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
      alert("Akses mikrofon disekat. Sila benarkan akses dalam tetapan pelayar anda (biasanya pada ikon mangga di bar alamat) untuk menggunakan fungsi rakaman suara AI.");
      return;
    }

    if (isListeningSymptoms) {
      stopVoice();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListeningSymptoms(true);
      setMicStatus('granted');

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      if (inputAudioContext.state === 'suspended') {
        await inputAudioContext.resume();
      }

      const sessionPromise = startLiveAssistant({
        onopen: () => {
          console.debug('Live session opened');
        },
        onmessage: (message: any) => {
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            setFormData(prev => ({ ...prev, symptoms: prev.symptoms + text }));
          }
        },
        onerror: (e: any) => {
          console.error("Live session error", e);
          stopVoice();
        },
        onclose: () => {
          console.debug('Live session closed');
          stopVoice();
        },
      });

      const session = await sessionPromise;
      sessionRef.current = session;

      const source = inputAudioContext.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise.then((activeSession) => {
          activeSession.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);
      (window as any)._voiceResources = { stream, inputAudioContext, scriptProcessor };

    } catch (error: any) {
      console.error("Mic error:", error);
      setIsListeningSymptoms(false);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.message?.includes('denied')) {
        setMicStatus('denied');
      } else {
        alert("Ralat Mikrofon: Pastikan peranti anda mempunyai mikrofon dan sambungan internet yang stabil.");
      }
    }
  };

  const stopVoice = () => {
    setIsListeningSymptoms(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
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
      { p_name: 'Muhammad Ali', p_age: '24', p_gender: Gender.MALE, symptoms: 'Sakit dada berterusan selepas larian 5km, sesak nafas.', kesedaran: 'Sedar Sepenuhnya', vitalBP: '145/95', vitalPR: '110', vitalDXT: '5.6', vitalTemp: '37.2', treatment: 'Diberikan Rehat & Bantuan Oksigen 4LPM.', statusAkhir: 'Dirujuk Hospital' },
      { p_name: 'Siti Aminah', p_age: '45', p_gender: Gender.FEMALE, symptoms: 'Pitam selepas larian, penglihatan kabur.', kesedaran: 'Keliru', vitalBP: '90/60', vitalPR: '65', vitalDXT: '4.2', vitalTemp: '36.5', treatment: 'Kaki ditinggikan, pantauan vital.', statusAkhir: 'Pemerhatian' }
    ];
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setFormData(prev => ({ ...prev, ...randomSample }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.p_name || !formData.p_age || !formData.symptoms || !formData.treatment) {
      alert("Sila isi semua medan wajib (*).");
      return;
    }
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
        
        {/* Status Mic Banner - Paling Atas */}
        {micStatus === 'denied' && (
          <div className="p-4 bg-rose-600 rounded-[2rem] text-white flex items-center gap-4 animate-in slide-in-from-top-4 shadow-lg shadow-rose-200">
            <div className="p-2 bg-white/20 rounded-xl"><AlertTriangle size={20}/></div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Akses Mikrofon Disekat</p>
              <p className="text-[8px] font-bold text-rose-100 uppercase tracking-tight">Sila benarkan akses di tetapan pelayar anda.</p>
            </div>
            <button type="button" onClick={checkMicPermission} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <RefreshCw size={14}/>
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isSimulasi ? 'bg-amber-100 text-amber-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}><ClipboardList size={24}/></div>
            <div>
              <h3 className="font-black uppercase italic text-2xl tracking-tighter leading-none">Borang Kes</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Responder ResQ Amal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleAutoFill} title="Auto Fill Data" className="p-2.5 bg-white text-amber-500 rounded-xl hover:bg-amber-50 border border-slate-100 shadow-sm transition-all active:scale-90"><Zap size={20}/></button>
            <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={28}/></button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={Navigation} title="Auto Location Pin" />
            <div className={`p-4 rounded-[1.5rem] border flex items-center justify-between transition-all ${location ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${location ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Koordinat Semasa</p>
                  <p className="text-[11px] font-bold text-slate-900 font-mono">
                    {isLocating ? 'Mencari Satelit...' : location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : (locError || 'Gagal Dikesan')}
                  </p>
                </div>
              </div>
              <button type="button" onClick={fetchLocation} className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm active:scale-90">
                <RefreshCw size={14} className={isLocating ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div>
            <SectionHeader icon={User} title="Data Pesakit" />
            <div className="bg-white p-5 rounded-[2rem] space-y-3 shadow-sm border border-slate-100">
              <div className="space-y-1">
                <InputLabel required>Nama Pesakit</InputLabel>
                <input required placeholder="Nama penuh" value={formData.p_name} onChange={e => setFormData({...formData, p_name: e.target.value})} className={inputClasses} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <InputLabel required>Umur</InputLabel>
                  <input required type="number" placeholder="Tahun" value={formData.p_age} onChange={e => setFormData({...formData, p_age: e.target.value})} className={inputClasses} />
                </div>
                <div className="space-y-1">
                  <InputLabel required>Jantina</InputLabel>
                  <select value={formData.p_gender} onChange={e => setFormData({...formData, p_gender: e.target.value as Gender})} className={inputClasses}>
                    <option value={Gender.MALE}>Lelaki</option><option value={Gender.FEMALE}>Perempuan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader icon={ShieldAlert} title="Maklumat Perubatan" />
            <div className="bg-white p-5 rounded-[2rem] space-y-3 shadow-sm border border-slate-100">
              <div className="space-y-1">
                <InputLabel 
                  required 
                  onMicClick={startVoice} 
                  isListening={isListeningSymptoms} 
                  isDenied={micStatus === 'denied'}
                >
                  Aduan / Simptom
                </InputLabel>

                {!isListeningSymptoms && micStatus !== 'denied' && (
                  <div className="mx-3 mt-1 mb-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 animate-in fade-in">
                    <Info size={12} className="text-blue-500 shrink-0" />
                    <p className="text-[7px] font-bold text-blue-400 uppercase leading-none">
                      Tekan ikon mikrofon untuk rakam suara ke teks (AI).
                    </p>
                  </div>
                )}

                <textarea required placeholder={isListeningSymptoms ? "Sila bercakap sekarang..." : "Nyatakan aduan pesakit..."} value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} className={`${inputClasses} h-20 resize-none ${isListeningSymptoms ? 'border-blue-300 ring-4 ring-blue-500/5' : ''}`} />
              </div>
              <div className="space-y-1">
                <InputLabel required>Kesedaran</InputLabel>
                <select value={formData.kesedaran} onChange={e => setFormData({...formData, kesedaran: e.target.value})} className={inputClasses}>
                  <option>Sedar Sepenuhnya</option>
                  <option>Keliru / Disorientasi</option>
                  <option>Vocal (Respon Suara)</option>
                  <option>Pain (Respon Sakit)</option>
                  <option>Unresponsive</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader icon={Activity} title="Tanda Vital" />
            <div className="bg-white p-5 rounded-[2rem] grid grid-cols-2 gap-3 shadow-sm border border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1 ml-3"><Heart size={10} className="text-rose-500"/><InputLabel>BP</InputLabel></div>
                <input placeholder="120/80" value={formData.vitalBP} onChange={e => setFormData({...formData, vitalBP: e.target.value})} className={`${inputClasses} text-center`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1 ml-3"><Activity size={10} className="text-blue-500"/><InputLabel>PR</InputLabel></div>
                <input placeholder="80" value={formData.vitalPR} onChange={e => setFormData({...formData, vitalPR: e.target.value})} className={`${inputClasses} text-center`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1 ml-3"><Droplets size={10} className="text-amber-600"/><InputLabel>DXT</InputLabel></div>
                <input placeholder="5.6" value={formData.vitalDXT} onChange={e => setFormData({...formData, vitalDXT: e.target.value})} className={`${inputClasses} text-center`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1 ml-3"><Thermometer size={10} className="text-orange-500"/><InputLabel>Temp</InputLabel></div>
                <input placeholder="37.0" value={formData.vitalTemp} onChange={e => setFormData({...formData, vitalTemp: e.target.value})} className={`${inputClasses} text-center`} />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader icon={UserCheck} title="Pengurusan Perawatan" />
            <div className="bg-white p-5 rounded-[2rem] space-y-4 shadow-sm border border-slate-100">
              <div className="space-y-1">
                <InputLabel required>Nama Perawat</InputLabel>
                <input required placeholder="Nama perawat kes..." value={formData.namaPerawat} onChange={e => setFormData({...formData, namaPerawat: e.target.value})} className={inputClasses} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <InputLabel>Masa Mula</InputLabel>
                  <div className="p-3 bg-slate-50 rounded-xl text-center font-bold text-xs text-slate-600 flex items-center justify-center gap-2">
                    <Clock size={12} /> {formData.masaMula}
                  </div>
                </div>
                <div className="space-y-1">
                  <InputLabel>Masa Akhir</InputLabel>
                  <div className="p-3 bg-blue-50/50 rounded-xl text-center font-bold text-xs text-blue-600 italic">
                    Auto-Capture
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <InputLabel required>Rawatan / Tindakan</InputLabel>
                <textarea required placeholder="Rawatan yang diberikan..." value={formData.treatment} onChange={e => setFormData({...formData, treatment: e.target.value})} className={`${inputClasses} h-24 resize-none`} />
              </div>
              
              <div className="space-y-1">
                <InputLabel required>Status Akhir</InputLabel>
                <select value={formData.statusAkhir} onChange={e => setFormData({...formData, statusAkhir: e.target.value})} className={inputClasses}>
                  <option>Selesai</option>
                  <option>Pemerhatian</option>
                  <option>Dirujuk Hospital</option>
                  <option>Ditolak Pesakit</option>
                </select>
              </div>
            </div>
          </div>

          <button className={`w-full text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isSimulasi ? 'bg-amber-600 shadow-amber-200' : 'bg-blue-600 shadow-blue-300'} shadow-xl active:scale-95 text-[11px]`}>
            <Send size={16}/> Simpan Laporan Kes
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Case Detail Modal ---
export const CaseDetailModal = ({ selectedCase, onClose }: { selectedCase: CaseRecord | null, onClose: () => void }) => {
  if (!selectedCase) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-lg" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-4xl relative z-10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className={`p-8 ${selectedCase.isSimulasi ? 'bg-amber-500' : 'bg-blue-600'} text-white shrink-0`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{selectedCase.idKes}</p>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedCase.p_name}</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Pesakit</p>
               <p className="text-xs font-bold text-slate-900 uppercase">{selectedCase.p_age} Tahun • {selectedCase.p_gender}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Masa</p>
               <p className="text-xs font-bold text-slate-900 uppercase">{selectedCase.masaMula} - {selectedCase.masaAkhir}</p>
            </div>
          </div>

          <div>
            <SectionHeader icon={ShieldAlert} title="Aduan & Kesedaran" />
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4">
              <div>
                <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Simptom</p>
                <p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{selectedCase.symptoms}"</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Tahap Kesedaran</p>
                <p className="text-xs font-bold text-slate-900 uppercase">{selectedCase.kesedaran}</p>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader icon={Activity} title="Tanda Vital" />
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'BP', value: selectedCase.vitalBP, icon: Heart, color: 'text-rose-500' },
                { label: 'PR', value: selectedCase.vitalPR, icon: Activity, color: 'text-blue-500' },
                { label: 'DXT', value: selectedCase.vitalDXT, icon: Droplets, color: 'text-amber-500' },
                { label: 'TEMP', value: selectedCase.vitalTemp, icon: Thermometer, color: 'text-orange-500' }
              ].map((v, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <v.icon size={12} className={`mx-auto mb-1 ${v.color}`} />
                  <p className="text-[7px] font-black text-slate-400 uppercase">{v.label}</p>
                  <p className="text-[10px] font-black text-slate-900">{v.value || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={UserCheck} title="Rawatan & Tindakan" />
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4">
              <p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{selectedCase.treatment}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${selectedCase.statusAkhir === 'Dirujuk Hospital' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                  Status: {selectedCase.statusAkhir}
                </div>
              </div>
            </div>
          </div>

          {selectedCase.location && (
            <div>
              <SectionHeader icon={MapPin} title="Lokasi Geotag" />
              <a 
                href={`https://www.google.com/maps?q=${selectedCase.location.lat},${selectedCase.location.lng}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <MapIcon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Lihat Koordinat di Peta</span>
                </div>
                <Navigation size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase">Perawat Bertugas</p>
              <p className="text-[10px] font-black text-slate-900 uppercase">{selectedCase.namaPerawat}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase">Tarikh Rekod</p>
              <p className="text-[10px] font-black text-slate-900 uppercase">{new Date(selectedCase.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Submission Success Modal ---
export const SubmissionSuccessModal = ({ isOpen, onClose, onShare }: { isOpen: boolean, onClose: () => void, onShare: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-sm rounded-[3rem] p-10 shadow-4xl relative z-10 animate-in zoom-in-95 text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100 animate-bounce">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter mb-2">Laporan Berjaya</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">
          Data kes telah selamat disimpan ke pangkalan data awan.
        </p>
        <div className="space-y-3">
          <button onClick={onShare} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3">
            <Share2 size={18} /> Kongsi ke WhatsApp
          </button>
          <button onClick={onClose} className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
};

// --- WhatsApp Preview Modal ---
export const WhatsAppPreviewModal = ({ isOpen, selectedCase, onClose }: { isOpen: boolean, selectedCase: CaseRecord | null, onClose: () => void }) => {
  if (!isOpen || !selectedCase) return null;

  const getWAMessage = () => {
    const loc = selectedCase.location ? `\nLOKASI: https://www.google.com/maps?q=${selectedCase.location.lat},${selectedCase.location.lng}` : '';
    return `*LAPORAN KES RESQ AMAL*
----------------------
ID KES: ${selectedCase.idKes}
NAMA: ${selectedCase.p_name} (${selectedCase.p_age} thn)
JANTINA: ${selectedCase.p_gender}
SIMPTOM: ${selectedCase.symptoms}
VITAL: BP ${selectedCase.vitalBP || '-'}, PR ${selectedCase.vitalPR || '-'}, DXT ${selectedCase.vitalDXT || '-'}, TEMP ${selectedCase.vitalTemp || '-'}
RAWATAN: ${selectedCase.treatment}
STATUS: ${selectedCase.statusAkhir}
REKOD OLEH: ${selectedCase.namaPerawat}${loc}`;
  };

  const handleSendWA = () => {
    const text = encodeURIComponent(getWAMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-4xl relative z-10 animate-in zoom-in-95 flex flex-col">
        <div className="p-8 bg-[#25D366] text-white shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MessageSquare size={24}/>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">WhatsApp Preview</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
        </div>
        <div className="p-8 flex-1">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
            <pre className="text-[10px] font-bold text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {getWAMessage()}
            </pre>
          </div>
          <button onClick={handleSendWA} className="w-full py-6 bg-[#25D366] text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-3">
            <Send size={18}/> Hantar ke WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
