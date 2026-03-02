
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const SECTOR_DATA_URL = 'https://docs.google.com/spreadsheets/d/1z5ZL72hbhzB6G2Tzh6s-E1BIbqmuqct0EA0Mdfuf9VY/export?format=csv&gid=1485532794';

interface SectorData {
  name: string;
  volVsPrev: number;
  volVsAvg20: number;
  changeToday: number;
  changePrev: number;
  strengthIndex: number;
  strengthChange: number;
  vsMA20: number;      // Cột P
  rsi: number;         // Cột S
  adx: number;         // Cột T
}

const cleanNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const sVal = String(val).trim();
  if (!sVal || sVal === '-' || sVal === '' || sVal === '#N/A' || sVal === '#VALUE!') return 0;
  let s = sVal.replace('%', '');
  
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

const getTrendColor = (val: number) => {
  if (val > 0) return 'text-emerald-600';
  if (val < 0) return 'text-rose-600';
  return 'text-amber-500';
};

const SectorAnalysis: React.FC = () => {
  const [data, setData] = useState<SectorData[]>([]);
  const [updateDate, setUpdateDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csv: string) => {
    try {
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
    } catch (e) {
      console.error("CSV Parse Error", e);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`${SECTOR_DATA_URL}&t=${timestamp}`, { cache: 'no-store' });

      if (!response.ok) throw new Error('Không thể tải dữ liệu nhóm ngành');

      const csv = await response.text();
      const rows = parseCSV(csv);

      if (rows.length === 0) {
        throw new Error('Dữ liệu trống hoặc không đúng định dạng');
      }

      // Dữ liệu ngày: Hiển thị ô B2 (hàng 2, cột 2 -> index [1][1])
      if (rows[1] && rows[1][1]) {
        setUpdateDate(rows[1][1]);
      }

      const parsedData: SectorData[] = rows
        .slice(1) // Bỏ qua hàng tiêu đề
        .filter(row => row[0] && row[0] !== 'Nhóm ngành' && row[0] !== '')
        .map(row => ({
          name: row[0] || 'N/A',
          volVsPrev: cleanNumber(row[4]), // Cột E
          volVsAvg20: cleanNumber(row[6]), // Cột G
          changeToday: cleanNumber(row[7]), // Cột H
          changePrev: cleanNumber(row[8]), // Cột I
          strengthIndex: cleanNumber(row[10]), // Cột K
          vsMA20: cleanNumber(row[15]),      // Cột P
          rsi: cleanNumber(row[18]),         // Cột S
          adx: cleanNumber(row[19]),         // Cột T
          strengthChange: cleanNumber(row[21]) // Cột V
        }));

      setData(parsedData);
      setError(null);
    } catch (err: any) {
      console.error('Lỗi SectorAnalysis:', err);
      setError(err.message || 'Đã xảy ra lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const runAiAnalysis = async () => {
    if (data.length === 0) return;
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Thiếu GEMINI_API_KEY. Nếu bạn đang chạy trên Vercel, hãy thêm key này vào Environment Variables trong Project Settings.');
      }

      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey });

      const sorted = [...data].sort((a, b) => b.changeToday - a.changeToday);
      const top3 = sorted.slice(0, 3);
      const bottom3 = sorted.slice(-3).reverse();

      const prompt = `
        Dựa trên dữ liệu thị trường chứng khoán Việt Nam ngày ${updateDate}, hãy đưa ra nhận định chuyên sâu và chuyên nghiệp về 3 nhóm ngành tăng mạnh nhất và 3 nhóm ngành giảm mạnh nhất.
        
        Dữ liệu 3 nhóm ngành TĂNG mạnh nhất:
        ${top3.map(s => `- ${s.name}: Biến động ${s.changeToday}%, KL/TB20P: ${s.volVsAvg20}%, Sức mạnh: ${s.strengthIndex} (Biến động: ${s.strengthChange}), Cách MA20: ${s.vsMA20}%, RSI: ${s.rsi}, ADX: ${s.adx}`).join('\n')}
        
        Dữ liệu 3 nhóm ngành GIẢM mạnh nhất:
        ${bottom3.map(s => `- ${s.name}: Biến động ${s.changeToday}%, KL/TB20P: ${s.volVsAvg20}%, Sức mạnh: ${s.strengthIndex} (Biến động: ${s.strengthChange}), Cách MA20: ${s.vsMA20}%, RSI: ${s.rsi}, ADX: ${s.adx}`).join('\n')}
        
        Yêu cầu phân tích:
        1. Đánh giá XU HƯỚNG: Sử dụng ADX (độ mạnh xu hướng) và RSI (quá mua/quá bán) kết hợp với vị thế so với MA20.
        2. Phân tích DÒNG TIỀN: Tương quan giữa giá và khối lượng (KL/TB20P).
        3. Đánh giá SỨC MẠNH: Dựa trên Chỉ số sức mạnh và Biến động bậc.
        4. Đưa ra CHIẾN LƯỢC: Lời khuyên cụ thể (Mua, Nắm giữ, Chốt lời, hoặc Cắt lỗ) cho từng nhóm.
        
        Trình bày:
        - Chia rõ các phần: "Tổng quan dòng tiền", "Phân tích chi tiết Nhóm Tăng", "Phân tích chi tiết Nhóm Giảm", "Kết luận & Hành động".
        - Ngôn ngữ: Tiếng Việt, phong cách chuyên gia phân tích cao cấp.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setAiAnalysis(response.text || "Không có phản hồi từ AI.");
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      setAiAnalysis(`Đã xảy ra lỗi khi kết nối với AI: ${error.message || 'Lỗi không xác định'}. Vui lòng thử lại sau.`);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5s
    return () => clearInterval(interval);
  }, []);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.changeToday - a.changeToday);
  }, [data]);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu nhóm ngành...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-rose-100 shadow-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-slate-500 text-sm font-medium mb-8">{error}</p>
        <button 
          onClick={fetchData}
          className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          Thử lại ngay
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-start gap-6 flex-grow">
            <div className="bg-blue-600 p-5 rounded-[1.5rem] shadow-lg shadow-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="space-y-2 flex-grow">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Dữ liệu nhóm ngành</h2>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-500">
                  Được cập nhật giữa phiên và cuối phiên giao dịch. Phân tích sức mạnh và dòng tiền theo từng lĩnh vực.
                </p>
                <p className="text-sm font-black text-blue-600 uppercase tracking-widest">
                  Dữ liệu ngày : <span className="underline underline-offset-8 decoration-blue-200">{updateDate || '---'}</span>
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={runAiAnalysis}
            disabled={aiLoading}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 ${aiLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
          >
            {aiLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Đang phân tích...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Nhận định AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Analysis Display */}
      {aiAnalysis && (
        <div className="relative group">
          {/* Decorative background elements */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          
          <div className="relative bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-800/50 overflow-hidden">
            {/* Abstract background pattern */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">AI Insights</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Phân tích chuyên sâu bởi Gemini 3 Flash</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Real-time Analysis</span>
              </div>
            </div>

            <div className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
              {aiAnalysis}
            </div>
            
            <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">© 2026 Đoàn Quỳnh Team - AI Financial Advisor</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Technical Indicators</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Sentiment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-100"></div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Biểu đồ biến động nhóm ngành (%)</h3>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontWeight: '900',
                  padding: '12px'
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Biến động']}
              />
              <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
              <Bar 
                dataKey="changeToday" 
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.changeToday >= 0 ? '#10b981' : '#f43f5e'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
          <h3 className="text-white text-base font-black uppercase tracking-widest">Chỉ số nhóm ngành</h3>
          <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-white/30">
            {sortedData.length} Nhóm ngành
          </span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 sticky left-0 bg-slate-50/90 backdrop-blur-sm z-20 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Nhóm ngành
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  % KL / Phiên trước
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  % KL / TB 20P
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  % Tăng giảm
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  % Trước đó
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Sức mạnh
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Biến động bậc
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map((item, index) => (
                <tr key={`${item.name}-${index}`} className="hover:bg-blue-50/30 transition-all duration-500 group">
                  <td className="px-6 py-5 font-black text-sm text-slate-900 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 border-b border-slate-50 transition-all duration-500">
                    {item.name}
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-sm text-slate-600 tabular-nums border-b border-slate-50 transition-all duration-500">
                    {Math.round(item.volVsPrev)}%
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-sm text-slate-600 tabular-nums border-b border-slate-50 transition-all duration-500">
                    {Math.round(item.volVsAvg20)}%
                  </td>
                  <td className={`px-6 py-5 text-right font-mono font-black text-sm tabular-nums border-b border-slate-50 transition-all duration-500 ${getTrendColor(item.changeToday)}`}>
                    <div className="flex items-center justify-end gap-1 transition-all duration-500">
                      {item.changeToday > 0 ? '▲' : item.changeToday < 0 ? '▼' : '•'}
                      {Math.abs(item.changeToday).toFixed(2)}%
                    </div>
                  </td>
                  <td className={`px-6 py-5 text-right font-mono font-bold text-sm tabular-nums border-b border-slate-50 transition-all duration-500 ${getTrendColor(item.changePrev)}`}>
                    {item.changePrev > 0 ? '+' : ''}{item.changePrev.toFixed(2)}%
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-black text-sm text-slate-900 tabular-nums border-b border-slate-50 transition-all duration-500">
                    <span className="px-2 py-1 bg-slate-100 rounded-md transition-all duration-500">
                      {item.strengthIndex.toFixed(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-5 text-right font-mono font-black text-sm tabular-nums border-b border-slate-50 transition-all duration-500 ${getTrendColor(item.strengthChange)}`}>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all duration-500 ${item.strengthChange > 0 ? 'bg-emerald-50' : item.strengthChange < 0 ? 'bg-rose-50' : 'bg-amber-50'}`}>
                      {item.strengthChange > 0 ? '+' : ''}{Math.round(item.strengthChange)} Bậc
                    </span>
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SectorAnalysis;
