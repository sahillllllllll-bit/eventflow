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
  Eye,
  EyeOff,
} from 'lucide-react';

const INCOME_TYPES  = new Set(['ticket_purchase', 'registration_payment']);
const EXPENSE_TYPES = new Set([
  'gateway_fee', 'platform_fee', 'certificate_generation',
  'reminder_email', 'promo_email', 'bulk_email', 'withdrawal_fee', 'other_deduction',
]);
const GATEWAY_FEE_PERCENT  = 2.1;
const PLATFORM_FEE_PERCENT = 1;

const METHODS = [
  { id: 'bank', label: '🏦 Bank Transfer' },
  { id: 'upi',  label: '📲 UPI' },
];

const PayoutsPage = () => {
  const { toasts, showToast, removeToast } = useToast();

  const [payout,    setPayout]    = useState(null);
  const [txSummary, setTxSummary] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [showBalance,      setShowBalance]      = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing,      setWithdrawing]      = useState(false);
  const [payMethod,        setPayMethod]        = useState('bank');

  const [withdrawForm, setWithdrawForm] = useState({
    accountName:   '',
    accountNumber: '',
    ifsc:          '',
    upiId:         '',
    displayName:   '',
  });

  useEffect(() => { fetchPayoutData(); }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const [payoutRes, summaryRes] = await Promise.allSettled([
        payoutAPI.getSummary(),
        transactionAPI.getSummary(),
      ]);
      if (payoutRes.status  === 'fulfilled') setPayout(payoutRes.value.data.payoutSummary ?? null);
      if (summaryRes.status === 'fulfilled') setTxSummary(summaryRes.value.data.data ?? null);
    } catch (error) {
      showToast('Failed to load payout data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived financials ────────────────────────────────────────────────────
  const grossRevenue = (() => {
    if (txSummary?.byType) return txSummary.byType.filter(t => INCOME_TYPES.has(t._id)).reduce((s, t) => s + (t.total ?? 0), 0);
    return payout?.totalEarned ?? 0;
  })();

 const gatewayFees = parseFloat((grossRevenue * 2.1 / 100).toFixed(2));

  const platformFees = parseFloat((grossRevenue * 1 / 100).toFixed(2));

 const netPayout = parseFloat(Math.max(0, grossRevenue - gatewayFees - platformFees).toFixed(2));

  const totalTickets      = (() => { if (txSummary?.byType) return txSummary.byType.filter(t => INCOME_TYPES.has(t._id)).reduce((s, t) => s + (t.count ?? 0), 0); return payout?.totalTickets ?? 0; })();
  const totalTransactions = txSummary?.totalTransactions ?? payout?.totalTransactions ?? 0;
  const pendingAmount     = payout?.pendingAmount   ?? 0;
  const completedAmount   = payout?.completedAmount ?? 0;

  // ── Reset form ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setShowWithdrawForm(false);
    setWithdrawForm({ accountName: '', accountNumber: '', ifsc: '', upiId: '', displayName: '' });
    setPayMethod('bank');
  };

  console.log({
  grossRevenue,
  type: typeof grossRevenue,
  gatewayCalc: grossRevenue * 2.1 / 100,
  platformCalc: grossRevenue * 1 / 100,
  gatewayFees,
  platformFees
});

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (payMethod === 'bank') {
      const any = withdrawForm.accountName.trim() || withdrawForm.accountNumber.trim() || withdrawForm.ifsc.trim();
      if (!any) { showToast('Please enter at least one bank detail', 'error'); return false; }
    }
    if (payMethod === 'upi') {
      if (!withdrawForm.upiId.trim()) { showToast('Please enter your UPI ID', 'error'); return false; }
    }
    if (netPayout <= 0) { showToast('No balance available to withdraw', 'error'); return false; }
    return true;
  };

  // ── Submit — calls backend which sends email ──────────────────────────────
