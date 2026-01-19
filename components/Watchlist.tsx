import React from 'react';
import { Stock } from '../types';
import { TrendingUp, TrendingDown, Plus, X } from 'lucide-react';

interface WatchlistProps {
  stocks: Stock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onAddStock: () => void;
  onRemoveStock: (symbol: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  onAddStock,
  onRemoveStock
}) => {
  return (
    <div className="bg-tupras-card rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full">
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">İZLEM LİSTESİ</h3>
        <button
          onClick={onAddStock}
          className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-tupras-yellow transition-colors"
          title="Hisse Ekle"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {stocks.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => onSelectStock(stock.symbol)}
            className={`w-full p-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors text-left flex items-center justify-between group ${
              selectedSymbol === stock.symbol ? 'bg-gray-800 border-l-2 border-l-tupras-yellow' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white truncate">{stock.name}</span>
                {stock.sector && (
                  <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded truncate">
                    {stock.sector}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-300">
                  {stock.price ? stock.price.toFixed(2) : '---'}
                </span>
                <span
                  className={`font-mono text-xs font-semibold flex items-center gap-0.5 ${
                    stock.changePercent && stock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {stock.changePercent && stock.changePercent >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {stock.changePercent ? Math.abs(stock.changePercent).toFixed(2) : '0'}%
                </span>
              </div>
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                onRemoveStock(stock.symbol);
              }}
              className="p-1 ml-2 opacity-0 group-hover:opacity-100 hover:bg-rose-900/30 rounded text-gray-500 hover:text-rose-500 transition-all cursor-pointer"
              title="Kaldır"
            >
              <X size={14} />
            </div>
          </button>
        ))}

        {stocks.length === 0 && (
          <div className="p-4 text-center text-gray-600 text-xs">
            İzlem listesi boş. <br />
            <button
              onClick={onAddStock}
              className="text-tupras-yellow hover:underline mt-2"
            >
              Hisse ekleyin
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
