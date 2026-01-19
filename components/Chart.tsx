import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchChartData, ChartDataPoint, ChartRange } from '../services/stockService';

interface ChartProps {
  symbol: string;
}

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: '1d', label: '1G' },
  { value: '5d', label: '1H' },
  { value: '1mo', label: '1A' },
  { value: '3mo', label: '3A' },
];

const Chart: React.FC<ChartProps> = ({ symbol }) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [range, setRange] = useState<ChartRange>('1mo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChart = async () => {
      setLoading(true);
      const chartData = await fetchChartData(symbol, range);
      setData(chartData);
      setLoading(false);
    };
    loadChart();
  }, [symbol, range]);

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex gap-2 justify-end">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setRange(option.value)}
            className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
              range === option.value
                ? 'bg-tupras-yellow text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full min-w-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="animate-pulse">Grafik yükleniyor...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Grafik verisi bulunamadı
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                tick={{fontSize: 10}} 
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666" 
                domain={['auto', 'auto']} 
                tick={{fontSize: 10}} 
                orientation="right"
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#FFD700' }}
                labelStyle={{ color: '#999', marginBottom: '5px' }}
                formatter={(value: number) => [`${value.toFixed(2)} TL`, 'Fiyat']}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#FFD700" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Chart;