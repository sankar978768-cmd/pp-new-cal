import React, { useState, useRef, ChangeEvent } from 'react';
import {
  Moon, Star, Feather, RefreshCw, ChevronDown, Sparkles,
  Calendar, Clock, Calculator, MapPin, Upload, Download, FileText,
  CheckCircle, Loader, AlertTriangle, Globe, Info, Users, Sun,
  Copy, Check
} from 'lucide-react';
import { CITIES, NAKSHATRAS, RASIS, DAYS_OF_WEEK, THITHIS } from './constants';
import { getDayAnalysis, getBird, normalizeDate, getDayOfWeek, getDayThithiAnalysis } from './services/astroService';
import { BulkDataRow, DaySegment, InputMethod, DayThithiAnalysis } from './types';

const PanchaPakshiApp = () => {
  const [step, setStep] = useState<number>(1);
  const [inputMethod, setInputMethod] = useState<InputMethod>('date');
  
  // Manual State
  const [nakshatra, setNakshatra] = useState<string>('');
  const [selectedRasi, setSelectedRasi] = useState<string>('');
  const [manualDay, setManualDay] = useState<string>('');
  const [manualThithi, setManualThithi] = useState<string>('');
  const [manualSecondaryThithi, setManualSecondaryThithi] = useState<string>('');
  
  // Date Calc State
  const [birthDate, setBirthDate] = useState<string>('');
  const [analyzedDob, setAnalyzedDob] = useState<string>('');
  
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
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

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
      "Karthik,25/05/1990,India - Chennai,",
      "Ananya,1995-10-12,,-5.0",
      "Murugan,15-03-1988,India - Madurai,",
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
           const thithiAnalysis = getDayThithiAnalysis(item.date, finalTz);
           
           if (analysis.length > 1) multiCount++;

           const mainSegment = analysis.reduce((prev, current) => ((prev.duration || 0) > (current.duration || 0)) ? prev : current);
           const secondarySegments = analysis.filter(s => s !== mainSegment);
           const dayInfo = getDayOfWeek(item.date);
           
           results.push({
             ...item,
             analysis,
             thithiAnalysis,
             resolvedTimezone: finalTz,
             dayOfWeek: mainSegment.dayOfWeek || dayInfo.name,
             mainThithi: thithiAnalysis.primary ? `${thithiAnalysis.primary.thithi.name} (${thithiAnalysis.primary.percent}%)` : mainSegment.thithiName,
             secondaryThithi: thithiAnalysis.secondary ? `${thithiAnalysis.secondary.thithi.name} (${thithiAnalysis.secondary.percent}%)` : undefined,
             thithiTransition: thithiAnalysis.hasTwoThithis ? thithiAnalysis.transitionTimeStr : undefined,
             mainBird: mainSegment.bird ? mainSegment.bird.name : 'Unknown',
             mainPercent: mainSegment.percent,
             mainNakshatra: mainSegment.nakshatraName,
             mainRasi: mainSegment.rasiName,
             paksha: 'General Method',
             secondary: secondarySegments.length > 0 ? secondarySegments.map(s => `${s.bird?.name} [${s.percent}%]`).join(' | ') : 'None'
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
    let csvContent = "Name,DOB,Day,Primary Thithi,Secondary Thithi,Thithi Transition Time,City,Input Timezone,Resolved Timezone,Multiple Birds?,Primary Bird,Primary %,Secondary Birds,Nakshatras,Rasi,Calculation Method,Full Bird Summary,Error\n";
    
    bulkData.forEach(row => {
      const locStr = row.city || '';
      const inputTzStr = row.timezone || '';
      const resolvedTzStr = row.resolvedTimezone !== undefined ? row.resolvedTimezone : '';
      const errorStr = row.error || '';
      const dayStr = row.dayOfWeek || '';
      const priThithiStr = row.mainThithi || '';
      const secThithiStr = row.secondaryThithi || 'None';
      const thithiTransStr = row.thithiTransition || 'Single Thithi';

      if (row.analysis) {
        const isMulti = row.analysis.length > 1 ? "YES" : "NO";
        const allNaks = row.analysis.map(s => s.nakshatraName).join(' -> ');
        const allRasis = row.analysis.map(s => s.rasiName).join(' -> ');
        const fullSummary = row.analysis.map(s => `${s.bird?.name} (${s.percent}%)`).join(' | ');
        
        csvContent += `"${row.name}","${row.date}","${dayStr}","${priThithiStr}","${secThithiStr}","${thithiTransStr}","${locStr}","${inputTzStr}","${resolvedTzStr}","${isMulti}","${row.mainBird}","${row.mainPercent}%","${row.secondary}","${allNaks}","${allRasis}","${row.paksha}","${fullSummary}",""\n`;
      } else {
        csvContent += `"${row.name}","${row.date}","${dayStr}","${priThithiStr}","${secThithiStr}","${thithiTransStr}","${locStr}","${inputTzStr}","${resolvedTzStr}",,,,,,,,,"${errorStr}"\n`;
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
        setAnalyzedDob(birthDate);
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
    const rasiName = rasi ? `${rasi.symbol} ${rasi.tanglish}` : undefined;

    let dayName: string | undefined = undefined;
    if (manualDay !== '') {
      const dObj = DAYS_OF_WEEK.find(d => d.id === parseInt(manualDay));
      if (dObj) {
        dayName = dObj.name;
      }
    }

    let thithiName: string | undefined = undefined;
    let manualThithiAnalysis: DayThithiAnalysis | undefined = undefined;

    if (manualThithi !== '') {
      const tObj = THITHIS.find(t => t.id === parseInt(manualThithi));
      if (tObj) {
        thithiName = tObj.name;

        let secondaryThithiObj = undefined;
        if (manualSecondaryThithi !== '') {
          secondaryThithiObj = THITHIS.find(t => t.id === parseInt(manualSecondaryThithi));
        }

        const priSegment = {
          thithiId: tObj.id,
          thithi: tObj,
          startMins: 0,
          endMins: secondaryThithiObj ? 864 : 1440,
          durationMins: secondaryThithiObj ? 864 : 1440,
          percent: secondaryThithiObj ? "60" : "100",
          startTimeStr: "00:00",
          endTimeStr: secondaryThithiObj ? "14:24" : "24:00"
        };

        const secSegment = secondaryThithiObj ? {
          thithiId: secondaryThithiObj.id,
          thithi: secondaryThithiObj,
          startMins: 864,
          endMins: 1440,
          durationMins: 576,
          percent: "40",
          startTimeStr: "14:24",
          endTimeStr: "24:00"
        } : undefined;

        manualThithiAnalysis = {
          segments: secSegment ? [priSegment, secSegment] : [priSegment],
          primary: priSegment,
          secondary: secSegment,
          hasTwoThithis: Boolean(secSegment),
          transitionTimeStr: secSegment ? "14:24" : undefined,
          summaryText: secSegment 
            ? `Primary: ${priSegment.thithi.name} (60%), Secondary: ${secSegment.thithi.name} (40%)` 
            : `${priSegment.thithi.name} (100%)`
        };
      }
    }
    
    setDaySegments([{
      startMins: 0, endMins: 1440, startTimeStr: "00:00", endTimeStr: "24:00", percent: "100",
      nakshatraId: nId, nakshatraName: nData?.tanglish || nData?.name,
      rasiName: rasiName,
      paksha: 'shukla', bird: bird,
      dayOfWeek: dayName,
      thithiName: thithiName,
      thithiAnalysis: manualThithiAnalysis
    }]);
    setAnalyzedDob('');
    setStep(2);
  };

  const copySummaryToClipboard = () => {
    if (daySegments.length === 0) return;
    const primary = daySegments.reduce((prev, cur) => (parseFloat(cur.percent || "0") > parseFloat(prev.percent || "0")) ? cur : prev, daySegments[0]);
    const nObj = NAKSHATRAS.find(n => n.id === primary.nakshatraId);
    const thithiData = primary.thithiAnalysis;
    
    let text = `✨ Pancha Pakshi Astrological Summary ✨\n\n`;
    if (analyzedDob) {
      text += `📅 Date of Birth: ${analyzedDob}\n`;
    }
    if (primary.dayOfWeek) {
      text += `☀️ Day: ${primary.dayOfWeek}\n`;
    }

    if (thithiData && thithiData.hasTwoThithis && thithiData.secondary) {
      text += `🌙 Thithis (Dual Thithi Transition Today):\n`;
      text += `   • Primary Thithi: ${thithiData.primary.thithi.name} [${thithiData.primary.percent}% | ${thithiData.primary.startTimeStr} - ${thithiData.primary.endTimeStr}]\n`;
      text += `   • Secondary Thithi: ${thithiData.secondary.thithi.name} [${thithiData.secondary.percent}% | ${thithiData.secondary.startTimeStr} - ${thithiData.secondary.endTimeStr}]\n`;
      text += `   • Transition Time: ${thithiData.transitionTimeStr}\n`;
    } else if (thithiData?.primary) {
      text += `🌙 Thithi: ${thithiData.primary.thithi.name} [Full Day / 100%]\n`;
    } else if (primary.thithiName) {
      text += `🌙 Thithi: ${primary.thithiName}\n`;
    }

    if (primary.nakshatraName) {
      text += `⭐ Nakshatram: ${nObj?.tanglish || primary.nakshatraName}\n`;
    }
    if (primary.rasiName) {
      text += `♈ Rasi: ${primary.rasiName}\n`;
    }
    if (primary.bird) {
      text += `🦅 Ruling Bird: ${primary.bird.icon} ${primary.bird.name}\n`;
      text += `🔥 Element: ${primary.bird.element}\n`;
    }
    text += `📖 Method: General Pancha Pakshi Method\n`;

    if (daySegments.length > 1) {
      text += `\n⏰ Day Time Transitions:\n`;
      daySegments.forEach(s => {
        text += `• ${s.startTimeStr} - ${s.endTimeStr} (${s.percent}%): ${s.bird?.icon} ${s.bird?.name} | ${s.thithiName || ''} | ${s.rasiName || ''}\n`;
      });
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      });
    }
  };

  const Header = () => (
    <div className="w-full text-center mb-6 sm:mb-8 relative z-10 px-2">
      <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-3 sm:mb-4 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <Feather className="w-7 h-7 sm:w-8 h-8 text-amber-400" />
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-wider font-serif">
        Pancha Pakshi
      </h1>
      <p className="text-amber-300/80 font-medium text-xs sm:text-sm mt-1">Five Birds Astrology Calculator</p>
      <p className="text-slate-400 mt-1 text-[11px] sm:text-xs tracking-widest uppercase opacity-80">
        Vedic Biorhythms • Nakshatram • Rasi • Thithi • Day
      </p>
    </div>
  );

  const BulkUploadScreen = () => {
    const errorCount = bulkData.filter(d => d.error).length;
    const multiBirdEntries = bulkData.filter(d => d.analysis && d.analysis.length > 1);
    
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-5 sm:p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
         <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-amber-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Bulk Calculator
              </h2>
              <p className="text-xs text-slate-400 mt-1">Multi-bird detection, Day, Primary & Secondary Thithi, Nakshatram and Rasi</p>
            </div>
            <button onClick={downloadSampleCSV} className="text-xs flex items-center gap-1.5 text-amber-400 hover:text-amber-300 border border-amber-400/30 px-3 py-2 rounded-xl transition-colors active:scale-95 touch-manipulation">
              <Download className="w-3.5 h-3.5" /> Sample CSV
            </button>
         </div>

         {bulkData.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 hover:border-amber-500/50 hover:bg-slate-800/50 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all group touch-manipulation"
            >
               <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-400" />
               </div>
               <p className="text-slate-200 font-semibold text-base">Click to upload CSV</p>
               <p className="text-xs text-slate-400 mt-2">Supports dates like 25/05/1990 or 1990-05-25 • Outputs Day, Thithi, Bird, Nakshatram, Rasi</p>
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
                  <button onClick={() => setBulkData([])} className="text-xs text-red-400 hover:text-red-300 py-1 px-2">Clear</button>
               </div>

               {isProcessing ? (
                  <div className="bg-slate-800 p-6 rounded-xl text-center">
                     <Loader className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                     <p className="text-amber-100 text-sm font-medium mb-2">Analyzing Pancha Pakshi, Day & Thithi...</p>
                     <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${processProgress}%` }}></div>
                     </div>
                     <p className="text-xs text-slate-400 mt-2">{processProgress}% complete</p>
                  </div>
               ) : (
                 <>
                   {bulkData[0]?.analysis ? (
                     <div className="space-y-4">
                       <div className="bg-amber-500/5 border border-amber-500/20 p-5 sm:p-6 rounded-2xl">
                          <div className="flex flex-col items-center text-center mb-6">
                             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                               <CheckCircle className="w-6 h-6 text-green-400" />
                             </div>
                             <h3 className="text-amber-100 font-bold text-lg">Batch Complete</h3>
                             <p className="text-slate-400 text-xs">Total analyzed: {bulkData.length} records</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Single Bird</span>
                                <span className="text-2xl font-serif text-white">{bulkData.length - multiBirdDetectedCount - errorCount}</span>
                             </div>
                             <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                                <span className="block text-[10px] text-amber-400 uppercase font-bold mb-1 flex items-center gap-1">
                                   <AlertTriangle className="w-3 h-3" /> Mixed Energy
                                </span>
                                <span className="text-2xl font-serif text-amber-200">{multiBirdDetectedCount}</span>
                             </div>
                          </div>

                          <button 
                            onClick={exportBulkResults}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/30 active:scale-95 touch-manipulation min-h-[48px]"
                          >
                            <Download className="w-4 h-4" /> Export CSV with Primary & Secondary Thithi
                          </button>
                       </div>

                       {/* Preview of processed records */}
                       <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4">
                          <h4 className="text-xs text-slate-400 uppercase font-bold mb-3 flex items-center justify-between">
                             <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-400" /> Processed Records Summary</span>
                             <span className="text-[11px] text-amber-400 font-normal">Day & Thithi Included</span>
                          </h4>
                          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                             {bulkData.slice(0, 50).map((entry, idx) => (
                               <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex flex-col">
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm font-bold text-amber-100">{entry.name}</span>
                                       <span className="text-xs text-slate-400">({entry.date})</span>
                                     </div>
                                     <div className="flex flex-wrap items-center gap-x-2.5 text-[11px] text-slate-400 mt-1">
                                       {entry.dayOfWeek && (
                                         <span className="text-amber-300 font-medium">☀️ {entry.dayOfWeek}</span>
                                       )}
                                       {entry.mainThithi && (
                                         <span className="text-amber-200 font-medium">
                                           🌙 Primary: {entry.mainThithi}
                                         </span>
                                       )}
                                       {entry.secondaryThithi && (
                                         <span className="text-indigo-300 font-medium">
                                           | Secondary: {entry.secondaryThithi}
                                         </span>
                                       )}
                                       {entry.mainNakshatra && (
                                         <span className="text-slate-300">⭐ {entry.mainNakshatra}</span>
                                       )}
                                       {entry.mainRasi && (
                                         <span className="text-emerald-300">♈ {entry.mainRasi}</span>
                                       )}
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                     <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-200">
                                       {entry.mainBird}
                                     </span>
                                     {entry.analysis && entry.analysis.length > 1 && (
                                       <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700">
                                         Mixed
                                       </span>
                                     )}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     </div>
                   ) : (
                     <button 
                        onClick={processBulk}
                        disabled={errorCount === bulkData.length}
                        className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[48px] touch-manipulation ${errorCount === bulkData.length ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-900/40'}`}
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

  const primarySegment = daySegments.length > 0 
    ? daySegments.reduce((prev, cur) => (parseFloat(cur.percent || "0") > parseFloat(prev.percent || "0")) ? cur : prev, daySegments[0])
    : null;

  const thithiAnalysis = primarySegment?.thithiAnalysis;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-200 selection:bg-amber-500/30 font-sans flex flex-col items-center py-6 sm:py-10 px-3 sm:px-6 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-[100px]"></div>
      </div>

      <Header />

      <main className="w-full relative z-10 max-w-4xl">
        {step === 1 && (
           <>
              <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-6 sm:mb-8 max-w-lg mx-auto backdrop-blur-md border border-slate-700/60 shadow-lg">
                <button onClick={() => setInputMethod('date')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all min-h-[42px] touch-manipulation ${inputMethod === 'date' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Calendar className="w-4 h-4" /> Date of Birth
                </button>
                <button onClick={() => setInputMethod('manual')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all min-h-[42px] touch-manipulation ${inputMethod === 'manual' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Feather className="w-4 h-4" /> Manual
                </button>
                <button onClick={() => setInputMethod('bulk')} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all min-h-[42px] touch-manipulation ${inputMethod === 'bulk' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                  <FileText className="w-4 h-4" /> Bulk Calc
                </button>
              </div>

              {inputMethod === 'bulk' ? (
                 <BulkUploadScreen />
              ) : (
                <div className="w-full max-w-lg mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
                  {inputMethod === 'date' ? (
                     <div className="space-y-5">
                       <div>
                         <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                           <Calendar className="w-3.5 h-3.5 text-amber-400" />
                           1. Birth Date (DOB)
                         </label>
                         <div className="relative">
                           <input 
                             type="date" 
                             value={birthDate} 
                             onChange={(e) => { setBirthDate(e.target.value); setCalcStatus(''); }} 
                             className="w-full bg-slate-950 border border-slate-600 rounded-xl py-3.5 pl-4 pr-4 text-base text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-inner min-h-[48px]" 
                           />
                         </div>
                         {birthDate && (
                           <div className="mt-2 text-xs flex items-center gap-2 text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                             <Sun className="w-3.5 h-3.5" />
                             <span>Day: <strong>{getDayOfWeek(birthDate).name}</strong></span>
                           </div>
                         )}
                       </div>
                       
                       <div className="space-y-4">
                         <div>
                            <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                               <MapPin className="w-3.5 h-3.5 text-amber-400" />
                               2. Location
                            </label>
                            <div className="relative">
                               <select 
                                 value={selectedCity} 
                                 onChange={handleCityChange} 
                                 className="w-full bg-slate-950 border border-slate-600 rounded-xl py-3.5 pl-4 pr-10 text-base text-slate-100 focus:outline-none focus:border-amber-500 appearance-none shadow-inner min-h-[48px]"
                               >
                                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                               </select>
                               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-amber-400" />
                              3. Timezone / GMT Offset
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                step="0.25" 
                                value={timezone} 
                                onChange={handleTimezoneChange} 
                                className="w-full bg-slate-950 border border-slate-600 rounded-xl py-3.5 pl-4 pr-12 text-base text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-inner min-h-[48px]" 
                                placeholder="e.g. 5.5"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">HRS</div>
                            </div>
                         </div>
                       </div>

                       <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
                          <div className="font-semibold text-amber-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Calculated Biorhythm Details:
                          </div>
                          <p className="text-[11px] text-slate-400">
                            • Day • Primary & Secondary Thithi • Nakshatram • Rasi • Ruling Bird
                          </p>
                       </div>

                       <button 
                         onClick={handleCalculateFromDate} 
                         disabled={!birthDate}
                         className={`w-full py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg min-h-[50px] touch-manipulation active:scale-[0.98] ${!birthDate ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/30'}`}
                       >
                         {calcStatus === 'calculating' ? (
                           <>
                             <Loader className="w-5 h-5 animate-spin" />
                             Calculating...
                           </>
                         ) : (
                           <>
                             <Calculator className="w-5 h-5" />
                             Analyze Birth Panchang & Bird
                           </>
                         )}
                       </button>
                     </div>
                  ) : (
                    <div className="space-y-5">
                       {/* General Method Info Banner */}
                       <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs">
                          <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                             <Sparkles className="w-4 h-4" />
                             <span>General Method (Pancha Pakshi)</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>1–5 (Aswini – Mrigaseerisham):</span>
                               <span className="font-semibold text-amber-200">🦅 Vulture</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>6–11 (Thiruvathirai – Pooram):</span>
                               <span className="font-semibold text-amber-200">🦉 Owl</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>12–16 (Uthiram – Visakam):</span>
                               <span className="font-semibold text-amber-200">🐦‍⬛ Crow</span>
                             </div>
                             <div className="flex justify-between py-1 border-b border-white/5">
                               <span>17–21 (Anusham – Uthiradam):</span>
                               <span className="font-semibold text-amber-200">🐓 Cock</span>
                             </div>
                             <div className="flex justify-between py-1">
                               <span>22–27 (Thiruvonam – Revathi):</span>
                               <span className="font-semibold text-amber-200">🦚 Peacock</span>
                             </div>
                          </div>
                       </div>

                       <div>
                          <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                             <Star className="w-3.5 h-3.5 text-amber-400" />
                             1. Select Nakshatram
                          </label>
                          <div className="relative">
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
                               className="w-full appearance-none bg-slate-950 text-slate-100 border border-slate-600 rounded-xl p-3.5 pr-10 focus:outline-none focus:border-amber-500 shadow-inner text-base min-h-[48px]"
                             >
                               <option value="" disabled>-- Choose Nakshatram --</option>
                               {NAKSHATRAS.map((n) => (
                                 <option key={n.id} value={n.id} className="bg-slate-900">
                                   {n.id}. {n.tanglish || n.name}
                                 </option>
                               ))}
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       {nakshatra && NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.length! > 1 && (
                         <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                               <Info className="w-3.5 h-3.5 text-amber-400" />
                               2. Select Rasi
                            </label>
                            <select 
                              value={selectedRasi} 
                              onChange={(e) => setSelectedRasi(e.target.value)} 
                              className="w-full appearance-none bg-slate-950 text-slate-100 border border-slate-600 rounded-xl p-3.5 pr-10 focus:outline-none focus:border-amber-500 shadow-inner text-base min-h-[48px]"
                            >
                              <option value="" disabled>-- Choose Rasi --</option>
                              {NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.map(rId => {
                                const r = RASIS.find(item => item.id === rId);
                                return <option key={rId} value={rId} className="bg-slate-900">{r?.symbol} {r?.tanglish}</option>;
                              })}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                       )}

                       {/* Optional Day Selection in Manual Mode */}
                       <div>
                          <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                             <Sun className="w-3.5 h-3.5 text-amber-400" />
                             Day of Week - Optional
                          </label>
                          <div className="relative">
                             <select 
                               value={manualDay} 
                               onChange={(e) => setManualDay(e.target.value)} 
                               className="w-full appearance-none bg-slate-950 text-slate-100 border border-slate-600 rounded-xl p-3.5 pr-10 focus:outline-none focus:border-amber-500 shadow-inner text-base min-h-[48px]"
                             >
                               <option value="">-- Optional: Select Day --</option>
                               {DAYS_OF_WEEK.map((d) => (
                                 <option key={d.id} value={d.id} className="bg-slate-900">
                                   {d.name} ({d.rulingPlanet})
                                 </option>
                               ))}
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       {/* Primary Thithi Selection in Manual Mode */}
                       <div>
                          <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                             <Moon className="w-3.5 h-3.5 text-amber-400" />
                             Primary Thithi - Optional
                          </label>
                          <div className="relative">
                             <select 
                               value={manualThithi} 
                               onChange={(e) => setManualThithi(e.target.value)} 
                               className="w-full appearance-none bg-slate-950 text-slate-100 border border-slate-600 rounded-xl p-3.5 pr-10 focus:outline-none focus:border-amber-500 shadow-inner text-base min-h-[48px]"
                             >
                               <option value="">-- Optional: Select Primary Thithi --</option>
                               <optgroup label="Valarpirai">
                                 {THITHIS.slice(0, 15).map((t) => (
                                   <option key={t.id} value={t.id} className="bg-slate-900">
                                     {t.name}
                                   </option>
                                 ))}
                               </optgroup>
                               <optgroup label="Theipirai">
                                 {THITHIS.slice(15, 30).map((t) => (
                                   <option key={t.id} value={t.id} className="bg-slate-900">
                                     {t.name}
                                   </option>
                                 ))}
                               </optgroup>
                             </select>
                             <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       {/* Optional Secondary Thithi Selection in Manual Mode */}
                       {manualThithi && (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-slate-300 text-xs uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                               <Moon className="w-3.5 h-3.5 text-indigo-400" />
                               Secondary Thithi - Optional (if 2 occur)
                            </label>
                            <div className="relative">
                               <select 
                                 value={manualSecondaryThithi} 
                                 onChange={(e) => setManualSecondaryThithi(e.target.value)} 
                                 className="w-full appearance-none bg-slate-950 text-slate-100 border border-slate-600 rounded-xl p-3.5 pr-10 focus:outline-none focus:border-amber-500 shadow-inner text-base min-h-[48px]"
                               >
                                 <option value="">-- Optional: Select Secondary Thithi --</option>
                                 <optgroup label="Valarpirai">
                                   {THITHIS.slice(0, 15).map((t) => (
                                     <option key={t.id} value={t.id} className="bg-slate-900">
                                       {t.name}
                                     </option>
                                   ))}
                                 </optgroup>
                                 <optgroup label="Theipirai">
                                   {THITHIS.slice(15, 30).map((t) => (
                                     <option key={t.id} value={t.id} className="bg-slate-900">
                                       {t.name}
                                     </option>
                                   ))}
                                 </optgroup>
                               </select>
                               <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                         </div>
                       )}

                       <button 
                         onClick={handleManualCalculate} 
                         disabled={!nakshatra || (NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.length! > 1 && !selectedRasi)} 
                         className={`w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[50px] touch-manipulation ${(!nakshatra || (NAKSHATRAS.find(n => n.id === parseInt(nakshatra))?.rasiIds.length! > 1 && !selectedRasi)) ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-900/30'}`}
                       >
                         <Sparkles className="w-5 h-5" /> Reveal My Pancha Pakshi
                       </button>
                    </div>
                  )}
                </div>
              )}
           </>
        )}

        {step === 2 && primarySegment && (
           <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
             
             {/* Main Astrological Summary Card */}
             <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-7 mb-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4 mb-5 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                        <Sun className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-amber-100 font-serif">
                          Birth Astrological Details
                        </h3>
                        <p className="text-xs text-slate-400">
                          {analyzedDob ? `DOB: ${analyzedDob} • ${selectedCity}` : 'Selected Nakshatram & Parameters'}
                        </p>
                      </div>
                   </div>

                   <button 
                     onClick={copySummaryToClipboard}
                     className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all touch-manipulation min-h-[40px]"
                     title="Copy birth details"
                   >
                     {copySuccess ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                     <span>{copySuccess ? 'Copied!' : 'Copy Summary'}</span>
                   </button>
                </div>

                {/* Key Astrological Data Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
                   {/* DOB */}
                   {analyzedDob && (
                     <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
                       <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                         <Calendar className="w-3 h-3 text-amber-400" /> Date of Birth
                       </span>
                       <span className="text-sm font-semibold text-white mt-1.5 break-words">{analyzedDob}</span>
                       <span className="text-[10px] text-slate-500">DOB</span>
                     </div>
                   )}

                   {/* Day of Week */}
                   <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-amber-500/30 flex flex-col justify-between shadow-sm">
                     <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1">
                       <Sun className="w-3 h-3 text-amber-400" /> Day
                     </span>
                     <span className="text-sm font-bold text-amber-200 mt-1.5 break-words">
                       {primarySegment.dayOfWeek || '—'}
                     </span>
                     <span className="text-[10px] text-slate-400">Day of Week</span>
                   </div>

                   {/* Thithi Badge - Single or Dual */}
                   {thithiAnalysis && thithiAnalysis.hasTwoThithis && thithiAnalysis.secondary ? (
                     <div className="bg-slate-900/90 p-3 rounded-2xl border border-indigo-500/40 flex flex-col justify-between shadow-sm col-span-2 sm:col-span-1 lg:col-span-2 ring-1 ring-indigo-500/30">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider flex items-center gap-1">
                           <Moon className="w-3 h-3 text-indigo-400" /> 2 Thithis Active
                         </span>
                         <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                           Transition @ {thithiAnalysis.transitionTimeStr}
                         </span>
                       </div>
                       
                       <div className="space-y-1 mt-1.5">
                         <div className="flex items-center justify-between text-xs">
                           <span className="text-amber-200 font-bold flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                             Primary: {thithiAnalysis.primary.thithi.name}
                           </span>
                           <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 px-1 rounded">{thithiAnalysis.primary.percent}%</span>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                           <span className="text-indigo-200 font-medium flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                             Secondary: {thithiAnalysis.secondary.thithi.name}
                           </span>
                           <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/15 px-1 rounded">{thithiAnalysis.secondary.percent}%</span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-500/30 flex flex-col justify-between shadow-sm">
                       <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider flex items-center gap-1">
                         <Moon className="w-3 h-3 text-indigo-400" /> Thithi
                       </span>
                       <span className="text-sm font-bold text-indigo-200 mt-1.5 break-words">
                         {thithiAnalysis?.primary?.thithi?.name || primarySegment.thithiName || '—'}
                       </span>
                       <span className="text-[10px] text-slate-400">{thithiAnalysis?.primary?.thithi?.pakshaTanglish || 'Full Day'} (100%)</span>
                     </div>
                   )}

                   {/* Nakshatram */}
                   <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                       <Star className="w-3 h-3 text-amber-400" /> Nakshatram
                     </span>
                     <span className="text-sm font-bold text-white mt-1.5 break-words">
                       {NAKSHATRAS.find(n => n.id === primarySegment.nakshatraId)?.tanglish || primarySegment.nakshatraName}
                     </span>
                     <span className="text-[10px] text-slate-400">Star</span>
                   </div>

                   {/* Rasi */}
                   <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                       <Info className="w-3 h-3 text-emerald-400" /> Rasi
                     </span>
                     <span className="text-sm font-bold text-white mt-1.5 break-words">
                       {primarySegment.rasiName || '—'}
                     </span>
                     <span className="text-[10px] text-slate-400">Moon Sign</span>
                   </div>

                   {/* Ruling Bird */}
                   <div className="bg-amber-500/15 p-3.5 rounded-2xl border border-amber-500/50 flex flex-col justify-between">
                     <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider flex items-center gap-1">
                       <Feather className="w-3 h-3 text-amber-400" /> Ruling Bird
                     </span>
                     <span className="text-sm font-black text-amber-200 mt-1.5 flex items-center gap-1.5">
                       <span>{primarySegment.bird?.icon}</span>
                       <span>{primarySegment.bird?.name}</span>
                     </span>
                     <span className="text-[10px] text-amber-300/80">Element: {primarySegment.bird?.element}</span>
                   </div>
                </div>
             </div>

             {/* Dedicated Dual Thithi Transition Card (if two thithis occur in the day) */}
             {thithiAnalysis && thithiAnalysis.hasTwoThithis && thithiAnalysis.secondary && (
               <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 mb-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-500">
                 <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                   <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                       <Moon className="w-4 h-4" />
                     </div>
                     <div>
                       <h4 className="text-base sm:text-lg font-bold text-indigo-100 font-serif">
                         Dual Thithi Transition Today
                       </h4>
                       <p className="text-xs text-slate-400">
                         Moon-Sun longitudinal separation transitions between two Thithis today
                       </p>
                     </div>
                   </div>

                   <div className="flex items-center gap-2 bg-indigo-900/50 border border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs">
                     <Clock className="w-3.5 h-3.5 text-indigo-300" />
                     <span className="text-slate-300">Transition Time:</span>
                     <strong className="text-amber-300 font-mono">{thithiAnalysis.transitionTimeStr}</strong>
                   </div>
                 </div>

                 {/* Visual Distribution Timeline Bar */}
                 <div className="mb-4">
                   <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex border border-indigo-500/30 p-0.5">
                     <div 
                       style={{ width: `${thithiAnalysis.primary.percent}%` }} 
                       className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all"
                       title={`Primary: ${thithiAnalysis.primary.thithi.name} (${thithiAnalysis.primary.percent}%)`}
                     />
                     <div 
                       style={{ width: `${thithiAnalysis.secondary.percent}%` }} 
                       className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all"
                       title={`Secondary: ${thithiAnalysis.secondary.thithi.name} (${thithiAnalysis.secondary.percent}%)`}
                     />
                   </div>
                   <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono px-1">
                     <span>00:00</span>
                     <span className="text-amber-300 font-semibold">Transition @ {thithiAnalysis.transitionTimeStr}</span>
                     <span>24:00</span>
                   </div>
                 </div>

                 {/* 2 Comparison Cards: Primary vs Secondary */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {/* Primary Thithi */}
                   <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-4 relative shadow-lg">
                     <div className="flex items-center justify-between mb-2">
                       <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-200 border border-amber-500/40 flex items-center gap-1">
                         🌟 Primary Thithi
                       </span>
                       <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/20">
                         {thithiAnalysis.primary.percent}% of Day
                       </span>
                     </div>
                     <h5 className="text-lg font-bold text-amber-100">{thithiAnalysis.primary.thithi.name}</h5>
                     <p className="text-xs text-slate-300">{thithiAnalysis.primary.thithi.pakshaTanglish}</p>
                     <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                       <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> Duration:</span>
                       <span className="font-mono font-bold text-amber-200">{thithiAnalysis.primary.startTimeStr} to {thithiAnalysis.primary.endTimeStr}</span>
                     </div>
                     <p className="text-[11px] text-amber-200/80 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                       Ranks as the Primary Thithi prevailing for the greater portion ({thithiAnalysis.primary.durationMins} mins / {thithiAnalysis.primary.percent}%) of the birth day.
                     </p>
                   </div>

                   {/* Secondary Thithi */}
                   <div className="bg-slate-900/95 border-2 border-indigo-500/50 rounded-2xl p-4 relative shadow-lg">
                     <div className="flex items-center justify-between mb-2">
                       <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-200 border border-indigo-500/40 flex items-center gap-1">
                         🌓 Secondary Thithi
                       </span>
                       <span className="text-xs font-mono font-bold text-indigo-300 bg-black/40 px-2 py-0.5 rounded border border-indigo-500/20">
                         {thithiAnalysis.secondary.percent}% of Day
                       </span>
                     </div>
                     <h5 className="text-lg font-bold text-indigo-100">{thithiAnalysis.secondary.thithi.name}</h5>
                     <p className="text-xs text-slate-300">{thithiAnalysis.secondary.thithi.pakshaTanglish}</p>
                     <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                       <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400" /> Duration:</span>
                       <span className="font-mono font-bold text-indigo-200">{thithiAnalysis.secondary.startTimeStr} to {thithiAnalysis.secondary.endTimeStr}</span>
                     </div>
                     <p className="text-[11px] text-indigo-200/80 mt-2 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                       Transitions at {thithiAnalysis.transitionTimeStr} and rules the remaining portion ({thithiAnalysis.secondary.durationMins} mins / {thithiAnalysis.secondary.percent}%) of the day.
                     </p>
                   </div>
                 </div>
               </div>
             )}

             {/* Status Header */}
             <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${daySegments.length > 1 ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
                  <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-slate-300">
                    {daySegments.length > 1 ? 'Mixed Energy Analysis (Transitions Today)' : 'Stable Energy Analysis'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-amber-100 mb-2">
                  {daySegments.length > 1 ? 'Multiple Birds Active Across the Day' : `${primarySegment.bird?.name} Ruling`}
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
                  {daySegments.length > 1 
                    ? 'Astronomical transitions today cause a shift in the Nakshatram and ruling bird during the day. See each time window below.' 
                    : 'Your ruling bird and astronomical rhythm remain constant throughout the 24 hours of this day.'}
                </p>
             </div>
             
             {/* Progress Timeline for Mixed days */}
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

             {/* Bird Segment Cards */}
             <div className={`grid gap-6 ${daySegments.length > 1 ? 'md:grid-cols-2' : 'max-w-xl mx-auto'}`}>
                {daySegments.map((segment, index) => {
                   const isPrimary = daySegments.length === 1 || parseFloat(segment.percent || "0") > 50;
                   const isMulti = daySegments.length > 1;
                   const nObj = NAKSHATRAS.find(n => n.id === segment.nakshatraId);
                   
                   return (
                     <div 
                        key={index} 
                        className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-500 ${
                           isPrimary 
                           ? 'bg-slate-900/90 border-amber-500/40 shadow-2xl scale-100 z-10' 
                           : 'bg-slate-800/80 border-slate-700 opacity-90 scale-95 hover:scale-100 hover:opacity-100'
                        } ${isMulti && isPrimary ? 'ring-2 ring-amber-500/20' : ''}`}
                     >
                        {isMulti && isPrimary && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg transform rotate-2">
                            Primary ({segment.percent}%)
                          </div>
                        )}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 ${isPrimary ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                           <div>
                              <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest ${isPrimary ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-600/30 text-slate-300'}`}>
                                {segment.percent}% of Day
                              </span>
                              <div className="mt-2.5 flex items-baseline gap-2">
                                <h3 className="text-2xl sm:text-3xl font-serif text-white">{segment.bird?.name}</h3>
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                Element: <span className="text-amber-200 font-semibold">{segment.bird?.element}</span>
                              </div>
                           </div>
                           <div className="text-5xl filter drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">{segment.bird?.icon}</div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2 mt-4 text-xs font-mono text-slate-300 bg-black/25 p-3.5 rounded-xl border border-white/5 relative z-10">
                           <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                             <span className="flex items-center gap-1.5 text-slate-400 font-sans"><Clock className="w-3.5 h-3.5 text-amber-400" /> Time Window:</span>
                             <span className="font-bold text-amber-100">{segment.startTimeStr || minsToTime(segment.startMins)} - {segment.endTimeStr || minsToTime(segment.endMins)}</span>
                           </div>

                           {segment.dayOfWeek && (
                             <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                               <span className="flex items-center gap-1.5 text-slate-400 font-sans"><Sun className="w-3.5 h-3.5 text-amber-400" /> Day:</span>
                               <span className="font-bold text-amber-300">{segment.dayOfWeek}</span>
                             </div>
                           )}

                           {segment.thithiName && (
                             <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                               <span className="flex items-center gap-1.5 text-slate-400 font-sans"><Moon className="w-3.5 h-3.5 text-indigo-400" /> Thithi:</span>
                               <span className="font-bold text-indigo-200">{segment.thithiName}</span>
                             </div>
                           )}

                           <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                             <span className="flex items-center gap-1.5 text-slate-400 font-sans"><Star className="w-3.5 h-3.5 text-amber-400" /> Nakshatram:</span>
                             <span className="font-bold text-white">{nObj?.tanglish || segment.nakshatraName}</span>
                           </div>

                           {segment.rasiName && (
                             <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                               <span className="flex items-center gap-1.5 text-slate-400 font-sans"><Info className="w-3.5 h-3.5 text-emerald-400" /> Rasi:</span>
                               <span className="font-bold text-emerald-200">{segment.rasiName}</span>
                             </div>
                           )}

                           <div className="flex items-center justify-between pt-0.5">
                             <span className="flex items-center gap-1.5 text-slate-400 font-sans"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Method:</span>
                             <span className="font-sans text-[11px] text-slate-300">General Method</span>
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>

             <div className="mt-10 text-center flex flex-wrap justify-center gap-4">
               <button 
                 onClick={copySummaryToClipboard}
                 className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/30 text-sm font-semibold transition-all touch-manipulation min-h-[48px]"
               >
                 {copySuccess ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                 <span>{copySuccess ? 'Copied!' : 'Copy Summary'}</span>
               </button>

               <button 
                 onClick={() => { setStep(1); setDaySegments([]); }} 
                 className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold transition-all touch-manipulation min-h-[48px]"
               >
                 <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> 
                 <span>Check Another Date</span>
               </button>
             </div>
           </div>
        )}
      </main>

      <footer className="mt-auto pt-8 pb-4 text-slate-500 text-xs text-center w-full z-10">
        <p>Pancha Pakshi Shastra &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default PanchaPakshiApp;
