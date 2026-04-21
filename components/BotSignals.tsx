
import React, { useEffect, useState, useMemo } from 'react';

const BOT_SIGNALS_ID = import.meta.env.VITE_BOT_SIGNALS_SHEET_ID || '12iFNV5uHO6k0JhOI_6MDwRBfpvyMpKMY-f1ucj3Jd9k';
const PRICE_DATA_ID = import.meta.env.VITE_PRICE_DATA_SHEET_ID || '13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c';

const SIGNALS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${BOT_SIGNALS_ID}/export?format=csv&gid=1277996624`;
const PRICE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${PRICE_DATA_ID}/export?format=csv&gid=1628670680`;

interface RawSignal {
  sentTime: string;    // Col A
  symbol: string;      // Col C
  botPrice: number;    // Col D
  signalTime: string;  // Col E
  note: string;        // Col F
}

interface PriceData {
  symbol: string;
  currentPrice: number;
  changePercent: number;
}

interface MergedSignal extends RawSignal {
  currentPrice: number;
  sessionChange: number;
  profitLoss: number;
  tPlus: string;
  fullSignalDateTime: Date;
}

const cleanNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const sVal = String(val).trim();
  if (!sVal || sVal === '-' || sVal === '' || sVal === '#N/A' || sVal === '#VALUE!') return 0;
  let s = sVal.replace('%', '');
  
  // Handle Vietnamese decimal format (comma as decimal separator)
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    s = s.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
};

const calculateTPlus = (signalDateStr: string): string => {
  try {
    // signalDateStr is MM/DD/YYYY HH:mm:ss based on user description (04/16/2026 10:00:00)
    const signalDate = new Date(signalDateStr);
    if (isNaN(signalDate.getTime())) return 'T+?';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(signalDate);
    start.setHours(0, 0, 0, 0);

    if (start.getTime() > today.getTime()) return 'T+0';

    let count = 0;
    let current = new Date(start);

    while (current.getTime() < today.getTime()) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
    }

    return `T+${count}`;
  } catch (e) {
    return 'T+?';
  }
};

