
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
  STOCK_LIST = 'Danh Sách CP'
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
