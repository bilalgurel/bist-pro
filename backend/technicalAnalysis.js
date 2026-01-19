/**
 * Technical Analysis Library
 * Gerçek RSI, MACD, Bollinger, SMA/EMA hesaplamaları
 */

// Simple Moving Average
export function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

// Exponential Moving Average
export function calculateEMA(prices, period) {
  if (prices.length < period) return null;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

// RSI (Relative Strength Index)
export function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  let gains = 0;
  let losses = 0;
  
  // İlk periyod için ortalama hesapla
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses -= changes[i];
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Sonraki değerler için smoothed ortalama
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (prices.length < slowPeriod + signalPeriod) return null;
  
  // EMA dizileri oluştur
  const emaFast = [];
  const emaSlow = [];
  
  // Fast EMA (12)
  let fastK = 2 / (fastPeriod + 1);
  let fastEma = prices.slice(0, fastPeriod).reduce((sum, p) => sum + p, 0) / fastPeriod;
  for (let i = fastPeriod; i < prices.length; i++) {
    fastEma = prices[i] * fastK + fastEma * (1 - fastK);
    emaFast.push(fastEma);
  }
  
  // Slow EMA (26)
  let slowK = 2 / (slowPeriod + 1);
  let slowEma = prices.slice(0, slowPeriod).reduce((sum, p) => sum + p, 0) / slowPeriod;
  const offset = slowPeriod - fastPeriod;
  for (let i = slowPeriod; i < prices.length; i++) {
    slowEma = prices[i] * slowK + slowEma * (1 - slowK);
    emaSlow.push(slowEma);
  }
  
  // MACD Line = Fast EMA - Slow EMA
  const macdLine = [];
  for (let i = 0; i < emaSlow.length; i++) {
    const fastIdx = i + offset;
    if (fastIdx < emaFast.length) {
      macdLine.push(emaFast[fastIdx] - emaSlow[i]);
    }
  }
  
  if (macdLine.length < signalPeriod) return null;
  
  // Signal Line (9-period EMA of MACD)
  let signalK = 2 / (signalPeriod + 1);
  let signalLine = macdLine.slice(0, signalPeriod).reduce((sum, m) => sum + m, 0) / signalPeriod;
  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalLine = macdLine[i] * signalK + signalLine * (1 - signalK);
  }
  
  const currentMACD = macdLine[macdLine.length - 1];
  const histogram = currentMACD - signalLine;
  
  // Crossover tespiti
  const prevMACD = macdLine.length > 1 ? macdLine[macdLine.length - 2] : currentMACD;
  const prevSignal = signalLine - histogram; // approximate
  
  let crossover = 'none';
  if (prevMACD < signalLine && currentMACD > signalLine) {
    crossover = 'bullish'; // Golden cross
  } else if (prevMACD > signalLine && currentMACD < signalLine) {
    crossover = 'bearish'; // Death cross
  }
  
  return {
    macdLine: currentMACD,
    signalLine: signalLine,
    histogram: histogram,
    crossover: crossover
  };
}

// Bollinger Bands
export function calculateBollinger(prices, period = 20, stdDev = 2) {
  if (prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const sma = slice.reduce((sum, p) => sum + p, 0) / period;
  
  // Standard Deviation
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
  const std = Math.sqrt(variance);
  
  const currentPrice = prices[prices.length - 1];
  
  return {
    upper: sma + stdDev * std,
    middle: sma,
    lower: sma - stdDev * std,
    percentB: (currentPrice - (sma - stdDev * std)) / (2 * stdDev * std), // 0-1 arası
    bandwidth: (2 * stdDev * std) / sma * 100
  };
}

// ATR (Average True Range) - Stop-loss için
export function calculateATR(highs, lows, closes, period = 14) {
  if (highs.length < period + 1) return null;
  
  const trueRanges = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  // İlk ATR
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  
  // Smoothed ATR
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }
  
  return atr;
}

// Trend Analizi
export function analyzeTrend(prices, shortPeriod = 20, longPeriod = 50) {
  const shortSMA = calculateSMA(prices, shortPeriod);
  const longSMA = calculateSMA(prices, longPeriod);
  const currentPrice = prices[prices.length - 1];
  
  if (!shortSMA || !longSMA) return { trend: 'unknown', strength: 0 };
  
  let trend = 'sideways';
  let strength = 0;
  
  if (currentPrice > shortSMA && shortSMA > longSMA) {
    trend = 'uptrend';
    strength = ((currentPrice - longSMA) / longSMA) * 100;
  } else if (currentPrice < shortSMA && shortSMA < longSMA) {
    trend = 'downtrend';
    strength = ((longSMA - currentPrice) / longSMA) * 100;
  }
  
  return { trend, strength: Math.min(strength, 100) };
}

// Hacim Analizi
export function analyzeVolume(volumes, period = 20) {
  if (volumes.length < period) return null;
  
  const avgVolume = volumes.slice(-period).reduce((sum, v) => sum + v, 0) / period;
  const currentVolume = volumes[volumes.length - 1];
  const ratio = currentVolume / avgVolume;
  
  return {
    current: currentVolume,
    average: avgVolume,
    ratio: ratio,
    trend: ratio > 1.2 ? 'increasing' : ratio < 0.8 ? 'decreasing' : 'normal'
  };
}

// Tüm göstergeleri hesapla
export function calculateAllIndicators(data) {
  const prices = data.closes;
  const volumes = data.volumes;
  const highs = data.highs;
  const lows = data.lows;
  
  return {
    rsi: calculateRSI(prices, 14),
    macd: calculateMACD(prices, 12, 26, 9),
    bollinger: calculateBollinger(prices, 20, 2),
    atr: calculateATR(highs, lows, prices, 14),
    trend: analyzeTrend(prices, 20, 50),
    volume: analyzeVolume(volumes, 20),
    sma20: calculateSMA(prices, 20),
    sma50: calculateSMA(prices, 50),
    ema12: calculateEMA(prices, 12),
    ema26: calculateEMA(prices, 26),
    currentPrice: prices[prices.length - 1]
  };
}
