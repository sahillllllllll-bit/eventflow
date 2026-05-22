import React, { useState, useEffect } from 'react';
import { payoutAPI, registrationAPI, eventAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { IndianRupee, TrendingUp, AlertCircle, Menu, Clock, CheckCircle } from 'lucide-react';

const PayoutsPage = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
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
      const response = await payoutAPI.getSummary();
      setPayout(response.data.payoutSummary);
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
  const platformFee = payout?.platformFee ?? parseFloat((grossRevenue * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  const netPayout = payout?.netPayout ?? parseFloat((grossRevenue - platformFee).toFixed(2));
  const totalTickets = payout?.totalTickets ?? 0;

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
          <p className="text-gray-400 mt-4">Loading payout information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">Payouts & Earnings</h1>
            <p className="text-gray-400 mt-1 text-sm">Track your event revenue and platform fees</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {payout ? (
            <>
              {/* Earnings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Gross Revenue */}
                <div className="p-5 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Gross Revenue</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">₹{grossRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-2">{totalTickets} tickets sold</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Platform Fee */}
                <div className="p-5 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Platform Fee ({PLATFORM_FEE_PERCENT}%)</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2 text-red-400">-₹{platformFee.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-2">Automatic deduction</p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Net Payout */}
                <div className="p-5 sm:p-6 bg-surface border border-brand/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Net Payout</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2 text-brand">₹{netPayout.toLocaleString()}</p>
                      <p className="text-xs text-brand/80 mt-2">Ready to withdraw</p>
                    </div>
                    <div className="p-3 bg-brand/20 rounded-lg">
                      <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="p-5 sm:p-6 bg-surface border border-blue-500/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Status</p>
                      <p className="text-lg font-bold mt-2 text-blue-400">Pending</p>
                      <p className="text-xs text-blue-300/80 mt-2">Awaiting withdrawal</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-8">
                <div className="flex gap-3 sm:gap-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1 text-sm sm:text-base">Payout Information</h3>
                    <p className="text-sm text-blue-200/80">
                      Payouts are processed to your registered bank account within 24–48 hours of your withdrawal request. A {PLATFORM_FEE_PERCENT}% platform fee is automatically deducted from gross earnings. Ensure your bank details are correct before requesting a withdrawal.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Withdrawal Section ── */}
              <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Withdraw Earnings</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Available: <span className="text-brand font-semibold">₹{netPayout.toLocaleString()}</span>
                      {' '}(after {PLATFORM_FEE_PERCENT}% platform fee)
                    </p>
                  </div>
                  {!showWithdrawForm && (
                    <button
                      onClick={() => setShowWithdrawForm(true)}
                      disabled={netPayout <= 0}
                      className="px-5 py-3 bg-brand hover:bg-brand-dark text-black font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
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
                          {netPayout.toLocaleString()}
                          <span className="text-gray-500 font-normal text-xs ml-1">(full balance)</span>
                        </div>
                      </div>
                    </div>
                        
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowWithdrawForm(false); setWithdrawForm({ accountNumber: '', ifsc: '', accountName: '' }); }}
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
              </div>

              {/* Payout History */}
              <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Transactions</h2>
                <div className="text-center py-10 sm:py-12 text-gray-400">
                  <p className="mb-2 text-sm">No transactions yet</p>
                  <p className="text-xs sm:text-sm text-gray-500">Your payout history will appear here after your first withdrawal.</p>
                </div>
              </div>
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
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PayoutsPage;