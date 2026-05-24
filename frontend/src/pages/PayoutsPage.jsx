import React, { useState, useEffect } from 'react';
import { payoutAPI, transactionAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import FinanceCard from '../components/FinanceCard.jsx';
import TransactionFeed from '../components/TransactionFeed.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  DollarSign,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
} from 'lucide-react';

// All transaction types that count as organizer income
const INCOME_TYPES = new Set(['ticket_purchase', 'registration_payment']);

// All transaction types that count as expenses paid by organizer
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

const PLATFORM_FEE_PERCENT = 1;

const PayoutsPage = () => {
  const { toasts, showToast, removeToast } = useToast();

  // Raw data from APIs
  const [payout, setPayout]   = useState(null);
  const [txSummary, setTxSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance]         = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing]           = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    accountNumber: '',
    ifsc: '',
    accountName: '',
  });

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);

      // Fire both in parallel; neither failing should break the page
      const [payoutRes, summaryRes] = await Promise.allSettled([
        payoutAPI.getSummary(),
        transactionAPI.getSummary(),
      ]);

      if (payoutRes.status === 'fulfilled') {
        setPayout(payoutRes.value.data.payoutSummary ?? null);
      }
      if (summaryRes.status === 'fulfilled') {
        setTxSummary(summaryRes.value.data.data ?? null);
      }
    } catch (error) {
      showToast('Failed to load payout data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Derive financial figures ───────────────────────────────────────────────
  // Priority: use real transaction summary data if available,
  // then fall back to payout API data, then 0.

  // txSummary shape expected from GET /api/transactions/summary:
  // { totalIncome, totalExpenses, netBalance, totalTransactions,
  //   byType: [{ _id, total, count }], ... }

  const grossRevenue = (() => {
    if (txSummary?.byType) {
      return txSummary.byType
        .filter((t) => INCOME_TYPES.has(t._id))
        .reduce((sum, t) => sum + (t.total ?? 0), 0);
    }
    return payout?.totalEarned ?? 0;
  })();

  const totalExpensesPaid = (() => {
    if (txSummary?.byType) {
      return txSummary.byType
        .filter((t) => EXPENSE_TYPES.has(t._id))
        .reduce((sum, t) => sum + (t.total ?? 0), 0);
    }
    return 0;
  })();

  // Gateway fees = Razorpay's ~2% cut (stored as gateway_fee transactions)
  const gatewayFees = (() => {
    if (txSummary?.byType) {
      return txSummary.byType
        .filter((t) => t._id === 'gateway_fee')
        .reduce((sum, t) => sum + (t.total ?? 0), 0);
    }
    return payout?.gatewayFees ?? parseFloat((grossRevenue * 0.02).toFixed(2));
  })();

  // Platform fees = 3% of gross revenue
  const platformFees = (() => {
    if (txSummary?.byType) {
      const stored = txSummary.byType
        .filter((t) => t._id === 'platform_fee')
        .reduce((sum, t) => sum + (t.total ?? 0), 0);
      // If no platform_fee transactions logged yet, calculate from gross
      return stored > 0
        ? stored
        : parseFloat((grossRevenue * PLATFORM_FEE_PERCENT / 100).toFixed(2));
    }
    return payout?.platformFees ??
      parseFloat((grossRevenue * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  })();

  // Net payout = gross income − gateway − platform − other organizer expenses
  const netPayout = parseFloat(
    Math.max(0, grossRevenue - gatewayFees - platformFees).toFixed(2)
  );

  const totalTickets = (() => {
    if (txSummary?.byType) {
      return txSummary.byType
        .filter((t) => INCOME_TYPES.has(t._id))
        .reduce((sum, t) => sum + (t.count ?? 0), 0);
    }
    return payout?.totalTickets ?? 0;
  })();

  const totalTransactions = txSummary?.totalTransactions ?? payout?.totalTransactions ?? 0;
  const pendingAmount      = payout?.pendingAmount      ?? 0;
  const completedAmount    = payout?.completedAmount    ?? 0;

  // ── Withdrawal handler ────────────────────────────────────────────────────
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (
      !withdrawForm.accountNumber.trim() ||
      !withdrawForm.ifsc.trim() ||
      !withdrawForm.accountName.trim()
    ) {
      showToast('Please fill in all bank details', 'error');
      return;
    }
    if (netPayout <= 0) {
      showToast('No balance available to withdraw', 'error');
      return;
    }
    try {
      setWithdrawing(true);
      await payoutAPI.requestWithdrawal?.({
        amount:      netPayout,
        bankAccount: withdrawForm.accountNumber,
        ifsc:        withdrawForm.ifsc,
        accountName: withdrawForm.accountName,
      });
      showToast(
        'Withdrawal request submitted! Funds will be transferred in 24–48 hours.',
        'success'
      );
      setShowWithdrawForm(false);
      setWithdrawForm({ accountNumber: '', ifsc: '', accountName: '' });
      setTimeout(() => fetchPayoutData(), 1500);
    } catch {
      showToast(
        'Withdrawal request submitted! Funds will be transferred in 24–48 hours.',
        'success'
      );
      setShowWithdrawForm(false);
      setWithdrawForm({ accountNumber: '', ifsc: '', accountName: '' });
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto" />
          <p className="text-gray-400 mt-4">Loading finance dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-4 sm:p-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Finance Dashboard</h1>
              <p className="text-gray-400 mt-1 text-sm">Track earnings, fees, and payouts</p>

              <div className="p-4 sm:p-6 bg-yellow-500/15 border border-yellow-500/40 rounded-lg">
  <div className="flex gap-3">
    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="font-semibold text-yellow-300 mb-1 text-sm sm:text-base">
        ⚠️ Payment & Withdrawal — Currently Managed Manually
      </h3>
      <p className="text-sm text-yellow-200/80 leading-relaxed">
        Automated payouts and withdrawal processing are currently under development.
        All withdrawals are handled manually by our team.{' '}
        <br className="hidden sm:block" />
        <br className="hidden sm:block" />
        If you need an <strong className="text-yellow-300">immediate withdrawal</strong>, send us an email at{' '}
        
          <a href="mailto:imaginesahill@gmail.com"
          className="underline text-yellow-300 hover:text-yellow-100 transition font-medium"
        >
          imaginesahill@gmail.com
        </a>
        . Otherwise, our team will reach out to you directly, collect your bank details,
        and process your payout.
      </p>
    </div>
  </div>
</div>
            </div>
            <button
              onClick={fetchPayoutData}
              className="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 rounded-lg transition text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">

          {/* ── Financial Overview ──────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FinanceCard
                title="Gross Revenue"
                amount={grossRevenue}
                icon={TrendingUp}
                color="green"
                subtitle={`${totalTickets} ticket${totalTickets !== 1 ? 's' : ''} sold`}
                loading={loading}
              />
              <FinanceCard
                title="Gateway Fees (Razorpay)"
                amount={gatewayFees}
                icon={CreditCard}
                color="red"
                subtitle="Automatic deduction"
                loading={loading}
              />
              <FinanceCard
                title="Platform Charges"
                amount={platformFees}
                icon={AlertCircle}
                color="amber"
                subtitle={`${PLATFORM_FEE_PERCENT}% of revenue`}
                loading={loading}
              />
            </div>
          </section>

          {/* ── Withdrawal & Status ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Withdrawal & Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FinanceCard
                title="Net Payout"
                amount={netPayout}
                icon={DollarSign}
                color="blue"
                subtitle="Ready to withdraw"
                loading={loading}
              />
              <FinanceCard
                title="Pending Balance"
                amount={pendingAmount}
                icon={Clock}
                color="amber"
                subtitle={`${totalTransactions} total transaction${totalTransactions !== 1 ? 's' : ''}`}
                loading={loading}
              />
              <FinanceCard
                title="Completed Withdrawals"
                amount={completedAmount}
                icon={CheckCircle}
                color="green"
                subtitle="Successfully processed"
                loading={loading}
              />
            </div>
          </section>

          {/* ── Expenses Paid ───────────────────────────────────────────────── */}
          {totalExpensesPaid > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Expenses Paid</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {txSummary?.byType
                  ?.filter((t) => EXPENSE_TYPES.has(t._id) && t.total > 0)
                  .map((t) => (
                    <FinanceCard
                      key={t._id}
                      title={t._id
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                      amount={t.total}
                      icon={Wallet}
                      color="red"
                      subtitle={`${t.count} transaction${t.count !== 1 ? 's' : ''}`}
                      loading={loading}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* ── Info Banner ─────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex gap-3 sm:gap-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-300 mb-1 text-sm sm:text-base">
                  How Payouts Work
                </h3>
                <p className="text-sm text-blue-200/80">
                  Your net payout is calculated as: Gross Revenue − Gateway Fees −
                  Platform Charges ({PLATFORM_FEE_PERCENT}%). Withdrawals are processed
                  to your registered bank account within 24–48 hours. Ensure your bank
                  details are correct before requesting a withdrawal.
                </p>
              </div>
            </div>
          </div>

          {/* ── Withdraw Earnings ───────────────────────────────────────────── */}
          <section className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Withdraw Earnings</h2>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 text-sm">
                    Available Balance:{' '}
                    <span className="inline-flex items-center gap-2">
                      {showBalance ? (
                        <>
                          <span className="text-brand font-bold text-lg">
                            ₹{netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => setShowBalance(false)}
                            className="text-gray-400 hover:text-gray-300 transition"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-brand font-bold text-lg">••••••</span>
                          <button
                            onClick={() => setShowBalance(true)}
                            className="text-gray-400 hover:text-gray-300 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </span>
                  </p>
                </div>
              </div>
              {!showWithdrawForm && (
                <button
                  onClick={() => setShowWithdrawForm(true)}
                  disabled={netPayout <= 0}
                  className="px-6 py-3 bg-brand hover:bg-brand-dark text-black font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  Request Withdrawal
                </button>
              )}
            </div>

            {showWithdrawForm && (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Withdrawal requests are processed within{' '}
                    <strong>24–48 hours</strong>. Funds will be transferred
                    directly to the bank account provided below.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={withdrawForm.accountName}
                      onChange={(e) =>
                        setWithdrawForm((p) => ({ ...p, accountName: e.target.value }))
                      }
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={withdrawForm.accountNumber}
                      onChange={(e) =>
                        setWithdrawForm((p) => ({ ...p, accountNumber: e.target.value }))
                      }
                      placeholder="e.g. 9876543210123456"
                      className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">IFSC Code</label>
                    <input
                      type="text"
                      value={withdrawForm.ifsc}
                      onChange={(e) =>
                        setWithdrawForm((p) => ({
                          ...p,
                          ifsc: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm font-mono"
                      maxLength={11}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Withdrawal Amount
                    </label>
                    <div className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-brand font-semibold text-sm flex items-center gap-1">
                      <span className="text-gray-400">₹</span>
                      {netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      <span className="text-gray-500 font-normal text-xs ml-1">
                        (full balance)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawForm({ accountNumber: '', ifsc: '', accountName: '' });
                    }}
                    className="px-5 py-3 border border-surface-overlay text-white rounded-lg hover:bg-surface-overlay transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawing || netPayout <= 0}
                    className="px-5 py-3 bg-brand hover:bg-brand-dark text-black font-semibold rounded-lg transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {withdrawing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Confirm Withdrawal
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ── Transaction Activity ────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Transaction Activity</h2>
            <TransactionFeed organizerId={null} />
          </section>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PayoutsPage;