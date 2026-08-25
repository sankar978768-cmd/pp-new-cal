
import React, { useState, useRef, ChangeEvent } from 'react';
import {
  Moon, Star, Feather, RefreshCw, ChevronDown, Sparkles,
  Calendar, Clock, Calculator, MapPin, Upload, Download, FileText,
  CheckCircle, Loader, AlertTriangle, Globe, Info, Users
} from 'lucide-react';
import { CITIES, NAKSHATRAS, RASIS } from './constants';
import { getDayAnalysis, getBird, normalizeDate } from './services/astroService';
import { BulkDataRow, DaySegment, InputMethod } from './types';

const PanchaPakshiApp = () => {
  const [step, setStep] = useState<number>(1);
  const [inputMethod, setInputMethod] = useState<InputMethod>('date');
  
  // Manual State
  const [paksha, setPaksha] = useState<'shukla' | 'krishna'>('shukla');
  const [nakshatra, setNakshatra] = useState<string>('');
  const [selectedRasi, setSelectedRasi] = useState<string>('');
  
  // Date Calc State
  const [birthDate, setBirthDate] = useState<string>('');
  
  // Bulk State
  const [bulkData, setBulkData] = useState<BulkDataRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [multiBirdDetectedCount, setMultiBirdDetectedCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location State
  const [selectedCity, setSelectedCity] = useState<string>('India - Chennai');
  const [timezone, setTimezone] = useState<number>(5.5); // IST default

  const [calcStatus, setCalcStatus] = useState<string>(''); 
  const [daySegments, setDaySegments] = useState<DaySegment[]>([]); 

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    const city = CITIES.find(c => c.name === cityName);
    if (city && cityName !== 'Custom') {
      setTimezone(city.timezone);
    }
  };

  const handleTimezoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsed = parseFloat(value);
    setTimezone(isNaN(parsed) ? 0 : parsed);
    setSelectedCity('Custom');
  };

  const downloadSampleCSV = () => {
    const rows = [
      "Name,Date,City,Timezone",
      "John Doe,25/05/1990,India - Chennai,",
      "Jane Smith,1995-10-12,,-5.0",
      "Robert,15-03-1988,USA - New York,"
    ];
    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pancha_pakshi_bulk_template.csv';
    link.click();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = text.split(/\r\n|\n|\r/).map(row => row.trim()).filter(row => row);
        
        if (rows.length < 2) {
          alert("CSV file seems empty or lacks data rows.");
          return;
        }

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('dob'));
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const cityIdx = headers.findIndex(h => h.includes('city') || h.includes('location'));
        const tzIdx = headers.findIndex(h => h.includes('timezone') || h.includes('offset'));
        
        if (dateIdx === -1) {
          alert("Could not find a 'Date' column.");
          return;
        }

        const data: BulkDataRow[] = rows.slice(1).map((row): BulkDataRow | null => {
          const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (!cols[dateIdx]) return null;

          const rawDate = cols[dateIdx];
          const normalized = normalizeDate(rawDate);
          const cityRaw = cityIdx !== -1 ? cols[cityIdx] : undefined;
          const tzRaw = tzIdx !== -1 ? cols[tzIdx] : undefined;
          
          let resolvedTz: number | undefined = undefined;
          let cityFound = false;

          if (cityRaw && cityRaw.trim() !== '') {
             const cityObj = CITIES.find(c => c.name.toLowerCase() === cityRaw.trim().toLowerCase());
             if (cityObj) {
               resolvedTz = cityObj.timezone;
               cityFound = true;
             }
          }
          if (!cityFound && tzRaw && tzRaw.trim() !== '' && !isNaN(parseFloat(tzRaw))) {
             resolvedTz = parseFloat(tzRaw);
          }

          return {
            name: nameIdx !== -1 ? cols[nameIdx] : 'Unknown',
            date: normalized || rawDate,
            error: !normalized ? 'Unsupported format' : undefined,
            city: cityRaw,
            timezone: tzRaw,
            resolvedTimezone: resolvedTz
          };
        }).filter((item): item is BulkDataRow => item !== null);

        setBulkData(data);
        setMultiBirdDetectedCount(0);
      } catch (err) {
        if (err instanceof Error) alert("Error: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const processBulk = async () => {
    setIsProcessing(true);
    setProcessProgress(0);
    let multiCount = 0;
    
    const results: BulkDataRow[] = [];
    const total = bulkData.length;

    for (let i = 0; i < total; i++) {
      const item = bulkData[i];
      if (item.error) {
         results.push(item);
      } else {
         try {
           const finalTz = item.resolvedTimezone !== undefined ? item.resolvedTimezone : timezone;
           const analysis = getDayAnalysis(item.date, finalTz);
           
           if (analysis.length > 1) multiCount++;

           const mainSegment = analysis.reduce((prev, current) => ((prev.duration || 0) > (current.duration || 0)) ? prev : current);
           const secondarySegments = analysis.filter(s => s !== mainSegment);
           
           results.push({
             ...item,
             analysis,
             resolvedTimezone: finalTz,
             mainBird: mainSegment.bird ? `${mainSegment.bird.name} (${mainSegment.bird.tamil})` : 'Unknown',
             mainPercent: mainSegment.percent,
             mainNakshatra: mainSegment.nakshatraName,
             mainRasi: mainSegment.rasiName,
             paksha: 'General Method',
             secondary: secondarySegments.length > 0 ? secondarySegments.map(s => `${s.bird?.name} (${s.bird?.tamil}) [${s.percent}%]`).join(' | ') : 'None'
           });
         } catch (err) {
           results.push({ ...item, error: 'Calculation Error' });
         }
      }
      setProcessProgress(Math.round(((i + 1) / total) * 100));
      await new Promise(r => setTimeout(r, 10));
    }

    setBulkData(results);
    setMultiBirdDetectedCount(multiCount);
    setIsProcessing(false);
  };

  const exportBulkResults = () => {
    // Extensive headers to satisfy the requirement
    let csvContent = "Name,Date,City,Input Timezone,Resolved Timezone,Multiple Birds?,Primary Bird,Primary %,Secondary Birds,Nakshatras,Rasi,Calculation Method,Full Bird Summary,Error\n";
    
    bulkData.forEach(row => {
      const locStr = row.city || '';
      const inputTzStr = row.timezone || '';
      const resolvedTzStr = row.resolvedTimezone !== undefined ? row.resolvedTimezone : '';
      const errorStr = row.error || '';

      if (row.analysis) {
        const isMulti = row.analysis.length > 1 ? "YES" : "NO";
        const allNaks = row.analysis.map(s => s.nakshatraName).join(' -> ');
        const allRasis = row.analysis.map(s => s.rasiName).join(' -> ');
        const fullSummary = row.analysis.map(s => `${s.bird?.name} (${s.percent}%)`).join(' | ');
        
        csvContent += `"${row.name}","${row.date}","${locStr}","${inputTzStr}","${resolvedTzStr}","${isMulti}","${row.mainBird}","${row.mainPercent}%","${row.secondary}","${allNaks}","${allRasis}","${row.paksha}","${fullSummary}",""\n`;
      } else {
        csvContent += `"${row.name}","${row.date}","${locStr}","${inputTzStr}","${resolvedTzStr}",,,,,,,,,"${errorStr}"\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pancha_pakshi_results_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleCalculateFromDate = () => {
    if (!birthDate) return;
    setCalcStatus('calculating');
    setTimeout(() => {
      try {
        const segments = getDayAnalysis(birthDate, timezone);
        setDaySegments(segments);
        setCalcStatus('done');
        setStep(2);
      } catch (e) {
        setCalcStatus('error');
      }
    }, 100);
  };

  const handleManualCalculate = () => {
    if (!nakshatra) return;
    const nId = parseInt(nakshatra);
    const bird = getBird(nId);
    
    let rasiId: number;
    const nData = NAKSHATRAS.find(n => n.id === nId);
    
    if (nData && nData.rasiIds.length > 1 && selectedRasi) {
      rasiId = parseInt(selectedRasi);
    } else if (nData) {
      rasiId = nData.rasiIds[0];
    } else {
      rasiId = 1;
    }

    const rasi = RASIS.find(r => r.id === rasiId);
    const rasiName = rasi ? `${rasi.symbol} ${rasi.tamil} (${rasi.name})` : undefined;
    
    setDaySegments([{
      startMins: 0, endMins: 1440, startTimeStr: "00:00", endTimeStr: "24:00", percent: "100",
      nakshatraId: nId, nakshatraName: nData?.name,
      rasiName: rasiName,
      paksha: 'shukla', bird: bird
    }]);
    setStep(2);
  };

  const Header = () => (
    <div className="w-full text-center mb-8 relative z-10">
      <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-4 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <Feather className="w-8 h-8 text-amber-400" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wider font-serif">
        Pancha Pakshi
      </h1>
      <p className="text-slate-400 mt-2 text-sm tracking-widest uppercase opacity-80">Five Birds Astrology</p>
    </div>
  );

  const BulkUploadScreen = () => {
    const errorCount = bulkData.filter(d => d.error).length;
    const multiBirdEntries = bulkData.filter(d => d.analysis && d.analysis.length > 1);
    
    return (
      <div className="w-full max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
         <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Bulk Calculator
              </h2>
              <p className="text-xs text-slate-400 mt-1">Multi-bird detection & detailed exports</p>
            </div>
            <button onClick={downloadSampleCSV} className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-3 h-3" /> Sample CSV
            </button>
         </div>

         {bulkData.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 hover:border-amber-500/50 hover:bg-slate-800/50 rounded-2xl p-12 text-center cursor-pointer transition-all group"
            >
               <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-400" />
               </div>
               <p className="text-slate-300 font-medium">Click to upload CSV</p>
               <p className="text-xs text-slate-500 mt-2">Supports multiple date formats (e.g. 25/05/1990 or 1990-05-25)</p>
            </div>
         ) : (
            <div className="space-y-4">
               <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-300 text-sm font-medium">{bulkData.length} records loaded</span>
                    {errorCount > 0 && (
                      <span className="ml-3 text-xs text-red-400 font-medium flex items-center gap-1 inline-flex">
                        <AlertTriangle className="w-3 h-3" /> {errorCount} date issues
                      </span>
                    )}
                  </div>
                  <button onClick={() => setBulkData([])} className="text-xs text-red-400 hover:text-red-300">Clear</button>
               </div>

               {isProcessing ? (
                  <div className="bg-slate-800 p-6 rounded-xl text-center">
                     <Loader className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                     <p className="text-amber-100 text-sm font-medium mb-2">Processing...</p>
                     <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${processProgress}%` }}></div>
                     </div>
                     <p className="text-xs text-slate-500 mt-2">{processProgress}% complete</p>
                  </div>
               ) : (
                 <>
                   {bulkData[0].analysis ? (
                     <div className="space-y-4">
                       <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl">
                          <div className="flex flex-col items-center text-center mb-6">
                             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                               <CheckCircle className="w-6 h-6 text-green-400" />
                             </div>
                             <h3 className="text-amber-100 font-bold text-lg">Batch Complete</h3>
                             <p className="text-slate-400 text-xs">Total analyzed: {bulkData.length}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Single Bird</span>
                                <span className="text-xl font-serif text-white">{bulkData.length - multiBirdDetectedCount - errorCount}</span>
                             </div>
                             <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                <span className="block text-[10px] text-amber-500/80 uppercase font-bold mb-1 flex items-center gap-1">
                                   <AlertTriangle className="w-3 h-3" /> Mixed Energy
                                </span>
                                <span className="text-xl font-serif text-amber-200">{multiBirdDetectedCount}</span>
                             </div>
                          </div>

                          <button 
                            onClick={exportBulkResults}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/30"
                          >
                            <Download className="w-4 h-4" /> Export Highlighted Results CSV
                          </button>
                       </div>

                       {multiBirdEntries.length > 0 && (
                         <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4">
                            <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3 flex items-center gap-2">
                               <Users className="w-3 h-3 text-amber-400" /> Mixed Energy Highlights (2+ Birds)
                            </h4>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                               {multiBirdEntries.map((entry, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                    <div className="flex flex-col">
                                       <span className="text-xs font-semibold text-amber-100">{entry.name}</span>
                                       <span className="text-[10px] text-slate-500">{entry.date}</span>
                                    </div>
                                    <div className="flex gap-1">
                                       {entry.analysis?.map((seg, sIdx) => (
                                         <span key={sIdx} title={`${seg.bird?.name} (${seg.percent}%)`} className="text-[14px]">
                                           {seg.bird?.icon}
                                         </span>
                                       ))}
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                     </div>
                   ) : (
                     <button 
                        onClick={processBulk}
                        disabled={errorCount === bulkData.length}
                        className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${errorCount === bulkData.length ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-900/40'}`}
                     >
                        <Sparkles className="w-5 h-5" /> Calculate All Records
                     </button>
                   )}
                 </>
               )}
            </div>
         )}
      </div>
    );
  };

  const minsToTime = (m: number) => `${Math.floor(m/60).toString().padStart(2,'0')}:${Math.floor(m%60).toString().padStart(2,'0')}`;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-200 selection:bg-amber-500/30 font-sans flex flex-col items-center py-12 px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      </div>

      <Header />

      <main className="w-full relative z-10 max-w-4xl">
        {step === 1 && (
           <>
              <div className="flex bg-slate-800/80 p-1 rounded-xl mb-8 max-w-lg mx-auto backdrop-blur-md">
                <button onClick={() => setInputMethod('date')} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${inputMethod === 'date' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Calculator className="w-4 h-4" /> Date
                </button>
                <button onClick={() => setInputMethod('manual')} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${inputMethod === 'manual' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Feather className="w-4 h-4" /> Manual
                </button>
                <button onClick={() => setInputMethod('bulk')} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${inputMethod === 'bulk' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                  <FileText className="w-4 h-4" /> Bulk Calc
                </button>
              </div>

              {inputMethod === 'bulk' ? (
                 <BulkUploadScreen />
              ) : (
                <div className="w-full max-w-lg mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
                  {inputMethod === 'date' ? (
                     <div className="space-y-6">
                       <div>
                         <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-3">1. Birth Date</label>
                         <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                           <input type="date" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); setCalcStatus(''); }} className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3.5 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors shadow-inner" />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2">
                           <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-3">2. Location Selection</label>
                           <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <select value={selectedCity} onChange={handleCityChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3.5 pl-12 pr-10 text-slate-200 focus:outline-none focus:border-amber-500 appearance-none shadow-inner">
                                 {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                           </div>
                         </div>
                         
                         <div className="md:col-span-2">
                           <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-3">3. Timezone (GMT Offset)</label>
                           <div className="relative">
                             <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                             <input 
                               type="number" 
                               step="0.25" 
                               value={timezone} 
                               onChange={handleTimezoneChange} 
                               className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3.5 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors shadow-inner" 
                               placeholder="e.g. 5.5"
                             />
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">HRS</div>
                           </div>
                         </div>
                       </div>

                       <button onClick={handleCalculateFromDate} className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-sm font-bold transition-all mt-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]">
                         {calcStatus === 'calculating' ? (
                           <>
                             <Loader className="w-4 h-4 animate-spin" />
                             Scanning Cycles...
                           </>
                         ) : (
                           <>
                             <Calculator className="w-4 h-4" />
                             Analyze Birth Cycles
                           </>
                         )}
                       </button>
                     </div>
                  ) : (
                    <div className="space-y-6">
                       {/* General Method Info Banner */}
                       <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs">
                          <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                             <Sparkles className="w-4 h-4" />
                             <span>பொது பஞ்ச பட்சி முறை (General Method)</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>1–5 (அஸ்வினி – மிருகசீரிஷம்):</span>
                               <span className="font-semibold text-amber-200">🦅 வல்லூறு (Vulture)</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>6–11 (திருவாதிரை – பூரம்):</span>
                               <span className="font-semibold text-amber-200">🦉 ஆந்தை (Owl)</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>12–16 (உத்திரம் – விசாகம்):</span>
                               <span className="font-semibold text-amber-200">🐦‍⬛ காகம் (Crow)</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>17–21 (அனுஷம் – உத்திராடம்):</span>
                               <span className="font-semibold text-amber-200">🐓 சேவல் (Cock)</span>
                             </div>
                             <div className="flex justify-between py-1">
                               <span>22–27 (திருவோணம் – ரேவதி):</span>
                               <span className="font-semibold text-amber-200">🦚 மயில் (Peacock)</span>
                             </div>
                          </div>
                       </div>

                       <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-2 ml-1">Select Nakshatra (நட்சத்திரம்)</label>
                          <div className="relative group">
                             <select 
                               value={nakshatra} 
                               onChange={(e) => {
                                 const id = e.target.value;
                                 setNakshatra(id);
                                 const n = NAKSHATRAS.find(item => item.id === parseInt(id));
                                 if (n && n.rasiIds.length === 1) {
                                   setSelectedRasi(n.rasiIds[0].toString());
                                 } else {
                                   setSelectedRasi('');
                                 }
                               }} 
                               className="w-full appearance-none bg-slate-800/80 text-amber-50 border border-slate-600 rounded-xl p-4 pr-10 focus:outline-none focus:border-amber-500 shadow-inner"
                             >
                               <option value="" disabled>-- Choose Nakshatra / நட்சத்திரம் --</option>
                               {NAKSHATRAS.map((n) => (
                                 <option key={n.id} value={n.id} className="bg-slate-900">
                                   {n.id}. {n.tamil ? `${n.tamil} (${n.name})` : n.name}
                                 </option>
                               ))}
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       {nakshatra && NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.length! > 1 && (
                         <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-2 ml-1">Select Rasi (Sign)</label>
                            <select 
                              value={selectedRasi} 
                              onChange={(e) => setSelectedRasi(e.target.value)} 
                              className="w-full appearance-none bg-slate-800/80 text-amber-50 border border-slate-600 rounded-xl p-4 pr-10 focus:outline-none focus:border-amber-500 shadow-inner"
                            >
                              <option value="" disabled>-- Choose Rasi --</option>
                              {NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.map(rId => {
                                const r = RASIS.find(item => item.id === rId);
                                return <option key={rId} value={rId} className="bg-slate-900">{r?.symbol} {r?.name} ({r?.tamil})</option>;
                              })}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 mt-3 text-slate-400 pointer-events-none" />
                         </div>
                       )}

                       <button 
                         onClick={handleManualCalculate} 
                         disabled={!nakshatra || (NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.length! > 1 && !selectedRasi)} 
                         className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${(!nakshatra || (NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.length! > 1 && !selectedRasi)) ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-900/30'}`}
                       >
                         <Sparkles className="w-5 h-5" /> Reveal My Bird
                       </button>
                    </div>
                  )}
                </div>
              )}
           </>
        )}

        {step === 2 && (
           <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full mb-3">
                  <span className={`w-2 h-2 rounded-full ${daySegments.length > 1 ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    {daySegments.length > 1 ? 'Mixed Energy Analysis' : 'Stable Energy Analysis'}
                  </span>
                </div>
                <h2 className="text-3xl font-serif text-amber-100 mb-2">
                  {daySegments.length > 1 ? 'Multiple Birds Active' : 'Single Bird Ruling'}
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  {daySegments.length > 1 
                    ? 'Astronomical transitions today result in a change of your ruling bird. Pay attention to the timing.' 
                    : 'Your ruling bird remains constant throughout the birth cycle of this day.'}
                </p>
             </div>
             
             {daySegments.length > 1 && (
               <div className="mb-8 w-full h-4 bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700">
                  {daySegments.map((seg, idx) => (
                    <div 
                      key={idx} 
                      style={{ width: `${seg.percent}%` }} 
                      className={`h-full relative group ${idx % 2 === 0 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          {seg.bird?.name} ({seg.percent}%)
                       </div>
                    </div>
                  ))}
               </div>
             )}

             <div className={`grid gap-6 ${daySegments.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'}`}>
                {daySegments.map((segment, index) => {
                   const isPrimary = daySegments.length === 1 || parseFloat(segment.percent || "0") > 50;
                   const isMulti = daySegments.length > 1;
                   
                   return (
                     <div 
                        key={index} 
                        className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-500 ${
                           isPrimary 
                           ? 'bg-slate-900/90 border-amber-500/40 shadow-2xl scale-100 z-10' 
                           : 'bg-slate-800/80 border-slate-700 opacity-90 scale-95 hover:scale-100 hover:opacity-100'
                        } ${isMulti && isPrimary ? 'ring-2 ring-amber-500/20' : ''}`}
                     >
                        {isMulti && isPrimary && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg transform rotate-3">
                            Primary
                          </div>
                        )}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 ${isPrimary ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        <div className="flex justify-between items-start mb-4 relative">
                           <div>
                              <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${isPrimary ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-600/30 text-slate-300'}`}>{segment.percent}% of Day</span>
                              <div className="mt-2 flex items-baseline gap-2">
                                <h3 className="text-3xl font-serif text-white">{segment.bird?.name}</h3>
                                <span className="text-lg text-amber-300 font-medium">({segment.bird?.tamil})</span>
                                <span className="text-xs text-slate-400 italic">({segment.bird?.sanskrit})</span>
                              </div>
                              <div className="mt-1 text-sm text-slate-400">Element: <span className="text-amber-200">{segment.bird?.element}</span></div>
                           </div>
                           <div className="text-5xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">{segment.bird?.icon}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-slate-400 mt-4 bg-black/20 p-3 rounded-lg border border-white/5 relative">
                           <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {segment.startTimeStr || minsToTime(segment.startMins)} - {segment.endTimeStr || minsToTime(segment.endMins)}</div>
                           <div className="hidden sm:block w-px h-3 bg-slate-700"></div>
                           <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {segment.nakshatraName}</div>
                           {segment.rasiName && (
                             <>
                               <div className="hidden sm:block w-px h-3 bg-slate-700"></div>
                               <div className="flex items-center gap-1 text-amber-200"><Info className="w-3 h-3" /> {segment.rasiName}</div>
                             </>
                           )}
                           <div className="hidden sm:block w-px h-3 bg-slate-700"></div>
                           <div className="flex items-center gap-1 text-slate-400"><Sparkles className="w-3 h-3 text-amber-400" /> பொது முறை (General Method)</div>
                        </div>
                     </div>
                   );
                })}
             </div>

             <div className="mt-12 text-center">
               <button onClick={() => { setStep(1); setDaySegments([]); }} className="group inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-all text-sm uppercase tracking-widest font-bold">
                 <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Check Another
               </button>
             </div>
           </div>
        )}
      </main>

      <footer className="fixed bottom-4 text-slate-600 text-xs text-center w-full pointer-events-none z-0">
        <p>Pancha Pakshi Shastra Calculation &copy; {new Date().getFullYear()}</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </div>
  );
};

export default PanchaPakshiApp;
