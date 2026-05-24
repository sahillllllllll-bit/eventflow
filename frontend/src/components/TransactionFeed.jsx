import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../api/endpoints.js';
import {
  Plus,
  Minus,
  AlertCircle,
  Calendar,
  RefreshCw,
  ChevronRight,
  Loader,
} from 'lucide-react';

/**
 * TransactionFeed Component
 * Displays list of transactions with filtering and pagination
 */
const TransactionFeed = ({ organizerId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all, income, expense, pending, completed
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchTransactions(1);
  }, [filter]);

  const fetchTransactions = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: limit,
      };

      // Map filter to API params
      if (filter === 'income') {
        params.type = 'ticket_purchase';
      } else if (filter === 'expense') {
        params.type = 'platform_fee';
      } else if (filter === 'pending') {
        params.status = 'pending';
      } else if (filter === 'completed') {
        params.status = 'completed';
      }

      const response = await transactionAPI.getTransactions(params);
      const { transactions: newTransactions, pagination } = response.data.data;

      if (pageNum === 1) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }

      setPage(pageNum);
      setTotalPages(pagination.pages);
      setHasMore(pageNum < pagination.pages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getTransactionIcon = (type) => {
    if (type.includes('purchase') || type.includes('registration') || type.includes('payment')) {
      return <Plus className="w-4 h-4" />;
    }
    return <Minus className="w-4 h-4" />;
  };

  const getTransactionColor = (type) => {
    if (type.includes('purchase') || type.includes('registration') || type.includes('payment')) {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'bg-green-500/20 text-green-300 border border-green-500/30',
      pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      failed: 'bg-red-500/20 text-red-300 border border-red-500/30',
      refunded: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[status] || statusClasses.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getTransactionLabel = (type) => {
    const labels = {
      ticket_purchase: 'Ticket Purchase',
      registration_payment: 'Registration Payment',
      gateway_fee: 'Gateway Fee',
      platform_fee: 'Platform Fee',
      certificate_generation: 'Certificate Generation',
      reminder_email: 'Reminder Email',
      promo_email: 'Promo Email',
      bulk_email: 'Bulk Email',
      withdrawal_fee: 'Withdrawal Fee',
      other_deduction: 'Other Deduction',
    };
    return labels[type] || type.replace(/_/g, ' ').title();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 text-brand animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No transactions yet</p>
          <p className="text-gray-500 text-xs mt-1">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'income', 'expense', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? 'bg-brand text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
            className="p-4 bg-bg border border-surface-overlay hover:border-brand/30 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand/5"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={`p-2 rounded-lg bg-opacity-20 flex-shrink-0 ${
                  transaction.transactionType.includes('purchase') ||
                  transaction.transactionType.includes('registration')
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 ${getTransactionColor(
                    transaction.transactionType
                  )}`}
                >
                  {getTransactionIcon(transaction.transactionType)}
                </span>
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                      {getTransactionLabel(transaction.transactionType)}
                    </h4>
                    {transaction.event && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Event: {transaction.event?.title || 'Unknown'}
                      </p>
                    )}
                    {transaction.registration && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attendee: {transaction.registration?.name || transaction.registration?.email}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>

                  {/* Status and Amount */}
                  <div className="flex flex-col sm:items-end gap-2 sm:gap-3">
                    {getStatusBadge(transaction.status)}
                    <p
                      className={`font-semibold text-sm sm:text-base ${
                        transaction.transactionType.includes('purchase') ||
                        transaction.transactionType.includes('registration')
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {(transaction.transactionType.includes('purchase') ||
                        transaction.transactionType.includes('registration'))
                        ? '+'
                        : '-'}
                      ₹{transaction.amount?.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {/* Net Amount breakdown */}
                {transaction.netAmount && (
                  <div className="mt-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                    <span>
                      {transaction.gatewayFee > 0 || transaction.platformFee > 0
                        ? `Net: ₹${transaction.netAmount?.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                          })}`
                        : 'No deductions'}
                    </span>
                  </div>
                )}

                {/* Razorpay ID */}
                {transaction.razorpayPaymentId && (
                  <p className="text-xs text-gray-600 mt-1">
                    ID: {transaction.razorpayPaymentId.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <button
          onClick={() => fetchTransactions(page + 1)}
          disabled={loadingMore}
          className="w-full mt-6 px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {loadingMore ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </span>
          ) : (
            'Load More Transactions'
          )}
        </button>
      )}
    </div>
  );
};

export default TransactionFeed;
