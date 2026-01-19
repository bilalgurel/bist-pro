// Varsayılan Watchlist (BIST 30'dan seçilen hisseler)
export const DEFAULT_WATCHLIST = [
  { symbol: 'TUPRS.IS', name: 'Tüpraş', sector: 'Enerji', price: 225.75, changePercent: 2.15 },
  { symbol: 'THYAO.IS', name: 'Turkish Airlines', sector: 'Ulaştırma', price: 12.45, changePercent: -1.20 },
  { symbol: 'GARAN.IS', name: 'Garanti Bankası', sector: 'Finans', price: 33.20, changePercent: 1.85 },
  { symbol: 'AKBNK.IS', name: 'Akbank', sector: 'Finans', price: 29.90, changePercent: 0.95 },
  { symbol: 'KCHOL.IS', name: 'Koç Holding', sector: 'Endüstri', price: 128.50, changePercent: 3.40 },
  { symbol: 'ASELS.IS', name: 'Aselsan', sector: 'Savunma', price: 456.80, changePercent: 2.65 },
  { symbol: 'TCELL.IS', name: 'Turkcell', sector: 'Telekomünikasyon', price: 74.30, changePercent: -0.75 },
  { symbol: 'TOASO.IS', name: 'Tofaş', sector: 'Otomotiv', price: 18.60, changePercent: 1.50 },
  { symbol: 'SODA.IS', name: 'Soda Sanayii', sector: 'Kimya', price: 55.25, changePercent: 4.20 },
  { symbol: 'VESTL.IS', name: 'Vestel', sector: 'Elektronik', price: 8.75, changePercent: -2.10 }
];

// Mock data for chart initialization before backend data loads or if offline
export const MOCK_CHART_DATA = Array.from({ length: 30 }, (_, i) => {
  const basePrice = 218;
  const randomFluctuation = Math.random() * 6 - 3;
  return {
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
    price: +(basePrice + randomFluctuation + i * 0.2).toFixed(2),
  };
});