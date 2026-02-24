
import React, { useEffect, useState } from 'react';

const ATC_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1041014389';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';

interface ATCStockData {
  symbol: string;
  klAtc: number;
  klDong: number;
  gtDong: number;
  currentPrice: string;
  changePercent: string;
}

const ATCForeign: React.FC = () => {
  const [data, setData] = useState<ATCStockData[]>([]);
  const [tradingDate, setTradingDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      const [atcRes, priceRes] = await Promise.all([
        fetch(ATC_DATA_URL),
        fetch(PRICE_DATA_URL)
      ]);
      if (!atcRes.ok || !priceRes.ok) throw new Error('Không thể tải dữ liệu ATC');
      const atcCSV = await atcRes.text();
      const priceCSV = await priceRes.text();
      const atcRows = parseCSV(atcCSV);
      const priceRows = parseCSV(priceCSV).slice(1);
      
      // Lấy dữ liệu ngày từ ô N2 (N là cột thứ 14, index 13)
      if (atcRows[1] && atcRows[1][13]) {
        setTradingDate(atcRows[1][13]);
      } else if (atcRows[1] && atcRows[1][1]) {
        // Fallback về ô B2 nếu N2 trống
        setTradingDate(atcRows[1][1]);
      }

      const priceMap = new Map();
      priceRows.forEach(row => { if (row[0]) priceMap.set(row[0], { price: row[1], change: row[2] }); });
      
      const merged: ATCStockData[] = atcRows
        .slice(1)
        .filter(row => row[12] && row[12] !== 'Mã CP' && row[12] !== '') 
        .map(row => {
          const symbol = row[12];
          const priceInfo = priceMap.get(symbol) || { price: '-', change: '0' };
          return {
            symbol,
            klAtc: parseFloat(row[24]?.replace(/\./g, '').replace(',', '.')) || 0,
            klDong: parseFloat(row[25]?.replace(/\./g, '').replace(',', '.')) || 0,
            gtDong: parseFloat(row[26]?.replace(/\./g, '').replace(',', '.')) || 0,
            currentPrice: priceInfo.price,
            changePercent: priceInfo.change
          };
        }).filter(item => item.klAtc !== 0);
      setData(merged);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPercentColor = (val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    if (num > 0) return 'text-emerald-600';
    if (num < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu ATC Khối Ngoại...</p>
      </div>
    );
  }

  const buyList = data.filter(d => d.klAtc > 0).sort((a, b) => b.klAtc - a.klAtc);
  const sellList = data.filter(d => d.klAtc < 0).sort((a, b) => a.klAtc - b.klAtc);

  const Table = ({ title, list, headerBg }: { title: string, list: ATCStockData[], headerBg: string }) => (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
      <div className={`${headerBg} px-6 py-5 flex items-center gap-3`}>
        <h3 className="text-white text-sm font-black uppercase tracking-widest">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
              <th className="px-5 py-4">Mã</th>
              <th className="px-5 py-4 text-right">KL ATC</th>
              <th className="px-5 py-4 text-right">KL Dòng</th>
              <th className="px-5 py-4 text-right">GT Dòng</th>
              <th className="px-5 py-4 text-right">Giá Hiện Tại</th>
              <th className="px-5 py-4 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item) => (
              <tr key={item.symbol} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-black text-slate-800">{item.symbol}</td>
                <td className="px-5 py-4 text-right font-black text-slate-500">{item.klAtc.toLocaleString('vi-VN')}</td>
                <td className={`px-5 py-4 text-right font-black ${item.klDong < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.klDong.toLocaleString('vi-VN')} CP</td>
                <td className={`px-5 py-4 text-right font-black ${item.gtDong < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.gtDong.toFixed(1)} tỷ</td>
                <td className={`px-5 py-4 text-right font-black ${getPercentColor(item.changePercent)}`}>{item.currentPrice}</td>
                <td className={`px-5 py-4 text-right font-black ${getPercentColor(item.changePercent)}`}>{item.changePercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Info Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật danh sách cổ phiếu được khối ngoại Mua - Bán trong phiên ATC</h2>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                Dữ liệu được cập nhật khi kết thúc phiên giao dịch
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">
                Dữ liệu ngày : <span className="text-indigo-600 font-black">{tradingDate || '---'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Table title="KHỐI NGOẠI MUA TRONG ATC" list={buyList} headerBg="bg-blue-600" />
        <Table title="KHỐI NGOẠI BÁN TRONG ATC" list={sellList} headerBg="bg-rose-600" />
      </div>
    </div>
  );
};

export default ATCForeign;