const BotSignals: React.FC = () => {
  const [signals, setSignals] = useState<MergedSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csv: string) => {
    return csv.split(/\r?\n/).filter(line => line.trim() !== '').map(row => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let char of row) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const [signalsRes, priceRes] = await Promise.all([
        fetch(`${SIGNALS_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!signalsRes.ok || !priceRes.ok) throw new Error('Không thể tải dữ liệu tín hiệu BOT');

      const signalsCsv = await signalsRes.text();
      const priceCsv = await priceRes.text();

      const signalRows = parseCSV(signalsCsv);
      const priceRows = parseCSV(priceCsv);

      const priceMap = new Map<string, PriceData>();
      priceRows.slice(1).forEach(row => {
        if (row[0]) {
          priceMap.set(row[0].trim().toUpperCase(), {
            symbol: row[0].trim().toUpperCase(),
            currentPrice: cleanNumber(row[1]),
            changePercent: cleanNumber(row[2])
          });
        }
      });

      const merged: MergedSignal[] = signalRows.slice(1).map(row => {
        const symbol = row[2]?.trim().toUpperCase() || '';
        const botPrice = cleanNumber(row[3]);
        const signalTimeStr = row[4]?.trim() || ''; // MM/DD/YYYY HH:mm:ss
        const sentTimeStr = row[0]?.trim() || '';   // DD/MM/YYYY HH:mm:ss
        
        const priceInfo = priceMap.get(symbol);
        const currentPrice = priceInfo?.currentPrice || 0;
        const sessionChange = priceInfo?.changePercent || 0;
        
        const profitLoss = botPrice > 0 ? ((currentPrice - botPrice) / botPrice) * 100 : 0;
        
        // Extract Time from Sent Time (Col A)
        let timePart = '';
        if (sentTimeStr.includes(' ')) {
          timePart = sentTimeStr.split(' ')[1];
        }

        // Extract Date from Signal Time (Col E)
        let datePart = '';
        if (signalTimeStr.includes(' ')) {
          const parts = signalTimeStr.split(' ')[0].split('/');
          if (parts.length === 3) {
            // parts[0] is MM, parts[1] is DD, parts[2] is YYYY
            datePart = `${parts[1]}/${parts[0]}/${parts[2]}`;
          }
        }

        return {
          sentTime: timePart,
          symbol,
          botPrice,
          signalTime: datePart,
          note: row[5] || '',
          currentPrice,
          sessionChange,
          profitLoss,
          tPlus: calculateTPlus(signalTimeStr),
          fullSignalDateTime: new Date(signalTimeStr)
        };
      });

      // Sort by signal time descending
      merged.sort((a, b) => b.fullSignalDateTime.getTime() - a.fullSignalDateTime.getTime());

      setSignals(merged);
      setError(null);
    } catch (err: any) {
      console.error('Lỗi BotSignals:', err);
      setError('Đang đồng bộ dữ liệu tín hiệu...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getProfitColor = (val: number) => {
    if (val > 0) return 'text-emerald-600';
    if (val < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  const getSessionColor = (val: number) => {
    if (val > 0) return 'text-emerald-600';
    if (val < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  if (loading && signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang quét tín hiệu BOT...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-2xl shadow-xl shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Tín hiệu auto scan bot</h3>
            <p className="text-slate-500 text-lg font-medium mt-1 italic">Quét tín hiệu mua tự động & Dữ liệu intraday trong phiên</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <span className="text-[16px] font-black uppercase tracking-widest">BOT ACTIVE</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
          <h3 className="text-white text-base font-black uppercase tracking-widest">Danh sách tín hiệu mới nhất</h3>
          <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-white/30">
            {signals.length} Tín hiệu
          </span>
        </div>
        
        <div className="overflow-x-auto no-scrollbar max-h-[800px] overflow-y-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-50/95 backdrop-blur-sm">
                <th className="px-6 py-4 text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[120px]">Ngày tháng</th>
                <th className="px-6 py-4 text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[100px]">Giờ phút</th>
                <th className="px-6 py-4 text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[140px]">Tên Cổ phiếu</th>
                <th className="px-6 py-4 text-right text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[100px]">Giá BOT</th>
                <th className="px-6 py-4 text-center text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[100px]">Số phiên</th>
                <th className="px-6 py-4 text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[200px]">Tín hiệu</th>
                <th className="px-6 py-4 text-right text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[120px]">Giá hiện tại</th>
                <th className="px-6 py-4 text-right text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[120px]">% Thay đổi</th>
                <th className="px-6 py-4 text-right text-[15px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[120px]">Lãi lỗ tạm tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {signals.map((item, index) => {
                const profitColor = getProfitColor(item.profitLoss);
                const sessionColor = getSessionColor(item.sessionChange);
                
                return (
                  <tr key={`${item.symbol}-${index}`} className="hover:bg-indigo-50/30 transition-all duration-500 group">
                    <td className="px-6 py-2 font-mono font-bold text-lg text-slate-500 border-b border-slate-50 transition-all duration-500">
                      {item.signalTime}
                    </td>
                    <td className="px-6 py-2 font-mono font-bold text-lg text-slate-500 border-b border-slate-50 transition-all duration-500">
                      {item.sentTime}
                    </td>
                    <td className={`px-6 py-2 font-black text-xl uppercase tracking-tight border-b border-slate-50 transition-all duration-500 ${profitColor}`}>
                      {item.symbol}
                    </td>
                    <td className="px-6 py-2 text-right font-mono font-bold text-lg text-slate-600 tabular-nums border-b border-slate-50 transition-all duration-500">
                      {item.botPrice.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-2 text-center border-b border-slate-50 transition-all duration-500">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[14px] font-black text-slate-600 uppercase transition-all duration-500">
                        {item.tPlus}
                      </span>
                    </td>
                    <td className="px-6 py-2 font-bold text-lg text-slate-600 border-b border-slate-50 transition-all duration-500">
                      {item.note}
                    </td>
                    <td className={`px-6 py-2 text-right font-mono font-black text-lg tabular-nums border-b border-slate-50 transition-all duration-500 ${sessionColor}`}>
                      {item.currentPrice.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-2 text-right font-mono font-black text-lg tabular-nums border-b border-slate-50 transition-all duration-500 ${sessionColor}`}>
                      {item.sessionChange > 0 ? '+' : ''}{item.sessionChange.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </td>
                    <td className={`px-6 py-2 text-right font-mono font-black text-lg tabular-nums border-b border-slate-50 transition-all duration-500 ${profitColor}`}>
                      {item.profitLoss > 0 ? '+' : ''}{item.profitLoss.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </td>
                  </tr>
                );
              })}
              {signals.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">
                    Không tìm thấy tín hiệu BOT
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {error && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center shadow-sm">
          <p className="text-amber-600 text-sm font-black uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
};

export default BotSignals;
