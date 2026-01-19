import { AnalysisResult, SignalType } from "../types";

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

export const fetchStockAnalysis = async (symbol: string = 'TUPRS.IS'): Promise<AnalysisResult> => {
    try {
        console.log(`🔄 Backend çağrılıyor: ${symbol}`);
        const response = await fetch(`${BACKEND_URL}/api/analysis/${symbol}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Backend yanıt: `, data);

        if (data.fromCache) {
            console.log(`[CACHED] ${symbol} - 5 dakika cache`);
        } else {
            console.log(`[FRESH] ${symbol} - Yeni veri`);
        }

        return data as AnalysisResult;
    } catch (error) {
        console.error('Analysis failed:', error);
        return getDefaultMockData(symbol);
    }
};

const getDefaultMockData = (symbol: string): AnalysisResult => ({
    signal: SignalType.HOLD,
    confidence: 50,
    summary: "Analiz şu anda kullanılamıyor. Backend'in çalışıp çalışmadığını kontrol edin.",
    detailedAnalysis: `${symbol} için detaylı analiz alınamadı.`,
    marketData: {
        price: 0,
        changePercent: 0,
        volume: "0",
        lastUpdated: new Date().toLocaleTimeString('tr-TR')
    },
    technicalLevels: {
        supports: [],
        resistances: [],
        stopLoss: "0",
        target: "0"
    },
    news: [],
    dividendInfo: "Bilgi alınamadı"
});

export interface ChartDataPoint {
    date: string;
    price: number;
}

export type ChartRange = '1d' | '5d' | '1mo' | '3mo';

export const fetchChartData = async (
    symbol: string = 'TUPRS.IS',
    range: ChartRange = '1mo'
): Promise<ChartDataPoint[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/chart/${symbol}?range=${range}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Chart data fetch failed:', error);
        return [];
    }
};
