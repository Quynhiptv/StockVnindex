
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const FOREIGN_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=358629670';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';

interface MergedStockData {
  symbol: string;
  netVolume: number;
  netValue: number;
  avgPrice: string;
  buySessions: number;
  sellSessions: number;
  currentPrice: string;
  changePercent: string;
}

const ForeignFlow: React.FC = () => {
  const [data, setData] = useState<MergedStockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csv: string) => {
    return csv.split('\n').map(row => {
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
      const [foreignRes, priceRes] = await Promise.all([
        fetch(`${FOREIGN_DATA_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!foreignRes.ok || !priceRes.ok) throw new Error('Không thể tải dữ liệu');

      const foreignCSV = await foreignRes.text();
      const priceCSV = await priceRes.text();

      const foreignRows = parseCSV(foreignCSV).slice(1);
      const priceRows = parseCSV(priceCSV).slice(1);

      const priceMap = new Map();
      priceRows.forEach(row => {
        if (row[0]) priceMap.set(row[0], { price: row[1], change: row[2] });
      });

      const merged: MergedStockData[] = foreignRows
        .filter(row => row[0])
        .map(row => {
          const symbol = row[0];
          const priceInfo = priceMap.get(symbol) || { price: '-', change: '0%' };
          
          return {
            symbol,
            netVolume: (parseFloat(row[8]?.replace(/\./g, '').replace(',', '.')) || 0),
            netValue: (parseFloat(row[9]?.replace(/\./g, '').replace(',', '.')) || 0) / 1000000000,
            avgPrice: row[10] || '-',
            buySessions: parseInt(row[12]) || 0,
            sellSessions: parseInt(row[13]) || 0,
            currentPrice: priceInfo.price,
            changePercent: priceInfo.change
          };
        });

      setData(merged);
    } catch (err) {
      setError('Lỗi kết nối dữ liệu máy chủ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPercent = (val: string) => {
    if (!val || val === '-') return '0%';
    return val.endsWith('%') ? val : `${val}%`;
  };

  const getChangeColor = (val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    if (num > 0) return 'text-emerald-600';
    if (num < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu Khối Ngoại...</p>
      </div>
    );
  }

  const topBuy = [...data].filter(d => d.netValue > 0).sort((a, b) => b.netValue - a.netValue).slice(0, 20);
  const topSell = [...data].filter(d => d.netValue < 0).sort((a, b) => a.netValue - b.netValue).slice(0, 20);
  
  const chartData = [...data]
    .sort((a, b) => Math.abs(b.netValue) - Math.abs(a.netValue))
    .slice(0, 10)
    .map(d => ({ name: d.symbol, value: d.netValue }));

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600/10 p-2.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">TOP 10 GIAO DỊCH RÒNG KHỐI NGOẠI (TỶ VNĐ)</h3>
            <p className="text-[10px] text-slate-400 font-bold">Dữ liệu cập nhật: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP MUA */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
            <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
              TOP MUA RÒNG
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">Mã</th>
                  <th className="px-5 py-4 text-right">GT Mua (tỷ)</th>
                  <th className="px-5 py-4 text-right">Giá TB</th>
                  <th className="px-5 py-4 text-right">Số Phiên</th>
                  <th className="px-5 py-4 text-right">Giá Hiện Tại</th>
                  <th className="px-5 py-4 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topBuy.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4 font-black text-slate-800 transition-all duration-500">{stock.symbol}</td>
                    <td className="px-5 py-4 text-right font-black text-emerald-600 transition-all duration-500">{stock.netValue.toFixed(1)}</td>
                    <td className="px-5 py-4 text-right text-slate-500 font-bold transition-all duration-500">{stock.avgPrice}</td>
                    <td className="px-5 py-4 text-right text-emerald-600 font-bold transition-all duration-500">{stock.buySessions} Phiên</td>
                    <td className="px-5 py-4 text-right text-slate-800 font-black transition-all duration-500">{stock.currentPrice}</td>
                    <td className={`px-5 py-4 text-right font-black transition-all duration-500 ${getChangeColor(stock.changePercent)}`}>
                      {formatPercent(stock.changePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP BÁN */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="bg-rose-600 px-6 py-5 flex items-center justify-between">
            <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
              TOP BÁN RÒNG
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">Mã</th>
                  <th className="px-5 py-4 text-right">GT Bán (tỷ)</th>
                  <th className="px-5 py-4 text-right">Giá TB</th>
                  <th className="px-5 py-4 text-right">Số Phiên</th>
                  <th className="px-5 py-4 text-right">Giá Hiện Tại</th>
                  <th className="px-5 py-4 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topSell.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4 font-black text-slate-800 transition-all duration-500">{stock.symbol}</td>
                    <td className="px-5 py-4 text-right font-black text-rose-600 transition-all duration-500">{Math.abs(stock.netValue).toFixed(1)}</td>
                    <td className="px-5 py-4 text-right text-slate-500 font-bold transition-all duration-500">{stock.avgPrice}</td>
                    <td className="px-5 py-4 text-right text-rose-600 font-bold transition-all duration-500">{stock.sellSessions} Phiên</td>
                    <td className="px-5 py-4 text-right text-slate-800 font-black transition-all duration-500">{stock.currentPrice}</td>
                    <td className={`px-5 py-4 text-right font-black transition-all duration-500 ${getChangeColor(stock.changePercent)}`}>
                      {formatPercent(stock.changePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForeignFlow;
