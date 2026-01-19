/**
 * Backtester
 * Strateji geri test motoru
 */

import { calculateAllIndicators } from './technicalAnalysis.js';
import { generateSignal } from './signalGenerator.js';
import { calculateStopLoss, calculateTakeProfit } from './riskManager.js';

// Basit backtest çalıştır
export async function runBacktest(historicalData, config = {}) {
  const {
    initialCapital = 100000,
    positionSizePercent = 10,
    stopLossMultiplier = 2,
    takeProfitRatio = 2,
    minDataPoints = 50
  } = config;
  
  const closes = historicalData.closes;
  const highs = historicalData.highs;
  const lows = historicalData.lows;
  const volumes = historicalData.volumes;
  const dates = historicalData.dates;
  
  if (closes.length < minDataPoints) {
    return { error: 'Yetersiz veri', minRequired: minDataPoints, actual: closes.length };
  }
  
  // Sonuçlar
  const trades = [];
  let capital = initialCapital;
  let position = null;
  let wins = 0;
  let losses = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let maxDrawdown = 0;
  let peak = initialCapital;
  const equityCurve = [{ date: dates[minDataPoints], equity: initialCapital }];
  
  // Test döngüsü
  for (let i = minDataPoints; i < closes.length; i++) {
    // O güne kadar olan veriyi kullan
    const slicedData = {
      closes: closes.slice(0, i + 1),
      highs: highs.slice(0, i + 1),
      lows: lows.slice(0, i + 1),
      volumes: volumes.slice(0, i + 1)
    };
    
    const indicators = calculateAllIndicators(slicedData);
    const signal = generateSignal(indicators);
    const currentPrice = closes[i];
    const currentDate = dates[i];
    
    // Pozisyon yokken AL sinyali
    if (!position && signal.signal === 'AL' && signal.confidence >= 60) {
      const positionValue = capital * (positionSizePercent / 100);
      const shares = Math.floor(positionValue / currentPrice);
      
      if (shares > 0) {
        const atr = indicators.atr || currentPrice * 0.02; // Fallback: %2
        const stopLoss = currentPrice - (atr * stopLossMultiplier);
        const takeProfit = currentPrice + ((currentPrice - stopLoss) * takeProfitRatio);
        
        position = {
          entryDate: currentDate,
          entryPrice: currentPrice,
          shares: shares,
          stopLoss: stopLoss,
          takeProfit: takeProfit,
          cost: shares * currentPrice
        };
        
        capital -= position.cost;
      }
    }
    
    // Pozisyon varken çıkış kontrolü
    if (position) {
      let exitReason = null;
      let exitPrice = currentPrice;
      
      // Stop-loss kontrolü
      if (lows[i] <= position.stopLoss) {
        exitReason = 'stop_loss';
        exitPrice = position.stopLoss;
      }
      // Take-profit kontrolü
      else if (highs[i] >= position.takeProfit) {
        exitReason = 'take_profit';
        exitPrice = position.takeProfit;
      }
      // SAT sinyali
      else if (signal.signal === 'SAT' && signal.confidence >= 60) {
        exitReason = 'signal_sell';
        exitPrice = currentPrice;
      }
      
      if (exitReason) {
        const revenue = position.shares * exitPrice;
        const profit = revenue - position.cost;
        const profitPercent = (profit / position.cost) * 100;
        
        trades.push({
          entryDate: position.entryDate,
          exitDate: currentDate,
          entryPrice: position.entryPrice,
          exitPrice: exitPrice,
          shares: position.shares,
          profit: profit,
          profitPercent: profitPercent,
          exitReason: exitReason
        });
        
        capital += revenue;
        
        if (profit > 0) {
          wins++;
          totalProfit += profit;
        } else {
          losses++;
          totalLoss += Math.abs(profit);
        }
        
        position = null;
      }
    }
    
    // Equity curve ve drawdown
    const currentEquity = capital + (position ? position.shares * currentPrice : 0);
    equityCurve.push({ date: currentDate, equity: currentEquity });
    
    peak = Math.max(peak, currentEquity);
    const drawdown = ((peak - currentEquity) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  // Son pozisyonu kapat
  if (position) {
    const finalPrice = closes[closes.length - 1];
    const revenue = position.shares * finalPrice;
    capital += revenue;
    
    const profit = revenue - position.cost;
    trades.push({
      entryDate: position.entryDate,
      exitDate: dates[dates.length - 1],
      entryPrice: position.entryPrice,
      exitPrice: finalPrice,
      shares: position.shares,
      profit: profit,
      profitPercent: (profit / position.cost) * 100,
      exitReason: 'end_of_test'
    });
    
    if (profit > 0) wins++;
    else losses++;
  }
  
  // Performans metrikleri
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? wins / totalTrades : 0;
  const avgWin = wins > 0 ? totalProfit / wins : 0;
  const avgLoss = losses > 0 ? totalLoss / losses : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  // Sharpe Ratio (basitleştirilmiş)
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const dailyReturn = (equityCurve[i].equity - equityCurve[i-1].equity) / equityCurve[i-1].equity;
    returns.push(dailyReturn);
  }
  
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((s, v) => s + v, 0) / returns.length);
  const sharpeRatio = stdReturn > 0 ? (avgReturn * 252) / (stdReturn * Math.sqrt(252)) : 0;
  
  return {
    summary: {
      initialCapital: initialCapital,
      finalCapital: capital,
      totalReturn: ((capital - initialCapital) / initialCapital) * 100,
      totalTrades: totalTrades,
      wins: wins,
      losses: losses,
      winRate: winRate * 100,
      avgWinPercent: wins > 0 ? (totalProfit / wins) / (initialCapital * positionSizePercent / 100) * 100 : 0,
      avgLossPercent: losses > 0 ? (totalLoss / losses) / (initialCapital * positionSizePercent / 100) * 100 : 0,
      profitFactor: profitFactor,
      maxDrawdown: maxDrawdown,
      sharpeRatio: sharpeRatio
    },
    trades: trades.slice(-20), // Son 20 işlem
    equityCurve: equityCurve.filter((_, i) => i % 5 === 0) // Her 5 günde bir
  };
}

