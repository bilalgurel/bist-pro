import React from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-tupras-card border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tupras-yellow rounded-lg flex items-center justify-center text-tupras-black shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">BIST<span className="text-tupras-yellow">Pro</span></h1>
            <p className="text-xs text-gray-400 font-medium tracking-wider">PROFESYONEL ANALİZ PLATFORMU</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-gray-300 font-mono">CANLI BAĞLANTI</span>
          </div>
          <BarChart2 className="text-gray-400 hover:text-tupras-yellow transition-colors cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default Header;