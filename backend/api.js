#!/usr/bin/env node
/**
 * BIST PRO Backend - Professional Trading System
 * Gerçek teknik analiz, risk yönetimi, backtesting
 * Veri Kaynağı: Bigpara/Mynet (anlık) + Yahoo Finance (fallback)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { calculateAllIndicators } from './technicalAnalysis.js';
import { generateSignal, generateDetailedAnalysis } from './signalGenerator.js';
import { calculateStopLoss, calculateTakeProfit, calculatePositionSize, checkDiversification } from './riskManager.js';
import { runBacktest, generateBacktestSummary } from './backtester.js';
import { fetchInvestingPrice, fetchInvestingHistorical, fetchStockData } from './investingScraper.js';
import { fetchBigparaPrice, fetchRealtimePrice, fetchBist100List } from './bigparaScraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Cache KALDIRILDI - Her sorguda taze veri

// Hisse bilgileri veritabanı
const stockDatabase = {
  'TUPRS.IS': { name: 'Tüpraş', sector: 'Enerji' },
  'THYAO.IS': { name: 'THY', sector: 'Havacılık' },
  'GARAN.IS': { name: 'Garanti BBVA', sector: 'Banka' },
  'AKBNK.IS': { name: 'Akbank', sector: 'Banka' },
  'KCHOL.IS': { name: 'Koç Holding', sector: 'Holding' },
  'ASELS.IS': { name: 'Aselsan', sector: 'Savunma' },
  'TCELL.IS': { name: 'Türkcell', sector: 'Telekomünikasyon' },
  'TOASO.IS': { name: 'Tofaş', sector: 'Otomotiv' },
  'SODA.IS': { name: 'Soda Sanayii', sector: 'Kimya' },
  'VESTL.IS': { name: 'Vestel', sector: 'Elektronik' },
  'EREGL.IS': { name: 'Ereğli Demir Çelik', sector: 'Metal' },
  'SAHOL.IS': { name: 'Sabancı Holding', sector: 'Holding' },
  'YKBNK.IS': { name: 'Yapı Kredi', sector: 'Banka' },
  'KOZAL.IS': { name: 'Koza Altın', sector: 'Madencilik' },
  'PGSUS.IS': { name: 'Pegasus', sector: 'Havacılık' },
  'BIMAS.IS': { name: 'BİM', sector: 'Perakende' },
  'EKGYO.IS': { name: 'Emlak Konut GYO', sector: 'Gayrimenkul' },
  'SISE.IS': { name: 'Şişecam', sector: 'Cam' },
  'PETKM.IS': { name: 'Petkim', sector: 'Kimya' },
  'TTKOM.IS': { name: 'Türk Telekom', sector: 'Telekomünikasyon' },
  'ENKAI.IS': { name: 'Enka İnşaat', sector: 'İnşaat' },
  'FROTO.IS': { name: 'Ford Otosan', sector: 'Otomotiv' },
  'TAVHL.IS': { name: 'TAV Havalimanları', sector: 'Havacılık' },
  'ARCLK.IS': { name: 'Arçelik', sector: 'Elektronik' }
};

// Investing.com öncelikli tarihsel veri + Yahoo fallback
async function fetchHistoricalData(symbol, range = '6mo') {
  const days = range === '1y' ? 365 : range === '6mo' ? 180 : range === '3mo' ? 90 : 30;
  
  // Önce Investing.com dene
  console.log(`📊 Investing.com'dan tarihsel veri çekiliyor: ${symbol}`);
  const investingData = await fetchInvestingHistorical(symbol, days);
  
  if (investingData && investingData.closes.length >= 30) {
    console.log(`✅ Investing.com: ${investingData.closes.length} gün veri alındı`);
    return investingData;
  }
  
  // Fallback: Yahoo Finance
  console.log(`🔄 Yahoo Finance'e fallback: ${symbol}`);
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`
    );
    const data = response.data;
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp || [];
      const quote = result.indicators.quote[0];
      
      const historicalData = {
        dates: timestamps.map(ts => new Date(ts * 1000).toISOString().split('T')[0]),
        closes: quote.close ? quote.close.filter(p => p !== null) : [],
        highs: quote.high ? quote.high.filter(p => p !== null) : [],
        lows: quote.low ? quote.low.filter(p => p !== null) : [],
        volumes: quote.volume ? quote.volume.filter(v => v !== null) : [],
        meta: result.meta,
        source: 'yahoo'
      };
      
      console.log(`✅ Yahoo: ${historicalData.closes.length} gün veri alındı`);
      return historicalData;
    }
    return null;
  } catch (error) {
    console.error(`❌ Yahoo API error for ${symbol}:`, error.message);
    return null;
  }
}

// Profesyonel analiz endpoint'i
app.get('/api/analysis/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  console.log(`\n🔍 PRO Analiz istendi: ${symbol}`);

  try {
    // Cache KALDIRILDI - Her sorguda taze veri çekiliyor

    // Yahoo Finance'den tarihsel veri çek (6 ay)
    const historicalData = await fetchHistoricalData(symbol, '6mo');
    
    if (!historicalData || historicalData.closes.length < 50) {
      console.log(`⚠️ Yetersiz veri: ${symbol}`);
      return res.status(400).json({
        error: 'Yetersiz tarihsel veri',
        message: `${symbol} için en az 50 günlük veri gerekli`,
        symbol
      });
    }

    // Gerçek teknik analiz
    const indicators = calculateAllIndicators(historicalData);
    const signalResult = generateSignal(indicators);
    const detailedAnalysis = generateDetailedAnalysis(indicators, signalResult);
    
    // Risk hesaplamaları
    const currentPrice = indicators.currentPrice;
    const atr = indicators.atr || currentPrice * 0.02;
    const stopLossCalc = calculateStopLoss(currentPrice, atr, 2);
    const takeProfitCalc = calculateTakeProfit(currentPrice, stopLossCalc.stopLoss, 2);
    
    // Hisse bilgisi
    const stock = stockDatabase[symbol] || { name: symbol.replace('.IS', ''), sector: 'BIST' };
    
    // Analiz sonucu
    const analysisData = {
      signal: signalResult.signal,
      confidence: signalResult.confidence,
      summary: signalResult.summary,
      detailedAnalysis: detailedAnalysis,
      
      // Teknik göstergeler
      indicators: {
        rsi: indicators.rsi ? parseFloat(indicators.rsi.toFixed(2)) : null,
        macd: indicators.macd ? {
          line: parseFloat(indicators.macd.macdLine.toFixed(4)),
          signal: parseFloat(indicators.macd.signalLine.toFixed(4)),
          histogram: parseFloat(indicators.macd.histogram.toFixed(4)),
          crossover: indicators.macd.crossover
        } : null,
        bollinger: indicators.bollinger ? {
          upper: parseFloat(indicators.bollinger.upper.toFixed(2)),
          middle: parseFloat(indicators.bollinger.middle.toFixed(2)),
          lower: parseFloat(indicators.bollinger.lower.toFixed(2)),
          percentB: parseFloat((indicators.bollinger.percentB * 100).toFixed(1))
        } : null,
        sma20: indicators.sma20 ? parseFloat(indicators.sma20.toFixed(2)) : null,
        sma50: indicators.sma50 ? parseFloat(indicators.sma50.toFixed(2)) : null,
        atr: atr ? parseFloat(atr.toFixed(2)) : null,
        trend: indicators.trend
      },
      
      // Sinyal detayları
      signalDetails: signalResult.signals,
      scoreBreakdown: signalResult.scores,
      
      // Risk yönetimi
      riskManagement: {
        stopLoss: parseFloat(stopLossCalc.stopLoss.toFixed(2)),
        takeProfit: parseFloat(takeProfitCalc.takeProfit.toFixed(2)),
        riskPercent: parseFloat(stopLossCalc.riskPercent.toFixed(2)),
        rewardPercent: parseFloat(takeProfitCalc.rewardPercent.toFixed(2)),
        riskRewardRatio: takeProfitCalc.riskRewardRatio
      },
      
      // Teknik seviyeler (Bollinger bazlı)
      technicalLevels: {
        supports: [
          indicators.bollinger ? indicators.bollinger.lower.toFixed(2) : (currentPrice * 0.97).toFixed(2),
          indicators.sma50 ? indicators.sma50.toFixed(2) : (currentPrice * 0.94).toFixed(2)
        ],
        resistances: [
          indicators.bollinger ? indicators.bollinger.upper.toFixed(2) : (currentPrice * 1.03).toFixed(2),
          indicators.sma20 ? (indicators.sma20 * 1.02).toFixed(2) : (currentPrice * 1.06).toFixed(2)
        ],
        stopLoss: stopLossCalc.stopLoss.toFixed(2),
        target: takeProfitCalc.takeProfit.toFixed(2)
      },
      
      // Market verileri
      marketData: {
        price: currentPrice,
        changePercent: historicalData.meta?.regularMarketChangePercent || 
          ((currentPrice - historicalData.closes[historicalData.closes.length - 2]) / 
           historicalData.closes[historicalData.closes.length - 2] * 100).toFixed(2),
        volume: historicalData.volumes[historicalData.volumes.length - 1]?.toLocaleString() || 'N/A',
        lastUpdated: new Date().toLocaleTimeString('tr-TR')
      },
      
      // Haber placeholder
      news: [{
        title: `${stock.name} Teknik Analiz Raporu`,
        source: 'BIST PRO Sistem',
        date: new Date().toLocaleDateString('tr-TR'),
        sentiment: signalResult.signal === 'AL' ? 'positive' : signalResult.signal === 'SAT' ? 'negative' : 'neutral'
      }],
      
      dividendInfo: `${stock.name} - Profesyonel teknik analiz ile hesaplanmıştır.`,
      dataPoints: historicalData.closes.length
    };
    
    // Veri kaynak bilgisi ekle
    analysisData.dataSource = historicalData.source || 'investing.com';
    
    console.log(`✅ PRO Analiz hazır: ${symbol} - Sinyal: ${signalResult.signal} (%${signalResult.confidence})`);

    res.json({
      ...analysisData,
      symbol,
      fromCache: false
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      error: error.message,
      symbol
    });
  }
});

// Backtest endpoint'i
app.get('/api/backtest/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  console.log(`\n📈 Backtest istendi: ${symbol}`);
  
  try {
    // 1 yıllık veri çek
    const historicalData = await fetchHistoricalData(symbol, '1y');
    
    if (!historicalData || historicalData.closes.length < 100) {
      return res.status(400).json({
        error: 'Yetersiz veri',
        message: 'Backtest için en az 100 günlük veri gerekli'
      });
    }
    
    const result = await runBacktest(historicalData, {
      initialCapital: 100000,
      positionSizePercent: 10,
      stopLossMultiplier: 2,
      takeProfitRatio: 2
    });
    
    console.log(`✅ Backtest tamamlandı: ${symbol}`);
    
    res.json({
      symbol,
      backtestResult: result.summary,
      recentTrades: result.trades,
      textSummary: generateBacktestSummary(result)
    });
    
  } catch (error) {
    console.error('Backtest error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Risk kontrolü endpoint'i
app.post('/api/risk-check', (req, res) => {
  const { positions, newPosition, portfolioValue } = req.body;
  
  const sectorData = {};
  for (const [symbol, info] of Object.entries(stockDatabase)) {
    sectorData[symbol] = info.sector;
  }
  
  const result = checkDiversification(positions || {}, newPosition, sectorData);
  
  res.json(result);
});

// Tarihsel grafik verisi
app.get('/api/chart/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const range = req.query.range || '1mo';
  const interval = range === '1d' ? '5m' : range === '5d' ? '15m' : '1d';
  
  console.log(`📈 Grafik verisi: ${symbol} - ${range}`);
  
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    );
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp || [];
      const prices = result.indicators.quote[0].close || [];
      
      const chartData = timestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        let dateStr;
        if (range === '1d') {
          dateStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (range === '5d') {
          dateStr = date.toLocaleDateString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        } else {
          dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
        }
        return {
          date: dateStr,
          price: prices[i] ? parseFloat(prices[i].toFixed(2)) : null
        };
      }).filter(d => d.price !== null);
      
      res.json({ symbol, range, data: chartData });
    } else {
      res.json({ symbol, range, data: [], error: 'Veri bulunamadı' });
    }
  } catch (error) {
    console.error('Grafik hatası:', error.message);
    res.status(500).json({ symbol, range, data: [], error: error.message });
  }
});

// Tüm hisseler
app.get('/api/stocks', (req, res) => {
  const stocks = Object.entries(stockDatabase).map(([symbol, info]) => ({
    symbol,
    name: info.name,
    sector: info.sector
  }));
  res.json(stocks);
});

// 🆕 Anlık fiyat endpoint'i (Bigpara scraping)
app.get('/api/realtime/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  console.log(`⚡ Anlık fiyat istendi: ${symbol}`);
  
  try {
    const priceData = await fetchRealtimePrice(symbol);
    
    if (priceData) {
      res.json({
        symbol,
        ...priceData,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: 'Fiyat bulunamadı',
        symbol
      });
    }
  } catch (error) {
    console.error(`❌ Anlık fiyat hatası (${symbol}):`, error.message);
    res.status(500).json({ error: error.message, symbol });
  }
});

// 🆕 BIST100 listesi
app.get('/api/bist100', async (req, res) => {
  try {
    const stocks = await fetchBist100List();
    res.json({ count: stocks.length, stocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    version: 'PRO 2.2 - Bigpara Integration',
    features: ['Bigpara Scraping', 'Mynet Fallback', 'Yahoo Fallback', 'Real RSI', 'Real MACD', 'Bollinger Bands', 'ATR Stop-Loss', 'Backtesting'],
    cache: 'disabled',
    dataSource: 'Bigpara/Mynet (realtime) + Yahoo Finance (historical)',
    endpoints: {
      realtime: '/api/realtime/:symbol',
      analysis: '/api/analysis/:symbol',
      bist100: '/api/bist100'
    }
  });
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 BIST PRO Backend v2.0 - http://localhost:${PORT}`);
  console.log(`\n📊 Profesyonel Özellikler:`);
  console.log(`   ✅ Gerçek RSI/MACD/Bollinger hesaplamaları`);
  console.log(`   ✅ Çoklu indikatör sinyal sistemi`);
  console.log(`   ✅ ATR bazlı stop-loss`);
  console.log(`   ✅ Backtesting motoru`);
  console.log(`   ✅ Risk yönetimi`);
  console.log(`\n📈 Endpoints:`);
  console.log(`   GET /api/analysis/:symbol - Profesyonel analiz`);
  console.log(`   GET /api/backtest/:symbol - Strateji testi`);
  console.log(`   POST /api/risk-check - Risk kontrolü`);
  console.log(`   GET /api/chart/:symbol - Grafik verisi`);
  console.log(`\n✅ Hazır!\n`);
});
