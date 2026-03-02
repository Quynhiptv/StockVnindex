
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

interface ForeignStockData {
  symbol: string;
  buyVol: number;
  sellVol: number;
  netVol: number;
  netValue: number;
  buySessions: number;
  sellSessions: number;
  avgPrice: string;
}

const BigOrderFilter: React.FC = () => {
  const [data, setData] = useState<BigOrderData[]>([]);
  const [priceData, setPriceData] = useState<Record<string, StockPriceData>>({});
  const [foreignData, setForeignData] = useState<Record<string, ForeignStockData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      // Parallel fetch for better performance
      const [orderRes, priceRes, foreignRes] = await Promise.all([
        fetch(`https://docs.google.com/spreadsheets/d/1PJSaUwbHfhyVJcaJhEBI6bUw6OamvvrKPhkonSh30z8/gviz/tq?tqx=out:csv&gid=0&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/gviz/tq?tqx=out:csv&gid=1628670680&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/gviz/tq?tqx=out:csv&gid=358629670&t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!orderRes.ok || !priceRes.ok || !foreignRes.ok) throw new Error('Network response was not ok');

      const [csvText, priceCsvText, foreignCsvText] = await Promise.all([
        orderRes.text(),
        priceRes.text(),
        foreignRes.text()
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

      // Parse Foreign CSV
      const foreignRows = foreignCsvText.split(/\r?\n/).filter(row => row.trim() !== '');
      const foreignDataMap: Record<string, ForeignStockData> = {};
      
      const cleanNum = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
      };

      for (let i = 1; i < foreignRows.length; i++) {
        const cols = parseCSVLine(foreignRows[i]);
        if (cols.length >= 14) {
          const symbol = cols[0].toUpperCase();
          foreignDataMap[symbol] = {
            symbol,
            buyVol: cleanNum(cols[2]),
            sellVol: cleanNum(cols[5]),
            netVol: cleanNum(cols[8]),
            netValue: cleanNum(cols[9]),
            buySessions: parseInt(cols[12]) || 0,
            sellSessions: parseInt(cols[13]) || 0,
            avgPrice: cols[10] || '-'
          };
        }
      }
      setForeignData(foreignDataMap);
      
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
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatValue = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    return formatNumber(num);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toUpperCase();
    if (term) {
      setSelectedSymbol(term);
    } else {
      setSelectedSymbol(null);
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedSymbol) return [];
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
    
    const buyVol = buyOrders.reduce((sum, item) => sum + item.volume, 0);
    const sellVol = sellOrders.reduce((sum, item) => sum + item.volume, 0);

    // Group by price for the stacked bar chart
    const priceMap: Record<string, { price: string, buyVol: number, sellVol: number, priceNum: number }> = {};
    filteredData.forEach(order => {
      const p = order.rawPrice;
      if (!priceMap[p]) {
        priceMap[p] = { price: p, buyVol: 0, sellVol: 0, priceNum: order.price };
      }
      if (order.type.toUpperCase() === 'MUA') {
        priceMap[p].buyVol += order.volume;
      } else {
        priceMap[p].sellVol += order.volume;
      }
    });

    const volumeByPrice = Object.values(priceMap)
      .sort((a, b) => a.priceNum - b.priceNum);

    const priceInfo = priceData[selectedSymbol];
    const foreignInfo = foreignData[selectedSymbol];
    const totalValue = buyValue + sellValue;
    const buyRatio = totalValue > 0 ? (buyValue / totalValue) * 100 : 0;

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
      buyRatio,
      volumeByPrice,
      totalOrders: filteredData.length,
      foreign: foreignInfo,
      pieData: [
        { name: 'Mua', value: buyValue },
        { name: 'Bán', value: sellValue }
      ]
    };
  }, [selectedSymbol, filteredData, priceData, foreignData]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">LỌC LỆNH BIG</h3>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">SÀN HOSE: ĐANG NGHỈ GIAO DỊCH</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <form onSubmit={handleSearch} className="flex items-center gap-0 bg-slate-200 rounded-full border border-slate-300 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <div className="pl-6 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Nhập mã chứng khoán (VD: HPG)..." 
            className="flex-grow px-4 py-5 bg-transparent text-slate-900 font-black uppercase placeholder:text-slate-500 placeholder:normal-case focus:outline-none text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="pr-2">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-sm px-12 py-4 rounded-full transition-all active:scale-95"
            >
              TÌM KIẾM
            </button>
          </div>
        </form>
      </div>

      {/* Detailed View and Table - Only show if Symbol Selected */}
      {selectedSymbol && stockStats ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h2 className={`text-5xl font-black tracking-tighter ${stockStats.changePercent > 0 ? 'text-emerald-600' : stockStats.changePercent < 0 ? 'text-rose-600' : 'text-amber-500'}`}>
                    {selectedSymbol}
                  </h2>
                  <div className="flex flex-col">
                    <span className={`text-3xl font-black leading-none ${stockStats.changePercent > 0 ? 'text-emerald-600' : stockStats.changePercent < 0 ? 'text-rose-600' : 'text-amber-500'}`}>
                      {(stockStats.currentPrice * 1000).toLocaleString('vi-VN')}
                    </span>
                    <span className={`text-lg font-bold ${stockStats.changePercent > 0 ? 'text-emerald-500' : stockStats.changePercent < 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                      {stockStats.changePercent > 0 ? '+' : ''}{stockStats.rawChangePercent}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                  <span>{stockStats.totalOrders} lệnh khớp</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Foreign Info Box */}
              {stockStats.foreign && (
                <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 min-w-[320px] shadow-sm transition-all ${stockStats.foreign.netValue < 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Thông tin nước ngoài</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stockStats.foreign.netValue < 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {stockStats.foreign.netValue < 0 ? 'BÁN RÒNG' : 'MUA RÒNG'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Mua</span>
                      <span className="text-[11px] font-black text-emerald-600">{formatNumber(stockStats.foreign.buyVol)} CP</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Bán</span>
                      <span className="text-[11px] font-black text-rose-600">{formatNumber(stockStats.foreign.sellVol)} CP</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Dòng KL</span>
                      <span className={`text-[11px] font-black ${stockStats.foreign.netVol < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatNumber(stockStats.foreign.netVol)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Dòng GT</span>
                      <span className={`text-[11px] font-black ${stockStats.foreign.netValue < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {(stockStats.foreign.netValue / 1000000000).toFixed(2)} Tỷ
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Giá GD NN</span>
                      <span className="text-[11px] font-black text-slate-700">
                        {stockStats.foreign.avgPrice} VND
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Số phiên {stockStats.foreign.netValue < 0 ? 'bán' : 'mua'}</span>
                    <span className={`text-xs font-black ${stockStats.foreign.netValue < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {stockStats.foreign.netValue < 0 ? stockStats.foreign.sellSessions : stockStats.foreign.buySessions} phiên
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`px-8 py-2.5 rounded-lg font-black uppercase tracking-widest text-sm shadow-sm ${stockStats.buyValue > stockStats.sellValue ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {stockStats.buyValue > stockStats.sellValue ? 'MUA RÒNG' : 'BÁN RÒNG'}
            </div>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">GIÁ TRỊ MUA</span>
              </div>
              <p className="text-2xl font-black text-emerald-600">{formatValue(stockStats.buyValue)}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{stockStats.buyCount} lệnh</p>
            </div>

            <div className="bg-rose-50/30 border border-rose-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">GIÁ TRỊ BÁN</span>
              </div>
              <p className="text-2xl font-black text-rose-600">{formatValue(stockStats.sellValue)}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{stockStats.sellCount} lệnh</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">TỶ LỆ ÁP ĐẢO</span>
                <span className="text-lg font-black text-emerald-600">{stockStats.buyRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-rose-500 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stockStats.buyRatio}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Mua</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Bán</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-blue-600 rounded-full" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">TỔNG QUAN MUA/BÁN</h4>
              </div>
              <div className="h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockStats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [formatValue(value), 'Giá trị']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng GT</p>
                  <p className="text-xl font-black text-slate-900">{formatValue(stockStats.buyValue + stockStats.sellValue)}</p>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Mua</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-600">Bán</span>
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-purple-600 rounded-full" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">PHÂN BỐ KHỐI LƯỢNG THEO GIÁ</h4>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockStats.volumeByPrice}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="price" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                      tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [formatNumber(value), 'Khối lượng']}
                    />
                    <Bar dataKey="buyVol" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="sellVol" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">KL Mua</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-600">KL Bán</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                NHẬT KÝ LỆNH BIG: {selectedSymbol}
              </h4>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filteredData.length} Lệnh được ghi nhận
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cổ phiếu</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Loại</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Khối lượng</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Giá khớp</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Giá trị</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Thay đổi</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item, index) => {
                    const isBuy = item.type.toUpperCase() === 'MUA';
                    return (
                      <tr key={`${item.symbol}-${item.time}-${index}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-900">{item.symbol}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase ${isBuy ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-mono font-medium text-slate-600">{formatNumber(item.volume)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-mono font-medium text-slate-900">{item.rawPrice}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs font-mono font-bold ${isBuy ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatValue(item.value)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.changePercent > 0 ? 'bg-emerald-50 text-emerald-600' : item.changePercent < 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-500'}`}>
                            {item.changePercent > 0 ? '+' : ''}{item.rawChangePercent}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white py-24 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Vui lòng nhập mã chứng khoán</h4>
          <p className="text-slate-400 mt-2 text-sm font-medium max-w-md">
            Nhập mã cổ phiếu vào ô tìm kiếm phía trên để xem chi tiết các lệnh BIG (lệnh quy mô lớn) được ghi nhận trong phiên.
          </p>
        </div>
      )}
    </div>
  );
};

export default BigOrderFilter;
