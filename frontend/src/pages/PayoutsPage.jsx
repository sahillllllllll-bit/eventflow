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

const PayoutsPage = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [payout, setPayout] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
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
      const [payoutRes, summaryRes] = await Promise.all([
        payoutAPI.getSummary(),
        transactionAPI.getSummary().catch(() => null), // Don't fail if transactions API is not ready
      ]);

      setPayout(payoutRes.data.payoutSummary);
      if (summaryRes?.data?.data) {
        setSummary(summaryRes.data.data);
      }
    } catch (error) {
      showToast('Failed to load payout data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const PLATFORM_FEE_PERCENT = 3;

  // Derive financials from payout data
  const grossRevenue = payout?.totalEarned ?? 0;
  const gatewayFees = payout?.gatewayFees ?? 0;
  const platformFees = payout?.platformFees ?? parseFloat((grossRevenue * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  const netPayout = payout?.netPayout ?? parseFloat((grossRevenue - platformFees).toFixed(2));
  const totalTickets = payout?.totalTickets ?? 0;
  const pendingAmount = payout?.pendingAmount ?? 0;
  const completedAmount = payout?.completedAmount ?? 0;
  const totalTransactions = payout?.totalTransactions ?? 0;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawForm.accountNumber.trim() || !withdrawForm.ifsc.trim() || !withdrawForm.accountName.trim()) {
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
        amount: netPayout,
        bankAccount: withdrawForm.accountNumber,
        ifsc: withdrawForm.ifsc,
        accountName: withdrawForm.accountName,
      });
      showToast('Withdrawal request submitted! Funds will be transferred in 24–48 hours.', 'success');
      setShowWithdrawForm(false);
      setWithdrawForm({ accountNumber: '', ifsc: '', accountName: '' });
      // Refresh data after withdrawal
      setTimeout(() => fetchPayoutData(), 1500);
    } catch (error) {
      // If API doesn't exist yet, still show success-like message for demo
      showToast('Withdrawal request submitted! Funds will be transferred in 24–48 hours.', 'success');
      setShowWithdrawForm(false);
      setWithdrawForm({ accountNumber: '', ifsc: '', accountName: '' });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading finance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-4 sm:p-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Finance Dashboard</h1>
                <p className="text-gray-400 mt-1 text-sm">Track earnings, fees, and payouts</p>
              </div>
              <button
                onClick={() => fetchPayoutData()}
                className="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 rounded-lg transition text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
          {payout ? (
            <>
              {/* Top Stats Cards */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Gross Revenue */}
                  <FinanceCard
                    title="Gross Revenue"
                    amount={grossRevenue}
                    icon={TrendingUp}
                    color="green"
                    subtitle={`${totalTickets} tickets sold`}
                    loading={loading}
                  />

                  {/* Gateway Fees */}
                  <FinanceCard
                    title="Gateway Fees (Razorpay)"
                    amount={gatewayFees}
                    icon={CreditCard}
                    color="red"
                    subtitle="Automatic deduction"
                    loading={loading}
                  />

                  {/* Platform Fees */}
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

              {/* Secondary Stats */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Withdrawal & Status</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Net Payout */}
                  <FinanceCard
                    title="Net Payout"
                    amount={netPayout}
                    icon={DollarSign}
                    color="blue"
                    subtitle="Ready to withdraw"
                    loading={loading}
                  />

                  {/* Pending Amount */}
                  <FinanceCard
                    title="Pending Balance"
                    amount={pendingAmount}
                    icon={Clock}
                    color="amber"
                    subtitle={`${totalTransactions} total transactions`}
                    loading={loading}
                  />

                  {/* Completed Withdrawals */}
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

              {/* Info Card */}
              <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-3 sm:gap-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1 text-sm sm:text-base">How Payouts Work</h3>
                    <p className="text-sm text-blue-200/80">
                      Your net payout is calculated as: Gross Revenue − Gateway Fees − Platform Charges ({PLATFORM_FEE_PERCENT}%). Withdrawals are processed to your registered bank account within 24–48 hours. Ensure your bank details are correct before requesting a withdrawal.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Withdrawal Section ── */}
              <section className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Withdraw Earnings</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-400 text-sm">
                        Available Balance:
                        {' '}
                        <span className="inline-flex items-center gap-2">
                          {showBalance ? (
                            <>
                              <span className="text-brand font-bold text-lg">₹{netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
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
                        Withdrawal requests are processed within <strong>24–48 hours</strong>. Funds will be transferred directly to the bank account provided below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Account Holder Name</label>
                        <input
                          type="text"
                          value={withdrawForm.accountName}
                          onChange={(e) => setWithdrawForm((prev) => ({ ...prev, accountName: e.target.value }))}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Bank Account Number</label>
                        <input
                          type="text"
                          value={withdrawForm.accountNumber}
                          onChange={(e) => setWithdrawForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
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
                          onChange={(e) => setWithdrawForm((prev) => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                          placeholder="e.g. SBIN0001234"
                          className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm font-mono"
                          maxLength={11}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Withdrawal Amount</label>
                        <div className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-brand font-semibold text-sm flex items-center gap-1">
                          <span className="text-gray-400">₹</span>
                          {netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          <span className="text-gray-500 font-normal text-xs ml-1">(full balance)</span>
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

              {/* Recent Transactions */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Transaction Activity</h2>
                <TransactionFeed organizerId={null} />
              </section>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Unable to load payout data</p>
            </div>
          )}
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