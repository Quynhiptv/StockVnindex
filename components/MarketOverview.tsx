
import React, { useEffect, useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, LabelList } from 'recharts';

const INDEX_SHEET_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=0';
const MOMENTUM_SHEET_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1280701284';

interface MarketIndexData {
  name: string;
  price: string;
  changePercent: string;
  value: string;
  rsi: string;
  ma20: string;
  volYesterday: string;
  volAvg20: string;
}

interface MomentumPoint {
  date: string;
  ma5: number;
  ma10: number;
  ma20: number;
}

const ensurePercent = (val: string) => {
  if (!val || val === '0' || val === '-') return '0%';
  const clean = val.trim();
  return clean.endsWith('%') ? clean : `${clean}%`;
};

const cleanNumeric = (val: string): number => {
  if (!val) return 0;
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const IndexCard: React.FC<{ data: MarketIndexData }> = ({ data }) => {
  const cleanChangePercent = data.changePercent.replace(',', '.');
  const changeVal = parseFloat(cleanChangePercent);
  
  let bgColor = 'bg-white';
  let borderColor = 'border-slate-200';
  let badgeColor = 'bg-slate-100 text-slate-600';
  let priceColor = 'text-slate-900';

  if (changeVal > 0) {
    bgColor = 'bg-emerald-50/20'; 
    borderColor = 'border-emerald-100';
    badgeColor = 'bg-emerald-600 text-white';
    priceColor = 'text-emerald-700';
  } else if (changeVal < 0) {
    bgColor = 'bg-rose-50/20';
    borderColor = 'border-rose-100';
    badgeColor = 'bg-rose-600 text-white';
    priceColor = 'text-rose-700';
  }

  const rawValue = cleanNumeric(data.value);
  const formattedValue = Math.round(rawValue / 1000).toLocaleString('vi-VN') + ' tỷ';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500`}>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{data.name}</h3>
        <div className={`px-4 py-1.5 rounded-xl text-[12px] font-black uppercase ${badgeColor}`}>
          {ensurePercent(data.changePercent)}
        </div>
      </div>

      <div className="mb-8">
        <div className={`text-4xl sm:text-5xl font-black ${priceColor} tracking-tighter leading-none tabular-nums`}>{data.price}</div>
        <div className="text-slate-500 text-[10px] font-black mt-5 bg-white inline-block px-4 py-1.5 rounded-full uppercase border border-slate-100 shadow-sm">
          GTGD: {formattedValue}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 pt-8 border-t border-slate-100/50">
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">RSI (14)</p>
          <p className="text-lg font-black text-slate-800 tabular-nums">{data.rsi}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">CÁCH MA20</p>
          <p className="text-lg font-black text-slate-800 tabular-nums">{ensurePercent(data.ma20)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">VOL / QUA</p>
          <p className="text-lg font-black text-slate-800 tabular-nums">{ensurePercent(data.volYesterday)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">VOL / TB20</p>
          <p className="text-lg font-black text-slate-800 tabular-nums">{ensurePercent(data.volAvg20)}</p>
        </div>
      </div>
    </div>
  );
};

const MomentumChart: React.FC<{ title: string; data: MomentumPoint[] }> = ({ title, data }) => {
  const chartId = useMemo(() => title.replace(/[^a-z0-9]/gi, '-').toLowerCase(), [title]);
  const gradientId = `ma20Gradient-${chartId}`;

  if (data.length === 0) return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 h-[300px] flex items-center justify-center">
       <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Đang tải biểu đồ...</span>
       </div>
    </div>
  );
  
  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 lg:p-14 shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-100"></div>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      </div>
      
      <div className="w-full relative h-[350px] sm:h-[450px] lg:h-[550px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                {data.map((point, i) => {
                  if (i === 0) return null;
                  const prev = data[i - 1].ma20;
                  const curr = point.ma20;
                  
                  let color = '#f59e0b'; // Ngang
                  if (curr > prev) color = '#10b981'; // Tăng
                  if (curr < prev) color = '#f43f5e'; // Giảm

                  const startPos = ((i - 1) / (data.length - 1)) * 100;
                  const endPos = (i / (data.length - 1)) * 100;

                  return (
                    <React.Fragment key={`grad-${i}`}>
                      <stop offset={`${startPos}%`} stopColor={color} />
                      <stop offset={`${endPos}%`} stopColor={color} />
                    </React.Fragment>
                  );
                })}
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={false} axisLine={{ stroke: '#f1f5f9' }} tickLine={false} />
            <YAxis orientation="right" stroke="#94a3b8" fontSize={11} fontWeight="900" axisLine={false} tickLine={false} domain={['dataMin', 'dataMax']} />
            <Tooltip
              cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                border: 'none', 
                borderRadius: '20px', 
                fontSize: '11px', 
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                padding: '12px'
              }}
            />
            
            <Line type="monotone" dataKey="ma5" stroke="#f59e0b" strokeWidth={1.5} dot={false} opacity={0.25} isAnimationActive={false} />
            <Line type="monotone" dataKey="ma10" stroke="#3b82f6" strokeWidth={2} dot={false} opacity={0.35} isAnimationActive={false} />
            <Line 
              type="monotone" 
              dataKey="ma20" 
              stroke={`url(#${gradientId})`} 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#fff', strokeWidth: 3, stroke: '#94a3b8' }} 
              activeDot={{ r: 8, fill: '#fff', strokeWidth: 4, stroke: '#475569' }}
              isAnimationActive={false} 
            >
              <LabelList dataKey="ma20" position="top" offset={20} fill="#334155" fontSize={10} fontWeight="900" 
                formatter={((val: any, index: number) => (index % 5 === 0 || index === data.length - 1) ? Number(val).toFixed(0) : '') as any}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 flex flex-wrap justify-center items-center gap-6 px-6 py-5 bg-slate-50 rounded-[2rem] border border-slate-100">
           <div className="flex items-center gap-2.5">
             <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white"></div>
             <span className="text-[11px] text-slate-800 font-black uppercase">XU THẾ TĂNG</span>
           </div>
           <div className="flex items-center gap-2.5">
             <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white"></div>
             <span className="text-[11px] text-slate-800 font-black uppercase">XU THẾ GIẢM</span>
           </div>
           <div className="flex items-center gap-2.5">
             <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white"></div>
             <span className="text-[11px] text-slate-800 font-black uppercase">ĐI NGANG</span>
           </div>
      </div>
    </div>
  );
};

const MarketOverview: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndexData[]>([]);
  const [momentumData, setMomentumData] = useState<{vn100: MomentumPoint[], vn30: MomentumPoint[]}>({vn100: [], vn30: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const timestamp = new Date().getTime();
      const [indexRes, momentumRes] = await Promise.all([
        fetch(`${INDEX_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${MOMENTUM_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!indexRes.ok || !momentumRes.ok) throw new Error('Dữ liệu chưa sẵn sàng');
      
      const indexCSV = await indexRes.text();
      const momentumCSV = await momentumRes.text();

      const parseRows = (csv: string) => {
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

      const indexRows = parseRows(indexCSV);
      const targetNames = ['VNINDEX', 'VN30', 'UPINDEX', 'HNX30', 'HNXINDEX', 'VNXALL'];
      const mappedIndices: MarketIndexData[] = indexRows
        .slice(1)
        .filter(row => row[0] && targetNames.includes(row[0].trim()))
        .map(row => ({
          name: row[0].trim(),
          price: row[9]?.trim() || '0',
          changePercent: row[7]?.trim() || '0',
          value: row[3]?.trim() || '0',
          rsi: row[18]?.trim() || '0',
          ma20: row[16]?.trim() || '0',
          volYesterday: row[4]?.trim() || '0',
          volAvg20: row[6]?.trim() || '0'
        }));
      mappedIndices.sort((a, b) => targetNames.indexOf(a.name) - targetNames.indexOf(b.name));
      setIndices(mappedIndices);

      const momentumRows = parseRows(momentumCSV);
      const displayData = momentumRows.slice(1, 51);

      const rawPointsVN100: MomentumPoint[] = [];
      const rawPointsVN30: MomentumPoint[] = [];

      displayData.forEach(row => {
        if (row[0] && row[0] !== '') {
          rawPointsVN100.push({
            date: row[0],
            ma5: cleanNumeric(row[1]),
            ma10: cleanNumeric(row[2]),
            ma20: cleanNumeric(row[3])
          });
        }
        if (row[4] || row[0]) {
          rawPointsVN30.push({
            date: row[4] || row[0],
            ma5: cleanNumeric(row[5]),
            ma10: cleanNumeric(row[6]),
            ma20: cleanNumeric(row[7])
          });
        }
      });

      rawPointsVN100.reverse();
      rawPointsVN30.reverse();

      setMomentumData({ vn100: rawPointsVN100, vn30: rawPointsVN30 });
      setError(null);
    } catch (err: any) {
      setError('Đang đồng bộ dữ liệu...');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12 md:space-y-20 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white px-8 py-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-5 rounded-[1.5rem] shadow-xl shadow-blue-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">CHỈ SỐ THỊ TRƯỜNG</h2>
            <p className="text-[12px] font-black text-slate-400 mt-4 uppercase tracking-[0.25em]">DÒNG TIỀN & ĐỘNG LƯỢNG THỰC THỜI</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} className="group flex items-center justify-center gap-4 px-10 py-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-[1.8rem] shadow-sm transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-blue-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[14px] font-black text-slate-800 uppercase tracking-widest">LÀM MỚI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {indices.map((item) => <IndexCard key={item.name} data={item} />)}
      </div>

      <div className="flex flex-col gap-16 md:gap-24">
        <MomentumChart title="ĐỘNG LƯỢNG VN100" data={momentumData.vn100} />
        <MomentumChart title="ĐỘNG LƯỢNG VN30" data={momentumData.vn30} />
      </div>
      
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-10 rounded-[2.5rem] text-center shadow-sm">
          <p className="text-rose-600 text-[14px] font-black uppercase tracking-[0.3em]">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MarketOverview;
