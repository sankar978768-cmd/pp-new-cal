import { BIRDS, NAKSHATRAS, RASIS, DAYS_OF_WEEK, THITHIS, DayOfWeekInfo, ThithiInfo } from '../constants';
import { CalculationResult, DaySegment, Bird, ThithiSegment, DayThithiAnalysis } from '../types';

/**
 * Normalizes various date string formats into YYYY-MM-DD.
 * Supports DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, etc.
 */
export const normalizeDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  // Remove any leading/trailing whitespace
  const cleanStr = dateStr.trim();
  
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
  
  // Try to split by common separators
  const parts = cleanStr.split(/[/\-.]/);
  if (parts.length !== 3) return null;

  let year, month, day;

  // Pattern: YYYY-MM-DD
  if (parts[0].length === 4) {
    [year, month, day] = parts;
  } 
  // Pattern: DD-MM-YYYY or MM-DD-YYYY
  else if (parts[2].length === 4) {
    year = parts[2];
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);

    // Heuristic: If first part > 12, it must be the Day (DD/MM/YYYY)
    if (p1 > 12) {
      day = parts[0];
      month = parts[1];
    } 
    // If second part > 12, it must be the Day (MM/DD/YYYY)
    else if (p2 > 12) {
      month = parts[0];
      day = parts[1];
    }
    // Ambiguous (both <= 12), default to DD/MM/YYYY for Vedic context
    else {
      day = parts[0];
      month = parts[1];
    }
  } else {
    return null;
  }

  // Final validation and padding
  const y = year.padStart(4, '0');
  const m = month.padStart(2, '0');
  const d = day.padStart(2, '0');

  const iso = `${y}-${m}-${d}`;
  const testDate = new Date(iso);
  return isNaN(testDate.getTime()) ? null : iso;
};

/**
 * Calculates Day of the Week (வாரம் / கிழமை) from date string.
 */
export const getDayOfWeek = (dateStr: string): DayOfWeekInfo => {
  const normalized = normalizeDate(dateStr) || dateStr;
  const parts = normalized.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d, 12, 0, 0);
    const dayIdx = date.getDay(); // 0 is Sunday
    return DAYS_OF_WEEK[dayIdx] || DAYS_OF_WEEK[0];
  }
  return DAYS_OF_WEEK[0];
};

/**
 * Calculates Thithi (திதி) from Moon-Sun elongation in degrees (0 - 360).
 */
export const getThithi = (elongationDeg: number): ThithiInfo => {
  let norm = elongationDeg % 360;
  if (norm < 0) norm += 360;
  const thithiId = Math.floor(norm / 12) + 1; // 1 to 30
  return THITHIS.find(t => t.id === thithiId) || THITHIS[0];
};

export const getBird = (nId: number, _pMode?: 'shukla' | 'krishna'): Bird => {
  const nIndex = nId;
  let birdKey = '';
  // General Method (பொது பஞ்ச பட்சி முறை):
  // 1-5 (அஸ்வினி, பரணி, கார்த்திகை, ரோகிணி, மிருகசீரிஷம்) -> Vulture (🦅 வல்லூறு)
  // 6-11 (திருவாதிரை, புனர்பூசம், பூசம், ஆயில்யம், மகம், பூரம்) -> Owl (🦉 ஆந்தை)
  // 12-16 (உத்திரம், அஸ்தம், சித்திரை, சுவாதி, விசாகம்) -> Crow (🐦‍⬛ காகம்)
  // 17-21 (அனுஷம், கேட்டை, மூலம், பூராடம், உத்திராடம்) -> Cock (🐓 சேவல்)
  // 22-27 (திருவோணம், அவிட்டம், சதயம், பூரட்டாதி, உத்திரட்டாதி, ரேவதி) -> Peacock (🦚 மயில்)
  if (nIndex >= 1 && nIndex <= 5) {
    birdKey = 'vulture';
  } else if (nIndex >= 6 && nIndex <= 11) {
    birdKey = 'owl';
  } else if (nIndex >= 12 && nIndex <= 16) {
    birdKey = 'crow';
  } else if (nIndex >= 17 && nIndex <= 21) {
    birdKey = 'cock';
  } else {
    birdKey = 'peacock';
  }
  return BIRDS[birdKey] || BIRDS.vulture;
};

