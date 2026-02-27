
import React, { useState, useEffect, useMemo } from 'react';

const PORTFOLIO_URL = 'https://docs.google.com/spreadsheets/d/1ahPELoUrj-w4MtwUY3tK9tL3FkpJBOSt2aIWa8dqQ9A/export?format=csv&gid=0';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';
const PASSWORD = '1234566';

interface PortfolioItem {
  symbol: string;
  recDate: string;
  recPrice: number;
  note: string;
  marketPrice: number;
  changePercent: number;
  profitPercent: number;
  holdingSessions: string;
}

const SystemSettings: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [data, setData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  const getBusinessDaysCount = (startDateStr: string) => {
    if (!startDateStr) return 'T+0';
    
    // Try to parse date DD/MM/YYYY or YYYY-MM-DD
    let parts = startDateStr.split(/[/ -]/);
    let startDate: Date;
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        // DD/MM/YYYY
        startDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      startDate = new Date(startDateStr);
    }

    if (isNaN(startDate.getTime())) return 'T+0';

    const endDate = new Date();
    let count = 0;
    let curDate = new Date(startDate.getTime());
    
    // Normalize to start of day
    curDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (curDate > endDate) return 'T+0';

    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      curDate.setDate(curDate.getDate() + 1);
    }
    
    const sessions = count > 0 ? count - 1 : 0;
    return `T + ${sessions}`;
  };

  const fetchData = async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [portRes, priceRes] = await Promise.all([
        fetch(`${PORTFOLIO_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!portRes.ok || !priceRes.ok) throw new Error('Lỗi kết nối dữ liệu');

      const portCSV = await portRes.text();
      const priceCSV = await priceRes.text();

      const portRows = parseCSV(portCSV).slice(2); // Skip header rows 1 and 2
      const priceRows = parseCSV(priceCSV).slice(1);

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

      const parsedData: PortfolioItem[] = portRows
        .filter(row => row[0] && row[0] !== '')
        .map(row => {
          const symbol = row[0].trim();
          const liveData = priceMap.get(symbol) || { price: 0, change: 0 };
          const recPrice = cleanNumber(row[2]);
          const marketPrice = liveData.price;
          
          let profitPercent = 0;
          if (recPrice > 0 && marketPrice > 0) {
            profitPercent = ((marketPrice - recPrice) / recPrice) * 100;
          }

          return {
            symbol,
            recDate: row[1],
            recPrice,
            note: row[3],
            marketPrice,
            changePercent: liveData.change,
            profitPercent,
            holdingSessions: getBusinessDaysCount(row[1])
          };
        })
        .sort((a, b) => {
          const parseDate = (dateStr: string) => {
            if (!dateStr) return 0;
            const parts = dateStr.split(/[/ -]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
              } else {
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
              }
            }
            return new Date(dateStr).getTime() || 0;
          };
          return parseDate(b.recDate) - parseDate(a.recDate);
        });

      setData(parsedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching system settings data:', err);
      setError('Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchData();
      const interval = setInterval(fetchData, 6000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setIsUnlocked(true);
      localStorage.setItem('system_unlocked', 'true');
    } else {
      alert('Mật khẩu không chính xác!');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('system_unlocked');
    if (saved === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const getPriceColor = (val: number) => {
    if (val > 0) return 'text-emerald-600';
    if (val < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-md w-full text-center">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">KHU VỰC HẠN CHẾ</h2>
          <p className="text-slate-400 text-sm font-medium mb-8">Vui lòng nhập mật khẩu để truy cập hệ thống</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center"
            />
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95">
              XÁC NHẬN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">DANH MỤC CP VÀ TẦM NGẮM</h2>
            <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Thực hiện: Giang Cao Team</span>
              <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 italic">Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto refresh</span>
                <span className="text-[10px] font-bold text-emerald-600 mt-1">LÀM MỚI SAU 6S</span>
             </div>
             <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                LÀM MỚI
              </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            Danh mục nắm giữ cổ phiếu
          </h3>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider">
                <th className="px-6 py-5">Tên cổ phiếu</th>
                <th className="px-6 py-5">Giá khuyến nghị</th>
                <th className="px-6 py-5">Số phiên nắm giữ</th>
                <th className="px-6 py-5">Giá thị trường</th>
                <th className="px-6 py-5">% thay đổi trong phiên</th>
                <th className="px-6 py-5">Lãi lỗ tạm tính</th>
                <th className="px-6 py-5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((item, idx) => {
                const profitColor = getPriceColor(item.profitPercent);
                const changeColor = getPriceColor(item.changePercent);
                
                return (
                  <tr key={`${item.symbol}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                    <td className={`px-6 py-5 font-black ${profitColor}`}>{item.symbol}</td>
                    <td className="px-6 py-5 font-bold text-slate-900">{item.recPrice.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-5 font-black text-blue-600">{item.holdingSessions}</td>
                    <td className={`px-6 py-5 font-black ${changeColor}`}>{item.marketPrice.toLocaleString('vi-VN')}</td>
                    <td className={`px-6 py-5 font-black ${changeColor}`}>
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </td>
                    <td className={`px-6 py-5 font-black ${profitColor}`}>
                      {item.profitPercent > 0 ? '+' : ''}{item.profitPercent.toFixed(2)}%
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium max-w-xs truncate">{item.note}</td>
                  </tr>
                );
              })}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest">
                    Chưa có dữ liệu danh mục
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

export default SystemSettings;
