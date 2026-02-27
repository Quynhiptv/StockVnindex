
import React, { useEffect, useState, useMemo } from 'react';

const PORTFOLIO_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ahPELoUrj-w4MtwUY3tK9tL3FkpJBOSt2aIWa8dqQ9A/export?format=csv&gid=0';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';

interface PortfolioItem {
  symbol: string;
  recDate: string;
  recPrice: number;
  note: string;
  marketPrice: number;
  sessionChange: number;
  holdingDays: number;
  profitPercent: number;
}

const SystemSettings: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const calculateBusinessDays = (startDateStr: string): number => {
    if (!startDateStr) return 0;
    
    // Parse date DD/MM/YYYY
    const parts = startDateStr.split('/');
    if (parts.length !== 3) return 0;
    
    const start = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const end = new Date();
    
    if (isNaN(start.getTime())) return 0;
    
    let count = 0;
    let cur = new Date(start.getTime());
    
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

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
      const [portRes, priceRes] = await Promise.all([
        fetch(`${PORTFOLIO_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!portRes.ok || !priceRes.ok) throw new Error('Lỗi kết nối dữ liệu');

      const portCSV = await portRes.text();
      const priceCSV = await priceRes.text();

      const portRows = parseCSV(portCSV).slice(2); // Skip row 1 (slogan) and row 2 (header)
      const priceRows = parseCSV(priceCSV).slice(1); // Skip header

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
          const recPrice = cleanNumber(row[2]);
          const liveData = priceMap.get(symbol) || { price: 0, change: 0 };
          
          const profitPercent = recPrice > 0 ? ((liveData.price - recPrice) / recPrice) * 100 : 0;

          return {
            symbol,
            recDate: row[1],
            recPrice,
            note: row[3] || '',
            marketPrice: liveData.price,
            sessionChange: liveData.change,
            holdingDays: calculateBusinessDays(row[1]),
            profitPercent
          };
        });

      setData(parsedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching system settings data:', err);
      setError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 6000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234566') {
      setIsAuthenticated(true);
    } else {
      alert('Mật khẩu không chính xác!');
    }
  };

  const getStatusColor = (val: number) => {
    if (val > 0) return 'text-emerald-600';
    if (val < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-40 animate-fadeIn">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-md text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">TRUY CẬP HỆ THỐNG</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Vui lòng nhập mật khẩu để tiếp tục</p>
          
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center font-bold"
          />
          
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95">
            XÁC NHẬN
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">DANH MỤC CP VÀ TẦM NGẮM</h2>
            <div className="flex flex-wrap gap-4 text-[11px] font-black uppercase tracking-widest">
              <span className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">Thực hiện: Giang Cao Team</span>
              <span className="text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic shadow-sm">
                Cập nhật: {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 shadow-inner">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto sync</span>
                <span className="text-[11px] font-bold text-emerald-600 mt-1.5">LÀM MỚI SAU 6S</span>
             </div>
             <button onClick={fetchData} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-200 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                LÀM MỚI
              </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-lg shadow-emerald-100"></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Danh mục nắm giữ cổ phiếu</h3>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider">
                  <th className="px-8 py-6">Tên cổ phiếu</th>
                  <th className="px-8 py-6">Giá khuyến nghị</th>
                  <th className="px-8 py-6">Số phiên nắm giữ</th>
                  <th className="px-8 py-6">Giá thị trường</th>
                  <th className="px-8 py-6">% Thay đổi phiên</th>
                  <th className="px-8 py-6">Lãi lỗ tạm tính</th>
                  <th className="px-8 py-6">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item, idx) => {
                  const profitColor = getStatusColor(item.profitPercent);
                  const sessionColor = getStatusColor(item.sessionChange);

                  return (
                    <tr key={`${item.symbol}-${idx}`} className="hover:bg-slate-50/80 transition-all group">
                      <td className={`px-8 py-6 font-black text-base ${profitColor}`}>{item.symbol}</td>
                      <td className="px-8 py-6 font-bold text-slate-900 text-sm">
                        {item.recPrice.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black border border-blue-100">
                          T + {item.holdingDays}
                        </span>
                      </td>
                      <td className={`px-8 py-6 font-black text-sm ${sessionColor}`}>
                        {item.marketPrice.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-8 py-6 font-black text-sm ${sessionColor}`}>
                        {item.sessionChange > 0 ? '+' : ''}{item.sessionChange.toFixed(2)}%
                      </td>
                      <td className={`px-8 py-6 font-black text-sm ${profitColor}`}>
                        {item.profitPercent > 0 ? '+' : ''}{item.profitPercent.toFixed(2)}%
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-medium max-w-xs truncate">
                        {item.note || '-'}
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest">
                      Chưa có dữ liệu danh mục
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
