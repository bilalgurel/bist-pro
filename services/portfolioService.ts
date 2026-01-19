/**
 * Portfolio Service - Pozisyon yönetimi ve stop-loss/take-profit takibi
 */

export interface Position {
    id: string;
    symbol: string;
    name: string;
    buyPrice: number;
    quantity: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    createdAt: string;
    status: 'active' | 'closed';
    closedAt?: string;
    closePrice?: number;
    closeReason?: 'stop-loss' | 'take-profit' | 'manual';
}

export interface PositionAlert {
    positionId: string;
    symbol: string;
    type: 'stop-loss' | 'take-profit';
    message: string;
    currentPrice: number;
    targetPrice: number;
    profitLoss: number;
    profitLossPercent: number;
    timestamp: string;
}

const STORAGE_KEY = 'bist_pro_positions';
const ALERTS_KEY = 'bist_pro_alerts';

// Pozisyonları localStorage'dan yükle
export function loadPositions(): Position[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Pozisyonları kaydet
export function savePositions(positions: Position[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

// Yeni pozisyon ekle
export function addPosition(
    symbol: string,
    name: string,
    buyPrice: number,
    quantity: number,
    stopLossPercent: number = 5,
    takeProfitPercent: number = 10
): Position {
    const positions = loadPositions();

    const newPosition: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        name,
        buyPrice,
        quantity,
        stopLossPercent,
        takeProfitPercent,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    positions.push(newPosition);
    savePositions(positions);

    console.log(`✅ Pozisyon eklendi: ${symbol} @ ${buyPrice} TL x ${quantity} adet`);
    return newPosition;
}

// Pozisyonu kapat
export function closePosition(
    positionId: string,
    closePrice: number,
    reason: 'stop-loss' | 'take-profit' | 'manual'
): Position | null {
    const positions = loadPositions();
    const index = positions.findIndex(p => p.id === positionId);

    if (index === -1) return null;

    positions[index] = {
        ...positions[index],
        status: 'closed',
        closedAt: new Date().toISOString(),
        closePrice,
        closeReason: reason
    };

    savePositions(positions);
    return positions[index];
}

// Pozisyonu sil
export function deletePosition(positionId: string): boolean {
    const positions = loadPositions();
    const filtered = positions.filter(p => p.id !== positionId);

    if (filtered.length === positions.length) return false;

    savePositions(filtered);
    return true;
}

// Aktif pozisyonları getir
export function getActivePositions(): Position[] {
    return loadPositions().filter(p => p.status === 'active');
}

// Kapalı pozisyonları getir
export function getClosedPositions(): Position[] {
    return loadPositions().filter(p => p.status === 'closed');
}

// Stop-loss ve take-profit seviyelerini hesapla
export function calculateLevels(position: Position): {
    stopLossPrice: number;
    takeProfitPrice: number;
} {
    return {
        stopLossPrice: position.buyPrice * (1 - position.stopLossPercent / 100),
        takeProfitPrice: position.buyPrice * (1 + position.takeProfitPercent / 100)
    };
}

// Kar/zarar hesapla
export function calculateProfitLoss(position: Position, currentPrice: number): {
    profitLoss: number;
    profitLossPercent: number;
    totalValue: number;
    investedAmount: number;
} {
    const investedAmount = position.buyPrice * position.quantity;
    const totalValue = currentPrice * position.quantity;
    const profitLoss = totalValue - investedAmount;
    const profitLossPercent = ((currentPrice - position.buyPrice) / position.buyPrice) * 100;

    return {
        profitLoss,
        profitLossPercent,
        totalValue,
        investedAmount
    };
}

// Pozisyon durumunu kontrol et - uyarı gerekiyor mu?
export function checkPositionAlert(
    position: Position,
    currentPrice: number
): PositionAlert | null {
    const { stopLossPrice, takeProfitPrice } = calculateLevels(position);
    const { profitLoss, profitLossPercent } = calculateProfitLoss(position, currentPrice);

    // Stop-Loss kontrolü
    if (currentPrice <= stopLossPrice) {
        return {
            positionId: position.id,
            symbol: position.symbol,
            type: 'stop-loss',
            message: `🔴 STOP-LOSS! ${position.symbol} ${stopLossPrice.toFixed(2)} TL seviyesine düştü!`,
            currentPrice,
            targetPrice: stopLossPrice,
            profitLoss,
            profitLossPercent,
            timestamp: new Date().toISOString()
        };
    }

    // Take-Profit kontrolü
    if (currentPrice >= takeProfitPrice) {
        return {
            positionId: position.id,
            symbol: position.symbol,
            type: 'take-profit',
            message: `🟢 HEDEF! ${position.symbol} ${takeProfitPrice.toFixed(2)} TL hedefine ulaştı!`,
            currentPrice,
            targetPrice: takeProfitPrice,
            profitLoss,
            profitLossPercent,
            timestamp: new Date().toISOString()
        };
    }

    return null;
}

// Uyarıları kaydet
export function saveAlert(alert: PositionAlert): void {
    try {
        const data = localStorage.getItem(ALERTS_KEY);
        const alerts: PositionAlert[] = data ? JSON.parse(data) : [];

        // Aynı pozisyon için tekrar uyarı verme (son 1 saat içinde)
        const recentAlert = alerts.find(
            a => a.positionId === alert.positionId &&
                a.type === alert.type &&
                new Date().getTime() - new Date(a.timestamp).getTime() < 3600000
        );

        if (!recentAlert) {
            alerts.unshift(alert);
            // Son 50 uyarıyı tut
            localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 50)));
        }
    } catch (e) {
        console.error('Alert kayıt hatası:', e);
    }
}

// Uyarıları yükle
export function loadAlerts(): PositionAlert[] {
    try {
        const data = localStorage.getItem(ALERTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Uyarıları temizle
export function clearAlerts(): void {
    localStorage.removeItem(ALERTS_KEY);
}

// Tüm pozisyonları kontrol et
export async function checkAllPositions(
    getPriceFunc: (symbol: string) => Promise<number | null>
): Promise<PositionAlert[]> {
    const activePositions = getActivePositions();
    const newAlerts: PositionAlert[] = [];

    for (const position of activePositions) {
        try {
            const currentPrice = await getPriceFunc(position.symbol);

            if (currentPrice) {
                const alert = checkPositionAlert(position, currentPrice);
                if (alert) {
                    saveAlert(alert);
                    newAlerts.push(alert);
                }
            }
        } catch (e) {
            console.error(`Fiyat kontrolü hatası (${position.symbol}):`, e);
        }
    }

    return newAlerts;
}

// Portföy özeti
export function getPortfolioSummary(prices: Record<string, number>): {
    totalInvested: number;
    totalValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    positionCount: number;
} {
    const activePositions = getActivePositions();

    let totalInvested = 0;
    let totalValue = 0;

    for (const pos of activePositions) {
        const currentPrice = prices[pos.symbol] || pos.buyPrice;
        totalInvested += pos.buyPrice * pos.quantity;
        totalValue += currentPrice * pos.quantity;
    }

    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0
        ? (totalProfitLoss / totalInvested) * 100
        : 0;

    return {
        totalInvested,
        totalValue,
        totalProfitLoss,
        totalProfitLossPercent,
        positionCount: activePositions.length
    };
}