// ── Submit — DEBUG VERSION ────────────────────────────────────────────────
  const handleWithdraw = async (e) => {
    e.preventDefault();
    console.log('🔵 handleWithdraw fired');
    if (!validate()) {
      console.log('🔴 validation failed');
      return;
    }
    console.log('🟢 validation passed, payMethod:', payMethod);
    console.log('🟢 withdrawForm:', withdrawForm);
    console.log('🟢 netPayout:', netPayout);

    try {
      setWithdrawing(true);

      const payload = {
        amount:        netPayout,
        method:        payMethod,
        accountName:   withdrawForm.accountName,
        accountNumber: withdrawForm.accountNumber,
        ifsc:          withdrawForm.ifsc,
        upiId:         withdrawForm.upiId,
        displayName:   withdrawForm.displayName,
      };
      console.log('📤 Calling payoutAPI.requestWithdrawal with:', payload);

      const res = await payoutAPI.requestWithdrawal(payload);
      console.log('✅ API response:', res);

      showToast('Withdrawal request submitted! Funds will be transferred in 24–48 hours.', 'success');
      resetForm();
      setTimeout(() => fetchPayoutData(), 1500);
    } catch (err) {
      // NOW we log the real error instead of hiding it
      console.error('❌ requestWithdrawal failed:', err);
      console.error('❌ err.response:', err?.response);
      console.error('❌ err.response.data:', err?.response?.data);
      console.error('❌ err.message:', err?.message);
      showToast(err?.response?.data?.message || err?.message || 'Request failed — check console', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">

        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-4 sm:p-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Finance Dashboard</h1>
              <p className="text-gray-400 mt-1 text-sm mb-3">Track earnings, fees, and payouts</p>
              <div className="p-4 bg-yellow-500/15 border border-yellow-500/40 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-300 mb-1 text-sm sm:text-base">
                      ⚠️ Payment &amp; Withdrawal — Currently Managed Manually
                    </h3>
                    <p className="text-sm text-yellow-200/80 leading-relaxed">
                      Automated payouts are under development. All withdrawals are handled manually by our team.{' '}
                      For an <strong className="text-yellow-300">immediate withdrawal</strong>, email us at{' '}
                      <a href="mailto:imaginesahill@gmail.com" className="underline text-yellow-300 hover:text-yellow-100 transition font-medium">
                        imaginesahill@gmail.com
                      </a>
                      . Otherwise submit a request below and our team will reach out.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={fetchPayoutData}
              className="px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30 rounded-lg transition text-sm font-medium shrink-0"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">

          {/* Financial Overview */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FinanceCard title="Gross Revenue"           amount={grossRevenue}  icon={TrendingUp}  color="green" subtitle={`${totalTickets} ticket${totalTickets !== 1 ? 's' : ''} sold`}                                          loading={loading} />
              <FinanceCard title="Gateway Fees (Razorpay)" amount={gatewayFees}   icon={CreditCard}  color="red"   subtitle="Automatic deduction"                                                                                    loading={loading} />
              <FinanceCard title="Platform Charges"        amount={platformFees}  icon={AlertCircle} color="amber" subtitle={`${PLATFORM_FEE_PERCENT}% of revenue`}                                                                  loading={loading} />
            </div>
          </section>

          {/* Withdrawal & Status */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Withdrawal &amp; Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FinanceCard title="Net Payout"            amount={netPayout}       icon={DollarSign}  color="blue"  subtitle="Ready to withdraw"                                                                                      loading={loading} />
              <FinanceCard title="Pending Balance"       amount={pendingAmount}   icon={Clock}       color="amber" subtitle={`${totalTransactions} total transaction${totalTransactions !== 1 ? 's' : ''}`}                         loading={loading} />
              <FinanceCard title="Completed Withdrawals" amount={completedAmount} icon={CheckCircle} color="green" subtitle="Successfully processed"                                                                                 loading={loading} />
            </div>
          </section>

          {/* Info Banner */}
          <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex gap-3 sm:gap-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-300 mb-1 text-sm sm:text-base">How Payouts Work</h3>
                <p className="text-sm text-blue-200/80">
                  Your net payout is calculated as: Gross Revenue − Gateway Fees − Platform Charges ({PLATFORM_FEE_PERCENT}%).
                  Withdrawals are processed to your registered bank account or UPI within 24–48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Withdraw Earnings */}
          <section className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Withdraw Earnings</h2>
                <p className="text-gray-400 text-sm">
                  Available Balance:{' '}
                  <span className="inline-flex items-center gap-2">
                    {showBalance ? (
                      <>
                        <span className="text-brand font-bold text-lg">
                          ₹{netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <button onClick={() => setShowBalance(false)} className="text-gray-400 hover:text-gray-300 transition">
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-brand font-bold text-lg">••••••</span>
                        <button onClick={() => setShowBalance(true)} className="text-gray-400 hover:text-gray-300 transition">
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </span>
                </p>
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
              <form onSubmit={handleWithdraw} className="space-y-5">

                {/* Note */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Requests are processed within <strong>24–48 hours</strong>.
                    Fill in your preferred payment method — at least one field is required.
                  </p>
                </div>

                {/* Method tabs */}
                <div className="flex gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        payMethod === m.id
                          ? 'bg-brand text-black border-brand'
                          : 'bg-bg border-surface-overlay text-gray-300 hover:border-brand/50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Bank fields */}
                {payMethod === 'bank' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Account Holder Name <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.accountName}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, accountName: e.target.value }))}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Bank Account Number <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.accountNumber}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, accountNumber: e.target.value }))}
                        placeholder="e.g. 9876543210123456"
                        className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        IFSC Code <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.ifsc}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm font-mono"
                        maxLength={11}
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
                )}

                {/* UPI fields */}
                {payMethod === 'upi' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        UPI ID <span className="text-red-400 text-xs">*required</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.upiId}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, upiId: e.target.value }))}
                        placeholder="e.g. rahul@upi or 9876543210@paytm"
                        className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Display Name <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.displayName}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, displayName: e.target.value }))}
                        placeholder="Name shown in UPI app"
                        className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand text-sm"
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
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
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
                        Confirm Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Transaction Activity */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Transaction Activity</h2>
            <TransactionFeed organizerId={null} />
          </section>
        </div>
      </div>

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default PayoutsPage;