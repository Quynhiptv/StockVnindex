
import React, { useEffect, useState } from 'react';

interface StockVolatility {
  symbol: string;
  close_price: number;
  phan_tram_thay_doi: number;
  tong_klgd_x10: number;
  trading_date?: string;
}

const TopVolatility: React.FC = () => {
  const [topGainers, setTopGainers] = useState<StockVolatility[]>([]);
  const [topLosers, setTopLosers] = useState<StockVolatility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradingDate, setTradingDate] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock-data');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      if (data && data.length > 0) {
        // Set trading date from the first record
        if (data[0].trading_date) {
          setTradingDate(data[0].trading_date);
        }

        const sorted = [...data].sort((a, b) => b.phan_tram_thay_doi - a.phan_tram_thay_doi);
        
        // Filter out items with null or invalid data if necessary
        const validData = sorted.filter((item: any) => item.symbol && item.phan_tram_thay_doi !== null);

        setTopGainers(validData.slice(0, 30));
        setTopLosers([...validData].reverse().slice(0, 30));
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching volatility data:', err);
      setError('Không thể tải dữ liệu biến động.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-rose-600';
    return 'text-amber-500';
  };

  const StockTable = ({ title, stocks, isGainer }: { title: string, stocks: StockVolatility[], isGainer: boolean }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
      <div className={`px-8 py-6 border-b border-slate-100 ${isGainer ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
        <h3 className={`text-xl font-black uppercase tracking-tight ${isGainer ? 'text-emerald-700' : 'text-rose-700'}`}>
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="text-slate-400 text-[16px] font-black uppercase tracking-widest border-b border-slate-100">
              <th className="px-6 py-4">Tên Cổ phiếu</th>
              <th className="px-6 py-4 text-right">Giá hiện tại</th>
              <th className="px-6 py-4 text-right">% Thay đổi</th>
              <th className="px-6 py-4 text-right">Khối lượng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stocks.map((stock, index) => {
              const colorClass = getPriceColor(stock.phan_tram_thay_doi);
              return (
                <tr key={`${stock.symbol}-${index}`} className="hover:bg-slate-50 transition-colors group">
                  <td className={`px-6 py-4 font-black uppercase tracking-tight text-lg ${colorClass}`}>
                    {stock.symbol}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold text-lg ${colorClass}`}>
                    {stock.close_price?.toLocaleString('vi-VN')}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-black text-lg ${colorClass}`}>
                    {stock.phan_tram_thay_doi > 0 ? '+' : ''}
                    {stock.phan_tram_thay_doi?.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-500 font-medium text-lg">
                    {stock.tong_klgd_x10?.toLocaleString('vi-VN')} CP
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && topGainers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu biến động...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-12">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tight">
            TOP CỔ PHIẾU BIẾN ĐỘNG TRONG PHIÊN
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <span className="text-[10px] font-black uppercase tracking-widest">Dữ liệu ngày:</span>
              <span className="text-xs font-bold">{tradingDate || '...'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <span className="text-[10px] font-black uppercase tracking-widest">Thực hiện bởi:</span>
              <span className="text-xs font-bold uppercase">TEAM ĐOÀN QUỲNH</span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl shadow-sm transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">LÀM MỚI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <StockTable title="TOP TĂNG" stocks={topGainers} isGainer={true} />
        <StockTable title="TOP GIẢM" stocks={topLosers} isGainer={false} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center">
          <p className="text-rose-600 text-sm font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TopVolatility;
