/**
 * Bigpara BIST Hisse Scraper
 * Anlık fiyat verisi - Türkçe kaynak
 * https://bigpara.hurriyet.com.tr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// User-Agent rotasyonu
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// BIST sembolleri için Bigpara URL mapping
// Bigpara format: hisse kodu küçük harf, .IS yok
function getBigparaUrl(symbol) {
  const code = symbol.replace('.IS', '').toLowerCase();
  return `https://bigpara.hurriyet.com.tr/borsa/hisse-fiyatlari/${code}/`;
}

// Bigpara API endpoint (daha güvenilir)
function getBigparaApiUrl(symbol) {
  const code = symbol.replace('.IS', '').toUpperCase();
  return `https://bigpara.hurriyet.com.tr/api/v1/hisse/hisseyuzeyalimsatim/${code}`;
}

/**
 * Bigpara'dan anlık fiyat çek (HTML scraping)
 */
export async function fetchBigparaPrice(symbol) {
  const url = getBigparaUrl(symbol);
  
  try {
    console.log(`🔵 Bigpara'dan çekiliyor: ${symbol}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Bigpara'nın yeni layoutu
    let price = null;
    let change = null;
    let changePercent = null;
    let high = null;
    let low = null;
    let volume = null;
    
    // Ana fiyat
    const priceSelectors = [
      '.piyasaBox .value',
      '.hisseSayfasi .fiyat',
      '.hisseValue',
      '[data-value]',
      '.tBody li:first-child .value'
    ];
    
    // Fiyat için tablo yapısını dene
    $('.tBody li').each((i, el) => {
      const label = $(el).find('.name').text().trim().toLowerCase();
      const value = $(el).find('.value').text().trim();
      
      if (label.includes('son') || label.includes('fiyat') || i === 0) {
        const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          price = parsed;
        }
      }
      if (label.includes('yüksek') || label.includes('high')) {
        high = parseFloat(value.replace(/\./g, '').replace(',', '.'));
      }
      if (label.includes('düşük') || label.includes('low')) {
        low = parseFloat(value.replace(/\./g, '').replace(',', '.'));
      }
      if (label.includes('hacim') || label.includes('volume')) {
        volume = value;
      }
    });
    
    // Alternatif selector'lar
    if (!price) {
      for (const selector of priceSelectors) {
        const text = $(selector).first().text().trim();
        if (text) {
          const parsed = parseFloat(text.replace(/\./g, '').replace(',', '.'));
          if (!isNaN(parsed) && parsed > 0) {
            price = parsed;
            break;
          }
        }
      }
    }
    
    // Değişim oranı
    const changeSelectors = [
      '.rateText',
      '.changePercent',
      '.piyasaBox .change',
      '.deger'
    ];
    
    for (const selector of changeSelectors) {
      const text = $(selector).first().text().trim();
      if (text && (text.includes('%') || text.includes('+') || text.includes('-'))) {
        changePercent = parseFloat(text.replace(/[%+\s]/g, '').replace(',', '.'));
        if (text.includes('-')) changePercent = -Math.abs(changePercent);
        break;
      }
    }
    
    if (price && price > 0) {
      console.log(`✅ Bigpara: ${symbol} = ${price} TL (${changePercent || 0}%)`);
      return {
        price,
        change: change || 0,
        changePercent: changePercent || 0,
        high: high || price,
        low: low || price,
        volume: volume || 'N/A',
        source: 'bigpara',
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`⚠️ Bigpara fiyat bulunamadı: ${symbol}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Bigpara scraping hatası (${symbol}):`, error.message);
    return null;
  }
}

/**
 * Bigpara'dan hisse listesi (BIST100)
 */
export async function fetchBist100List() {
  try {
    console.log('📋 BIST100 listesi çekiliyor...');
    
    const response = await axios.get(
      'https://bigpara.hurriyet.com.tr/borsa/canli-borsa/',
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'tr-TR,tr;q=0.9'
        },
        timeout: 15000
      }
    );
    
    const $ = cheerio.load(response.data);
    const stocks = [];
    
    // Tablo satırlarından hisse bilgilerini çek
    $('table tbody tr, .hisseTable tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const code = $(cells[0]).text().trim();
        const priceText = $(cells[1]).text().trim();
        const changeText = $(cells[2]).text().trim();
        
        if (code && code.length <= 6 && !code.includes(' ')) {
          const price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));
          const changePercent = parseFloat(changeText.replace(/[%+\s]/g, '').replace(',', '.'));
          
          if (!isNaN(price)) {
            stocks.push({
              symbol: code + '.IS',
              price,
              changePercent: isNaN(changePercent) ? 0 : changePercent
            });
          }
        }
      }
    });
    
    console.log(`✅ ${stocks.length} hisse bulundu`);
    return stocks;
    
  } catch (error) {
    console.error('❌ BIST100 listesi hatası:', error.message);
    return [];
  }
}

/**
 * Mynet Finans alternatifi
 */
export async function fetchMynetPrice(symbol) {
  const code = symbol.replace('.IS', '').toLowerCase();
  const url = `https://finans.mynet.com/borsa/hisseler/${code}/`;
  
  try {
    console.log(`🟢 Mynet'ten çekiliyor: ${symbol}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    let price = null;
    let changePercent = null;
    
    // Mynet fiyat yapısı
    const priceText = $('.stock-price, .fiyat, .price').first().text().trim();
    if (priceText) {
      price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));
    }
    
    const changeText = $('.stock-change, .degisim, .change').first().text().trim();
    if (changeText) {
      changePercent = parseFloat(changeText.replace(/[%+\s]/g, '').replace(',', '.'));
      if (changeText.includes('-')) changePercent = -Math.abs(changePercent);
    }
    
    if (price && price > 0) {
      console.log(`✅ Mynet: ${symbol} = ${price} TL`);
      return {
        price,
        changePercent: changePercent || 0,
        source: 'mynet',
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error(`❌ Mynet hatası (${symbol}):`, error.message);
    return null;
  }
}

/**
 * Ana fonksiyon - Tüm kaynakları dene
 */
export async function fetchRealtimePrice(symbol) {
  // 1. Bigpara dene
  let data = await fetchBigparaPrice(symbol);
  if (data) return data;
  
  // 2. Mynet dene
  data = await fetchMynetPrice(symbol);
  if (data) return data;
  
  // 3. Yahoo fallback (gecikmeli)
  console.log(`🔄 Yahoo fallback: ${symbol}`);
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      { timeout: 10000 }
    );
    
    if (response.data.chart?.result?.[0]) {
      const result = response.data.chart.result[0];
      const closes = result.indicators.quote[0].close || [];
      const price = closes.filter(p => p !== null).pop() || result.meta.regularMarketPrice;
      
      if (price) {
        return {
          price,
          changePercent: ((price - result.meta.previousClose) / result.meta.previousClose * 100),
          source: 'yahoo',
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error(`❌ Yahoo da başarısız: ${symbol}`);
  }
  
  return null;
}

export default {
  fetchBigparaPrice,
  fetchMynetPrice,
  fetchRealtimePrice,
  fetchBist100List
};