// Performans özeti metni
export function generateBacktestSummary(result) {
  if (result.error) return `Backtest hatası: ${result.error}`;
  
  const s = result.summary;
  
  let summary = `BACKTEST SONUÇLARI\n`;
  summary += `${'='.repeat(40)}\n\n`;
  summary += `Başlangıç: ${s.initialCapital.toLocaleString('tr-TR')} TL\n`;
  summary += `Bitiş: ${s.finalCapital.toLocaleString('tr-TR')} TL\n`;
  summary += `Toplam Getiri: %${s.totalReturn.toFixed(2)}\n\n`;
  
  summary += `İŞLEM İSTATİSTİKLERİ:\n`;
  summary += `Toplam İşlem: ${s.totalTrades}\n`;
  summary += `Kazanan: ${s.wins} (%${s.winRate.toFixed(1)})\n`;
  summary += `Kaybeden: ${s.losses}\n`;
  summary += `Ort. Kazanç: %${s.avgWinPercent.toFixed(2)}\n`;
  summary += `Ort. Kayıp: %${s.avgLossPercent.toFixed(2)}\n\n`;
  
  summary += `RİSK METRİKLERİ:\n`;
  summary += `Profit Factor: ${s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)}\n`;
  summary += `Max Drawdown: %${s.maxDrawdown.toFixed(2)}\n`;
  summary += `Sharpe Ratio: ${s.sharpeRatio.toFixed(2)}\n`;
  
  // Değerlendirme
  summary += `\nDEĞERLENDİRME:\n`;
  if (s.winRate > 50 && s.profitFactor > 1.5 && s.sharpeRatio > 1) {
    summary += `✅ Strateji başarılı görünüyor`;
  } else if (s.winRate > 40 && s.profitFactor > 1) {
    summary += `⚠️ Strateji marjinal, iyileştirme gerekebilir`;
  } else {
    summary += `❌ Strateji zayıf, kullanım önerilmez`;
  }
  
  return summary;
}
