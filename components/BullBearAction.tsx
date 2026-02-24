import React, { useEffect, useState, useMemo } from 'react';

const BULL_BEAR_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1233905660';

interface BullBearStock {
  symbol: string;
  price: number;
  changePercent: number;
  volVsAvg20: number;
  volume: number;
  category: string;
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

const TableHeader: React.FC = () => (
  <thead>
    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
      <th className="px-5 py-4 text-left">Mã</th>
      <th className="px-5 py-4 text-right">Giá TT</th>
      <th className="px-5 py-4 text-right">% Đổi</th>
      <th className="px-5 py-4 text-right">% KL/TB20</th>
      <th className="px-5 py-4 text-right">Khối lượng</th>
    </tr>
  </thead>
);

const StockRow: React.FC<{ stock: BullBearStock }> = ({ stock }) => (
  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
    <td className={`px-5 py-4 font-black text-xs ${getPriceColor(stock.changePercent)}`}>{stock.symbol}</td>
    <td className="px-5 py-4 text-right font-black text-xs text-slate-900">{stock.price.toLocaleString('vi-VN')}</td>
    <td className={`px-5 py-4 text-right font-black text-xs ${getPriceColor(stock.changePercent)}`}>
      {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
    </td>
    <td className="px-5 py-4 text-right font-black text-xs text-slate-700">{stock.volVsAvg20.toFixed(1)}%</td>
    <td className="px-5 py-4 text-right font-bold text-xs text-slate-400">{stock.volume.toLocaleString('vi-VN')}</td>
  </tr>
);

const BullBearAction: React.FC = () => {
  const [data, setData] = useState<BullBearStock[]>([]);
  const [updateDate, setUpdateDate] = useState<string>('');
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
      const timestamp = new Date().getTime();
      const response = await fetch(`${BULL_BEAR_URL}&t=${timestamp}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const csv = await response.text();
      const rows = parseCSV(csv);
      
      // Lấy dữ liệu ngày cập nhật từ ô B2 (rows[1][1])
      if (rows[1] && rows[1][1]) {
        setUpdateDate(rows[1][1]);
      }

      const parsedData: BullBearStock[] = rows
        .slice(1)
        .filter(row => row[0] && row[0] !== 'Mã CP' && row[0] !== '')
        .map(row => ({
          symbol: row[0],
          price: cleanNumber(row[2]),
          changePercent: cleanNumber(row[3]),
          volVsAvg20: cleanNumber(row[4]),
          volume: cleanNumber(row[5]),
          category: row[6]?.trim() || ''
        }));
      setData(parsedData);
    } catch (err) {
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

  const highestClosing = useMemo(() => 
    data.filter(s => s.category.toLowerCase().includes('cao nhất')).sort((a, b) => b.changePercent - a.changePercent), 
  [data]);
  
  const lowestClosing = useMemo(() => 
    data.filter(s => s.category.toLowerCase().includes('thấp nhất')).sort((a, b) => b.changePercent - a.changePercent), 
  [data]);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang quét tín hiệu đóng nến...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Info Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="bg-blue-100 p-4 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="space-y-3 flex-grow">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật những cổ phiếu có tín hiệu đóng nến</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mt-1">
                Dữ liệu được cập nhật tự động intraday trong phiên
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <p className="text-xs font-bold text-slate-700">
                  <span className="text-emerald-600">Đóng nến đỉnh</span> → Tín hiệu bullish mạnh, phe mua kiểm soát hoàn toàn.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <p className="text-xs font-bold text-slate-700">
                  <span className="text-rose-600">Đóng nến đáy</span> → Tín hiệu bearish mạnh, phe bán kiểm soát hoàn toàn.
                </p>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Dữ liệu ngày cập nhật: <span className="text-blue-600 font-black">{updateDate || 'Đang tải...'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="bg-emerald-600 px-6 py-5 flex items-center gap-3">
            <h3 className="text-white text-sm font-black uppercase tracking-widest">CỔ PHIẾU GIÁ ĐÓNG CAO NHẤT PHIÊN</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="divide-y divide-slate-50">
                {highestClosing.length > 0 ? (
                  highestClosing.map(stock => <StockRow key={stock.symbol} stock={stock} />)
                ) : (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="bg-rose-600 px-6 py-5 flex items-center gap-3">
            <h3 className="text-white text-sm font-black uppercase tracking-widest">CỔ PHIẾU GIÁ ĐÓNG CỬA THẤP NHẤT PHIÊN</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="divide-y divide-slate-50">
                {lowestClosing.length > 0 ? (
                  lowestClosing.map(stock => <StockRow key={stock.symbol} stock={stock} />)
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

export default BullBearAction;