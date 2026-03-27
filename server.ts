import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STOCK_LIST_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1358455783';
const PRICE_DATA_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=1628670680';
const TELEGRAM_BOT_TOKEN = '8213831667:AAGsz3XcF-18Iv5hFWSbHwWsdN80860dC6w';
const TELEGRAM_CHAT_ID = '-1003876897678';

const HISTORY_FILE = path.join(__dirname, 'alert-history.json');

interface StockListItem {
  symbol: string;
  zone1: number;
  zone2: number;
  exploratoryPrice: number;
  targetPrice: number;
  currentPrice: number;
  changePercent: number;
}

interface AlertHistory {
  [key: string]: {
    lastSent: number;
    count: number;
    date: string;
  };
}

let alertHistory: AlertHistory = {};
if (fs.existsSync(HISTORY_FILE)) {
  try {
    alertHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (e) {
    console.error('Lỗi đọc file lịch sử:', e);
  }
}

const saveHistory = () => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(alertHistory, null, 2));
};

const parseCSV = (csv: string) => {
  return csv.split('\n').map(row => {
    const matches = row.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g);
    return matches ? matches.map(val => val.replace(/^"|"$/g, '').trim()) : [];
  });
};

const cleanNumber = (val: string) => {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

const sendTelegramMessage = async (message: string) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  } catch (error) {
    console.error('Lỗi gửi Telegram:', error);
  }
};

const sendAlert = async (stock: StockListItem, type: 'watch' | 'buy') => {
  let message = '';
  const trendIcon = stock.changePercent > 0 ? '📈' : stock.changePercent < 0 ? '📉' : '➖';
  
  if (type === 'watch') {
    message = `🔔 *CẢNH BÁO THEO DÕI* 📊\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `💎 Mã cổ phiếu: *${stock.symbol}*\n` +
              `💵 Giá hiện tại: *${stock.currentPrice.toFixed(2)}*\n` +
              `${trendIcon} Biến động: *${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%*\n` +
              `📝 Trạng thái: _Đang trong diện theo dõi để mua_\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `🚀 *Team Đoàn Quỳnh - ITC & SMC Strategy*`;
  } else {
    let targetInfo = stock.targetPrice > 0 ? `${stock.targetPrice.toFixed(2)}` : 'Chưa có';
    if (stock.targetPrice > 0 && stock.exploratoryPrice > 0) {
      const profit = ((stock.targetPrice - stock.exploratoryPrice) / stock.exploratoryPrice) * 100;
      targetInfo += ` (🎯 +${profit.toFixed(1)}%)`;
    }
    
    message = `🔥 *CẢNH BÁO MUA THĂM DÒ 30%* 💰\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `💎 Mã cổ phiếu: *${stock.symbol}*\n` +
              `💵 Giá hiện tại: *${stock.currentPrice.toFixed(2)}*\n` +
              `${trendIcon} Biến động: *${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%*\n` +
              `🛒 *ĐIỂM MUA:* *${stock.exploratoryPrice.toFixed(2)}*\n` +
              `🎯 Target kỳ vọng: *${targetInfo}*\n` +
              `📝 Khuyến nghị: _Đi vốn 30% lượt 1_\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `🚀 *Team Đoàn Quỳnh - ITC & SMC Strategy*`;
  }
  await sendTelegramMessage(message);
};

const checkAlerts = async () => {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const hour = vnTime.getHours();
  const today = vnTime.toLocaleDateString('vi-VN');
  
  // Chỉ gửi trong khung giờ từ 9h00 - 15h00 hàng ngày theo giờ VN
  if (hour < 9 || hour >= 15) return;

  try {
    const [stockListRes, priceDataRes] = await Promise.all([
      fetch(STOCK_LIST_URL),
      fetch(PRICE_DATA_URL)
    ]);

    const stockListCsv = await stockListRes.text();
    const priceDataCsv = await priceDataRes.text();

    const stockRows = parseCSV(stockListCsv);
    const priceRows = parseCSV(priceDataCsv);

    const priceMap = new Map();
    priceRows.slice(1).forEach(row => {
      if (row[0]) priceMap.set(row[0], { price: cleanNumber(row[1]), change: cleanNumber(row[2]) });
    });

    const stocks: StockListItem[] = stockRows.slice(1).map(row => {
      const symbol = row[0];
      const pData = priceMap.get(symbol) || { price: 0, change: 0 };
      return {
        symbol,
        zone1: cleanNumber(row[1]),
        zone2: cleanNumber(row[2]),
        exploratoryPrice: cleanNumber(row[3]),
        targetPrice: cleanNumber(row[4]),
        currentPrice: pData.price,
        changePercent: pData.change
      };
    }).filter(s => s.symbol);

    for (const stock of stocks) {
      const minZone = Math.min(stock.zone1, stock.zone2);
      const maxZone = Math.max(stock.zone1, stock.zone2);
      
      const isWatch = stock.currentPrice > 0 && stock.currentPrice >= minZone && stock.currentPrice <= maxZone;
      const isBuy = stock.currentPrice > 0 && stock.exploratoryPrice > 0 && stock.currentPrice <= (stock.exploratoryPrice + 0.05);

      if (isBuy) {
        await handleAlert(stock, 'buy', today);
      } else if (isWatch) {
        await handleAlert(stock, 'watch', today);
      }
    }
  } catch (error) {
    console.error('Lỗi kiểm tra cảnh báo:', error);
  }
};

const handleAlert = async (stock: StockListItem, type: 'watch' | 'buy', today: string) => {
  const key = `${stock.symbol}_${type}`;
  const history = alertHistory[key];
  const now = Date.now();

  if (!history || history.date !== today) {
    await sendAlert(stock, type);
    alertHistory[key] = { lastSent: now, count: 1, date: today };
    saveHistory();
    return;
  }

  if (history.count >= 4) return;

  const diffMinutes = (now - history.lastSent) / (1000 * 60);
  let shouldSend = false;
  
  if (history.count === 1 && diffMinutes >= 10) shouldSend = true;
  else if (history.count === 2 && diffMinutes >= 20) shouldSend = true;
  else if (history.count === 3 && diffMinutes >= 20) shouldSend = true;

  if (shouldSend) {
    await sendAlert(stock, type);
    alertHistory[key] = { ...history, lastSent: now, count: history.count + 1 };
    saveHistory();
  }
};

// Chạy kiểm tra mỗi 1 phút
// setInterval(checkAlerts, 60000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Chạy kiểm tra lần đầu khi khởi động
    // checkAlerts();
  });
}

startServer();
