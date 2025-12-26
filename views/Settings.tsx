
import React, { useContext, useState, useRef } from 'react';
import { DataContext } from '../App';
import { parsePdfImport } from '../geminiService';
import * as QRCodeModule from 'qrcode';

// Robust QR generator access
const QRCode = (QRCodeModule as any).default || QRCodeModule;

declare var Html5Qrcode: any;

const Settings: React.FC = () => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { data, updateSettings, importLogs } = context;

  const [isPdfImporting, setIsPdfImporting] = useState(false);
  const [pdfImportMessage, setPdfImportMessage] = useState('');
  
  // UI States
  const [modalMode, setModalMode] = useState<'qr-gen' | 'qr-scan' | 'sync-text' | 'result' | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [syncCode, setSyncCode] = useState<string>('');
  const [pasteInput, setPasteInput] = useState<string>('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count: number }>({ success: false, message: '', count: 0 });
  
  const scannerRef = useRef<any>(null);
  const [currentCamera, setCurrentCamera] = useState<"environment" | "user">("environment");

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfImporting(true);
    setPdfImportMessage('Reading PDF data...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const parsedData = await parsePdfImport(base64);
          const { added } = importLogs(parsedData);
          setPdfImportMessage(`Successfully added ${added} records.`);
          setTimeout(() => {
            setIsPdfImporting(false);
            setPdfImportMessage('');
          }, 4000);
        } catch (err: any) {
          setPdfImportMessage(err.message || 'Failed to parse PDF.');
          setTimeout(() => setIsPdfImporting(false), 5000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsPdfImporting(false);
      alert("Error reading file.");
    }
  };

  /**
   * HYPER-COMPACT CHRONOLOGICAL PROTOCOL (Last 20 Events)
   */
  const hyperCompactEncode = (data: any) => {
    const allEvents: any[] = [
      ...data.feedings.map((e: any) => ({ ...e, _t: 'f' })),
      ...data.diapers.map((e: any) => ({ ...e, _t: 'd' })),
      ...data.sleep.map((e: any) => ({ ...e, _t: 's' })),
      ...data.growth.map((e: any) => ({ ...e, _t: 'g' })),
      ...data.medical.map((e: any) => ({ ...e, _t: 'm' })),
      ...data.milestones.map((e: any) => ({ ...e, _t: 'l' })),
    ].sort((a, b) => (a.timestamp || a.startTime) - (b.timestamp || b.startTime)).slice(-20);

    if (allEvents.length === 0) return btoa('{}');

    const baseTime = (allEvents[0].timestamp || allEvents[0].startTime);
    const msToS = (ms: number) => Math.floor(ms / 1000);
    const baseS = msToS(baseTime);

    const compact = {
      b: baseS,
      e: allEvents.map(e => {
        const timeOffset = msToS(e.timestamp || e.startTime) - baseS;
        switch (e._t) {
          case 'f': return ['f', timeOffset, e.type === 'bottle' ? 0 : 1, e.amountMl || 0, e.leftMinutes || 0, e.rightMinutes || 0];
          case 'd': return ['d', timeOffset, e.type === 'wet' ? 0 : e.type === 'dirty' ? 1 : 2];
          case 's': return ['s', timeOffset, e.endTime ? msToS(e.endTime) - baseS : -1];
          case 'g': return ['g', timeOffset, e.weightKg];
          case 'm': return ['m', timeOffset, e.title];
          case 'l': return ['l', timeOffset, e.title];
          default: return null;
        }
      }).filter(Boolean)
    };

    return btoa(JSON.stringify(compact));
  };

  const hyperCompactDecode = (base64: string) => {
    const compact = JSON.parse(atob(base64.trim()));
    if (!compact.e) return {};
    
    const sToMs = (s: number) => s * 1000;
    const baseMs = sToMs(compact.b);

    const result: any = { feedings: [], diapers: [], sleep: [], growth: [], medical: [], milestones: [] };
    
    compact.e.forEach((e: any) => {
      const [type, offset] = e;
      const eventTime = baseMs + sToMs(offset);
      
      switch (type) {
        case 'f':
          result.feedings.push({ timestamp: eventTime, type: e[2] === 0 ? 'bottle' : 'nursing', amountMl: e[3], leftMinutes: e[4], rightMinutes: e[5] });
          break;
        case 'd':
          result.diapers.push({ timestamp: eventTime, type: e[2] === 0 ? 'wet' : e[2] === 1 ? 'dirty' : 'mixed' });
          break;
        case 's':
          result.sleep.push({ startTime: eventTime, endTime: e[2] === -1 ? undefined : baseMs + sToMs(e[2]) });
          break;
        case 'g':
          result.growth.push({ timestamp: eventTime, weightKg: e[2] });
          break;
        case 'm':
          result.medical.push({ timestamp: eventTime, title: e[2], type: 'visit' });
          break;
        case 'l':
          result.milestones.push({ timestamp: eventTime, title: e[2] });
          break;
      }
    });
    
    return result;
  };

  const downloadBackup = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tinytrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const showPartnerQR = async () => {
    setIsGeneratingQr(true);
    setModalMode('qr-gen');
    setQrImageUrl('');

    try {
      const encoded = hyperCompactEncode(data);
      const url = await QRCode.toDataURL(encoded, { 
        margin: 1, 
        width: 1000,
        errorCorrectionLevel: 'L',
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrImageUrl(url);
    } catch (err) {
      console.error("QR Gen Error:", err);
      setModalMode(null);
      alert("QR Failed. Try Manual Sync.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const startScanner = async () => {
    setModalMode('qr-scan');
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        const config = { 
          fps: 15, 
          qrbox: (w: number, h: number) => ({ width: w * 0.9, height: h * 0.9 }) 
        };
        
        await html5QrCode.start(
          { facingMode: currentCamera }, 
          config, 
          (decodedText: string) => {
            try {
              const parsed = hyperCompactDecode(decodedText);
              const { added } = importLogs(parsed);
              showResult(true, `Synced ${added} new records.`, added);
            } catch (e) {
              showResult(false, "Incompatible QR code version.", 0);
            }
          },
          () => {} 
        );
      } catch (err) {
        setModalMode(null);
        alert("Camera permission required.");
      }
    }, 400);
  };

  const showResult = async (success: boolean, message: string, count: number) => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {}
    }
    setSyncResult({ success, message, count });
    setModalMode('result');
  };

  const closeModal = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {}
    }
    setModalMode(null);
    setQrImageUrl('');
    setPasteInput('');
    setCopiedFeedback(false);
    setIsGeneratingQr(false);
  };

  const flipCamera = async () => {
    const nextCam = currentCamera === "environment" ? "user" : "environment";
    setCurrentCamera(nextCam);
    if (scannerRef.current) {
      await scannerRef.current.stop();
      setTimeout(startScanner, 200);
    }
  };

  const prepareSyncCode = () => {
    setSyncCode(btoa(JSON.stringify(data)));
    setModalMode('sync-text');
  };

  const copySyncCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  const handlePasteImport = () => {
    if (!pasteInput.trim()) return;
    try {
      const parsed = JSON.parse(atob(pasteInput.trim()));
      const { added } = importLogs(parsed);
      showResult(true, `Imported ${added} records.`, added);
    } catch (e) {
      alert("Invalid backup code.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h2>
        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">PWA & Data Management</p>
      </div>

      {/* Units Section */}
      <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Units</h3>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => updateSettings({ unitSystem: 'metric' })}
              className={`flex-1 py-3 rounded-xl font-black transition-all text-[10px] ${data.settings.unitSystem === 'metric' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              METRIC
            </button>
            <button 
              onClick={() => updateSettings({ unitSystem: 'imperial' })}
              className={`flex-1 py-3 rounded-xl font-black transition-all text-[10px] ${data.settings.unitSystem === 'imperial' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              IMPERIAL
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Sync</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={showPartnerQR} className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-2xl active:scale-95 transition-all">
              <i className="fas fa-qrcode text-indigo-600 text-2xl"></i>
              <span className="text-[8px] font-black text-indigo-700 uppercase tracking-widest">Show QR</span>
            </button>
            <button onClick={startScanner} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl active:scale-95 transition-all">
              <i className="fas fa-camera text-emerald-600 text-2xl"></i>
              <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Scan QR</span>
            </button>
          </div>
        </div>
      </section>

      {/* Backup & Import Section */}
      <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Management</h3>
        
        <button onClick={downloadBackup} className="w-full p-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white"><i className="fas fa-download text-sm"></i></div>
            <div className="text-left">
              <span className="text-xs font-black block">Download JSON Backup</span>
              <span className="text-[9px] font-bold uppercase text-indigo-100">Save to device storage</span>
            </div>
          </div>
        </button>

        <button onClick={prepareSyncCode} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between active:bg-slate-100 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm"><i className="fas fa-file-export text-sm"></i></div>
            <div className="text-left">
              <span className="text-xs font-black text-slate-800 block">Manual Code Transfer</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Export full data via code</span>
            </div>
          </div>
          <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
        </button>

        <div className="pt-2">
          <label className={`w-full p-4 bg-white border-2 border-dashed rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isPdfImporting ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-100 active:bg-slate-50'}`}>
            <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfImport} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                {isPdfImporting ? <i className="fas fa-circle-notch fa-spin text-indigo-500"></i> : <i className="fas fa-file-pdf text-sm"></i>}
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-slate-800 block">Import from Other App</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">{pdfImportMessage || 'Upload PDF export report'}</span>
              </div>
            </div>
            {!isPdfImporting && <i className="fas fa-plus text-slate-300 text-xs"></i>}
          </label>
        </div>
      </section>

      {/* MODALS */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-6 flex flex-col items-center gap-6 shadow-2xl relative border border-white/20">
            <button onClick={closeModal} className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
              <i className="fas fa-times"></i>
            </button>
            
            <h3 className="text-lg font-black text-slate-800 tracking-tight pt-2 uppercase tracking-widest text-center">
              {modalMode === 'qr-gen' && 'Partner Sync'}
              {modalMode === 'qr-scan' && 'Scanner'}
              {modalMode === 'sync-text' && 'Backup Code'}
              {modalMode === 'result' && 'Sync Summary'}
            </h3>

            {modalMode === 'qr-gen' && (
              <div className="w-full aspect-square bg-white rounded-3xl flex items-center justify-center p-4 shadow-inner border border-slate-50 overflow-hidden">
                {isGeneratingQr || !qrImageUrl ? (
                  <div className="flex flex-col items-center gap-2 text-slate-300 animate-pulse">
                    <i className="fas fa-circle-notch fa-spin text-2xl"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Preparing...</p>
                  </div>
                ) : (
                  <img src={qrImageUrl} alt="Sync QR" className="w-full h-full object-contain" />
                )}
              </div>
            )}

            {modalMode === 'qr-scan' && (
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl">
                <div id="qr-reader" className="w-full h-full"></div>
                <button onClick={flipCamera} className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/30 active:scale-90">
                  <i className="fas fa-camera-rotate"></i>
                </button>
              </div>
            )}

            {modalMode === 'sync-text' && (
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Your Device History</p>
                  <div className="relative">
                    <textarea readOnly value={syncCode} className="w-full h-20 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[8px] font-mono break-all resize-none outline-none" />
                    <button onClick={copySyncCode} className={`absolute bottom-2 right-2 py-1.5 px-3 rounded-lg font-black text-[8px] uppercase ${copiedFeedback ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                      {copiedFeedback ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Paste Partner History</p>
                  <textarea placeholder="Paste code here..." value={pasteInput} onChange={(e) => setPasteInput(e.target.value)} className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-[8px] font-mono break-all resize-none outline-none focus:ring-1 focus:ring-indigo-500" />
                  <button onClick={handlePasteImport} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Restore from Code</button>
                </div>
              </div>
            )}

            {modalMode === 'result' && (
              <div className="w-full flex flex-col items-center gap-4 py-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl ${syncResult.success ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <i className={`fas ${syncResult.success ? 'fa-check' : 'fa-times'}`}></i>
                </div>
                <div className="text-center space-y-1">
                  <p className={`text-base font-black ${syncResult.success ? 'text-slate-800' : 'text-rose-600'}`}>
                    {syncResult.success ? 'Data Updated' : 'Failed to Sync'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium px-2">{syncResult.message}</p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-400 font-bold px-2 leading-relaxed">
              {modalMode === 'qr-gen' && "Showing strictly the last 20 events in high-scannability mode."}
              {modalMode === 'qr-scan' && "Keep the partner's screen bright and align the QR."}
              {modalMode === 'sync-text' && "Full database transfer using raw text encoding."}
            </p>
            
            <button onClick={closeModal} className="w-full py-4 bg-slate-950 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
              {modalMode === 'result' ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="pt-8 text-center">
        <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">TinyTrack v3.2.0-OFFLINE</p>
      </div>
    </div>
  );
};

export default Settings;
