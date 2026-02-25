
import React from 'react';
import Clock from './Clock';

const Banner: React.FC = () => {
  return (
    <div className="relative w-full h-auto min-h-[20rem] md:h-[28rem] bg-[#004d7a] overflow-hidden py-12 md:py-0">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="grid grid-cols-12 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/10"></div>
          ))}
        </div>
      </div>

      <div className="container mx-auto h-full px-4 md:px-8 flex flex-col justify-center relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="max-w-3xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Dữ liệu thời gian thực
            </div>
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] drop-shadow-2xl uppercase tracking-tighter">
              Thống kê thị trường <br className="hidden md:block" /> 
              Chứng khoán VN
            </h1>
            <p className="mt-6 text-blue-100/90 text-lg md:text-xl font-bold flex items-center justify-center md:justify-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Dòng tiền & Tín hiệu chuyên sâu
            </p>
          </div>

          <div className="flex flex-col gap-4 items-center md:items-end">
             <div className="flex flex-col gap-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[240px] shadow-2xl">
                  <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Team Vận Hành</p>
                    <p className="text-white text-sm font-black">Đoàn Quỳnh Team</p>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[240px] shadow-2xl">
                  <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Hotline 24/7</p>
                    <p className="text-white text-sm font-black tracking-tighter">0904.301.086</p>
                  </div>
                </div>
             </div>

             <div className="mt-4 bg-black/20 backdrop-blur-xl border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl">
                <Clock />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
