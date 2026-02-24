
import React from 'react';
import Clock from './Clock';

const Banner: React.FC = () => {
  return (
    <div className="relative w-full h-auto min-h-[16rem] md:h-80 bg-gradient-to-r from-[#051937] via-[#004d7a] to-[#008793] overflow-hidden py-8 md:py-0">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid grid-cols-12 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20"></div>
          ))}
        </div>
      </div>

      <div className="container mx-auto h-full px-4 md:px-8 flex flex-col justify-center relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Dữ liệu thời gian thực
            </div>
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase">
              Thống kê thị trường <br className="hidden md:block" /> chứng khoán VN
            </h1>
            <p className="mt-4 text-blue-100/80 text-sm md:text-base font-medium flex items-center justify-center md:justify-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Dòng tiền & Tín hiệu chuyên sâu
            </p>
          </div>

          <div className="flex flex-col gap-3 items-center md:items-end">
             <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[180px]">
                  <div className="bg-emerald-500/30 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-white/60 font-bold uppercase">Team Vận Hành</p>
                    <p className="text-white text-xs font-bold">Đoàn Quỳnh Team</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[180px]">
                  <div className="bg-blue-500/30 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-white/60 font-bold uppercase">Hotline 24/7</p>
                    <p className="text-white text-xs font-bold">0904.301.086</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Clock Responsive Position */}
        <div className="mt-8 md:absolute md:right-8 md:bottom-6 flex justify-center">
          <Clock />
        </div>
      </div>
    </div>
  );
};

export default Banner;
