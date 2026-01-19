import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SignalBadge from './components/SignalBadge';
import TechnicalLevels from './components/TechnicalLevels';
import Chart from './components/Chart';
import IndicatorsPanel from './components/IndicatorsPanel';
import Watchlist from './components/Watchlist';
import StockSearch from './components/StockSearch';
import PortfolioTracker from './components/PortfolioTracker';
import { fetchStockAnalysis } from './services/stockService';
import { AnalysisResult, Stock } from './types';
import { DEFAULT_WATCHLIST } from './constants';
import { RefreshCw, Newspaper, Info, ChevronRight, AlertCircle, BarChart3, PieChart, Link as LinkIcon } from 'lucide-react';

const App: React.FC = () => {
  // --- State Management ---
  const [selectedSymbol, setSelectedSymbol] = useState<string>('TUPRS.IS');
  const [loading, setLoading] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStockSearch, setShowStockSearch] = useState<boolean>(false);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<Stock[]>(() => {
    const saved = localStorage.getItem('bist_watchlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_WATCHLIST.slice(0, 10);
      }
    }
    return DEFAULT_WATCHLIST.slice(0, 10);
  });

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('bist_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // --- Analysis Fetching ---
  const handleFetchAnalysis = useCallback(async (symbol = selectedSymbol) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStockAnalysis(symbol);
      setAnalysis(result);
    } catch (err) {
      setError("Analiz verileri alınırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  // Fetch analysis when selected stock changes
  useEffect(() => {
    handleFetchAnalysis();
  }, [selectedSymbol]);

  // Update watchlist prices when analysis is fetched
  useEffect(() => {
    if (analysis && analysis.marketData) {
      setWatchlist(prev => prev.map(stock => 
        stock.symbol === selectedSymbol
          ? { ...stock, price: analysis.marketData.price, changePercent: analysis.marketData.changePercent }
          : stock
      ));
    }
  }, [analysis, selectedSymbol]);

  // --- Handlers ---
  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleAddStock = (stock: Stock) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist([...watchlist, { ...stock, addedDate: new Date().toISOString() }]);
      setSelectedSymbol(stock.symbol); // Yeni eklenen hisseyi seç
    }
    setShowStockSearch(false);
  };

  const handleRemoveStock = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s.symbol !== symbol));
    if (selectedSymbol === symbol && watchlist.length > 0) {
      setSelectedSymbol(watchlist[0].symbol);
    }
  };

  // --- Render Helpers ---
  const stockName = watchlist.find(s => s.symbol === selectedSymbol)?.name || selectedSymbol;

  return (
    <div className="min-h-screen bg-[#121212] pb-12">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Watchlist Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24">
              <Watchlist
                stocks={watchlist}
                selectedSymbol={selectedSymbol}
                onSelectStock={handleSelectStock}
                onAddStock={() => setShowStockSearch(true)}
                onRemoveStock={handleRemoveStock}
              />
            </div>
          </div>

          {/* Center Column */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            
            {/* Top Status Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {selectedSymbol} <span className="bg-gray-800 text-xs px-2 py-1 rounded text-gray-400 border border-gray-700">BIST</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">{stockName}</p>
              </div>

              <div className="flex items-center gap-4">
                {analysis && (
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-white">
                      {analysis.marketData.price.toFixed(2)} <span className="text-lg text-gray-500">TL</span>
                    </div>
                    <div className={`font-mono text-sm font-semibold ${analysis.marketData.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {analysis.marketData.changePercent > 0 ? '+' : ''}%{analysis.marketData.changePercent}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleFetchAnalysis()}
                  disabled={loading}
                  className="p-3 bg-tupras-yellow text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                  <span className="hidden md:inline text-sm">Analizi Yenile</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-900/20 border border-rose-900 text-rose-200 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Signal & Summary Card */}
            <div className="bg-tupras-card rounded-xl p-6 border border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-tupras-yellow"></div>
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center animate-pulse gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                  <div className="text-gray-500">Piyasa Analiz Ediliyor...</div>
                  <div className="text-xs text-gray-600">Teknik göstergeler hesaplanıyor</div>
                </div>
              ) : analysis ? (
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/3">
                    <SignalBadge signal={analysis.signal} confidence={analysis.confidence} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Info size={18} className="text-tupras-yellow" /> Analiz Özeti
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-sm bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        {analysis.summary}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Detaylı Teknik Görünüm</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {analysis.detailedAnalysis}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Chart Section */}
            <div className="bg-tupras-card rounded-xl p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-tupras-yellow" /> Fiyat Grafiği
                </h3>
                <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">Yahoo Finance</span>
              </div>
              <Chart symbol={selectedSymbol} />
            </div>

            {/* Indicators Panel - PRO */}
            {analysis && analysis.indicators && (
              <IndicatorsPanel 
                indicators={analysis.indicators} 
                signalDetails={analysis.signalDetails}
              />
            )}

            {/* Technical Levels */}
            {analysis && <TechnicalLevels data={analysis.technicalLevels} />}

            {/* News Section */}
            {analysis && analysis.news.length > 0 && (
              <div className="bg-tupras-card rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Newspaper size={18} className="text-tupras-yellow" /> Önemli Gelişmeler
                </h3>
                <div className="space-y-4">
                  {analysis.news.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-lg bg-gray-900/40 hover:bg-gray-900/60 transition-colors border border-gray-800/50">
                      <div className={`w-1 h-12 rounded-full ${item.sentiment === 'positive' ? 'bg-emerald-500' : item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-gray-500'}`}></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-200 mb-1">{item.title}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{item.source} • {item.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.sentiment === 'positive' ? 'bg-emerald-900/30 text-emerald-400' : item.sentiment === 'negative' ? 'bg-rose-900/30 text-rose-400' : 'bg-gray-800 text-gray-400'}`}>
                            {item.sentiment === 'positive' ? 'Olumlu' : item.sentiment === 'negative' ? 'Olumsuz' : 'Nötr'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dividend Info */}
            {analysis && analysis.dividendInfo && (
              <div className="bg-gradient-to-r from-tupras-card to-gray-900 rounded-xl p-6 border border-gray-800 flex items-start gap-4">
                <div className="p-3 bg-tupras-yellow/10 rounded-full text-tupras-yellow">
                  <PieChart size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Temettü Durumu</h3>
                  <p className="text-sm text-gray-300">{analysis.dividendInfo}</p>
                </div>
              </div>
            )}

            {/* Sources */}
            {analysis && analysis.sources && analysis.sources.length > 0 && (
              <div className="bg-tupras-card rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <LinkIcon size={18} className="text-tupras-yellow" /> Veri Kaynakları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-900/40 rounded border border-gray-800/50 hover:bg-gray-800 transition-colors text-sm text-gray-400 hover:text-tupras-yellow truncate"
                    >
                      <div className="w-1.5 h-1.5 bg-tupras-yellow rounded-full flex-shrink-0"></div>
                      <span className="truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Portföy Takip */}
          <div className="lg:col-span-1 order-3">
            <div className="sticky top-24">
              {/* Portföy Takip - Stop-Loss/Take-Profit */}
              {analysis ? (
                <PortfolioTracker
                  currentSymbol={selectedSymbol}
                  currentPrice={analysis.marketData.price}
                  stockName={stockName}
                />
              ) : (
                <div className="bg-tupras-card h-64 rounded-xl border border-gray-800 flex items-center justify-center text-gray-500 text-sm p-8 text-center">
                  Piyasa verilerinin yüklenmesi bekleniyor...
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl bg-emerald-900/10 border border-emerald-900/30 text-xs text-emerald-200 leading-relaxed">
                <strong>Min Risk, Max Kazanç:</strong> Alım yaptığınız hisseleri Stop-Loss ile koruyun.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stock Search Modal */}
      {showStockSearch && (
        <StockSearch
          existingStocks={watchlist}
          onAddStock={handleAddStock}
          onClose={() => setShowStockSearch(false)}
        />
      )}
    </div>
  );
};

export default App;