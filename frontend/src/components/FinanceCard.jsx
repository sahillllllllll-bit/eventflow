import React from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * FinanceCard Component
 * Displays financial metric with icon, trend, and value
 */
const FinanceCard = ({
  title,
  amount,
  icon: Icon,
  color = 'green', // green, red, blue, purple, amber
  trend = null, // { value: number, isPositive: boolean }
  subtitle = '',
  loading = false,
}) => {
  const colorClasses = {
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      icon: 'bg-green-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: 'bg-red-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: 'bg-blue-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: 'bg-purple-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: 'bg-amber-500/20',
    },
  };

  const colors = colorClasses[color] || colorClasses.green;

  if (loading) {
    return (
      <div className={`p-5 sm:p-6 bg-surface border ${colors.border} rounded-lg animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <div className="h-8 bg-gray-700 rounded mt-3 w-32"></div>
            {subtitle && <div className="h-4 bg-gray-700 rounded mt-2 w-24"></div>}
          </div>
          <div className={`p-3 ${colors.icon} rounded-lg`}>
            <div className="w-5 h-5 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 sm:p-6 bg-surface border ${colors.border} rounded-lg hover:border-opacity-60 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-2 ${colors.text}`}>
            ₹{typeof amount === 'number'
  ? amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  : amount}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowUp className="w-3 h-3 text-green-400" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-400" />
              )}
              <span className={trend.isPositive ? 'text-green-400' : 'text-red-400'} style={{ fontSize: '0.75rem' }}>
                {Math.abs(trend.value).toFixed(1)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 ${colors.icon} rounded-lg flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

export default FinanceCard;
