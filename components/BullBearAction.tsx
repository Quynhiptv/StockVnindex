import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bwitfhihuqsjdpxrgxhb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3mm3NKqJxoH-aOh79h4GWA_t7IbusZZ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface BullBearStock {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  trading_date?: string;
}

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
      <th className="px-5 py-4 text-right">Khối lượng</th>
    </tr>
  </thead>
);

const StockRow: React.FC<{ stock: BullBearStock }> = ({ stock }) => (
  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
    <td className={`px-5 py-4 font-black text-xs transition-all duration-500 ${getPriceColor(stock.changePercent)}`}>{stock.symbol}</td>
    <td className="px-5 py-4 text-right font-black text-xs text-slate-900 transition-all duration-500">{stock.price.toLocaleString('vi-VN')}</td>
    <td className={`px-5 py-4 text-right font-black text-xs transition-all duration-500 ${getPriceColor(stock.changePercent)}`}>
      {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
    </td>
    <td className="px-5 py-4 text-right font-bold text-xs text-slate-400 transition-all duration-500">{stock.volume.toLocaleString('vi-VN')} CP</td>
  </tr>
);

const BullBearAction: React.FC = () => {
  const [data, setData] = useState<BullBearStock[]>([]);
  const [updateDate, setUpdateDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: sbData, error: sbError } = await supabase
        .from('ohcl_dnse')
        .select('symbol, close_price, phan_tram_thay_doi, gia_cao_nhat, gia_thap_nhat, tong_klgd_x10, trading_date');

      if (sbError) throw sbError;

      if (sbData && sbData.length > 0) {
        if (sbData[0].trading_date) {
          const date = new Date(sbData[0].trading_date);
          setUpdateDate(date.toLocaleDateString('vi-VN'));
        }

        const parsedData: BullBearStock[] = sbData.map(item => ({
          symbol: item.symbol,
          price: item.close_price || 0,
          changePercent: item.phan_tram_thay_doi || 0,
          volume: item.tong_klgd_x10 || 0,
          high: item.gia_cao_nhat || 0,
          low: item.gia_thap_nhat || 0
        }));
        setData(parsedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const highestClosing = useMemo(() => 
    data.filter(s => s.price > 0 && s.price >= s.high * 0.99995).sort((a, b) => b.changePercent - a.changePercent), 
  [data]);
  
  const lowestClosing = useMemo(() => 
    data.filter(s => s.price > 0 && s.price <= s.low * 1.00005).sort((a, b) => a.changePercent - b.changePercent), 
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
                  highestClosing.map((stock, index) => <StockRow key={`${stock.symbol}-${index}`} stock={stock} />)
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
                  lowestClosing.map((stock, index) => <StockRow key={`${stock.symbol}-${index}`} stock={stock} />)
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