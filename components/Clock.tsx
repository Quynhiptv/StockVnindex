
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDay = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const year = time.getFullYear();

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-full px-4 py-2 flex items-center gap-3 text-white shadow-lg">
      <div className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono font-bold text-lg">{hours}:{minutes}:{seconds}</span>
      </div>
      <div className="h-4 w-[1px] bg-slate-600"></div>
      <span className="text-sm font-medium tracking-wide">
        TH {time.getDay() + 1 === 1 ? 'CN' : time.getDay() + 1}, {day}/{month}/{year}
      </span>
    </div>
  );
};

export default Clock;
