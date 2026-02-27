
import React from 'react';
import Clock from './Clock';

const Banner: React.FC = () => {
  return (
    <div className="relative w-full h-auto min-h-[16rem] md:h-[22rem] bg-gradient-to-br from-[#003d60] via-[#004d7a] to-[#002d4a] overflow-hidden py-8 md:py-0 flex items-center">
      {/* Background Image - Centered and Dimmed */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="relative w-full max-w-4xl h-full opacity-[0.12] blur-[1px] transform -rotate-3 scale-125">
          <img 
            src="https://images.unsplash.com/photo-1611974717482-48a66500516e?q=80&w=2070&auto=format&fit=crop" 
            alt="Market Chart Background" 
            className="w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#003d60] via-transparent to-[#003d60]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#003d60] via-transparent to-[#003d60]"></div>
      </div>

      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="grid grid-cols-12 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/5"></div>
          ))}
        </div>
      </div>

      {/* Animated Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-4xl text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 shadow-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Dữ liệu thời gian thực
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] drop-shadow-2xl uppercase tracking-tighter mb-2">
              Thống kê <br className="hidden md:block" />
              thị trường <br className="hidden md:block" /> 
              Chứng khoán VN
            </h1>
            
            <div className="flex flex-col md:flex-row items-center lg:items-start gap-4 mt-4">
              <div className="h-px w-12 bg-blue-400/50 hidden md:block mt-4"></div>
              <p className="text-blue-200/80 text-base md:text-xl font-medium italic tracking-tight">
                Thống kê dòng tiền và phân tích chuyên sâu
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-center lg:items-end shrink-0">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 w-full sm:w-auto">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-4 flex items-center gap-4 min-w-[260px] shadow-2xl hover:bg-white/10 transition-all duration-500 group">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-3 rounded-xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mb-0.5">Team Vận Hành</p>
                    <p className="text-white text-base font-black tracking-tight">Đoàn Quỳnh Team</p>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-4 flex items-center gap-4 min-w-[260px] shadow-2xl hover:bg-white/10 transition-all duration-500 group">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mb-0.5">Hotline 24/7</p>
                    <p className="text-white text-base font-black tracking-tighter">0904.301.086</p>
                  </div>
                </div>
             </div>

             <div className="bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] px-6 py-3 flex items-center gap-4 shadow-2xl w-full sm:w-auto justify-center">
                <Clock />
             </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Banner;
