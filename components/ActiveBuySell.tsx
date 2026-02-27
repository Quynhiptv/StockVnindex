
import React, { useEffect, useState, useMemo } from 'react';

const ACTIVE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1407181227';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';

interface ActiveStockData {
  symbol: string;
  sellVol: number;
  buyVol: number;
  netFlowPercent: number;
  currentPrice: number;
  changePercent: number;
}

const cleanNumber = (val: string): number => {
  if (!val || val === '-' || val === '' || val === '#N/A' || val === '#VALUE!') return 0;
  let s = val.trim().replace('%', '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    s = s.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    s = s.replace(',', '.');
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
};

const getTrendColor = (change: number) => {
  if (change > 0) return 'text-emerald-600';
  if (change < 0) return 'text-rose-600';
  return 'text-amber-500';
};

const TableHeader = () => (
  <thead>
    <tr className="text-slate-400 text-[9px] font-black uppercase tracking-wider border-b border-slate-100">
      <th className="px-3 py-4 sticky left-0 bg-white z-10">Mã CP</th>
      <th className="px-2 py-4 text-right">KL Bán</th>
      <th className="px-2 py-4 text-right">KL Mua</th>
      <th className="px-2 py-4 text-right">% KL Dòng</th>
      <th className="px-2 py-4 text-right">Giá</th>
      <th className="px-2 py-4 text-right">% Thay đổi</th>
    </tr>
  </thead>
);

const StockRow: React.FC<{ item: ActiveStockData }> = ({ item }) => {
  const priceColor = getTrendColor(item.changePercent);
  const flowColor = item.netFlowPercent > 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className={`px-3 py-4 font-black text-[11px] sticky left-0 bg-white group-hover:bg-slate-50 ${priceColor}`}>{item.symbol}</td>
      <td className="px-2 py-4 text-right font-black text-[10px] text-rose-600 tabular-nums">
        {item.sellVol.toLocaleString('vi-VN')}
      </td>
      <td className="px-2 py-4 text-right font-black text-[10px] text-emerald-600 tabular-nums">
        {item.buyVol.toLocaleString('vi-VN')}
      </td>
      <td className={`px-2 py-4 text-right font-black text-[10px] ${flowColor} tabular-nums`}>
        {item.netFlowPercent > 0 ? '+' : ''}{item.netFlowPercent.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
      </td>
      <td className={`px-2 py-4 text-right font-black text-[10px] ${priceColor} tabular-nums`}>
        {item.currentPrice.toLocaleString('vi-VN', { minimumFractionDigits: 1 })}
      </td>
      <td className={`px-2 py-4 text-right font-black text-[10px] ${priceColor} tabular-nums`}>
        {item.changePercent > 0 ? '+' : ''}{item.changePercent.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
      </td>
    </tr>
  );
};

const ActiveBuySell: React.FC = () => {
  const [data, setData] = useState<ActiveStockData[]>([]);
  const [tradingDate, setTradingDate] = useState<string>('');
  const [extraInfo, setExtraInfo] = useState<string>('');
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
      const [activeRes, priceRes] = await Promise.all([
        fetch(`${ACTIVE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${PRICE_DATA_URL}&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!activeRes.ok || !priceRes.ok) throw new Error('Dữ liệu chưa sẵn sàng');

      const activeCSV = await activeRes.text();
      const priceCSV = await priceRes.text();

      const activeRows = parseCSV(activeCSV);
      const priceRows = parseCSV(priceCSV);

      if (activeRows[1]) {
        const rawDate = activeRows[1][1] || '';
        setTradingDate(rawDate.split(' ')[0]);
        setExtraInfo(activeRows[1][9] || '');
      }

      const priceMap = new Map<string, { price: number; change: number }>();
      priceRows.slice(1).forEach(row => {
        const symbol = row[0]?.trim();
        if (symbol) {
          priceMap.set(symbol, {
            price: cleanNumber(row[1]),
            change: cleanNumber(row[2])
          });
        }
      });

      const merged: ActiveStockData[] = activeRows
        .slice(1)
        .filter(row => row[0] && row[0] !== 'Mã CP' && row[0] !== '')
        .map(row => {
          const symbol = row[0].trim();
          const pData = priceMap.get(symbol) || { price: 0, change: 0 };
          return {
            symbol,
            sellVol: cleanNumber(row[2]),
            buyVol: cleanNumber(row[5]),
            netFlowPercent: cleanNumber(row[8]),
            currentPrice: pData.price,
            changePercent: pData.change
          };
        });

      setData(merged);
    } catch (err) {
      console.error('Lỗi ActiveBuySell:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const buyList = useMemo(() => 
    data
      .filter(d => d.netFlowPercent > 0 && (d.buyVol + d.sellVol) > 300000)
      .sort((a, b) => b.netFlowPercent - a.netFlowPercent), 
  [data]);

  const sellList = useMemo(() => 
    data
      .filter(d => d.netFlowPercent < 0 && (d.buyVol + d.sellVol) > 300000)
      .sort((a, b) => a.netFlowPercent - b.netFlowPercent), 
  [data]);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Đang đồng bộ dòng tiền...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-12">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="bg-blue-600 p-5 rounded-[1.5rem] shadow-xl shadow-blue-100 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="space-y-3 flex-grow">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Thống kê Mua/Bán chủ động</h2>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                Ngày GD: <span className="underline underline-offset-4 decoration-indigo-200">{tradingDate || '---'}</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cập nhật Intraday 5s</p>
                {extraInfo && (
                  <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100">
                    {extraInfo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col group">
          <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-white text-base font-black uppercase tracking-widest">TOP Mua chủ động</h3>
            <span className="bg-white/20 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase ring-1 ring-white/30">
              {buyList.length} CP
            </span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="divide-y divide-slate-50">
                {buyList.map(item => <StockRow key={item.symbol} item={item} />)}
                {buyList.length === 0 && (
                  <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col group">
          <div className="bg-rose-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-white text-base font-black uppercase tracking-widest">TOP Bán chủ động</h3>
            <span className="bg-white/20 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase ring-1 ring-white/30">
              {sellList.length} CP
            </span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <TableHeader />
              <tbody className="divide-y divide-slate-50">
                {sellList.map(item => <StockRow key={item.symbol} item={item} />)}
                {sellList.length === 0 && (
                  <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveBuySell;
