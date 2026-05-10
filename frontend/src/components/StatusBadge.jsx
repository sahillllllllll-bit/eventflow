import React from 'react';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    published: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    paid: 'bg-green-500/20 text-green-300 border-green-500/30',
    free: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyles[status] || statusStyles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
