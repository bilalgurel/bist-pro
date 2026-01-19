/**
 * Investing.com BIST Hisse Scraper
 * Anlık fiyat ve tarihsel veri çekme
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// BIST hisseleri için Investing.com URL'leri
const INVESTING_URLS = {
  'TUPRS.IS': { url: 'https://www.investing.com/equities/tupras-turkiye-petrol', historyUrl: 'tupras-turkiye-petrol' },
  'THYAO.IS': { url: 'https://www.investing.com/equities/turk-hava-yollari', historyUrl: 'turk-hava-yollari' },
  'GARAN.IS': { url: 'https://www.investing.com/equities/garanti-bank', historyUrl: 'garanti-bank' },
  'AKBNK.IS': { url: 'https://www.investing.com/equities/akbank', historyUrl: 'akbank' },
  'KCHOL.IS': { url: 'https://www.investing.com/equities/koc-holding', historyUrl: 'koc-holding' },
  'ASELS.IS': { url: 'https://www.investing.com/equities/aselsan', historyUrl: 'aselsan' },
  'TCELL.IS': { url: 'https://www.investing.com/equities/turkcell', historyUrl: 'turkcell' },
  'TOASO.IS': { url: 'https://www.investing.com/equities/tofas-oto.-fab.', historyUrl: 'tofas-oto.-fab.' },
  'SODA.IS': { url: 'https://www.investing.com/equities/soda-sanayii', historyUrl: 'soda-sanayii' },
  'VESTL.IS': { url: 'https://www.investing.com/equities/vestel', historyUrl: 'vestel' },
  'EREGL.IS': { url: 'https://www.investing.com/equities/eregli-demir-celik', historyUrl: 'eregli-demir-celik' },
  'SAHOL.IS': { url: 'https://www.investing.com/equities/sabanci-holding', historyUrl: 'sabanci-holding' },
  'YKBNK.IS': { url: 'https://www.investing.com/equities/yapi-ve-kredi-bank', historyUrl: 'yapi-ve-kredi-bank' },
  'KOZAL.IS': { url: 'https://www.investing.com/equities/koza-altin', historyUrl: 'koza-altin' },
  'PGSUS.IS': { url: 'https://www.investing.com/equities/pegasus', historyUrl: 'pegasus' },
  'BIMAS.IS': { url: 'https://www.investing.com/equities/bim-birlesik-magazalar', historyUrl: 'bim-birlesik-magazalar' },
  'EKGYO.IS': { url: 'https://www.investing.com/equities/emlak-konut-gyo', historyUrl: 'emlak-konut-gyo' },
  'SISE.IS': { url: 'https://www.investing.com/equities/turkiye-sise-cam', historyUrl: 'turkiye-sise-cam' },
  'PETKM.IS': { url: 'https://www.investing.com/equities/petkim', historyUrl: 'petkim' },
  'TTKOM.IS': { url: 'https://www.investing.com/equities/turk-telekom', historyUrl: 'turk-telekom' },
  'ENKAI.IS': { url: 'https://www.investing.com/equities/enka-insaat', historyUrl: 'enka-insaat' },
  'FROTO.IS': { url: 'https://www.investing.com/equities/ford-otosan', historyUrl: 'ford-otosan' },
  'TAVHL.IS': { url: 'https://www.investing.com/equities/tav-havalimanlari', historyUrl: 'tav-havalimanlari' },
  'ARCLK.IS': { url: 'https://www.investing.com/equities/arcelik', historyUrl: 'arcelik' }
};

// User-Agent rotasyonu (bot algılamayı engelle)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Axios instance with headers
const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  }
});

/**
 * Investing.com'dan anlık fiyat ve değişim çek
 */
export async function fetchInvestingPrice(symbol) {
  const config = INVESTING_URLS[symbol.toUpperCase()];
  
  if (!config) {
    console.log(`⚠️ ${symbol} için Investing.com URL'si tanımlı değil, Yahoo'ya fallback`);
    return null;
  }

  try {
    console.log(`🌐 Investing.com'dan çekiliyor: ${symbol}`);
    
    const response = await axiosInstance.get(config.url, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });
    
    const $ = cheerio.load(response.data);
    
    // Fiyat çekme - birden fazla selector dene
    let price = null;
    let change = null;
    let changePercent = null;
    
    // Güncel Investing.com layout
    const priceSelectors = [
      '[data-test="instrument-price-last"]',
      '.text-5xl',
      '.instrument-price_last__KQzyA',
      '#last_last',
      '.pid-944593-last' // Specific to some stocks
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        // Virgülü noktaya çevir (Türk formatı)
        price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(price)) break;
      }
    }
    
    // Değişim çekme
    const changeSelectors = [
      '[data-test="instrument-price-change"]',
      '.instrument-price_change__nVTRV',
      '.arial_20',
      '#last_change'
    ];
    
    for (const selector of changeSelectors) {
      const changeText = $(selector).first().text().trim();
      if (changeText) {
        change = parseFloat(changeText.replace(/\./g, '').replace(',', '.').replace(/[+%]/g, ''));
        if (!isNaN(change)) break;
      }
    }
    
    // Yüzde değişim
    const percentSelectors = [
      '[data-test="instrument-price-change-percent"]',
      '.instrument-price_change-percent__WLQ1q',
      '#last_change_pct'
    ];
    
    for (const selector of percentSelectors) {
      const percentText = $(selector).first().text().trim();
      if (percentText) {
        changePercent = parseFloat(percentText.replace(/[()%+]/g, '').replace(',', '.'));
        if (!isNaN(changePercent)) break;
      }
    }
    
    if (price) {
      console.log(`✅ Investing.com: ${symbol} = ${price} TL (${changePercent}%)`);
      return {
        price,
        change: change || 0,
        changePercent: changePercent || 0,
        source: 'investing.com',
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`⚠️ Fiyat parse edilemedi: ${symbol}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Investing.com scraping hatası (${symbol}):`, error.message);
    return null;
  }
}

