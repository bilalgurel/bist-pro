import React from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';

interface IndicatorsPanelProps {
  indicators: {
    rsi: number | null;
    macd: {
      line: number;
      signal: number;
      histogram: number;
      crossover: string;
    } | null;
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
      percentB: number;
    } | null;
    sma20: number | null;
    sma50: number | null;
    atr: number | null;
    trend: {
      trend: string;
      strength: number;
    } | null;
  };
  signalDetails?: Array<{
    indicator: string;
    value: string;
    signal: string;
    reason: string;
  }>;
}

const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ indicators, signalDetails }) => {
  const getRSIColor = (rsi: number) => {
    if (rsi < 30) return 'text-emerald-400';
    if (rsi > 70) return 'text-rose-400';
    if (rsi < 40) return 'text-emerald-300';
    if (rsi > 60) return 'text-rose-300';
    return 'text-gray-300';
  };

  const getRSILabel = (rsi: number) => {
    if (rsi < 30) return 'Aşırı Satım';
    if (rsi > 70) return 'Aşırı Alım';
    return 'Nötr';
  };

  return (
    <div className="bg-tupras-card rounded-xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity size={18} className="text-tupras-yellow" />
        Teknik Göstergeler
        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded ml-2">GERÇEK VERİ</span>
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* RSI */}
        {indicators.rsi !== null && (
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">RSI (14)</div>
            <div className={`text-2xl font-mono font-bold ${getRSIColor(indicators.rsi)}`}>
              {indicators.rsi.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{getRSILabel(indicators.rsi)}</div>
            {/* RSI Bar */}
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  indicators.rsi < 30 ? 'bg-emerald-500' : 
                  indicators.rsi > 70 ? 'bg-rose-500' : 'bg-tupras-yellow'
                }`}
                style={{ width: `${indicators.rsi}%` }}
              />
            </div>
          </div>
        )}

        {/* MACD */}
        {indicators.macd && (
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">MACD</div>
            <div className={`text-lg font-mono font-bold ${
              indicators.macd.histogram > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {indicators.macd.histogram > 0 ? '+' : ''}{indicators.macd.histogram.toFixed(3)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {indicators.macd.crossover === 'bullish' ? '📈 Pozitif Kesişim' :
               indicators.macd.crossover === 'bearish' ? '📉 Negatif Kesişim' :
               indicators.macd.histogram > 0 ? 'Pozitif Momentum' : 'Negatif Momentum'}
            </div>
          </div>
        )}

        {/* Bollinger %B */}
        {indicators.bollinger && (
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Bollinger %B</div>
            <div className={`text-lg font-mono font-bold ${
              indicators.bollinger.percentB < 20 ? 'text-emerald-400' :
              indicators.bollinger.percentB > 80 ? 'text-rose-400' : 'text-gray-300'
            }`}>
              {indicators.bollinger.percentB.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {indicators.bollinger.percentB < 20 ? 'Alt Banda Yakın' :
               indicators.bollinger.percentB > 80 ? 'Üst Banda Yakın' : 'Orta Bant'}
            </div>
          </div>
        )}

        {/* Trend */}
        {indicators.trend && (
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Trend</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${
              indicators.trend.trend === 'uptrend' ? 'text-emerald-400' :
              indicators.trend.trend === 'downtrend' ? 'text-rose-400' : 'text-gray-400'
            }`}>
              {indicators.trend.trend === 'uptrend' ? <TrendingUp size={18} /> :
               indicators.trend.trend === 'downtrend' ? <TrendingDown size={18} /> : null}
              {indicators.trend.trend === 'uptrend' ? 'Yükseliş' :
               indicators.trend.trend === 'downtrend' ? 'Düşüş' : 'Yatay'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Güç: {indicators.trend.strength.toFixed(1)}%
            </div>
          </div>
        )}

        {/* SMA 20/50 */}
        {indicators.sma20 && indicators.sma50 && (
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Hareketli Ortalamalar</div>
            <div className="text-sm font-mono">
              <span className="text-tupras-yellow">SMA20:</span>{' '}
              <span className="text-white">{indicators.sma20.toFixed(2)}</span>
            </div>
            <div className="text-sm font-mono">
              <span className="text-gray-400">SMA50:</span>{' '}
              <span className="text-white">{indicators.sma50.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ATR */}
        {indicators.atr && (
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">ATR (Volatilite)</div>
            <div className="text-lg font-mono font-bold text-white">
              {indicators.atr.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Stop-Loss aralığı
            </div>
          </div>
        )}
      </div>

      {/* Sinyal Detayları */}
      {signalDetails && signalDetails.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">Sinyal Detayları</div>
          <div className="space-y-1">
            {signalDetails.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1">
                <span className="text-gray-400">{detail.indicator}</span>
                <span className="font-mono text-gray-300">{detail.value}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  detail.signal === 'AL' ? 'bg-emerald-900/50 text-emerald-400' :
                  detail.signal === 'SAT' ? 'bg-rose-900/50 text-rose-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {detail.signal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorsPanel;
