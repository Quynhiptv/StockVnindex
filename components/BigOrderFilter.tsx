
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BigOrderData {
  symbol: string;
  type: string;
  price: number;
  rawPrice: string;
  volume: number;
  changePercent: number;
  rawChangePercent: string;
  time: string;
  value: number;
}

interface StockPriceData {
  symbol: string;
  price: number;
  rawPrice: string;
  changePercent: number;
  rawChangePercent: string;
}

const BigOrderFilter: React.FC = () => {
  const [data, setData] = useState<BigOrderData[]>([]);
  const [priceData, setPriceData] = useState<Record<string, StockPriceData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      // Parallel fetch for better performance
      const [orderRes, priceRes] = await Promise.all([
        fetch(`https://docs.google.com/spreadsheets/d/1PJSaUwbHfhyVJcaJhEBI6bUw6OamvvrKPhkonSh30z8/gviz/tq?tqx=out:csv&gid=0&t=${timestamp}`),
        fetch(`https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/gviz/tq?tqx=out:csv&gid=1628670680&t=${timestamp}`)
      ]);

      if (!orderRes.ok || !priceRes.ok) throw new Error('Network response was not ok');

      const [csvText, priceCsvText] = await Promise.all([
        orderRes.text(),
        priceRes.text()
      ]);
      
      // Optimized CSV Parser
      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(col => col.replace(/^"|"$/g, '').trim());
      };

      // Parse Price CSV
      const priceRows = priceCsvText.split(/\r?\n/).filter(row => row.trim() !== '');
      const priceDataMap: Record<string, StockPriceData> = {};
      
      for (let i = 1; i < priceRows.length; i++) {
        const cols = parseCSVLine(priceRows[i]);
        if (cols.length >= 3) {
          const symbol = cols[0].toUpperCase();
          priceDataMap[symbol] = {
            symbol,
            price: parseFloat(cols[1].replace(',', '.')) || 0,
            rawPrice: cols[1],
            changePercent: parseFloat(cols[2].replace(',', '.')) || 0,
            rawChangePercent: cols[2]
          };
        }
      }
      setPriceData(priceDataMap);
      
      // Parse Big Order CSV
      const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');
      const dataRows = rows.slice(1);
      
      const parsedData: BigOrderData[] = dataRows.map(row => {
        const cols = parseCSVLine(row);
        if (cols.length < 6) return null;
        
        const price = parseFloat(cols[2].replace(',', '.')) || 0;
        const volume = parseFloat(cols[3].replace(',', '.')) || 0;
        const changePercent = parseFloat(cols[4].replace(',', '.')) || 0;
        
        return {
          symbol: cols[0],
          type: cols[1],
          price: price,
          rawPrice: cols[2],
          volume: volume,
          changePercent: changePercent,
          rawChangePercent: cols[4],
          time: cols[5],
          value: price * volume * 1000
        };
      }).filter((item): item is BigOrderData => item !== null);

      // Sort by time descending
      parsedData.sort((a, b) => b.time.localeCompare(a.time));

      setData(parsedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching big order data:', error);
      if (data.length === 0) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Refresh every 8s
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatValue = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + ' Tỷ';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + ' Tr';
    return formatNumber(num);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSelectedSymbol(searchTerm.trim().toUpperCase());
    } else {
      setSelectedSymbol(null);
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedSymbol) return data;
    return data.filter(item => item.symbol.toUpperCase() === selectedSymbol);
  }, [data, selectedSymbol]);

  const stockStats = useMemo(() => {
    if (!selectedSymbol || filteredData.length === 0) return null;
    
    const buyOrders = filteredData.filter(item => item.type.toUpperCase() === 'MUA');
    const sellOrders = filteredData.filter(item => item.type.toUpperCase() === 'BÁN');
    
    const buyCount = buyOrders.length;
    const sellCount = sellOrders.length;
    
    const buyValue = buyOrders.reduce((sum, item) => sum + item.value, 0);
    const sellValue = sellOrders.reduce((sum, item) => sum + item.value, 0);
    
    // Calculate top 5 price levels for Buy and Sell
    const getTopPriceLevels = (orders: BigOrderData[]) => {
      const priceMap: Record<string, number> = {};
      orders.forEach(order => {
        const priceStr = order.rawPrice;
        priceMap[priceStr] = (priceMap[priceStr] || 0) + order.value;
      });
      
      return Object.entries(priceMap)
        .map(([price, value]) => ({ price, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    };

    const topBuyLevels = getTopPriceLevels(buyOrders);
    const topSellLevels = getTopPriceLevels(sellOrders);

    const priceInfo = priceData[selectedSymbol];

    return {
      symbol: selectedSymbol,
      currentPrice: priceInfo ? priceInfo.price : (filteredData[0]?.price || 0),
      rawPrice: priceInfo ? priceInfo.rawPrice : (filteredData[0]?.rawPrice || '0'),
      changePercent: priceInfo ? priceInfo.changePercent : (filteredData[0]?.changePercent || 0),
      rawChangePercent: priceInfo ? priceInfo.rawChangePercent : (filteredData[0]?.rawChangePercent || '0'),
      buyCount,
      sellCount,
      buyValue,
      sellValue,
      topBuyLevels,
      topSellLevels,
      pieData: [
        { name: 'Mua', value: buyValue, count: buyCount },
        { name: 'Bán', value: sellValue, count: sellCount }
      ]
    };
  }, [selectedSymbol, filteredData, priceData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu Lệnh BIG...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cập nhật dữ liệu Lệnh BIG trong phiên</h3>
          <p className="text-slate-500 text-sm font-medium mt-1 italic">Dữ liệu được cập nhật intraday</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Phân tích bởi</p>
            <p className="text-sm font-black text-slate-800 uppercase mt-1">Team Đoàn Quỳnh - 0904301086</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-100 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Nhập mã chứng khoán (VD: VND)..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            TÌM KIẾM
          </button>
        </form>
      </div>

      {/* Detailed View if Symbol Selected */}
      {selectedSymbol && stockStats && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                <span className="text-white font-black text-xl">{selectedSymbol[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900">Chi tiết mã:</h4>
                  <span className={`text-2xl font-black uppercase tracking-tight ${stockStats.changePercent > 0 ? 'text-emerald-600' : stockStats.changePercent < 0 ? 'text-rose-600' : 'text-amber-500'}`}>
                    {selectedSymbol}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Giá hiện tại:</span>
                    <span className="text-lg font-mono font-black text-slate-900">
                      {(stockStats.currentPrice * 1000).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 10 })} VND
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${stockStats.changePercent > 0 ? 'bg-emerald-50 text-emerald-600' : stockStats.changePercent < 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-500'}`}>
                    {stockStats.changePercent > 0 ? '▲' : stockStats.changePercent < 0 ? '▼' : '●'}
                    {stockStats.rawChangePercent}%
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedSymbol(null); setSearchTerm(''); }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Tổng Lệnh Mua</p>
                <p className="text-3xl font-black text-emerald-700">{stockStats.buyCount}</p>
                <p className="text-xs font-bold text-emerald-600/70 mt-1">Giá trị: {formatValue(stockStats.buyValue)}</p>
              </div>
              <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Tổng Lệnh Bán</p>
                <p className="text-3xl font-black text-rose-700">{stockStats.sellCount}</p>
                <p className="text-xs font-bold text-rose-600/70 mt-1">Giá trị: {formatValue(stockStats.sellValue)}</p>
              </div>
              <div className="col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Giá Trị Giao Dịch BIG</p>
                  <p className="text-2xl font-black text-slate-800">{formatValue(stockStats.buyValue + stockStats.sellValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tỷ lệ Mua/Bán</p>
                  <p className="text-2xl font-black text-blue-600">
                    {((stockStats.buyValue / (stockStats.buyValue + stockStats.sellValue || 1)) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="h-[280px] bg-slate-50/30 rounded-3xl border border-slate-100 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string, props: any) => {
                      return [
                        `${formatValue(value)} (${props.payload.count} lệnh)`,
                        name
                      ];
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Price Levels Chart */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">Thống kê 5 bước giá giao dịch BIG cao nhất</h5>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buy Levels */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Top 5 Bước Giá Mua</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockStats.topBuyLevels} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="price" 
                        type="category" 
                        width={60} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatValue(value), 'Giá trị']}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sell Levels */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4">Top 5 Bước Giá Bán</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockStats.topSellLevels} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="price" 
                        type="category" 
                        width={60} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [formatValue(value), 'Giá trị']}
                      />
                      <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-100">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {selectedSymbol ? `Lệnh BIG cho mã ${selectedSymbol}` : 'Lệnh BIG intraday'}
            </h4>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">
            {filteredData.length} Lệnh được ghi nhận
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tên cổ phiếu</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Loại Lệnh</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Khối lượng Khớp</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Giá khớp</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Giá trị khớp</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Thay đổi</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item, index) => {
                const isBuy = item.type.toUpperCase() === 'MUA';
                const changeColor = item.changePercent > 0 ? 'text-emerald-600' : item.changePercent < 0 ? 'text-rose-600' : 'text-amber-500';
                const changeBg = item.changePercent > 0 ? 'bg-emerald-50' : item.changePercent < 0 ? 'bg-rose-50' : 'bg-amber-50';
                
                return (
                  <tr key={`${item.symbol}-${item.time}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.symbol}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black uppercase tracking-wider ${isBuy ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-mono font-medium text-slate-600">{formatNumber(item.volume)} CP</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-mono font-medium text-slate-900">
                        {item.rawPrice}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-mono font-bold ${isBuy ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatValue(item.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${changeColor} ${changeBg}`}>
                        {item.changePercent > 0 ? '+' : ''}{item.rawChangePercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-mono text-slate-400">{item.time}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-medium">
              {selectedSymbol ? `Không tìm thấy lệnh BIG cho mã ${selectedSymbol}.` : 'Chưa có dữ liệu lệnh BIG trong phiên hôm nay.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BigOrderFilter;
