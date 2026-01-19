import React, { useState } from 'react';
import { DEFAULT_WATCHLIST } from '../constants';
import { Stock } from '../types';
import { Search, Plus, X } from 'lucide-react';

interface StockSearchProps {
  existingStocks: Stock[];
  onAddStock: (stock: Stock) => void;
  onClose: () => void;
}

const StockSearch: React.FC<StockSearchProps> = ({
  existingStocks,
  onAddStock,
  onClose
}) => {
  const [query, setQuery] = useState('');

  const existingSymbols = new Set(existingStocks.map(s => s.symbol));
  
  // Önceden tanımlı hisseler
  const availableStocks = DEFAULT_WATCHLIST.filter(
    stock => !existingSymbols.has(stock.symbol) &&
             (stock.name.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')) ||
              stock.symbol.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  );

  // Kullanıcının yazdığı sembolü doğrudan ekleyebilmesi için
  const canAddCustomSymbol = query.length >= 2 && 
    !existingSymbols.has(query.toUpperCase() + '.IS') &&
    !availableStocks.some(s => s.symbol.includes(query.toUpperCase()));

  const handleAddCustomStock = () => {
    const symbol = query.toUpperCase().replace('.IS', '') + '.IS';
    const customStock: Stock = {
      symbol: symbol,
      name: query.toUpperCase().replace('.IS', ''),
      price: 0,
      changePercent: 0,
      sector: 'BIST'
    };
    onAddStock(customStock);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-tupras-card rounded-xl border border-gray-700 max-w-md w-full max-h-96 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-white">Hisse Ekle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Hisse kodu yazın (örn: ENKAI, EREGL)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:border-tupras-yellow focus:ring-1 focus:ring-tupras-yellow outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Önerilen hisseler */}
          {availableStocks.slice(0, 5).map((stock) => (
            <div
              key={stock.symbol}
              className="p-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-white">{stock.name}</p>
                <p className="text-xs text-gray-500">{stock.symbol}</p>
              </div>
              <button
                onClick={() => {
                  onAddStock(stock);
                  setQuery('');
                }}
                className="p-1.5 bg-tupras-yellow/10 hover:bg-tupras-yellow/20 rounded text-tupras-yellow transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}

          {/* Özel hisse ekleme butonu */}
          {canAddCustomSymbol && (
            <div className="p-3 border-b border-gray-800/50 bg-tupras-yellow/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-tupras-yellow">
                    {query.toUpperCase().replace('.IS', '')}.IS
                  </p>
                  <p className="text-xs text-gray-500">Bu hisseyi ekle</p>
                </div>
                <button
                  onClick={handleAddCustomStock}
                  className="p-1.5 bg-tupras-yellow hover:bg-yellow-400 rounded text-black transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {availableStocks.length === 0 && !canAddCustomSymbol && query.length < 2 && (
            <div className="p-4 text-center text-gray-600 text-sm">
              Hisse kodu yazın (en az 2 karakter)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockSearch;
