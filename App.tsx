
import React, { useState, useEffect } from 'react';
import { MarketTab } from './types';
import Banner from './components/Banner';
import DashboardTabs from './components/DashboardTabs';
import MarketOverview from './components/MarketOverview';
import ForeignFlow from './components/ForeignFlow';
import ATCForeign from './components/ATCForeign';
import ATCPriceAction from './components/ATCPriceAction';
import StockList from './components/StockList';
import VolumeSurge from './components/VolumeSurge';
import BullBearAction from './components/BullBearAction';
import ActiveBuySell from './components/ActiveBuySell';
import BigOrderFilter from './components/BigOrderFilter';
import RecommendationPortfolio from './components/RecommendationPortfolio';
import SectorAnalysis from './components/SectorAnalysis';
import SystemSettings from './components/SystemSettings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MarketTab>(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab && Object.values(MarketTab).includes(savedTab as MarketTab)) {
      return savedTab as MarketTab;
    }
    return MarketTab.OVERVIEW;
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  const [marketStatus, setMarketStatus] = useState({ isOpen: false, text: '' });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isWeekend = day === 0 || day === 6;
      
      const isTradingHours = (hour === 9 && minute >= 0) || (hour > 9 && hour < 15);

      if (!isWeekend && isTradingHours) {
        setMarketStatus({ isOpen: true, text: 'SÀN HOSE: ĐANG KHỚP LỆNH' });
      } else {
        setMarketStatus({ isOpen: false, text: 'SÀN HOSE: ĐANG NGHỈ GIAO DỊCH' });
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case MarketTab.OVERVIEW:
        return <MarketOverview />;
      case MarketTab.FOREIGN_FLOW:
        return <ForeignFlow />;
      case MarketTab.VOLUME_SURGE:
        return <VolumeSurge />;
      case MarketTab.BULL_BEAR:
        return <BullBearAction />;
      case MarketTab.BIG_ORDER:
        return <BigOrderFilter />;
      case MarketTab.ATC_FOREIGN:
        return <ATCForeign />;
      case MarketTab.ATC_PRICE_ACTION:
        return <ATCPriceAction />;
      case MarketTab.ACTIVE_BUY_SELL:
        return <ActiveBuySell />;
      case MarketTab.SECTORS:
        return <SectorAnalysis />;
      case MarketTab.STOCK_LIST:
        return <StockList />;
      case MarketTab.RECOMMENDATIONS:
        return <RecommendationPortfolio />;
      case MarketTab.SYSTEM_SETTINGS:
        return <SystemSettings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Tính năng đang phát triển</h3>
            <p className="text-slate-400 mt-3 text-sm font-medium">Dữ liệu {activeTab} sẽ sớm ra mắt.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-10 bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <header>
        <Banner />
      </header>

      <div className="sticky top-0 z-40">
        <DashboardTabs 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
        />
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-10 flex-grow max-w-[1600px]">
        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-blue-600 rounded-full shrink-0 shadow-lg shadow-blue-200"></div>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
                    {activeTab}
                </h2>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm self-start sm:self-auto ring-1 ring-slate-100">
                <div className={`w-3 h-3 rounded-full ${marketStatus.isOpen ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest leading-none">
                    {marketStatus.text}
                </span>
            </div>
        </div>
        
        <div className="transition-all duration-500 transform">
          {renderContent()}
        </div>
      </main>

      <footer className="mt-20 container mx-auto px-4 text-center border-t border-slate-200 pt-12">
         <div className="flex flex-col items-center gap-4">
           <div className="w-10 h-1 bg-slate-200 rounded-full mb-2"></div>
           <p className="text-slate-400 text-[11px] font-black tracking-[0.3em] uppercase">
            © 2020 Đoàn Quỳnh Team • Hệ thống phân tích chứng khoán chuyên nghiệp
           </p>
           <p className="text-slate-300 text-[10px] italic">Dữ liệu được cập nhật từ các nguồn uy tín nhất thị trường</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
