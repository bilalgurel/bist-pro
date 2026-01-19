/**
 * Signal Generator
 * Çoklu indikatör bazlı sinyal üretimi
 */

import { calculateAllIndicators } from './technicalAnalysis.js';

// Sinyal skoru hesaplama (0-100 arası)
export function generateSignal(indicators) {
  const scores = [];
  const signals = [];
  
  // 1. RSI Skoru (0-100)
  if (indicators.rsi !== null) {
    let rsiScore = 50;
    if (indicators.rsi < 30) {
      rsiScore = 80 + (30 - indicators.rsi); // Oversold = AL
      signals.push({ indicator: 'RSI', value: indicators.rsi.toFixed(1), signal: 'AL', reason: 'Aşırı satım bölgesi' });
    } else if (indicators.rsi > 70) {
      rsiScore = 20 - (indicators.rsi - 70); // Overbought = SAT
      signals.push({ indicator: 'RSI', value: indicators.rsi.toFixed(1), signal: 'SAT', reason: 'Aşırı alım bölgesi' });
    } else if (indicators.rsi < 40) {
      rsiScore = 65;
      signals.push({ indicator: 'RSI', value: indicators.rsi.toFixed(1), signal: 'NÖTR', reason: 'Alım bölgesine yakın' });
    } else if (indicators.rsi > 60) {
      rsiScore = 35;
      signals.push({ indicator: 'RSI', value: indicators.rsi.toFixed(1), signal: 'NÖTR', reason: 'Satım bölgesine yakın' });
    } else {
      signals.push({ indicator: 'RSI', value: indicators.rsi.toFixed(1), signal: 'NÖTR', reason: 'Nötr bölge' });
    }
    scores.push({ name: 'RSI', score: rsiScore, weight: 0.25 });
  }
  
  // 2. MACD Skoru
  if (indicators.macd) {
    let macdScore = 50;
    if (indicators.macd.crossover === 'bullish') {
      macdScore = 85;
      signals.push({ indicator: 'MACD', value: indicators.macd.histogram.toFixed(4), signal: 'AL', reason: 'Pozitif kesişim (Golden Cross)' });
    } else if (indicators.macd.crossover === 'bearish') {
      macdScore = 15;
      signals.push({ indicator: 'MACD', value: indicators.macd.histogram.toFixed(4), signal: 'SAT', reason: 'Negatif kesişim (Death Cross)' });
    } else if (indicators.macd.histogram > 0) {
      macdScore = 60 + Math.min(indicators.macd.histogram * 100, 20);
      signals.push({ indicator: 'MACD', value: indicators.macd.histogram.toFixed(4), signal: 'NÖTR', reason: 'Pozitif momentum' });
    } else {
      macdScore = 40 - Math.min(Math.abs(indicators.macd.histogram) * 100, 20);
      signals.push({ indicator: 'MACD', value: indicators.macd.histogram.toFixed(4), signal: 'NÖTR', reason: 'Negatif momentum' });
    }
    scores.push({ name: 'MACD', score: macdScore, weight: 0.25 });
  }
  
  // 3. Bollinger Bands Skoru
  if (indicators.bollinger) {
    let bbScore = 50;
    const percentB = indicators.bollinger.percentB;
    if (percentB < 0) {
      bbScore = 80; // Alt bandın altında = AL
      signals.push({ indicator: 'Bollinger', value: `%B: ${(percentB * 100).toFixed(1)}%`, signal: 'AL', reason: 'Alt bandın altında (oversold)' });
    } else if (percentB > 1) {
      bbScore = 20; // Üst bandın üstünde = SAT
      signals.push({ indicator: 'Bollinger', value: `%B: ${(percentB * 100).toFixed(1)}%`, signal: 'SAT', reason: 'Üst bandın üstünde (overbought)' });
    } else if (percentB < 0.2) {
      bbScore = 70;
      signals.push({ indicator: 'Bollinger', value: `%B: ${(percentB * 100).toFixed(1)}%`, signal: 'NÖTR', reason: 'Alt banda yakın' });
    } else if (percentB > 0.8) {
      bbScore = 30;
      signals.push({ indicator: 'Bollinger', value: `%B: ${(percentB * 100).toFixed(1)}%`, signal: 'NÖTR', reason: 'Üst banda yakın' });
    } else {
      signals.push({ indicator: 'Bollinger', value: `%B: ${(percentB * 100).toFixed(1)}%`, signal: 'NÖTR', reason: 'Orta bantda' });
    }
    scores.push({ name: 'Bollinger', score: bbScore, weight: 0.15 });
  }
  
  // 4. Trend Skoru
  if (indicators.trend) {
    let trendScore = 50;
    if (indicators.trend.trend === 'uptrend') {
      trendScore = 60 + Math.min(indicators.trend.strength * 2, 30);
      signals.push({ indicator: 'Trend', value: `Yükseliş (${indicators.trend.strength.toFixed(1)}%)`, signal: 'AL', reason: 'Yükseliş trendi' });
    } else if (indicators.trend.trend === 'downtrend') {
      trendScore = 40 - Math.min(indicators.trend.strength * 2, 30);
      signals.push({ indicator: 'Trend', value: `Düşüş (${indicators.trend.strength.toFixed(1)}%)`, signal: 'SAT', reason: 'Düşüş trendi' });
    } else {
      signals.push({ indicator: 'Trend', value: 'Yatay', signal: 'NÖTR', reason: 'Yatay trend' });
    }
    scores.push({ name: 'Trend', score: trendScore, weight: 0.20 });
  }
  
  // 5. Hacim Skoru
  if (indicators.volume) {
    let volumeScore = 50;
    if (indicators.volume.trend === 'increasing') {
      // Artan hacim + trend yönüne göre değerlendir
      const trendUp = indicators.trend?.trend === 'uptrend';
      volumeScore = trendUp ? 70 : 30;
      signals.push({ 
        indicator: 'Hacim', 
        value: `x${indicators.volume.ratio.toFixed(2)}`, 
        signal: trendUp ? 'AL' : 'SAT', 
        reason: trendUp ? 'Artan hacim + yükseliş' : 'Artan hacim + düşüş' 
      });
    } else if (indicators.volume.trend === 'decreasing') {
      volumeScore = 45;
      signals.push({ indicator: 'Hacim', value: `x${indicators.volume.ratio.toFixed(2)}`, signal: 'NÖTR', reason: 'Azalan hacim' });
    } else {
      signals.push({ indicator: 'Hacim', value: `x${indicators.volume.ratio.toFixed(2)}`, signal: 'NÖTR', reason: 'Normal hacim' });
    }
    scores.push({ name: 'Hacim', score: volumeScore, weight: 0.15 });
  }
  
  // Ağırlıklı ortalama hesapla
  let totalWeight = 0;
  let weightedSum = 0;
  for (const s of scores) {
    weightedSum += s.score * s.weight;
    totalWeight += s.weight;
  }
  
  const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
  
  // Sinyal belirleme - Min Risk Max Kazanç Politikası
  let signal = 'TUT';
  let confidence = Math.round(finalScore);
  
  if (finalScore >= 75) {
    signal = 'GÜÇLÜ AL'; // Çok güçlü alım fırsatı
  } else if (finalScore >= 60) {
    signal = 'AL'; // Normal alım sinyali
  } else if (finalScore <= 39) {
    signal = 'SAT'; // Erken çıkış - riski azalt
  } else if (finalScore <= 44) {
    signal = 'DİKKAT'; // Satış baskısı var
  } else if (finalScore >= 55) {
    signal = 'BEKLE'; // Alıma yakın ama emin değil
  }
  // 45-54 arası TUT
  
  return {
    signal,
    confidence,
    scores,
    signals,
    summary: generateSummary(signal, confidence, indicators, signals)
  };
}

