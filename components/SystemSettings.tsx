
import React, { useState, useEffect, useMemo } from 'react';

const PORTFOLIO_URL = 'https://docs.google.com/spreadsheets/d/1ahPELoUrj-w4MtwUY3tK9tL3FkpJBOSt2aIWa8dqQ9A/export?format=csv&gid=0';
const WATCHLIST_URL = 'https://docs.google.com/spreadsheets/d/1ahPELoUrj-w4MtwUY3tK9tL3FkpJBOSt2aIWa8dqQ9A/export?format=csv&gid=478926059';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';
const PASSWORD = '1234566';

interface PortfolioItem {
  symbol: string;
  recDate: string;
  recPrice: number;
  sellPrice: number;
  note: string;
  marketPrice: number;
  changePercent: number;
  profitPercent: number;
  sellProfitPercent: number;
  holdingSessions: string;
}

interface WatchlistItem {
  symbol: string;
  zone1: number;
  zone2: number;
  note: string;
  marketPrice: number;
  changePercent: number;
  proximityPercent: number;
}

const SystemSettings: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statsResult, setStatsResult] = useState<{
    totalTrades: number;
    avgProfit: number;
    trades: PortfolioItem[];
  } | null>(null);

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

  const parseDateStr = (dateStr: string) => {
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

  const fetchData = async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const [portRes, watchRes, priceRes] = await Promise.all([
        fetch(`${PORTFOLIO_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${WATCHLIST_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!portRes.ok || !watchRes.ok || !priceRes.ok) throw new Error('Lỗi kết nối dữ liệu');

      const portCSV = await portRes.text();
      const watchCSV = await watchRes.text();
      const priceCSV = await priceRes.text();

      const portRows = parseCSV(portCSV).slice(2); 
      const watchlistRows = parseCSV(watchCSV).slice(2); 
      
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

      // Process Portfolio Data
      const parsedPortfolio: PortfolioItem[] = portRows
        .filter(row => row[0] && row[0] !== '')
        .map(row => {
          const symbol = row[0].trim();
          const liveData = priceMap.get(symbol) || { price: 0, change: 0 };
          const recPrice = cleanNumber(row[2]);
          const sellPrice = cleanNumber(row[4]); // Column E
          const marketPrice = liveData.price;
          
          let profitPercent = 0;
          if (recPrice > 0 && marketPrice > 0) {
            profitPercent = ((marketPrice - recPrice) / recPrice) * 100;
          }

          let sellProfitPercent = 0;
          if (recPrice > 0 && sellPrice > 0) {
            sellProfitPercent = ((sellPrice - recPrice) / recPrice) * 100;
          }

          return {
            symbol,
            recDate: row[1],
            recPrice,
            sellPrice,
            note: row[3],
            marketPrice,
            changePercent: liveData.change,
            profitPercent,
            sellProfitPercent,
            holdingSessions: getBusinessDaysCount(row[1])
          };
        })
        .sort((a, b) => {
          return parseDateStr(b.recDate) - parseDateStr(a.recDate);
        });

      // Process Watchlist Data
      const parsedWatchlist: WatchlistItem[] = watchlistRows
        .filter(row => row[0] && row[0] !== '')
        .map(row => {
          const symbol = row[0].trim();
          const liveData = priceMap.get(symbol) || { price: 0, change: 0 };
          const zone1 = cleanNumber(row[1]);
          const zone2 = cleanNumber(row[2]);
          const marketPrice = liveData.price;
          
          // Calculate proximity to zone2 (Vùng giá cao)
          let proximityPercent = 999;
          if (marketPrice > 0 && zone2 > 0) {
            proximityPercent = Math.abs((marketPrice - zone2) / marketPrice) * 100;
          }

          return {
            symbol,
            zone1,
            zone2,
            note: row[3],
            marketPrice,
            changePercent: liveData.change,
            proximityPercent
          };
        })
        .sort((a, b) => a.proximityPercent - b.proximityPercent);

      setPortfolioData(parsedPortfolio);
      setWatchlistData(parsedWatchlist);
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
      const interval = setInterval(fetchData, 5000);
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

  const handleFilterStats = () => {
    if (!startDate || !endDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!');
      return;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const startTime = start.getTime();

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const endTime = end.getTime();

    const successfulTrades = portfolioData.filter(item => {
      if (item.sellPrice <= 0) return false;
      const tradeTime = parseDateStr(item.recDate);
      return tradeTime >= startTime && tradeTime <= endTime;
    });

    const totalProfit = successfulTrades.reduce((sum, item) => sum + item.sellProfitPercent, 0);
    const avgProfit = successfulTrades.length > 0 ? totalProfit / successfulTrades.length : 0;

    setStatsResult({
      totalTrades: successfulTrades.length,
      avgProfit,
      trades: successfulTrades
    });
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
            <button 
              onClick={() => setShowStats(!showStats)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Thống kê giao dịch
            </button>
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

        {showStats && (
          <div className="mb-10 p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 animate-slideDown">
            <div className="flex flex-wrap items-end gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-3 bg-white border border-indigo-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-3 bg-white border border-indigo-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                onClick={handleFilterStats}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Bắt đầu lọc
              </button>
            </div>

            {statsResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng số lệnh thành công</p>
                    <p className="text-2xl font-black text-indigo-600">{statsResult.totalTrades} <span className="text-xs font-bold text-slate-400">LỆNH</span></p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lãi lỗ bình quân</p>
                    <p className={`text-2xl font-black ${statsResult.avgProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {statsResult.avgProfit > 0 ? '+' : ''}{statsResult.avgProfit.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Chi tiết các mã đã thực hiện</h4>
                  </div>
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
                          <th className="px-6 py-4">Mã CP</th>
                          <th className="px-6 py-4">Ngày mua</th>
                          <th className="px-6 py-4">Giá mua</th>
                          <th className="px-6 py-4">Giá bán</th>
                          <th className="px-6 py-4">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {statsResult.trades.map((trade, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-black text-slate-900">{trade.symbol}</td>
                            <td className="px-6 py-4 font-bold text-slate-500">{trade.recDate}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{trade.recPrice.toLocaleString('vi-VN')}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{trade.sellPrice.toLocaleString('vi-VN')}</td>
                            <td className={`px-6 py-4 font-black ${trade.sellProfitPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {trade.sellProfitPercent > 0 ? '+' : ''}{trade.sellProfitPercent.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                        {statsResult.trades.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-300 font-black uppercase tracking-widest">Không có giao dịch trong khoảng thời gian này</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            Danh mục nắm giữ cổ phiếu
          </h3>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100 max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider shadow-sm">
                <th className="px-6 py-5">Tên cổ phiếu</th>
                <th className="px-6 py-5">Giá khuyến nghị</th>
                <th className="px-6 py-5">Số phiên nắm giữ</th>
                <th className="px-6 py-5">Giá thị trường</th>
                <th className="px-6 py-5">% thay đổi trong phiên</th>
                <th className="px-6 py-5">Lãi lỗ tạm tính</th>
                <th className="px-6 py-5">Giá bán</th>
                <th className="px-6 py-5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {portfolioData.map((item, idx) => {
                const profitColor = getPriceColor(item.profitPercent);
                const changeColor = getPriceColor(item.changePercent);
                
                return (
                  <tr key={`${item.symbol}-${idx}`} className={`hover:bg-slate-50 transition-all group ${item.sellPrice > 0 ? 'opacity-60 grayscale-[0.2]' : ''}`}>
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
                    <td className="px-6 py-5 font-bold text-slate-900">
                      {item.sellPrice > 0 ? item.sellPrice.toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium max-w-xs truncate">
                      {item.sellPrice > 0 ? (
                        <span className={`font-black ${item.sellProfitPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.sellProfitPercent >= 0 ? 'CHỐT LÃI' : 'CẮT LỖ'} {item.sellProfitPercent > 0 ? '+' : ''}{item.sellProfitPercent.toFixed(2)}%
                        </span>
                      ) : (
                        item.note
                      )}
                    </td>
                  </tr>
                );
              })}
              {portfolioData.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest">
                    Chưa có dữ liệu danh mục
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-16 mb-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            Cổ phiếu trong tầm ngắm phiên tới
          </h3>
          <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest mt-2">
            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Thực hiện: Cao Giang</span>
            <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 italic">Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100 max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider shadow-sm">
                <th className="px-6 py-5">Tên cổ phiếu</th>
                <th className="px-6 py-5">Vùng giá thấp</th>
                <th className="px-6 py-5">Vùng giá cao</th>
                <th className="px-6 py-5">Giá thị trường</th>
                <th className="px-6 py-5">% Thay đổi trong phiên</th>
                <th className="px-6 py-5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {watchlistData.map((item, idx) => {
                const changeColor = getPriceColor(item.changePercent);
                const isInZone = item.marketPrice > 0 && 
                                 item.marketPrice >= Math.min(item.zone1, item.zone2) && 
                                 item.marketPrice <= Math.max(item.zone1, item.zone2);
                
                return (
                  <tr key={`${item.symbol}-watch-${idx}`} className="hover:bg-slate-50 transition-colors group">
                    <td className={`px-6 py-5 font-black ${changeColor}`}>{item.symbol}</td>
                    <td className={`px-6 py-5 font-bold transition-all ${isInZone ? 'bg-amber-100 animate-pulse text-amber-900' : 'text-slate-900'}`}>
                      {item.zone1.toLocaleString('vi-VN')}
                    </td>
                    <td className={`px-6 py-5 font-bold transition-all ${isInZone ? 'bg-amber-100 animate-pulse text-amber-900' : 'text-slate-900'}`}>
                      {item.zone2.toLocaleString('vi-VN')}
                    </td>
                    <td className={`px-6 py-5 font-black ${changeColor}`}>{item.marketPrice.toLocaleString('vi-VN')}</td>
                    <td className={`px-6 py-5 font-black ${changeColor}`}>
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium max-w-xs truncate">{item.note}</td>
                  </tr>
                );
              })}
              {watchlistData.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest">
                    Chưa có dữ liệu tầm ngắm
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
