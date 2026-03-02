
import React, { useEffect, useState, useMemo } from 'react';

const VOLUME_SURGE_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=566500951';

interface VolumeSurgeStock {
  symbol: string;
  price: number;
  changePercent: number;
  volVsAvg20: number;
  volume: number;
}

const cleanNumber = (val: string): number => {
  if (!val || val === '-' || val === '' || val === '#N/A' || val === '#VALUE!') return 0;
  let s = val.trim().replace('%', '');
  const commaCount = (s.match(/,/g) || []).length;
  const dotCount = (s.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    if (s.indexOf('.') < s.indexOf(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (commaCount > 1) {
    s = s.replace(/,/g, '');
  } else if (dotCount > 1) {
    s = s.replace(/\./g, '');
  } else if (commaCount === 1) {
    s = s.replace(',', '.');
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
};

const getPriceColor = (change: number) => {
  if (change > 0) return 'text-emerald-600';
  if (change < 0) return 'text-rose-600';
  return 'text-amber-500';
};

const formatVolume = (val: number) => {
  return val.toLocaleString('vi-VN');
};

const StockRow: React.FC<{ stock: VolumeSurgeStock }> = ({ stock }) => {
  const color = getPriceColor(stock.changePercent);
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className={`px-5 py-4 font-black text-xs transition-all duration-500 ${color}`}>{stock.symbol}</td>
      <td className={`px-5 py-4 text-right font-black text-xs text-slate-900 transition-all duration-500`}>{stock.price.toLocaleString('vi-VN', { minimumFractionDigits: 1 })}</td>
      <td className={`px-5 py-4 text-right font-black text-xs transition-all duration-500 ${color}`}>
        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
      </td>
      <td className="px-5 py-4 text-right font-black text-xs text-slate-700 transition-all duration-500">{stock.volVsAvg20.toFixed(1)}%</td>
      <td className="px-5 py-4 text-right font-bold text-xs text-slate-400 transition-all duration-500">{formatVolume(stock.volume)}</td>
    </tr>
  );
};

const VolumeSurge: React.FC = () => {
  const [data, setData] = useState<VolumeSurgeStock[]>([]);
  const [updateDate, setUpdateDate] = useState<string>('');
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
      const timestamp = new Date().getTime();
      const response = await fetch(`${VOLUME_SURGE_URL}&t=${timestamp}`, { cache: 'no-store' });

      if (!response.ok) throw new Error('Không thể tải dữ liệu');

      const csv = await response.text();
      const rows = parseCSV(csv);

      // Lấy dữ liệu ngày cập nhật từ ô B2 (hàng 2, cột 2 trong CSV là rows[1][1])
      if (rows[1] && rows[1][1]) {
        setUpdateDate(rows[1][1]);
      }

      const parsedData: VolumeSurgeStock[] = rows
        .slice(1)
        .filter(row => row[0] && row[0] !== 'Mã CP' && row[0] !== '')
        .map(row => ({
          symbol: row[0],
          price: cleanNumber(row[2]),
          changePercent: cleanNumber(row[3]),
          volVsAvg20: cleanNumber(row[4]),
          volume: cleanNumber(row[5])
        }));

      setData(parsedData);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Lỗi đồng bộ dữ liệu...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const gainers = useMemo(() => 
    data.filter(s => s.changePercent >= 0).sort((a, b) => b.changePercent - a.changePercent), 
  [data]);
  
  const losers = useMemo(() => 
    data.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent), 
  [data]);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang quét đột biến khối lượng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Info Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="bg-orange-100 p-4 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật những cổ phiếu có giao dịch đột biến về khối lượng</h2>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Dữ liệu ngày cập nhật: <span className="text-blue-600 font-black">{updateDate || 'Đang tải...'}</span>
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                Dữ liệu được cập nhật tự động intraday trong phiên
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Table 1: Tăng */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="bg-emerald-600 px-6 py-5 flex items-center gap-3">
            <h3 className="text-white text-sm font-black uppercase tracking-widest">CỔ PHIẾU TĂNG - THANH KHOẢN TĂNG</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">Mã</th>
                  <th className="px-5 py-4 text-right">Giá TT</th>
                  <th className="px-5 py-4 text-right">% Đổi</th>
                  <th className="px-5 py-4 text-right">% KL/TB20</th>
                  <th className="px-5 py-4 text-right">Khối lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gainers.length > 0 ? (
                  gainers.map(stock => <StockRow key={stock.symbol} stock={stock} />)
                ) : (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Giảm */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="bg-rose-600 px-6 py-5 flex items-center gap-3">
            <h3 className="text-white text-sm font-black uppercase tracking-widest">CỔ PHIẾU GIẢM - THANH KHOẢN TĂNG</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">Mã</th>
                  <th className="px-5 py-4 text-right">Giá TT</th>
                  <th className="px-5 py-4 text-right">% Đổi</th>
                  <th className="px-5 py-4 text-right">% KL/TB20</th>
                  <th className="px-5 py-4 text-right">Khối lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {losers.length > 0 ? (
                  losers.map(stock => <StockRow key={stock.symbol} stock={stock} />)
                ) : (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeSurge;
