
export enum MarketTab {
  OVERVIEW = 'Tổng Quan',
  FOREIGN_FLOW = 'Khối Ngoại',
  VOLUME_SURGE = 'Đột biến KL',
  BULL_BEAR = 'Bullish/Bearish',
  BIG_ORDER = 'Lọc Lệnh BIG',
  ACTIVE_BUY_SELL = 'M/B Chủ động',
  SECTORS = 'Nhóm Ngành',
  ATC_PRICE_ACTION = 'ATC Kéo/Đạp',
  ATC_FOREIGN = 'ATC Khối Ngoại',
  STOCK_LIST = 'Danh Sách CP',
  RECOMMENDATIONS = 'Danh Mục Khuyến Nghị',
  SYSTEM_SETTINGS = 'Cài đặt Hệ thống'
}

export interface MarketIndexData {
  name: string;
  price: string;
  changePercent: string;
  value: string; // Col D
  rsi: string;   // Col S
  ma20: string;  // Col Q
  volYesterday: string; // Col E
  volAvg20: string;    // Col G
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
}

export interface SectorPerformance {
  name: string;
  change: number;
}
