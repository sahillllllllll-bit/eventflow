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

const DISPLAY_FONT = '"Arial Black", Impact, sans-serif';

const INCOME_TYPES  = new Set(['ticket_purchase', 'registration_payment']);
const EXPENSE_TYPES = new Set([
  'gateway_fee', 'platform_fee', 'certificate_generation',
  'reminder_email', 'promo_email', 'bulk_email', 'withdrawal_fee', 'other_deduction',
]);
const GATEWAY_FEE_PERCENT  = 2.1;
const PLATFORM_FEE_PERCENT = 1;

const METHODS = [
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'upi',  label: 'UPI' },
];

const SectionLabel = ({ children }) => (
  <h2
    className="text-sm font-black uppercase tracking-widest mb-4 text-white"
    style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}
  >
    {children}
  </h2>
);

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
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="border-2 border-[#6C47FF] border-t-transparent rounded-full animate-spin h-12 w-12 mx-auto" />
          <p
            className="text-[#6b7280] mt-4 text-xs font-black uppercase tracking-widest"
            style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.12em' }}
          >
            Loading Finance Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">

        {/* Header */}
        <div className="bg-[#111] border-b border-white/10 p-4 sm:p-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex-1 mr-4">
              <h1
                className="font-black uppercase mb-1"
                style={{ fontFamily: DISPLAY_FONT, fontSize: 'clamp(22px, 4vw, 34px)', letterSpacing: '0.01em' }}
              >
                Finance Dashboard
              </h1>
              <p className="text-[#b4b4b4] mt-1 text-sm mb-3">Track earnings, fees, and payouts</p>
              <div className="p-4 border-l-[3px] border-[#f5b942] bg-[#f5b942]/10">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#f5b942] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3
                      className="font-black uppercase tracking-widest text-[#f5b942] mb-1 text-xs sm:text-sm"
                      style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.08em' }}
                    >
                      Payment &amp; Withdrawal — Currently Managed Manually
                    </h3>
                    <p className="text-sm text-[#f5b942]/80 leading-relaxed">
                      Automated payouts are under development. All withdrawals are handled manually by our team.{' '}
                      For an <strong className="text-[#f5b942]">immediate withdrawal</strong>, email us at{' '}
                      <a href="mailto:imaginesahill@gmail.com" className="underline text-[#f5b942] hover:text-white transition font-medium">
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
              className="px-4 py-2 border border-[#6C47FF]/40 text-[#a29bfe] hover:bg-[#6C47FF]/10 hover:border-[#6C47FF] transition text-xs font-black uppercase tracking-widest shrink-0 active:scale-95"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">

          {/* Financial Overview */}
          <section>
            <SectionLabel>Financial Overview</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
              <FinanceCard title="Gross Revenue"           amount={grossRevenue}  icon={TrendingUp}  color="green" subtitle={`${totalTickets} ticket${totalTickets !== 1 ? 's' : ''} sold`}                                          loading={loading} />
              <FinanceCard title="Gateway Fees (Razorpay)" amount={gatewayFees}   icon={CreditCard}  color="red"   subtitle="Automatic deduction"                                                                                    loading={loading} />
              <FinanceCard title="Platform Charges"        amount={platformFees}  icon={AlertCircle} color="amber" subtitle={`${PLATFORM_FEE_PERCENT}% of revenue`}                                                                  loading={loading} />
            </div>
          </section>

          {/* Withdrawal & Status */}
          <section>
            <SectionLabel>Withdrawal &amp; Status</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
              <FinanceCard title="Net Payout"            amount={netPayout}       icon={DollarSign}  color="blue"  subtitle="Ready to withdraw"                                                                                      loading={loading} />
              <FinanceCard title="Pending Balance"       amount={pendingAmount}   icon={Clock}       color="amber" subtitle={`${totalTransactions} total transaction${totalTransactions !== 1 ? 's' : ''}`}                         loading={loading} />
              <FinanceCard title="Completed Withdrawals" amount={completedAmount} icon={CheckCircle} color="green" subtitle="Successfully processed"                                                                                 loading={loading} />
            </div>
          </section>

          {/* Info Banner */}
          <div className="p-4 sm:p-6 border-l-[3px] border-[#6c5ce7]" style={{ background: 'rgba(108,92,231,0.08)' }}>
            <div className="flex gap-3 sm:gap-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: '#a29bfe' }} />
              <div>
                <h3
                  className="font-black uppercase tracking-widest mb-1 text-xs sm:text-sm"
                  style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.08em', color: '#a29bfe' }}
                >
                  How Payouts Work
                </h3>
                <p className="text-sm text-[#b4b4b4]">
                  Your net payout is calculated as: Gross Revenue − Gateway Fees − Platform Charges ({PLATFORM_FEE_PERCENT}%).
                  Withdrawals are processed to your registered bank account or UPI within 24–48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Withdraw Earnings */}
          <section className="p-4 sm:p-6 bg-[#1a1a1a] border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2
                  className="font-black uppercase tracking-widest mb-2 text-base sm:text-lg"
                  style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.08em' }}
                >
                  Withdraw Earnings
                </h2>
                <p className="text-[#b4b4b4] text-sm">
                  Available Balance:{' '}
                  <span className="inline-flex items-center gap-2">
                    {showBalance ? (
                      <>
                        <span className="font-black text-lg" style={{ color: '#a29bfe' }}>
                          ₹{netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <button onClick={() => setShowBalance(false)} className="text-gray-500 hover:text-white transition">
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-lg" style={{ color: '#a29bfe' }}>••••••</span>
                        <button onClick={() => setShowBalance(true)} className="text-gray-500 hover:text-white transition">
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
                  className="px-6 py-3 bg-[#6C47FF] text-white font-black uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed text-xs whitespace-nowrap active:scale-95"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Request Withdrawal
                </button>
              )}
            </div>

            {showWithdrawForm && (
              <form onSubmit={handleWithdraw} className="space-y-5">

                {/* Note */}
                <div className="p-4 border-l-[3px] border-[#f5b942] bg-[#f5b942]/10 flex gap-3">
                  <Clock className="w-5 h-5 text-[#f5b942] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#f5b942]/90">
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
                      className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition border active:scale-95 ${
                        payMethod === m.id
                          ? 'bg-white text-gray-900 border-white'
                          : 'bg-transparent border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                      }`}
                      style={{ fontFamily: DISPLAY_FONT }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Bank fields */}
                {payMethod === 'bank' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        Account Holder Name <span className="text-[#555] normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.accountName}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, accountName: e.target.value }))}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        Bank Account Number <span className="text-[#555] normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.accountNumber}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, accountNumber: e.target.value }))}
                        placeholder="e.g. 9876543210123456"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        IFSC Code <span className="text-[#555] normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.ifsc}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition text-sm font-mono"
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        Withdrawal Amount
                      </label>
                      <div className="w-full px-4 py-3 bg-white/5 border border-white/10 font-semibold text-sm flex items-center gap-1" style={{ color: '#a29bfe' }}>
                        <span className="text-gray-500">₹</span>
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
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        UPI ID <span className="text-[#dc2626] normal-case font-normal tracking-normal">*required</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.upiId}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, upiId: e.target.value }))}
                        placeholder="e.g. rahul@upi or 9876543210@paytm"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        Display Name <span className="text-[#555] normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={withdrawForm.displayName}
                        onChange={(e) => setWithdrawForm(p => ({ ...p, displayName: e.target.value }))}
                        placeholder="Name shown in UPI app"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#b4b4b4] mb-2" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.1em' }}>
                        Withdrawal Amount
                      </label>
                      <div className="w-full px-4 py-3 bg-white/5 border border-white/10 font-semibold text-sm flex items-center gap-1" style={{ color: '#a29bfe' }}>
                        <span className="text-gray-500">₹</span>
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
                    className="px-5 py-3 border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition text-xs font-black uppercase tracking-widest active:scale-95"
                    style={{ fontFamily: DISPLAY_FONT }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawing || netPayout <= 0}
                    className="px-5 py-3 bg-[#6C47FF] text-white font-black uppercase tracking-widest transition disabled:opacity-50 text-xs flex items-center justify-center gap-2 active:scale-95"
                    style={{ fontFamily: DISPLAY_FONT }}
                  >
                    {withdrawing ? (
                      <>
                        <div className="border-2 border-white border-t-transparent rounded-full animate-spin h-4 w-4" />
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
            <SectionLabel>Transaction Activity</SectionLabel>
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