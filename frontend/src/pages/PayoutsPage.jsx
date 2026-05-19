import React, { useState, useEffect } from 'react';
import { payoutAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { IndianRupee, TrendingUp, AlertCircle } from 'lucide-react';

const PayoutsPage = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);

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
                <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Gross Revenue</p>
                      <p className="text-3xl font-bold mt-2">₹{payout.totalEarned.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-2">{payout.totalTickets} tickets sold</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Platform Fee (3%)</p>
                      <p className="text-3xl font-bold mt-2">-₹{payout.platformFee.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-2">Automatic deduction</p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <IndianRupee className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface border border-brand/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Net Payout</p>
                      <p className="text-3xl font-bold mt-2 text-brand">₹{payout.netPayout.toLocaleString()}</p>
                      <p className="text-xs text-brand/80 mt-2">Ready to transfer</p>
                    </div>
                    <div className="p-3 bg-brand/20 rounded-lg">
                      <IndianRupee className="w-6 h-6 text-brand" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface border border-blue-500/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Status</p>
                      <p className="text-lg font-bold mt-2 text-blue-400">Pending</p>
                      <p className="text-xs text-blue-300/80 mt-2">Processing...</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-8">
                <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Payout Information</h3>
                    <p className="text-sm text-blue-200/80">
                      Payouts are processed to your registered bank account within 3–5 business days. Ensure your account details are up to date in settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout History */}
              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                <div className="text-center py-12 text-gray-400">
                  <p className="mb-2">No transactions yet</p>
                  <p className="text-sm">Your payout history will appear here</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Unable to load payout data</p>
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