/**
 * Investing.com'dan tarihsel veri çek (API endpoint)
 */
export async function fetchInvestingHistorical(symbol, days = 180) {
  const config = INVESTING_URLS[symbol.toUpperCase()];
  
  if (!config) {
    return null;
  }

  try {
    console.log(`📊 Investing.com tarihsel veri: ${symbol} (${days} gün)`);
    
    // Investing.com'un internal API'sini kullan
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (days * 24 * 60 * 60);
    
    // Ana sayfadan pair_id çek
    const mainPage = await axiosInstance.get(config.url, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });
    
    const $ = cheerio.load(mainPage.data);
    
    // pair_id bul
    let pairId = null;
    const scriptContent = $('script').text();
    const pairIdMatch = scriptContent.match(/pairId['":\s]+(\d+)/i);
    if (pairIdMatch) {
      pairId = pairIdMatch[1];
    }
    
    if (!pairId) {
      // Data attribute'dan dene
      pairId = $('[data-pair-id]').attr('data-pair-id');
    }
    
    if (!pairId) {
      console.log(`⚠️ pair_id bulunamadı: ${symbol}`);
      return null;
    }
    
    console.log(`📎 pair_id: ${pairId}`);
    
    // Historical data API
    const historyResponse = await axiosInstance.post(
      'https://www.investing.com/instruments/HistoricalDataAjax',
      new URLSearchParams({
        curr_id: pairId,
        smlID: String(Math.floor(Math.random() * 1000000)),
        header: `${symbol} Historical Data`,
        st_date: new Date(startDate * 1000).toLocaleDateString('en-US'),
        end_date: new Date(endDate * 1000).toLocaleDateString('en-US'),
        interval_sec: 'Daily',
        sort_col: 'date',
        sort_ord: 'DESC',
        action: 'historical_data'
      }),
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': config.url
        }
      }
    );
    
    const historyHtml = historyResponse.data;
    const $hist = cheerio.load(historyHtml);
    
    const historicalData = {
      dates: [],
      closes: [],
      highs: [],
      lows: [],
      volumes: []
    };
    
    $hist('tr').each((i, row) => {
      const cells = $hist(row).find('td');
      if (cells.length >= 5) {
        const dateText = $hist(cells[0]).text().trim();
        const closeText = $hist(cells[1]).text().trim();
        const highText = $hist(cells[3]).text().trim();
        const lowText = $hist(cells[4]).text().trim();
        const volText = $hist(cells[5]).text().trim();
        
        const close = parseFloat(closeText.replace(/\./g, '').replace(',', '.'));
        const high = parseFloat(highText.replace(/\./g, '').replace(',', '.'));
        const low = parseFloat(lowText.replace(/\./g, '').replace(',', '.'));
        
        if (!isNaN(close)) {
          historicalData.dates.unshift(dateText);
          historicalData.closes.unshift(close);
          historicalData.highs.unshift(high || close);
          historicalData.lows.unshift(low || close);
          
          // Volume parse
          let volume = 0;
          if (volText.includes('K')) {
            volume = parseFloat(volText.replace('K', '')) * 1000;
          } else if (volText.includes('M')) {
            volume = parseFloat(volText.replace('M', '')) * 1000000;
          } else {
            volume = parseFloat(volText.replace(/[,.]/g, '')) || 0;
          }
          historicalData.volumes.unshift(volume);
        }
      }
    });
    
    if (historicalData.closes.length > 0) {
      console.log(`✅ Investing.com: ${historicalData.closes.length} gün tarihsel veri alındı`);
      return historicalData;
    }
    
    return null;
    
  } catch (error) {
    console.error(`❌ Investing.com historical hatası (${symbol}):`, error.message);
    return null;
  }
}

/**
 * Ana veri çekme fonksiyonu - Investing.com öncelikli, Yahoo fallback
 */
export async function fetchStockData(symbol, fallbackToYahoo = true) {
  // Önce Investing.com dene
  const investingData = await fetchInvestingPrice(symbol);
  
  if (investingData) {
    return { ...investingData, source: 'investing.com' };
  }
  
  // Fallback: Yahoo Finance
  if (fallbackToYahoo) {
    console.log(`🔄 Yahoo Finance'e fallback: ${symbol}`);
    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
      );
      const data = response.data;
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const price = result.meta.regularMarketPrice;
        const prevClose = result.meta.previousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;
        
        return {
          price,
          change,
          changePercent,
          source: 'yahoo',
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.error(`❌ Yahoo da başarısız: ${symbol}`);
    }
  }
  
  return null;
}

export { INVESTING_URLS };
