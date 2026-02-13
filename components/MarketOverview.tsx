
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const mockChartData = [
  { time: '09:00', value: 1250 },
  { time: '10:00', value: 1255 },
  { time: '11:00', value: 1252 },
  { time: '13:00', value: 1258 },
  { time: '14:00', value: 1262 },
  { time: '14:30', value: 1265 },
  { time: '15:00', value: 1264 },
];

const sectorData = [
  { name: 'Ngân hàng', value: 1.2, color: '#34d399' },
  { name: 'Bất động sản', value: -0.5, color: '#f87171' },
  { name: 'Chứng khoán', value: 2.1, color: '#34d399' },
  { name: 'Thép', value: 0.8, color: '#34d399' },
  { name: 'Dầu khí', value: -1.2, color: '#f87171' },
  { name: 'Bán lẻ', value: 0.3, color: '#34d399' },
];

const MarketOverview: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Main Chart Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                VN-Index
              </h3>
              <p className="text-3xl font-black mt-1">
                1,264.44 <span className="text-emerald-400 text-lg font-bold">+12.45 (1.00%)</span>
              </p>
            </div>
            <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-700 rounded-md text-xs font-medium cursor-pointer">1D</span>
                <span className="px-3 py-1 bg-slate-900 rounded-md text-xs font-medium cursor-pointer text-slate-500">1W</span>
                <span className="px-3 py-1 bg-slate-900 rounded-md text-xs font-medium cursor-pointer text-slate-500">1M</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Phân bổ dòng tiền</h4>
              <div className="flex items-center justify-between h-[150px]">
                <div className="flex flex-col gap-2 flex-1">
                   <div className="flex items-center gap-3">
                      <div className="w-32 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-bold">Tăng: 245 CP</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-16 h-3 bg-slate-600 rounded-full"></div>
                      <span className="text-sm font-bold">Không đổi: 80 CP</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-24 h-3 bg-rose-500 rounded-full"></div>
                      <span className="text-sm font-bold">Giảm: 112 CP</span>
                   </div>
                </div>
                <div className="relative w-24 h-24 rounded-full border-[10px] border-slate-700 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent border-l-transparent"></div>
                    <span className="text-xl font-bold">65%</span>
                </div>
              </div>
           </div>

           <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top Ngành Biến Động</h4>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Biến động cổ phiếu</h4>
          <div className="space-y-4">
            {[
              { ticker: 'HPG', price: '28.45', change: '+2.4%', color: 'text-emerald-400' },
              { ticker: 'VCB', price: '92.10', change: '+0.8%', color: 'text-emerald-400' },
              { ticker: 'SSI', price: '34.20', change: '+4.1%', color: 'text-emerald-400' },
              { ticker: 'VHM', price: '41.25', change: '-1.2%', color: 'text-rose-400' },
              { ticker: 'VIC', price: '45.80', change: '+0.5%', color: 'text-emerald-400' },
              { ticker: 'MWG', price: '52.30', change: '-2.1%', color: 'text-rose-400' },
              { ticker: 'GAS', price: '78.90', change: '+1.5%', color: 'text-emerald-400' },
            ].map((stock) => (
              <div key={stock.ticker} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center font-bold">
                      {stock.ticker[0]}
                   </div>
                   <span className="font-bold">{stock.ticker}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stock.price}</div>
                  <div className={`text-xs ${stock.color} font-bold`}>{stock.change}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors text-xs font-bold uppercase tracking-widest">
             Xem tất cả
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group">
            <div className="relative z-10">
                <h4 className="text-lg font-black mb-2">Đoàn Quỳnh Team</h4>
                <p className="text-blue-100/70 text-sm mb-4">Hỗ trợ tư vấn đầu tư chuyên nghiệp, tín hiệu điểm mua/bán realtime qua Zalo.</p>
                <button className="bg-white text-blue-700 px-4 py-2 rounded-lg font-bold text-sm shadow-xl flex items-center gap-2 group-hover:scale-105 transition-transform">
                   Tham gia ngay
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="white">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
