/**
 * Risk Manager
 * Pozisyon boyutlandırma, stop-loss, portföy limitleri
 */

// Kelly Criterion - Optimal pozisyon boyutu
export function calculateKellyPosition(winRate, avgWin, avgLoss, portfolioValue) {
  // f* = (bp - q) / b
  // b = ortalama kazanç / ortalama kayıp (odds)
  // p = kazanma olasılığı
  // q = 1 - p
  
  if (avgLoss === 0) return 0;
  
  const b = avgWin / avgLoss;
  const p = winRate;
  const q = 1 - p;
  
  const kelly = (b * p - q) / b;
  
  // Half-Kelly (daha konservatif)
  const halfKelly = Math.max(0, Math.min(kelly / 2, 0.25)); // Max %25
  
  return {
    fullKelly: kelly,
    halfKelly: halfKelly,
    suggestedPositionValue: portfolioValue * halfKelly,
    maxPositionPercent: halfKelly * 100
  };
}

// ATR bazlı Stop-Loss hesaplama
export function calculateStopLoss(currentPrice, atr, multiplier = 2) {
  const stopLoss = currentPrice - (atr * multiplier);
  const riskPercent = ((currentPrice - stopLoss) / currentPrice) * 100;
  
  return {
    stopLoss: stopLoss,
    riskPercent: riskPercent,
    atrMultiplier: multiplier
  };
}

// Take-Profit hesaplama (Risk/Reward oranına göre)
export function calculateTakeProfit(currentPrice, stopLoss, riskRewardRatio = 2) {
  const risk = currentPrice - stopLoss;
  const takeProfit = currentPrice + (risk * riskRewardRatio);
  const rewardPercent = ((takeProfit - currentPrice) / currentPrice) * 100;
  
  return {
    takeProfit: takeProfit,
    rewardPercent: rewardPercent,
    riskRewardRatio: riskRewardRatio
  };
}

// Pozisyon boyutu hesaplama (sabit risk)
export function calculatePositionSize(portfolioValue, riskPerTrade, entryPrice, stopLoss) {
  // Risk miktarı = portfolyo * risk yüzdesi
  const riskAmount = portfolioValue * (riskPerTrade / 100);
  
  // Hisse başına risk
  const riskPerShare = entryPrice - stopLoss;
  
  if (riskPerShare <= 0) return { shares: 0, totalValue: 0, riskAmount: 0 };
  
  // Alınacak hisse sayısı
  const shares = Math.floor(riskAmount / riskPerShare);
  const totalValue = shares * entryPrice;
  
  return {
    shares: shares,
    totalValue: totalValue,
    riskAmount: riskAmount,
    actualRiskPercent: (shares * riskPerShare / portfolioValue) * 100
  };
}

// Portföy çeşitlendirme kontrolü
export function checkDiversification(positions, newPosition, sectorData) {
  const warnings = [];
  const limits = {
    maxSingleStock: 0.20, // Tek hisse max %20
    maxSector: 0.40, // Tek sektör max %40
    maxPositions: 10 // Max 10 farklı hisse
  };
  
  // Mevcut portföy değeri
  let totalValue = 0;
  const sectorAllocations = {};
  
  for (const [symbol, pos] of Object.entries(positions)) {
    const value = pos.shares * pos.averageCost;
    totalValue += value;
    
    const sector = sectorData[symbol] || 'Diğer';
    sectorAllocations[sector] = (sectorAllocations[sector] || 0) + value;
  }
  
  // Yeni pozisyon dahil toplam
  const newTotalValue = totalValue + newPosition.value;
  const newPositionPercent = newPosition.value / newTotalValue;
  
  // 1. Tek hisse kontrolü
  if (newPositionPercent > limits.maxSingleStock) {
    warnings.push({
      type: 'single_stock_limit',
      message: `Bu pozisyon portföyün %${(newPositionPercent * 100).toFixed(1)}'ini oluşturacak (limit: %${limits.maxSingleStock * 100})`,
      severity: 'high'
    });
  }
  
  // 2. Sektör kontrolü
  const newSector = sectorData[newPosition.symbol] || 'Diğer';
  const currentSectorValue = sectorAllocations[newSector] || 0;
  const newSectorPercent = (currentSectorValue + newPosition.value) / newTotalValue;
  
  if (newSectorPercent > limits.maxSector) {
    warnings.push({
      type: 'sector_limit',
      message: `${newSector} sektörü portföyün %${(newSectorPercent * 100).toFixed(1)}'ini oluşturacak (limit: %${limits.maxSector * 100})`,
      severity: 'medium'
    });
  }
  
  // 3. Pozisyon sayısı kontrolü
  const positionCount = Object.keys(positions).length;
  if (!positions[newPosition.symbol] && positionCount >= limits.maxPositions) {
    warnings.push({
      type: 'position_count',
      message: `Maksimum ${limits.maxPositions} farklı hisse tutabilirsiniz`,
      severity: 'high'
    });
  }
  
  return {
    isAllowed: !warnings.some(w => w.severity === 'high'),
    warnings: warnings,
    diversificationScore: calculateDiversificationScore(positions, sectorData)
  };
}

// Çeşitlendirme skoru (0-100)
function calculateDiversificationScore(positions, sectorData) {
  const symbols = Object.keys(positions);
  if (symbols.length === 0) return 100;
  
  // Herfindahl-Hirschman Index (HHI) benzeri hesaplama
  let totalValue = 0;
  const values = {};
  
  for (const [symbol, pos] of Object.entries(positions)) {
    const value = pos.shares * pos.averageCost;
    values[symbol] = value;
    totalValue += value;
  }
  
  if (totalValue === 0) return 100;
  
  // HHI hesapla
  let hhi = 0;
  for (const value of Object.values(values)) {
    const weight = value / totalValue;
    hhi += weight * weight;
  }
  
  // HHI: 1/n (mükemmel çeşitlendirme) ile 1 (tek hisse) arasında
  // Normalize et: 0-100 arası skor
  const minHHI = 1 / Math.max(symbols.length, 1);
  const score = 100 * (1 - hhi) / (1 - minHHI);
  
  return Math.max(0, Math.min(100, score));
}

// Risk özeti
export function generateRiskReport(portfolio, indicators, signalResult) {
  const report = {
    portfolioValue: 0,
    totalRisk: 0,
    positionCount: 0,
    largestPosition: null,
    recommendations: []
  };
  
  const positions = portfolio.positions || {};
  
  for (const [symbol, pos] of Object.entries(positions)) {
    const value = pos.shares * pos.averageCost;
    report.portfolioValue += value;
    report.positionCount++;
    
    if (!report.largestPosition || value > report.largestPosition.value) {
      report.largestPosition = { symbol, value, percent: 0 };
    }
  }
  
  report.portfolioValue += portfolio.balance;
  
  if (report.largestPosition) {
    report.largestPosition.percent = (report.largestPosition.value / report.portfolioValue) * 100;
  }
  
  // Öneriler
  if (report.positionCount < 3) {
    report.recommendations.push('Portföyünüz yetersiz çeşitlendirilmiş. En az 3-5 farklı hisse önerilir.');
  }
  
  if (report.largestPosition && report.largestPosition.percent > 30) {
    report.recommendations.push(`${report.largestPosition.symbol} pozisyonu çok büyük (%${report.largestPosition.percent.toFixed(1)}). Küçültmeyi düşünün.`);
  }
  
  if (signalResult && signalResult.signal === 'SAT' && report.positionCount > 0) {
    report.recommendations.push('Satış sinyali var. Pozisyonlarınızı gözden geçirin.');
  }
  
  return report;
}
