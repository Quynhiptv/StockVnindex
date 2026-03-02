
import React, { useEffect, useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';

const VN30F1M_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1z5ZL72hbhzB6G2Tzh6s-E1BIbqmuqct0EA0Mdfuf9VY/export?format=csv&gid=1836056666';

interface VN30F1MDataPoint {
  date: string;
  foreign: number;
  proprietary: number;
}

interface HeaderInfo {
  foreignChange: string;
  foreignHolding: string;
  propChange: string;
  propHolding: string;
}

const cleanNumeric = (val: string): number | null => {
  if (!val || val.trim() === '' || val === '-') return null;
  const cleaned = val.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const VN30F1MChart: React.FC = () => {
  const [data, setData] = useState<VN30F1MDataPoint[]>([]);
  const [header, setHeader] = useState<HeaderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`${VN30F1M_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Dữ liệu chưa sẵn sàng');
      
      const csv = await res.text();
      const rows = csv.split(/\r?\n/).filter(line => line.trim() !== '').map(row => {
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

      if (rows.length >= 4) {
        setHeader({
          foreignChange: rows[2][6] || '0',
          foreignHolding: rows[2][7] || '0',
          propChange: rows[3][6] || '0',
          propHolding: rows[3][7] || '0'
        });
      }

      const chartPoints: VN30F1MDataPoint[] = rows.slice(1)
        .map(row => ({
          date: row[0] || '',
          foreign: cleanNumeric(row[9]),
          proprietary: cleanNumeric(row[10])
        }))
        .filter(p => p.date !== '');

      setData(chartPoints);
    } catch (err) {
      console.error('Error fetching VN30F1M data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderHeaderRow = (label: string, change: string, holding: string) => {
    const changeVal = cleanNumeric(change);
    const isPositive = changeVal > 0;
    const prefix = isPositive ? 'Nâng ' : 'Hạ ';
    const colorClass = isPositive ? 'text-emerald-600' : 'text-rose-600';

    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:text-base">
        <span className="font-bold text-slate-700">{label}:</span>
        <span className={`font-black ${colorClass}`}>
          {prefix}{change}
        </span>
        <span className="text-slate-400">|</span>
        <span className="font-bold text-slate-700">
          Nắm giữ qua ngày: <span className="text-blue-600 font-black">{holding} Hợp đồng</span>
        </span>
      </div>
    );
  };

  if (loading && data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Đang tải biểu đồ VN30F1M...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 lg:p-14 shadow-sm relative overflow-hidden group">
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-100"></div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Đồ thị hợp đồng tương lai VN30F1M</h3>
        </div>
        
        {header && (
          <div className="flex flex-col gap-3 px-6 py-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
            {renderHeaderRow('Khối ngoại', header.foreignChange, header.foreignHolding)}
            {renderHeaderRow('Khối Tự doanh', header.propChange, header.propHolding)}
          </div>
        )}
      </div>
      
      <div className="w-full relative h-[350px] sm:h-[450px] lg:h-[550px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 30, right: 40, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={true} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '900' }} 
              axisLine={{ stroke: '#f1f5f9' }} 
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis 
              orientation="right" 
              stroke="#94a3b8" 
              fontSize={11} 
              fontWeight="900" 
              axisLine={false} 
              tickLine={false} 
              domain={['dataMin - 500', 'dataMax + 500']}
              tickFormatter={(val) => val.toLocaleString('vi-VN')}
            />
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
              formatter={(val: any) => [val.toLocaleString('vi-VN'), '']}
            />
            
            <Line 
              type="monotone" 
              dataKey="foreign" 
              name="Khối ngoại"
              stroke="#3b82f6" 
              strokeWidth={4} 
              dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }}
              isAnimationActive={false}
              connectNulls={true}
            />
            <Line 
              type="monotone" 
              dataKey="proprietary" 
              name="Tự doanh"
              stroke="#f43f5e" 
              strokeWidth={4} 
              dot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8, fill: '#f43f5e', strokeWidth: 3, stroke: '#fff' }}
              isAnimationActive={false}
              connectNulls={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 flex flex-wrap justify-center items-center gap-6 px-6 py-5 bg-slate-50 rounded-[2rem] border border-slate-100">
           <div className="flex items-center gap-2.5">
             <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white"></div>
             <span className="text-[11px] text-slate-800 font-black uppercase">KHỐI NGOẠI</span>
           </div>
           <div className="flex items-center gap-2.5">
             <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white"></div>
             <span className="text-[11px] text-slate-800 font-black uppercase">TỰ DOANH</span>
           </div>
      </div>
    </div>
  );
};

export default VN30F1MChart;
