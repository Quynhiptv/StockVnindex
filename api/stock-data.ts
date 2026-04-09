
import type { VercelRequest, VercelResponse } from '@vercel/node';

const STOCK_DATA_SHEET_URL = 'https://docs.google.com/spreadsheets/d/13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c/export?format=csv&gid=838120477';

const parseCSV = (csv: string) => {
  return csv.split('\n').map(row => {
    const matches = row.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g);
    return matches ? matches.map(val => val.replace(/^"|"$/g, '').trim()) : [];
  });
};

const cleanNumber = (val: string) => {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`${STOCK_DATA_SHEET_URL}&t=${timestamp}`, { cache: 'no-store' });
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Không thể tải dữ liệu từ Google Sheets' });
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);

    const data = rows.slice(1).map(row => {
      if (row.length < 9) return null;

      const volRaw = row[8] || '0';
      const commaCount = (volRaw.match(/,/g) || []).length;
      let volume = 0;
      
      if (commaCount === 1) {
        const volCleaned = volRaw.replace(/,/g, '.');
        volume = (parseFloat(volCleaned) || 0) * 1000;
      } else {
        const volCleaned = volRaw.replace(/,/g, '');
        volume = parseFloat(volCleaned) || 0;
      }

      return {
        symbol: row[0],
        trading_date: row[2],
        close_price: cleanNumber(row[4]) * 1000,
        phan_tram_thay_doi: cleanNumber(row[5]),
        gia_cao_nhat: cleanNumber(row[6]) * 1000,
        gia_thap_nhat: cleanNumber(row[7]) * 1000,
        tong_klgd_x10: volume
      };
    }).filter(item => item !== null && item.symbol);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