// Özet metin oluştur
function generateSummary(signal, confidence, indicators, signalDetails) {
  const price = indicators.currentPrice?.toFixed(2) || '?';
  const rsi = indicators.rsi?.toFixed(1) || '?';
  const trend = indicators.trend?.trend || 'bilinmiyor';
  
  let summary = `Fiyat: ${price} TL | RSI: ${rsi} | Trend: ${trend === 'uptrend' ? 'Yükseliş' : trend === 'downtrend' ? 'Düşüş' : 'Yatay'}. `;
  
  // AL sinyali veren göstergeleri say
  const buySignals = signalDetails.filter(s => s.signal === 'AL').length;
  const sellSignals = signalDetails.filter(s => s.signal === 'SAT').length;
  
  if (signal === 'GÜÇLÜ AL') {
    summary += `🟢 ${buySignals} gösterge güçlü alım sinyali veriyor! Güven: %${confidence}. Fırsat!`;
  } else if (signal === 'AL') {
    summary += `${buySignals} gösterge alım sinyali veriyor. Güven: %${confidence}.`;
  } else if (signal === 'SAT') {
    summary += `🔴 ${sellSignals} gösterge satım sinyali veriyor. Güven: %${confidence}. Pozisyon kapatılabilir.`;
  } else if (signal === 'DİKKAT') {
    summary += `⚠️ Satış baskısı var. ${sellSignals} gösterge olumsuz. Dikkatli olun!`;
  } else {
    summary += `Belirgin sinyal yok. Bekleme pozisyonunda kalınabilir.`;
  }
  
  return summary;
}

