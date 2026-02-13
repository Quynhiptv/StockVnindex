
import React from 'react';
import Clock from './Clock';

const Banner: React.FC = () => {
  return (
    <div className="relative w-full h-64 md:h-80 bg-gradient-to-r from-[#051937] via-[#004d7a] to-[#008793] overflow-hidden">
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
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-time Market Data
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg">
              DỮ LIỆU THỊ TRƯỜNG <br /> CHỨNG KHOÁN VIỆT NAM
            </h1>
            <p className="mt-4 text-blue-100/80 font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Thống kê dòng tiền & Tín hiệu kỹ thuật chuyên sâu
            </p>
          </div>

          <div className="flex flex-col gap-4 self-end md:self-center">
             <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[200px]">
                  <div className="bg-emerald-500/30 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 font-bold uppercase">VẬN HÀNH BỞI</p>
                    <p className="text-white font-bold">Đoàn Quỳnh Team</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[200px]">
                  <div className="bg-blue-500/30 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 font-bold uppercase">HOTLINE</p>
                    <p className="text-white font-bold">0904.301.086</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Decorative charts graphics */}
        <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none hidden lg:block">
            <svg width="400" height="200" viewBox="0 0 400 200">
                <rect x="20" y="100" width="30" height="80" fill="#34d399" rx="4" />
                <rect x="70" y="60" width="30" height="120" fill="#34d399" rx="4" />
                <rect x="120" y="140" width="30" height="40" fill="#f87171" rx="4" />
                <rect x="170" y="40" width="30" height="140" fill="#34d399" rx="4" />
                <rect x="220" y="80" width="30" height="100" fill="#34d399" rx="4" />
                <path d="M0 150 Q 100 80 200 120 T 400 50" fill="none" stroke="white" strokeWidth="4" />
            </svg>
        </div>

        {/* Clock positioned in bottom right corner of the banner section */}
        <div className="absolute right-4 bottom-4 md:right-8 md:bottom-6">
          <Clock />
        </div>
      </div>
    </div>
  );
};

export default Banner;
