
import React, { useEffect, useState, useMemo } from 'react';

const STOCK_LIST_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1358455783';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';

interface StockListItem {
  symbol: string;
  zone1: number;
  zone2: number;
  exploratoryPrice: number;
  targetPrice: number;
  currentPrice: number;
  changePercent: number;
  requiredDropPercent: number;
}

type SortKey = keyof StockListItem | 'priority';
type SortOrder = 'asc' | 'desc';

const StockList: React.FC = () => {
  const [data, setData] = useState<StockListItem[]>([]);
  const [updateTime, setUpdateTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'priority', order: 'asc' });

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

  const fetchData = async () => {
    try {
      const timestamp = new Date().getTime();
      const [listRes, priceRes] = await Promise.all([
        fetch(`${STOCK_LIST_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!listRes.ok || !priceRes.ok) {
        throw new Error('Không thể kết nối tới máy chủ Google Sheets');
      }
      
      const listCSV = await listRes.text();
      const priceCSV = await priceRes.text();
      
      const listRows = parseCSV(listCSV);
      const priceRows = parseCSV(priceCSV).slice(1);

      if (listRows[1] && listRows[1][7]) {
        setUpdateTime(listRows[1][7]);
      }

      const priceMap = new Map<string, { price: number, change: number }>();
      priceRows.forEach(row => {
        const symbol = row[0]?.trim();
        if (symbol) {
          priceMap.set(symbol, {
            price: cleanNumber(row[1]),
            change: cleanNumber(row[2])
          });
        }
      });

      const parsedData: StockListItem[] = listRows
        .slice(1)
        .filter(row => row[0] && row[0] !== 'Tên cổ phiếu' && row[0] !== '')
        .map(row => {
          const symbol = row[0].trim();
          const liveData = priceMap.get(symbol) || { price: 0, change: 0 };
          const exploratoryPrice = cleanNumber(row[3]);
          const currentPrice = liveData.price;
          
          let requiredDropPercent = 0;
          if (exploratoryPrice > 0 && currentPrice > 0) {
            if (currentPrice > exploratoryPrice) {
              requiredDropPercent = ((currentPrice - exploratoryPrice) / currentPrice) * 100;
            } else {
              requiredDropPercent = 0; // Already at or below buy point
            }
          } else {
            requiredDropPercent = 999; // No target price, put at bottom
          }
          
          return {
            symbol: symbol,
            zone1: cleanNumber(row[1]),
            zone2: cleanNumber(row[2]),
            exploratoryPrice: exploratoryPrice,
            targetPrice: cleanNumber(row[4]),
            currentPrice: currentPrice,
            changePercent: liveData.change,
            requiredDropPercent: requiredDropPercent
          };
        });

      setData(parsedData);
      setError(null);
    } catch (err: any) {
      console.error('Lỗi fetch StockList:', err);
      setError('Lỗi kết nối dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortConfig.key === 'priority') {
        const getPriority = (item: StockListItem) => {
          if (item.exploratoryPrice > 0) return 1;
          if (item.zone1 > 0 || item.zone2 > 0) return 2;
          return 3;
        };
        
        const pA = getPriority(a);
        const pB = getPriority(b);
        
        if (pA !== pB) return pA - pB;
        
        if (pA === 1) {
          // Both have exploratory price, sort by drop percent ASC
          return a.requiredDropPercent - b.requiredDropPercent;
        }
        
        return a.symbol.localeCompare(b.symbol);
      }

      const aValue = a[sortConfig.key as keyof StockListItem];
      const bValue = b[sortConfig.key as keyof StockListItem];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.order === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const formatPrice = (val: number) => {
    if (val === 0) return '-';
    return val.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">DANH SÁCH CỔ PHIẾU THEO DÕI</h2>
            <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Phương pháp: ITC - SMC</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">Thực hiện: Team Đoàn Quỳnh</span>
              <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 italic">Cập nhật: {updateTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto refresh</span>
                <span className="text-[10px] font-bold text-emerald-600 mt-1">LÀM MỚI SAU 5S</span>
             </div>
             <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                LÀM MỚI
              </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider">
                {[
                  { key: 'symbol', label: 'Mã Cổ Phiếu' },
                  { key: 'zone1', label: 'Vùng TD 1' },
                  { key: 'zone2', label: 'Vùng TD 2' },
                  { key: 'exploratoryPrice', label: 'Giá Thăm Dò' },
                  { key: 'targetPrice', label: 'Target Kỳ Vọng' },
                  { key: 'currentPrice', label: 'Giá Hiện Tại' },
                  { key: 'changePercent', label: '% Thay Đổi' },
                  { key: 'requiredDropPercent', label: 'Cần giảm % để Mua' }
                ].map((col) => (
                  <th 
                    key={col.key} 
                    className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort(col.key as SortKey)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortConfig.key === col.key && (
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${sortConfig.order === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map((stock) => {
                const minZone = Math.min(stock.zone1, stock.zone2);
                const maxZone = Math.max(stock.zone1, stock.zone2);
                
                const isPriceInZone = stock.currentPrice > 0 && stock.currentPrice >= minZone && stock.currentPrice <= maxZone;
                const isAtExploratory = stock.currentPrice > 0 && 
                  stock.currentPrice >= stock.exploratoryPrice && 
                  stock.currentPrice <= (stock.exploratoryPrice + 0.05);
                const isAtTarget = stock.targetPrice > 0 && stock.currentPrice >= stock.targetPrice;

                const trendColor = getTrendColor(stock.changePercent);

                return (
                  <tr key={stock.symbol} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5 font-black text-slate-900 transition-all duration-500">{stock.symbol}</td>
                    
                    <td className={`px-6 py-5 font-bold transition-all duration-500 ${isPriceInZone ? 'animate-blink-yellow text-amber-700' : 'text-slate-500'}`}>
                      {formatPrice(stock.zone1)}
                    </td>
                    <td className={`px-6 py-5 font-bold transition-all duration-500 ${isPriceInZone ? 'animate-blink-yellow text-amber-700' : 'text-slate-500'}`}>
                      {formatPrice(stock.zone2)}
                    </td>
                    
                    <td className={`px-6 py-5 font-bold transition-all duration-500 ${isAtExploratory ? 'animate-blink-green text-emerald-700' : 'text-slate-900'}`}>
                      {formatPrice(stock.exploratoryPrice)}
                    </td>
                    
                    <td className={`px-6 py-5 font-bold transition-all duration-500 ${isAtTarget ? 'animate-blink-purple text-purple-700' : 'text-slate-900'}`}>
                      {formatPrice(stock.targetPrice)}
                    </td>
                    
                    <td className={`px-6 py-5 font-black transition-all duration-500 ${trendColor}`}>
                      {formatPrice(stock.currentPrice)}
                    </td>

                    <td className={`px-6 py-5 font-black transition-all duration-500 ${trendColor}`}>
                      {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>

                    <td className="px-6 py-5 transition-all duration-500">
                      {stock.exploratoryPrice > 0 ? (
                        <div className="flex items-center gap-2 transition-all duration-500">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all duration-500 ${stock.requiredDropPercent === 0 ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                            {stock.requiredDropPercent === 0 ? 'ĐIỂM MUA' : `-${stock.requiredDropPercent.toFixed(2)}%`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockList;