const AstroEngine = {
  normalize: (deg: number) => {
    let res = deg % 360;
    if (res < 0) res += 360;
    return res;
  },
  getJulianDay: (dateStr: string, timeStr: string, tzOffset: number) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    const localTime = date.getTime();
    // Simplified JD calculation
    return (localTime / 86400000) + 2440587.5 - (tzOffset / 24);
  },
  calculate: (dateStr: string, timeStr: string, tzOffset: number): CalculationResult => {
    const jd = AstroEngine.getJulianDay(dateStr, timeStr, tzOffset);
    const D = jd - 2451545.0;
    const ayanamsa = 23.85 + (0.0000387 * D);

    const g_sun = AstroEngine.normalize(357.529 + 0.98560028 * D);
    const q_sun = AstroEngine.normalize(280.459 + 0.98564736 * D);
    const L_sun = AstroEngine.normalize(
      q_sun + 1.915 * Math.sin(g_sun * Math.PI / 180) + 0.020 * Math.sin(2 * g_sun * Math.PI / 180)
    );
    const sunSidereal = AstroEngine.normalize(L_sun - ayanamsa);

    const l_moon = AstroEngine.normalize(218.316 + 13.176396 * D);
    const m_moon = AstroEngine.normalize(134.963 + 13.064993 * D);

    const moonCorrection =
      6.289 * Math.sin(m_moon * Math.PI / 180) +
      -1.274 * Math.sin((l_moon - 2 * D) * Math.PI / 180) +
      -0.658 * Math.sin(2 * (l_moon - L_sun) * Math.PI / 180);

    const L_moon_true = AstroEngine.normalize(l_moon + moonCorrection);
    const moonSidereal = AstroEngine.normalize(L_moon_true - ayanamsa);
    
    const rasiIndex = Math.floor(moonSidereal / 30);
    const rasiId = rasiIndex + 1;

    const nakshatraIndex = Math.floor(moonSidereal / 13.333333);
    const nakshatraId = nakshatraIndex + 1;

    const elongation = AstroEngine.normalize(moonSidereal - sunSidereal);
    const isShukla = elongation < 180;

    const thithiObj = getThithi(elongation);
    const dayOfWeekObj = getDayOfWeek(dateStr);

    return {
      nakshatraId,
      rasiId,
      paksha: isShukla ? 'shukla' : 'krishna',
      elongation: elongation.toFixed(2),
      moonDeg: moonSidereal.toFixed(2),
      thithiId: thithiObj.id,
      thithiName: thithiObj.name,
      dayOfWeek: dayOfWeekObj.name
    };
  }
};

/**
 * Calculates all Thithis occurring in a single 24-hour day,
 * identifying the Primary (longest duration) and Secondary Thithi with transition times.
 */
export const getDayThithiAnalysis = (dateStr: string, tzOffset: number): DayThithiAnalysis => {
  const normalized = normalizeDate(dateStr);
  if (!normalized) throw new Error("Invalid Date Format");

  const getThithiAtMinute = (minute: number) => {
    const h = Math.floor(minute / 60);
    const m = Math.floor(minute % 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return AstroEngine.calculate(normalized, timeStr, tzOffset);
  };

  const rawSegments: { thithiId: number; startMins: number; endMins: number }[] = [];
  const startData = getThithiAtMinute(0);
  let lastThithi = startData.thithiId;
  let segmentStartMins = 0;

  // Scan every 30 minutes to capture any Thithi boundary
  for (let t = 30; t <= 1440; t += 30) {
    const checkTime = t === 1440 ? 1439 : t;
    const data = getThithiAtMinute(checkTime);

    if (data.thithiId !== lastThithi) {
      let low = t - 30;
      let high = t;
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        const midData = getThithiAtMinute(mid);
        if (midData.thithiId === lastThithi) low = mid;
        else high = mid;
      }
      const transitionMinute = high;

      rawSegments.push({
        thithiId: lastThithi,
        startMins: segmentStartMins,
        endMins: transitionMinute
      });

      segmentStartMins = transitionMinute;
      lastThithi = data.thithiId;
    }
  }

  rawSegments.push({
    thithiId: lastThithi,
    startMins: segmentStartMins,
    endMins: 1440
  });

  const segments: ThithiSegment[] = rawSegments.map(seg => {
    const durationMins = seg.endMins - seg.startMins;
    const percent = ((durationMins / 1440) * 100).toFixed(0);
    const startH = Math.floor(seg.startMins / 60).toString().padStart(2, '0');
    const startM = Math.floor(seg.startMins % 60).toString().padStart(2, '0');
    const endH = Math.floor(seg.endMins / 60).toString().padStart(2, '0');
    const endM = Math.floor(seg.endMins % 60).toString().padStart(2, '0');
    const thithi = THITHIS.find(t => t.id === seg.thithiId) || THITHIS[0];

    return {
      thithiId: seg.thithiId,
      thithi,
      startMins: seg.startMins,
      endMins: seg.endMins,
      durationMins,
      percent,
      startTimeStr: `${startH}:${startM}`,
      endTimeStr: `${endH}:${endM}`
    };
  });

  // Sort by duration descending to determine Primary (highest %) and Secondary
  const sorted = [...segments].sort((a, b) => b.durationMins - a.durationMins);
  const primary = sorted[0];
  const secondary = sorted.length > 1 ? sorted[1] : undefined;
  const hasTwoThithis = segments.length > 1;
  const transitionTimeStr = hasTwoThithis ? segments[0].endTimeStr : undefined;

  let summaryText = "";
  if (hasTwoThithis && secondary) {
    summaryText = `Primary: ${primary.thithi.name} (${primary.percent}%), Secondary: ${secondary.thithi.name} (${secondary.percent}%)`;
  } else {
    summaryText = `${primary.thithi.name} (100%)`;
  }

  return {
    segments,
    primary,
    secondary,
    hasTwoThithis,
    transitionTimeStr,
    summaryText
  };
};

