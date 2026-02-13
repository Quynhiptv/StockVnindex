
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const data = [
  { date: '01/02', value: 450 },
  { date: '02/02', value: -120 },
  { date: '03/02', value: 380 },
  { date: '04/02', value: 620 },
  { date: '05/02', value: -450 },
  { date: '06/02', value: -210 },
  { date: '07/02', value: 890 },
  { date: '08/02', value: 120 },
  { date: '09/02', value: -330 },
  { date: '10/02', value: 540 },
];

const stockData = [
  { symbol: 'VNM', buy: 120.5, sell: 45.2, net: 75.3 },
  { symbol: 'STB', buy: 98.1, sell: 112.5, net: -14.4 },
  { symbol: 'VCB', buy: 245.0, sell: 12.4, net: 232.6 },
  { symbol: 'HPG', buy: 89.4, sell: 156.8, net: -67.4 },
  { symbol: 'MWG', buy: 67.2, sell: 32.1, net: 35.1 },
];

const ForeignFlow: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-6">Diễn biến mua bán ròng Khối ngoại (Tỷ VNĐ)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#34d399' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Chi tiết giao dịch Khối ngoại theo Cổ phiếu</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <th className="py-4 font-bold">Mã CP</th>
              <th className="py-4 font-bold">Giá trị mua (Tỷ)</th>
              <th className="py-4 font-bold">Giá trị bán (Tỷ)</th>
              <th className="py-4 font-bold">Mua bán ròng</th>
              <th className="py-4 font-bold">% Khối ngoại sở hữu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {stockData.map((stock) => (
              <tr key={stock.symbol} className="hover:bg-slate-700/20 transition-colors">
                <td className="py-4 font-black">{stock.symbol}</td>
                <td className="py-4 text-emerald-400 font-medium">{stock.buy.toFixed(1)}</td>
                <td className="py-4 text-rose-400 font-medium">{stock.sell.toFixed(1)}</td>
                <td className={`py-4 font-black ${stock.net > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.net > 0 ? `+${stock.net.toFixed(1)}` : stock.net.toFixed(1)}
                </td>
                <td className="py-4 text-slate-300">
                    <div className="w-full bg-slate-700 rounded-full h-1.5 max-w-[100px] overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.random() * 49}%` }}></div>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForeignFlow;
