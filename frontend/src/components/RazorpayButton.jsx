// frontend/src/components/RazorpayButton.jsx
// ─────────────────────────────────────────────────────────────
// Reusable Razorpay payment button.
// Shows:  idle → loading → paid (green checkmark, no re-pay)
//
// Props:
//   type        - 'registration' | 'email_credits' | 'certificates'
//   eventId     - required for 'registration' and 'certificates'
//   count       - required for 'email_credits' and 'certificates'
//   label       - button text when idle (default: "Pay & Continue")
//   description - shown in Razorpay modal
//   prefill     - { name, email, contact } for Razorpay modal pre-fill
//   onSuccess   - called with { paymentId, orderId } after verified payment
//   onError     - called with Error if payment fails / cancelled
//   disabled    - additional disable flag from parent
//   className   - extra Tailwind classes
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { CheckCircle, Loader2, IndianRupee } from 'lucide-react';
import useRazorpay from '../hooks/useRazorpay';
import { paymentAPI } from '../api/endpoints';  // adjust if you keep separate file

const STATUS = { IDLE: 'idle', LOADING: 'loading', PAID: 'paid' };

const RazorpayButton = ({
  type,
  eventId,
  count,
  label       = 'Pay & Continue',
  description = 'EventGlow Payment',
  prefill     = {},
  onSuccess,
  onError,
  disabled    = false,
  className   = '',
}) => {
  const [status, setStatus]       = useState(STATUS.IDLE);
  const [errorMsg, setErrorMsg]   = useState('');
  const { openCheckout }          = useRazorpay();

  const handlePay = async () => {
    if (status === STATUS.PAID || status === STATUS.LOADING) return;

    setStatus(STATUS.LOADING);
    setErrorMsg('');

    try {
      // 1. Create order on backend
      const orderRes = await paymentAPI.createOrder({ type, eventId, count });
      const { order, amount } = orderRes.data;

      // 2. Open Razorpay checkout
      const paymentResponse = await openCheckout({
        order,
        amount,
        name:        'EventGlow',
        description,
        prefill,
      });

      // 3. Verify signature on backend
      await paymentAPI.verifyPayment({
        razorpay_order_id:   paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature:  paymentResponse.razorpay_signature,
      });

      // 4. Mark paid
      setStatus(STATUS.PAID);
      onSuccess?.({
        paymentId: paymentResponse.razorpay_payment_id,
        orderId:   paymentResponse.razorpay_order_id,
      });

    } catch (err) {
      setStatus(STATUS.IDLE);
      const msg = err?.response?.data?.message || err.message || 'Payment failed';
      setErrorMsg(msg === 'Payment cancelled' ? '' : msg);
      onError?.(err);
    }
  };

  // ── Paid state ───────────────────────────────────────────────
  if (status === STATUS.PAID) {
    return (
      <div className={`flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 font-medium ${className}`}>
        <CheckCircle className="w-5 h-5" />
        Payment Successful
      </div>
    );
  }

  // ── Idle / Loading state ─────────────────────────────────────
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handlePay}
        disabled={disabled || status === STATUS.LOADING}
        className={`flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {status === STATUS.LOADING ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <IndianRupee className="w-4 h-4" />
            {label}
          </>
        )}
      </button>
      {errorMsg && (
        <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
      )}
    </div>
  );
};

export default RazorpayButton;