export const getDayAnalysis = (dateStr: string, tzOffset: number): DaySegment[] => {
  const normalized = normalizeDate(dateStr);
  if (!normalized) throw new Error("Invalid Date Format");

  const dayOfWeekInfo = getDayOfWeek(normalized);
  const thithiAnalysis = getDayThithiAnalysis(normalized, tzOffset);

  const segments: DaySegment[] = [];
  let lastNak: number | null = null;
  let segmentStartMins = 0;

  const getDataAtMinute = (minute: number) => {
    const h = Math.floor(minute / 60);
    const m = Math.floor(minute % 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return AstroEngine.calculate(normalized, timeStr, tzOffset);
  };

  let startData = getDataAtMinute(0);
  lastNak = startData.nakshatraId;
  let currentPaksha = startData.paksha;

  for (let t = 60; t <= 1440; t += 60) {
    const checkTime = t === 1440 ? 1439 : t;
    const data = getDataAtMinute(checkTime);

    if (data.nakshatraId !== lastNak) {
      let low = t - 60;
      let high = t;
      let transitionMinute = t;

      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        const midData = getDataAtMinute(mid);
        if (midData.nakshatraId === lastNak) low = mid;
        else high = mid;
      }
      transitionMinute = high;

      segments.push({
        startMins: segmentStartMins,
        endMins: transitionMinute,
        nakshatraId: lastNak!,
        rasiId: startData.rasiId,
        paksha: currentPaksha
      });

      segmentStartMins = transitionMinute;
      lastNak = data.nakshatraId;
      currentPaksha = data.paksha;
    }
  }

  segments.push({
    startMins: segmentStartMins,
    endMins: 1440,
    nakshatraId: lastNak!,
    paksha: currentPaksha
  });

  return segments.map(seg => {
    const duration = seg.endMins - seg.startMins;
    const percent = ((duration / 1440) * 100).toFixed(0);
    const bird = getBird(seg.nakshatraId, seg.paksha);
    const nakshatraName = NAKSHATRAS.find(n => n.id === seg.nakshatraId)?.tanglish || NAKSHATRAS.find(n => n.id === seg.nakshatraId)?.name;
    
    // Re-calculate at midpoint of segment for exact Rasi and Thithi
    const midPointMins = seg.startMins + (duration / 2);
    const midPointData = getDataAtMinute(midPointMins);
    const rasi = RASIS.find(r => r.id === midPointData.rasiId);
    const rasiName = rasi ? `${rasi.symbol} ${rasi.tanglish}` : undefined;

    const thithiObj = getThithi(parseFloat(midPointData.elongation));

    const startH = Math.floor(seg.startMins / 60).toString().padStart(2, '0');
    const startM = Math.floor(seg.startMins % 60).toString().padStart(2, '0');
    const endH = Math.floor(seg.endMins / 60).toString().padStart(2, '0');
    const endM = Math.floor(seg.endMins % 60).toString().padStart(2, '0');

    return {
      ...seg,
      duration,
      percent,
      bird,
      nakshatraName,
      rasiName,
      thithiName: thithiObj.name,
      dayOfWeek: dayOfWeekInfo.name,
      startTimeStr: `${startH}:${startM}`,
      endTimeStr: `${endH}:${endM}`,
      thithiAnalysis
    };
  });
};