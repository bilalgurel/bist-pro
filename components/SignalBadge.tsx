import React from 'react';
import { SignalType } from '../types';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Clock, AlertTriangle, Zap } from 'lucide-react';

interface SignalBadgeProps {
  signal: SignalType;
  confidence: number;
}

const SignalBadge: React.FC<SignalBadgeProps> = ({ signal, confidence }) => {
  let colorClass = '';
  let Icon = MinusCircle;
  let glowClass = '';
  let signalText = signal;

  switch (signal) {
    case SignalType.STRONG_BUY:
      colorClass = 'text-emerald-300 bg-emerald-500/20 border-emerald-400/50';
      glowClass = 'shadow-[0_0_30px_rgba(52,211,153,0.5)] animate-pulse';
      Icon = Zap;
      signalText = 'GÜÇLÜ AL' as SignalType;
      break;
    case SignalType.BUY:
      colorClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      glowClass = 'shadow-[0_0_20px_rgba(52,211,153,0.3)]';
      Icon = ArrowUpCircle;
      break;
    case SignalType.SELL:
      colorClass = 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      glowClass = 'shadow-[0_0_20px_rgba(251,113,133,0.3)]';
      Icon = ArrowDownCircle;
      break;
    case SignalType.CAUTION:
      colorClass = 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      glowClass = 'shadow-[0_0_15px_rgba(251,191,36,0.3)]';
      Icon = AlertTriangle;
      signalText = 'DİKKAT' as SignalType;
      break;
    case SignalType.HOLD:
      colorClass = 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      Icon = MinusCircle;
      break;
    default:
      colorClass = 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      Icon = Clock;
      break;
  }

  const getProgressColor = () => {
    if (signal === SignalType.STRONG_BUY) return 'bg-emerald-400';
    if (signal === SignalType.BUY) return 'bg-emerald-500';
    if (signal === SignalType.SELL) return 'bg-rose-500';
    if (signal === SignalType.CAUTION) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${colorClass} ${glowClass} transition-all duration-300`}>
      <span className="text-sm font-semibold tracking-widest opacity-80 mb-2">TEKNİK ANALİZ SİNYALİ</span>
      <div className="flex items-center gap-3">
        <Icon size={48} strokeWidth={1.5} />
        <span className="text-4xl font-black tracking-tighter">{signalText}</span>
      </div>
      <div className="mt-4 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full ${getProgressColor()}`} 
          style={{ width: `${confidence}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-400 mt-1 font-mono">Güven Skoru: %{confidence}</span>
    </div>
  );
};

export default SignalBadge;