
import React, { useEffect, useState, useMemo } from 'react';

const ATC_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=2084490786';
const LIVE_PRICE_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';

interface ATCPriceItem {
  symbol: string;
  atcPercent: number;
  currentPrice: number;
  dayChangePercent: number;
}

const cleanNumber = (val: string): number => {
  if (!val || val === '-' || val === '' || val === '#N/A' || val === '#VALUE!') return 0;
  let s = val.trim().replace('%', '');
  
  // Xác định xem chuỗi có định dạng Châu Âu/VN (chấm là hàng ngàn, phẩy là thập phân)
  // hay định dạng chuẩn (phẩy là hàng ngàn, chấm là thập phân)
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Có vẻ là định dạng VN: 28.200,50 -> 28200.50
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // Định dạng chuẩn: 28,200.50 -> 28200.50
    s = s.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    // Chỉ có dấu phẩy: 28,2 -> 28.2
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
};

const getTrendColor = (change: number) => {
  if (change > 0) return 'text-emerald-600';
  if (change < 0) return 'text-rose-600';
  return 'text-amber-500'; // Vàng khi = 0
};

const StockRow: React.FC<{ item: ATCPriceItem }> = ({ item }) => {
  const atcColor = item.atcPercent > 0 ? 'text-emerald-600' : 'text-rose-600';
  const dayColor = getTrendColor(item.dayChangePercent);

  // Hiển thị đầy đủ dữ liệu với định dạng số Việt Nam
  const formattedPrice = item.currentPrice.toLocaleString('vi-VN', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 3 
  });
  
  const formattedAtc = item.atcPercent.toLocaleString('vi-VN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  const formattedDayChange = item.dayChangePercent.toLocaleString('vi-VN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className={`px-5 py-4 font-black text-xs ${dayColor}`}>{item.symbol}</td>
      <td className={`px-5 py-4 text-right font-black text-xs ${atcColor}`}>
        {item.atcPercent > 0 ? '+' : ''}{formattedAtc}%
      </td>
      <td className={`px-5 py-4 text-right font-black text-xs ${dayColor}`}>
        {formattedPrice}
      </td>
      <td className={`px-5 py-4 text-right font-black text-xs ${dayColor}`}>
        {item.dayChangePercent > 0 ? '+' : ''}{formattedDayChange}%
      </td>
    </tr>
  );
};

const ATCPriceAction: React.FC = () => {
  const [data, setData] = useState<ATCPriceItem[]>([]);
  const [updateDate, setUpdateDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      const timestamp = new Date().getTime();
      const [atcRes, priceRes] = await Promise.all([
        fetch(`${ATC_DATA_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${LIVE_PRICE_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!atcRes.ok || !priceRes.ok) throw new Error('Không thể tải dữ liệu từ máy chủ');

      const atcCSV = await atcRes.text();
      const priceCSV = await priceRes.text();

      const atcRows = parseCSV(atcCSV);
      const priceRows = parseCSV(priceCSV);

      // Lấy ngày cập nhật từ ô B2 (rows[1][1]) của tab ATC
      if (atcRows[1] && atcRows[1][1]) {
        setUpdateDate(atcRows[1][1]);
      }

      // Tạo bản đồ giá hiện tại (Cột B) và % thay đổi trong phiên (Cột C) từ gid=1628670680
      const priceMap = new Map<string, { price: number; change: number }>();
      priceRows.slice(1).forEach(row => {
        const symbol = row[0]?.trim();
        if (symbol) {
          priceMap.set(symbol, {
            price: cleanNumber(row[1]), // Cột B: giá hiện tại
            change: cleanNumber(row[2]) // Cột C: % thay đổi
          });
        }
      });

      // Kết hợp dữ liệu % ATC (Cột C từ gid=2084490786) với dữ liệu Giá từ tab Live
      const parsedData: ATCPriceItem[] = atcRows
        .slice(1)
        .filter(row => row[0] && row[0] !== 'Mã CP' && row[0] !== '')
        .map(row => {
          const symbol = row[0].trim();
          const liveData = priceMap.get(symbol) || { price: 0, change: 0 };
          return {
            symbol: symbol,
            atcPercent: cleanNumber(row[2]), // % ATC từ tab ATC
            currentPrice: liveData.price,    // Giá hiện tại từ tab Live
            dayChangePercent: liveData.change // % Thay đổi từ tab Live
          };
        })
        .filter(item => item.atcPercent !== 0);

      setData(parsedData);
    } catch (err) {
      console.error('Lỗi fetch ATCPriceAction:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const kéoList = useMemo(() => 
    data.filter(i => i.atcPercent > 0).sort((a, b) => b.atcPercent - a.atcPercent), 
  [data]);
  
  const đạpList = useMemo(() => 
    data.filter(i => i.atcPercent < 0).sort((a, b) => a.atcPercent - b.atcPercent), 
  [data]);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang quét dữ liệu Kéo/Đạp ATC...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Info Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="bg-indigo-600 p-5 rounded-[1.5rem] shadow-lg shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <div className="space-y-2 flex-grow">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cổ Phiếu Kéo phiên ATC - Đạp ATC</h2>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-500">
                Cập nhật các cổ phiếu được kéo đạp trong phiên đóng cửa. Dữ liệu được cập nhật khi kết thúc phiên.
              </p>
              <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">
                Dữ liệu cập nhật phiên giao dịch ngày : <span className="underline underline-offset-8 decoration-indigo-200">{updateDate || '---'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Bảng Kéo ATC */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
          <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-white text-base font-black uppercase tracking-widest">Cổ phiếu được kéo ATC</h3>
            <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-white/30">
              {kéoList.length} CP
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">Tên cổ phiếu</th>
                  <th className="px-5 py-4 text-right">% ATC</th>
                  <th className="px-5 py-4 text-right">Giá hiện tại</th>
                  <th className="px-5 py-4 text-right">% Thay đổi trong phiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {kéoList.length > 0 ? (
                  kéoList.map(item => <StockRow key={item.symbol} item={item} />)
                ) : (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase">Không có mã nào được kéo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng Đạp ATC */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
          <div className="bg-rose-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-white text-base font-black uppercase tracking-widest">Cổ phiếu bị đạp trong phiên ATC</h3>
            <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-white/30">
              {đạpList.length} CP
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">Tên cổ phiếu</th>
                  <th className="px-5 py-4 text-right">% ATC</th>
                  <th className="px-5 py-4 text-right">Giá hiện tại</th>
                  <th className="px-5 py-4 text-right">% Thay đổi trong phiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {đạpList.length > 0 ? (
                  đạpList.map(item => <StockRow key={item.symbol} item={item} />)
                ) : (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase">Không có mã nào bị đạp</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATCPriceAction;
