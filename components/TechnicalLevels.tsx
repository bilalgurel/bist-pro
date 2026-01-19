import React from 'react';
import { TechnicalLevels as ITechnicalLevels } from '../types';
import { Shield, Target, AlertTriangle } from 'lucide-react';

const TechnicalLevels: React.FC<{ data: ITechnicalLevels }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="bg-tupras-card border border-emerald-900/30 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
           <Shield size={40} className="text-emerald-500" />
        </div>
        <h4 className="text-emerald-400 text-xs font-bold uppercase mb-2 tracking-wider">Destek Seviyeleri</h4>
        <div className="space-y-1">
          {data.supports.map((s, i) => (
            <div key={i} className="font-mono text-xl text-white font-semibold">{s} <span className="text-emerald-700 text-xs">TL</span></div>
          ))}
        </div>
      </div>

      <div className="bg-tupras-card border border-rose-900/30 p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
           <AlertTriangle size={40} className="text-rose-500" />
        </div>
        <h4 className="text-rose-400 text-xs font-bold uppercase mb-2 tracking-wider">Direnç Seviyeleri</h4>
        <div className="space-y-1">
          {data.resistances.map((r, i) => (
            <div key={i} className="font-mono text-xl text-white font-semibold">{r} <span className="text-rose-700 text-xs">TL</span></div>
          ))}
        </div>
      </div>

      <div className="bg-tupras-card border border-gray-800 p-4 rounded-xl flex flex-col justify-center">
        <h4 className="text-gray-400 text-xs font-bold uppercase mb-1">Stop-Loss</h4>
        <div className="font-mono text-2xl text-white font-bold text-rose-400">{data.stopLoss} TL</div>
        <p className="text-[10px] text-gray-500 mt-1">Zarar Kes Seviyesi</p>
      </div>

      <div className="bg-tupras-card border border-gray-800 p-4 rounded-xl flex flex-col justify-center">
        <h4 className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-2"><Target size={12}/> Hedef</h4>
        <div className="font-mono text-2xl text-white font-bold text-tupras-yellow">{data.target} TL</div>
        <p className="text-[10px] text-gray-500 mt-1">Kısa Vade Hedef</p>
      </div>
    </div>
  );
};

export default TechnicalLevels;