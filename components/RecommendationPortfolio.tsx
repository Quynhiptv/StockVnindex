
import React, { useState, useEffect, useMemo } from 'react';

interface RecommendationData {
  group: string;
  date: string;
  symbol: string;
  recommendedPrice: number;
}

interface StockPriceInfo {
  symbol: string;
  currentPrice: number;
  changePercent: number;
}

const RecommendationPortfolio: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [priceData, setPriceData] = useState<Record<string, StockPriceInfo>>({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('Tất cả');

  const handleFilterToday = () => {
    if (recommendations.length === 0) return;
    
    // Get unique dates in descending order (data is already sorted)
    const uniqueDates = Array.from(new Set(recommendations.map(r => r.date)));
    if (uniqueDates.length === 0) return;

    const latestDateStr = uniqueDates[0];
    const previousDateStr = uniqueDates.length > 1 ? uniqueDates[1] : uniqueDates[0];

    const formatDateForInput = (dateStr: string) => {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      } else if (dateStr.includes('-')) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      }
      return '';
    };

    const latestFormatted = formatDateForInput(latestDateStr);
    const previousFormatted = formatDateForInput(previousDateStr);

    if (latestFormatted && previousFormatted) {
      setStartDate(previousFormatted);
      setEndDate(latestFormatted);
    }
  };

  const parseDate = (dateStr: string) => {
    try {
      if (!dateStr) return 0;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
      } else if (dateStr.includes('-')) {
        return new Date(dateStr).getTime();
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const calculateTPrefix = (recDateStr: string) => {
    try {
      let recDate: Date;
      if (recDateStr.includes('/')) {
        const parts = recDateStr.split('/');
        if (parts.length !== 3) return 'T+?';
        recDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else if (recDateStr.includes('-')) {
        recDate = new Date(recDateStr);
      } else {
        return 'T+?';
      }
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      recDate.setHours(0, 0, 0, 0);

      if (recDate > now) return 'T+0';

      let count = 0;
      let tempDate = new Date(recDate);

      while (tempDate < now) {
        tempDate.setDate(tempDate.getDate() + 1);
        const day = tempDate.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
      }

      return `T+${count}`;
    } catch (e) {
      return 'T+?';
    }
  };

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      // Fetch Recommendations
      const recResponse = await fetch(`https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/gviz/tq?tqx=out:csv&gid=2082559901&t=${timestamp}`, { cache: 'no-store' });
      const recCsvText = await recResponse.text();
      
      // Fetch Price Data
      const priceResponse = await fetch(`https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/gviz/tq?tqx=out:csv&gid=1628670680&t=${timestamp}`, { cache: 'no-store' });
      const priceCsvText = await priceResponse.text();

      // Parse Price CSV
      const priceRows = priceCsvText.split('\n').filter(row => row.trim() !== '');
      const priceMap: Record<string, StockPriceInfo> = {};
      priceRows.slice(1).forEach(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
        if (cols.length >= 3) {
          const symbol = cols[0].toUpperCase();
          priceMap[symbol] = {
            symbol,
            currentPrice: parseFloat(cols[1].replace(',', '.')) || 0,
            changePercent: parseFloat(cols[2].replace(',', '.')) || 0
          };
        }
      });
      setPriceData(priceMap);

      // Parse Recommendations CSV
      const recRows = recCsvText.split('\n').filter(row => row.trim() !== '');
      const parsedRecs: RecommendationData[] = recRows.slice(1).map(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
        if (cols.length < 4) return null;
        return {
          group: cols[0],
          date: cols[1],
          symbol: cols[2].toUpperCase(),
          recommendedPrice: parseFloat(cols[3].replace(',', '.')) || 0
        };
      }).filter((item): item is RecommendationData => item !== null);

      // Sort by date descending
      parsedRecs.sort((a, b) => parseDate(b.date) - parseDate(a.date));

      setRecommendations(parsedRecs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recommendation data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(recommendations.map(r => r.group)));
    return ['Tất cả', ...uniqueGroups.sort()];
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    // Filter by Group
    if (selectedGroup !== 'Tất cả') {
      filtered = filtered.filter(item => item.group === selectedGroup);
    }

    // Filter by Date Range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;

      filtered = filtered.filter(item => {
        const itemDate = parseDate(item.date);
        return itemDate >= start && itemDate <= end;
      });
    } else {
      // Default: Only show recommendations within the last 10 trading days (T+0 to T+10)
      filtered = filtered.filter(item => {
        const tStatus = calculateTPrefix(item.date);
        if (tStatus === 'T+?') return false;
        const tValue = parseInt(tStatus.replace('T+', ''));
        return tValue >= 0 && tValue <= 10;
      });
    }

    return filtered;
  }, [recommendations, startDate, endDate, selectedGroup]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải danh mục khuyến nghị...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật danh sách các mã cổ phiếu của 1 số nhóm</h3>
          <p className="text-slate-500 text-sm font-medium mt-1 italic">Đây là thông tin mang giá trị tham khảo</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lọc Nhóm:</span>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="text-sm font-black text-blue-600 outline-none bg-transparent cursor-pointer uppercase tracking-tight"
            >
              {groups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Thực hiện bởi</p>
              <p className="text-sm font-black text-slate-800 uppercase mt-1">ĐOÀN QUỲNH TEAM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-100">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tổng hợp cổ phiếu khuyến nghị</h4>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleFilterToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Lọc hôm nay
            </button>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Từ</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-bold text-slate-600 outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đến</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-bold text-slate-600 outline-none bg-transparent"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Xóa bộ lọc"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">
              {filteredRecommendations.length} Mã khuyến nghị
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Nhóm khuyến nghị</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ngày KN</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tên Cổ phiếu</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Giá KN</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Số phiên</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Giá hiện tại</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">% Thay đổi</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Lãi lỗ tạm tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecommendations.map((item, index) => {
                const priceInfo = priceData[item.symbol];
                const currentPrice = priceInfo ? priceInfo.currentPrice : 0;
                const changePercent = priceInfo ? priceInfo.changePercent : 0;
                
                const profitLoss = item.recommendedPrice > 0 
                  ? ((currentPrice - item.recommendedPrice) / item.recommendedPrice) * 100 
                  : 0;

                const profitLossColor = profitLoss > 0 ? 'text-emerald-600' : profitLoss < 0 ? 'text-rose-600' : 'text-amber-500';
                const changeColor = changePercent > 0 ? 'text-emerald-600' : changePercent < 0 ? 'text-rose-600' : 'text-amber-500';
                
                return (
                  <tr key={`${item.symbol}-${index}`} className="hover:bg-slate-50/80 transition-colors duration-500 group">
                    <td className="px-6 py-4 transition-all duration-500">
                      <span className="text-xs font-bold text-slate-600 transition-all duration-500">{item.group}</span>
                    </td>
                    <td className="px-6 py-4 transition-all duration-500">
                      <span className="text-xs font-mono text-slate-500 transition-all duration-500">{item.date}</span>
                    </td>
                    <td className="px-6 py-4 transition-all duration-500">
                      <span className={`text-sm font-black uppercase tracking-tight transition-all duration-500 ${profitLossColor}`}>
                        {item.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right transition-all duration-500">
                      <span className="text-sm font-mono font-medium text-slate-600 transition-all duration-500">
                        {(item.recommendedPrice * 1000).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} VND
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center transition-all duration-500">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase transition-all duration-500">
                        {calculateTPrefix(item.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right transition-all duration-500">
                      <span className={`text-sm font-mono font-bold transition-all duration-500 ${changeColor}`}>
                        {(currentPrice * 1000).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} VND
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right transition-all duration-500">
                      <span className={`text-sm font-mono font-bold transition-all duration-500 ${changeColor}`}>
                        {changePercent > 0 ? '+' : ''}{changePercent.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right transition-all duration-500">
                      <span className={`text-sm font-mono font-black transition-all duration-500 ${profitLossColor}`}>
                        {profitLoss > 0 ? '+' : ''}{profitLoss.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {recommendations.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-medium">Chưa có dữ liệu danh mục khuyến nghị.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationPortfolio;
