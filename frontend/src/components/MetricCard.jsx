import React from 'react';

const MetricCard = ({ icon: Icon, label, value, trend, trendUp }) => {
  return (
    <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}% from last month
            </p>
          )}
        </div>
        <div className="p-3 bg-brand/20 rounded-lg">
          <Icon className="w-6 h-6 text-brand" />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
