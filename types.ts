export enum SignalType {
  BUY = 'AL',
  STRONG_BUY = 'GÜÇLÜ AL',
  SELL = 'SAT',
  HOLD = 'TUT',
  WAIT = 'BEKLE',
  CAUTION = 'DİKKAT'
}

export interface MarketData {
  price: number;
  changePercent: number;
  volume: string;
  lastUpdated: string;
}

export interface TechnicalLevels {
  supports: string[];
  resistances: string[];
  stopLoss: string;
  target: string;
}

export interface AnalysisResult {
  signal: SignalType;
  confidence: number;
  summary: string;
  detailedAnalysis: string;
  technicalLevels: TechnicalLevels;
  news: NewsItem[];
  dividendInfo: string;
  marketData: MarketData;
  sources?: { title: string; uri: string }[];
  // PRO features
  indicators?: {
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
  riskManagement?: {
    stopLoss: number;
    takeProfit: number;
    riskPercent: number;
    rewardPercent: number;
    riskRewardRatio: number;
  };
  dataPoints?: number;
}

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}



export interface Stock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sector?: string;
}

export interface WatchlistItem extends Stock {
  addedDate: string;
}