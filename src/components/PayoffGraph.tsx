import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PayoffGraphProps {
  spotPrice: number;
  strikePrice: number;
  premium: number;
  optionType: 'call' | 'put';
}

export const PayoffGraph: React.FC<PayoffGraphProps> = ({
  spotPrice,
  strikePrice,
  premium,
  optionType
}) => {
  // Generate data points for the graph
  const generateData = () => {
    const data = [];
    
    // Simple price range calculation - 30% on either side
    const priceRange = spotPrice * 0.3;
    const minPrice = Math.max(0, spotPrice - priceRange);
    const maxPrice = spotPrice + priceRange;
    
    // Simplified step size calculation
    let stepSize;
    if (spotPrice > 10000) {       // BTC range
      stepSize = 250;              // $250 steps
    } else if (spotPrice > 1000) { // ETH range
      stepSize = 25;              // $25 steps
    } else if (spotPrice > 100) {  // SOL, MATIC range
      stepSize = 5;               // $5 steps
    } else {                       // Low-price assets
      stepSize = 1;               // $1 step
    }

    // Generate base points
    for (let price = minPrice; price <= maxPrice; price += stepSize) {
      let buyerPayoff = 0;
      let sellerPayoff = 0;

      if (optionType === 'call') {
        buyerPayoff = Math.max(0, price - strikePrice) - premium;
        sellerPayoff = premium - Math.max(0, price - strikePrice);
      } else {
        buyerPayoff = Math.max(0, strikePrice - price) - premium;
        sellerPayoff = premium - Math.max(0, strikePrice - price);
      }

      data.push({
        price: Number(price.toFixed(2)),
        buyerPayoff: Number(buyerPayoff.toFixed(2)),
        sellerPayoff: Number(sellerPayoff.toFixed(2))
      });
    }

    return data;
  };

  const data = generateData();

  // Simplified number formatting
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-gray-600 dark:text-gray-300 font-medium mb-2 text-xs sm:text-sm">
            Asset Price: {formatValue(label)}
          </p>
          <p className="text-emerald-600 font-medium mb-1 text-xs sm:text-sm">
            Buyer Payoff: {formatValue(payload[0].value)}
          </p>
          <p className="text-red-600 font-medium text-xs sm:text-sm">
            Seller Payoff: {formatValue(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 30,
          bottom: 10,
        }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--muted-foreground))" 
          opacity={0.2} 
          horizontal={true}
          vertical={true}
        />
        <XAxis 
          dataKey="price" 
          label={{ 
            value: 'Asset Price ($)', 
            position: 'insideBottom', 
            offset: -5,
            style: { 
              textAnchor: 'middle',
              fontSize: '12px',
              fill: 'hsl(var(--muted-foreground))'
            }
          }}
          tickFormatter={formatValue}
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 11 }}
          tickMargin={5}
          axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
          interval="preserveStartEnd"
          ticks={data
            .filter((_, index) => index % Math.ceil(data.length / 10) === 0)
            .map(item => item.price)
          }
        />
        <YAxis 
          label={{ 
            value: 'Payoff ($)', 
            angle: -90, 
            position: 'insideLeft',
            offset: 0,
            style: { 
              textAnchor: 'middle',
              fontSize: '12px',
              fill: 'hsl(var(--muted-foreground))'
            }
          }}
          tickFormatter={formatValue}
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 11 }}
          tickMargin={5}
          axisLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
          interval="preserveStartEnd"
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, opacity: 0.3 }}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
          wrapperStyle={{
            paddingTop: '5px',
            fontSize: '12px'
          }}
        />
        <Line
          type="monotone"
          dataKey="buyerPayoff"
          stroke="hsl(var(--primary))"
          name="Buyer Payoff"
          dot={false}
          strokeWidth={2}
          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="sellerPayoff"
          stroke="hsl(var(--destructive))"
          name="Seller Payoff"
          dot={false}
          strokeWidth={2}
          strokeDasharray="5 5"
          activeDot={{ r: 6, stroke: 'hsl(var(--destructive))', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}; 