// Detaylı analiz metni
export function generateDetailedAnalysis(indicators, signalResult) {
  let analysis = `TEKNİK ANALİZ RAPORU\n`;
  analysis += `${'='.repeat(50)}\n\n`;
  
  // Fiyat bilgisi
  analysis += `GÜNCEL FİYAT: ${indicators.currentPrice?.toFixed(2)} TL\n\n`;
  
  // İndikatörler
  analysis += `İNDİKATÖRLER:\n`;
  analysis += `-`.repeat(30) + '\n';
  
  if (indicators.rsi !== null) {
    analysis += `RSI (14): ${indicators.rsi.toFixed(2)}\n`;
    analysis += `  → ${indicators.rsi < 30 ? 'Aşırı Satım' : indicators.rsi > 70 ? 'Aşırı Alım' : 'Nötr'}\n`;
  }
  
  if (indicators.macd) {
    analysis += `MACD: ${indicators.macd.macdLine.toFixed(4)}\n`;
    analysis += `  Signal: ${indicators.macd.signalLine.toFixed(4)}\n`;
    analysis += `  Histogram: ${indicators.macd.histogram.toFixed(4)}\n`;
    analysis += `  → ${indicators.macd.crossover === 'bullish' ? 'Pozitif Kesişim' : indicators.macd.crossover === 'bearish' ? 'Negatif Kesişim' : 'Kesişim Yok'}\n`;
  }
  
  if (indicators.bollinger) {
    analysis += `Bollinger Bantları:\n`;
    analysis += `  Üst: ${indicators.bollinger.upper.toFixed(2)}\n`;
    analysis += `  Orta: ${indicators.bollinger.middle.toFixed(2)}\n`;
    analysis += `  Alt: ${indicators.bollinger.lower.toFixed(2)}\n`;
    analysis += `  %B: ${(indicators.bollinger.percentB * 100).toFixed(1)}%\n`;
  }
  
  if (indicators.sma20 && indicators.sma50) {
    analysis += `SMA(20): ${indicators.sma20.toFixed(2)}\n`;
    analysis += `SMA(50): ${indicators.sma50.toFixed(2)}\n`;
  }
  
  if (indicators.atr) {
    analysis += `ATR(14): ${indicators.atr.toFixed(2)}\n`;
    analysis += `  → Stop-Loss önerisi: ${(indicators.currentPrice - 2 * indicators.atr).toFixed(2)} TL (-2×ATR)\n`;
  }
  
  analysis += `\nTREND ANALİZİ:\n`;
  analysis += `-`.repeat(30) + '\n';
  if (indicators.trend) {
    analysis += `Trend: ${indicators.trend.trend === 'uptrend' ? 'Yükseliş' : indicators.trend.trend === 'downtrend' ? 'Düşüş' : 'Yatay'}\n`;
    analysis += `Güç: ${indicators.trend.strength.toFixed(2)}%\n`;
  }
  
  analysis += `\nSINYAL ÖZETİ:\n`;
  analysis += `-`.repeat(30) + '\n';
  for (const s of signalResult.signals) {
    analysis += `${s.indicator}: ${s.value} → ${s.signal} (${s.reason})\n`;
  }
  
  analysis += `\nFINAL: ${signalResult.signal} (%${signalResult.confidence} güven)\n`;
  
  return analysis;
}
