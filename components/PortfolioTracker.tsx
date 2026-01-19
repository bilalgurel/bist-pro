import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown, Bell, X, Target, Shield } from 'lucide-react';
import {
  Position,
  PositionAlert,
  addPosition,
  getActivePositions,
  deletePosition,
  closePosition,
  calculateLevels,
  calculateProfitLoss,
  loadAlerts,
  clearAlerts,
  getPortfolioSummary
} from '../services/portfolioService';

interface PortfolioTrackerProps {
  currentSymbol: string;
  currentPrice: number;
  stockName: string;
  onPriceCheck?: (symbol: string) => Promise<number | null>;
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({
  currentSymbol,
  currentPrice,
  stockName,
  onPriceCheck
}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [alerts, setAlerts] = useState<PositionAlert[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    buyPrice: currentPrice || 0,
    quantity: 1,
    stopLossPercent: 5,
    takeProfitPercent: 10
  });

  // Pozisyonları yükle
  const loadData = useCallback(() => {
    setPositions(getActivePositions());
    setAlerts(loadAlerts().slice(0, 10));
  }, []);

  useEffect(() => {
    loadData();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Mevcut fiyatı güncelle
  useEffect(() => {
    if (currentPrice > 0) {
      setPrices(prev => ({ ...prev, [currentSymbol]: currentPrice }));
      setFormData(prev => ({ ...prev, buyPrice: currentPrice }));
    }
  }, [currentPrice, currentSymbol]);

  // Pozisyon ekle
  const handleAddPosition = () => {
    if (formData.buyPrice <= 0 || formData.quantity <= 0) {
      alert('Geçerli fiyat ve adet giriniz!');
      return;
    }

    addPosition(
      currentSymbol,
      stockName,
      formData.buyPrice,
      formData.quantity,
      formData.stopLossPercent,
      formData.takeProfitPercent
    );

    loadData();
    setShowAddForm(false);
    setFormData(prev => ({ ...prev, quantity: 1 }));
  };

  // Pozisyon sil
  const handleDeletePosition = (id: string) => {
    if (confirm('Bu pozisyonu silmek istediğinize emin misiniz?')) {
      deletePosition(id);
      loadData();
    }
  };

  // Pozisyonu kapat
  const handleClosePosition = (position: Position, reason: 'manual' | 'stop-loss' | 'take-profit') => {
    const price = prices[position.symbol] || position.buyPrice;
    closePosition(position.id, price, reason);
    loadData();
  };

  // Portföy özeti
  const summary = getPortfolioSummary(prices);

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Portföy Takip</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Alım Ekle
        </button>
      </div>

      {/* Özet */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-900/50 rounded-lg">
          <div>
            <div className="text-xs text-gray-400">Pozisyon</div>
            <div className="text-lg font-bold text-white">{summary.positionCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Yatırım</div>
            <div className="text-lg font-bold text-white truncate" title={`${summary.totalInvested.toLocaleString('tr-TR')} ₺`}>
              {summary.totalInvested.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Güncel Değer</div>
            <div className="text-lg font-bold text-white truncate" title={`${summary.totalValue.toLocaleString('tr-TR')} ₺`}>
              {summary.totalValue.toLocaleString('tr-TR')} ₺
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Kar/Zarar</div>
            <div className={`text-lg font-bold ${summary.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <div className="flex flex-col">
                <span>{summary.totalProfitLoss >= 0 ? '+' : ''}{summary.totalProfitLoss.toLocaleString('tr-TR')} ₺</span>
                <span className="text-xs opacity-80">({summary.totalProfitLossPercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alım Formu */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-900/70 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">Yeni Alım - {currentSymbol}</h4>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Alış Fiyatı (₺)</label>
              <input
                type="number"
                step="0.01"
                value={formData.buyPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, buyPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Adet</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Stop-Loss (%)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={formData.stopLossPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, stopLossPercent: parseFloat(e.target.value) || 5 }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="text-xs text-rose-400 mt-1">
                = {(formData.buyPrice * (1 - formData.stopLossPercent / 100)).toFixed(2)} ₺
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Take-Profit (%)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="100"
                value={formData.takeProfitPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, takeProfitPercent: parseFloat(e.target.value) || 10 }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="text-xs text-emerald-400 mt-1">
                = {(formData.buyPrice * (1 + formData.takeProfitPercent / 100)).toFixed(2)} ₺
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Toplam: <span className="text-white font-medium">{(formData.buyPrice * formData.quantity).toLocaleString('tr-TR')} ₺</span>
            </div>
            <button
              onClick={handleAddPosition}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
            >
              Alım Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Aktif Pozisyonlar */}
      {positions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Henüz pozisyon yok</p>
          <p className="text-sm">Alım ekleyerek takibe başlayın</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => {
            const currentPriceForPos = prices[position.symbol] || position.buyPrice;
            const { stopLossPrice, takeProfitPrice } = calculateLevels(position);
            const { profitLoss, profitLossPercent } = calculateProfitLoss(position, currentPriceForPos);
            const isProfit = profitLoss >= 0;
            
            // Stop-loss veya take-profit'e yakın mı?
            const nearStopLoss = currentPriceForPos <= stopLossPrice * 1.02;
            const nearTakeProfit = currentPriceForPos >= takeProfitPrice * 0.98;
            const hitStopLoss = currentPriceForPos <= stopLossPrice;
            const hitTakeProfit = currentPriceForPos >= takeProfitPrice;

            return (
              <div
                key={position.id}
                className={`p-3 rounded-lg border transition-all ${
                  hitStopLoss ? 'bg-rose-900/30 border-rose-500 animate-pulse' :
                  hitTakeProfit ? 'bg-emerald-900/30 border-emerald-500 animate-pulse' :
                  nearStopLoss ? 'bg-rose-900/20 border-rose-700' :
                  nearTakeProfit ? 'bg-emerald-900/20 border-emerald-700' :
                  'bg-gray-900/50 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{position.symbol.replace('.IS', '')}</span>
                    <span className="text-sm text-gray-400">{position.name}</span>
                    {hitStopLoss && (
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-xs rounded-full animate-pulse">
                        🔴 STOP-LOSS!
                      </span>
                    )}
                    {hitTakeProfit && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full animate-pulse">
                        🟢 HEDEF!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClosePosition(position, 'manual')}
                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      title="Pozisyonu Kapat"
                    >
                      Kapat
                    </button>
                    <button
                      onClick={() => handleDeletePosition(position.id)}
                      className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Alış</div>
                    <div className="text-white">{position.buyPrice.toFixed(2)} ₺</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Adet</div>
                    <div className="text-white">{position.quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Güncel</div>
                    <div className="text-white">{currentPriceForPos.toFixed(2)} ₺</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">K/Z</div>
                    <div className={`font-medium ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{profitLoss.toFixed(2)} ₺
                      <span className="text-xs ml-1">({profitLossPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-700/50 text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingDown size={12} className="text-rose-400" />
                    <span className="text-gray-400">SL:</span>
                    <span className={`${hitStopLoss ? 'text-rose-400 font-bold' : 'text-gray-300'}`}>
                      {stopLossPrice.toFixed(2)} ₺ (-{position.stopLossPercent}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-400" />
                    <span className="text-gray-400">TP:</span>
                    <span className={`${hitTakeProfit ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}>
                      {takeProfitPrice.toFixed(2)} ₺ (+{position.takeProfitPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Son Uyarılar */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">Son Uyarılar</span>
            </div>
            <button
              onClick={() => { clearAlerts(); setAlerts([]); }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Temizle
            </button>
          </div>
          <div className="space-y-1">
            {alerts.slice(0, 5).map((alert, idx) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded ${
                  alert.type === 'stop-loss' ? 'bg-rose-900/30 text-rose-300' : 'bg-emerald-900/30 text-emerald-300'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioTracker;
