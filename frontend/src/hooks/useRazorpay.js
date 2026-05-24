// frontend/src/hooks/useRazorpay.js
import { useCallback } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script    = document.createElement('script');
    script.src      = src;
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * useRazorpay()
 *
 * Returns `openCheckout(options)` — a function that:
 *  1. Loads the Razorpay SDK if not already loaded
 *  2. Opens the checkout modal
 *  3. Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *     on success, or rejects with an Error on failure / dismiss.
 *
 * Usage:
 *   const { openCheckout } = useRazorpay();
 *
 *   const result = await openCheckout({
 *     order,          // Razorpay order object from backend
 *     amount,         // display amount in rupees
 *     name,           // modal header name
 *     description,    // modal description
 *     prefill: { name, email, contact },
 *   });
 */
const useRazorpay = () => {
  const openCheckout = useCallback(({ order, amount, name, description, prefill = {} }) => {
    return new Promise(async (resolve, reject) => {
      const loaded = await loadScript(RAZORPAY_SCRIPT);
      if (!loaded) {
        reject(new Error('Razorpay SDK failed to load. Check your internet connection.'));
        return;
      }

      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      Math.round(amount * 100),
        currency:    'INR',
        name:        name        || 'EventGlow',
        description: description || 'Payment',
        order_id:    order.id,
        prefill: {
          name:    prefill.name    || '',
          email:   prefill.email   || '',
          contact: prefill.contact || '',
        },
        theme: { color: '#6C47FF' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
        handler: (response) => resolve(response),
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  }, []);

  return { openCheckout };
};

export default useRazorpay;