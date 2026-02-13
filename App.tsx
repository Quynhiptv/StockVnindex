
import React, { useState } from 'react';
import { MarketTab } from './types';
import Banner from './components/Banner';
import DashboardTabs from './components/DashboardTabs';
import MarketOverview from './components/MarketOverview';
import ForeignFlow from './components/ForeignFlow';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MarketTab>(MarketTab.OVERVIEW);

  const renderContent = () => {
    switch (activeTab) {
      case MarketTab.OVERVIEW:
        return <MarketOverview />;
      case MarketTab.FOREIGN_FLOW:
        return <ForeignFlow />;
      case MarketTab.VOLUME_SURGE:
      case MarketTab.BULL_BEAR:
      case MarketTab.BIG_ORDER:
      case MarketTab.ACTIVE_BUY_SELL:
      case MarketTab.SECTORS:
      case MarketTab.ATC_PRICE_ACTION:
      case MarketTab.ATC_FOREIGN:
      case MarketTab.STOCK_LIST:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-bold text-slate-400">Dữ liệu {activeTab} đang được tải...</h3>
            <p className="text-slate-500 mt-2">Tính năng này sẽ sớm ra mắt trong phiên bản cập nhật tới.</p>
          </div>
        );
      default:
        return <MarketOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-10 bg-[#0f172a]">
      {/* Top Banner */}
      <header>
        <Banner />
      </header>

      {/* Navigation Tabs */}
      <DashboardTabs 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 mt-8 flex-grow">
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                {activeTab}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sàn HOSE: Đang khớp lệnh
            </div>
        </div>
        
        {renderContent()}
      </main>

      {/* Floating Action for Mobile / Support */}
      <button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-emerald-500 rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-400 transition-all hover:scale-110 z-40 group">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
         </svg>
         <div className="absolute right-16 bg-slate-900 text-