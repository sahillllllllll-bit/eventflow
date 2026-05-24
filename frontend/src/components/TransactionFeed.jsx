import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../api/endpoints.js';
import {
  Plus,
  Minus,
  AlertCircle,
  Calendar,
  RefreshCw,
  Loader,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const EXPENSE_TYPES = new Set([
  'gateway_fee',
  'platform_fee',
  'certificate_generation',
  'reminder_email',
  'promo_email',
  'bulk_email',
  'withdrawal_fee',
  'other_deduction',
]);

const INCOME_TYPES = new Set([
  'ticket_purchase',
  'registration_payment',
]);

const TRANSACTION_LABELS = {
  ticket_purchase:        'Ticket Purchase',
  registration_payment:   'Registration Payment',
  gateway_fee:            'Gateway Fee',
  platform_fee:           'Platform Fee',
  certificate_generation: 'Certificate Generation',
  reminder_email:         'Reminder Email',
  promo_email:            'Promo Email',
  bulk_email:             'Bulk Email',
  withdrawal_fee:         'Withdrawal Fee',
  other_deduction:        'Other Deduction',
};

// Determines income vs expense — checks metadata flag saved by verifyPayment,
// falls back to type-based lookup for older records
const isExpense = (transaction) => {
  if (transaction.metadata?.isExpense !== undefined) {
    return transaction.metadata.isExpense;
  }
  return EXPENSE_TYPES.has(transaction.transactionType);
};

// ── Component ──────────────────────────────────────────────────────────────────
const TransactionFeed = ({ organizerId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [limit]                         = useState(15);
  const [hasMore, setHasMore]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [loadingMore, setLoadingMore]   = useState(false);

  useEffect(() => {
    fetchTransactions(1);
  }, [filter]);

  const fetchTransactions = async (pageNum = 1) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);

      const params = { page: pageNum, limit };

      // ── Map filter → API params ──────────────────────────────────────────────
      if (filter === 'income') {
        // Fetch all income types, not just one
        params.types = ['ticket_purchase', 'registration_payment'].join(',');
      } else if (filter === 'expense') {
        // Fetch all expense types
        params.types = [
          'gateway_fee',
          'platform_fee',
          'certificate_generation',
          'reminder_email',
          'promo_email',
          'bulk_email',
          'withdrawal_fee',
          'other_deduction',
        ].join(',');
      } else if (filter === 'pending') {
        params.status = 'pending';
      } else if (filter === 'completed') {
        params.status = 'completed';
      }

      const response = await transactionAPI.getTransactions(params);
      const { transactions: newTxns, pagination } = response.data.data;

      setTransactions(prev => pageNum === 1 ? newTxns : [...prev, ...newTxns]);
      setPage(pageNum);
      setHasMore(pageNum < pagination.pages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getTransactionLabel = (type) =>
    TRANSACTION_LABELS[type] ||
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      month:  'short',
      day:    'numeric',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });

  const getStatusBadge = (status) => {
    const classes = {
      completed: 'bg-green-500/20 text-green-300 border border-green-500/30',
      pending:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      failed:    'bg-red-500/20 text-red-300 border border-red-500/30',
      refunded:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${classes[status] || classes.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────────
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

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (transactions.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
        {/* Filters shown even when empty so user can switch */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'income', 'expense', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
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
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No transactions found</p>
          <p className="text-gray-500 text-xs mt-1">
            {filter !== 'all'
              ? 'Try switching to "All" to see everything'
              : 'Your transaction history will appear here'}
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'income', 'expense', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
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
        {transactions.map((tx) => {
          const expense      = isExpense(tx);
          const amountColor  = expense ? 'text-red-400'   : 'text-green-400';
          const iconBg       = expense ? 'bg-red-500/20'  : 'bg-green-500/20';
          const iconColor    = expense ? 'text-red-400'   : 'text-green-400';
          const amountPrefix = expense ? '−'              : '+';

          return (
            <div
              key={tx._id}
              className="p-4 bg-bg border border-surface-overlay hover:border-brand/30 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${iconBg}`}>
                  <span className={`flex items-center justify-center w-5 h-5 ${iconColor}`}>
                    {expense ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                        {getTransactionLabel(tx.transactionType)}
                      </h4>

                      {/* Event name — from populated ref or snapshot */}
                      {(tx.snapshot?.eventTitle || tx.event?.title) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Event: {tx.snapshot?.eventTitle || tx.event?.title}
                        </p>
                      )}

                      {/* Attendee info */}
                      {tx.registration && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Attendee: {tx.registration?.name || tx.registration?.email}
                        </p>
                      )}

                      {/* Description fallback */}
                      {tx.description && !tx.snapshot?.eventTitle && !tx.event?.title && (
                        <p className="text-xs text-gray-500 mt-0.5">{tx.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>

                    {/* Status + Amount */}
                    <div className="flex flex-col sm:items-end gap-2">
                      {getStatusBadge(tx.status)}
                      <p className={`font-bold text-sm sm:text-base ${amountColor}`}>
                        {amountPrefix}₹{tx.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Net amount breakdown — only show if fees were deducted */}
                  {tx.netAmount > 0 && (tx.gatewayFee > 0 || tx.platformFee > 0) && (
                    <div className="mt-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded flex gap-3">
                      {tx.gatewayFee > 0 && (
                        <span>Gateway: −₹{tx.gatewayFee.toFixed(2)}</span>
                      )}
                      {tx.platformFee > 0 && (
                        <span>Platform: −₹{tx.platformFee.toFixed(2)}</span>
                      )}
                      <span className="text-gray-300">
                        Net: ₹{tx.netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Razorpay ID */}
                  {tx.razorpayPaymentId && (
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      {tx.razorpayPaymentId.slice(0, 14)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
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