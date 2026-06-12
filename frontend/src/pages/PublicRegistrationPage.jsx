// frontend/src/pages/PublicRegistrationPage.jsx
// Paid events:   ONE button — "Pay ₹X & Register" — hides RegistrationForm's internal button via CSS
//                Clicking it: validates form → opens Razorpay → on success → submits registration
// Free events:   Unchanged — RegistrationForm renders its own "Complete Registration" button

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, paymentAPI } from '../api/endpoints.js';
import RegistrationForm from '../components/RegistrationForm.jsx';
import Modal from '../components/Modal.jsx';
import useRazorpay from '../hooks/useRazorpay.js';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { formatEventDate } from '../utils/helpers.js';
import { CheckCircle, Copy, Mail, Zap, ShieldCheck, CreditCard, Lock } from 'lucide-react';

const PublicRegistrationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const { openCheckout } = useRazorpay();

  const [event, setEvent]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [successData, setSuccessData]   = useState(null);

  const pendingFormData  = useRef(null);
  const [paymentPending, setPaymentPending] = useState(false);

  useEffect(() => { fetchEvent(); }, [slug]);

  const fetchEvent = async () => {
    try {
      const res = await eventAPI.getEventBySlug(slug);
      setEvent(res.data.event);
    } catch {
      showToast('Event not found', 'error');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async (formData, paymentId = null) => {
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('eventId', event._id);
      fd.append('name',    formData.fullName || '');
      fd.append('email',   formData.email    || '');
      fd.append('phone',   formData.phone    || '');
      fd.append('consentPromoEmails', formData.consentPromoEmails !== false);

      if (paymentId) {
        fd.append('paymentId',     paymentId);
        fd.append('paymentStatus', 'paid');
      }

      const textResponses = {};
      for (const [key, value] of Object.entries(formData)) {
        if (['fullName', 'email', 'phone', 'consentPromoEmails'].includes(key)) continue;
        if (value instanceof File) fd.append(key, value);
        else if (value !== undefined && value !== null && value !== '')
          textResponses[key] = String(value);
      }
      fd.append('responses', JSON.stringify(textResponses));

      const res = await registrationAPI.registerForEvent(fd);
      setSuccessData(res.data.registration);
      setSuccessModal(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
      console.error(err);
    } finally {
      setSubmitting(false);
      setPaymentPending(false);
      pendingFormData.current = null;
    }
  };

  // Called by RegistrationForm after its own validation passes
  const handleRegistrationSubmit = async (formData) => {
    if (event.isPaid) {
      // Store form data and trigger Razorpay directly
      pendingFormData.current = formData;
      setPaymentPending(true);
      try {
        // 1. Create order
        const orderRes = await paymentAPI.createOrder({
          type:    'registration',
          eventId: event._id,
        });
        const { order, amount } = orderRes.data;

        // 2. Open Razorpay checkout
        const paymentResponse = await openCheckout({
          order,
          amount,
          name:        'EventGlow',
          description: `Registration — ${event.title}`,
          prefill: {
            name:    formData.fullName || '',
            email:   formData.email    || '',
            contact: formData.phone    || '',
          },
        });

        // 3. Verify signature
        await paymentAPI.verifyPayment({
          razorpay_order_id:   paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature:  paymentResponse.razorpay_signature,
        });

        // 4. Submit registration with paymentId
        showToast('Payment confirmed! Completing your registration…', 'success');
        await submitRegistration(formData, paymentResponse.razorpay_payment_id);

      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Payment failed';
        if (msg !== 'Payment cancelled') {
          showToast(msg, 'error');
        }
        setPaymentPending(false);
        pendingFormData.current = null;
      }
    } else {
      await submitRegistration(formData);
    }
  };

  // "Pay & Register" clicked → dispatch submit on the form so RegistrationForm validates first
  const handlePayButtonClick = () => {
    if (submitting || paymentPending) return;
    const form = document.querySelector('#registration-form-wrapper form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading event details…</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isFull = event.maxCapacity && event.currentRegistrations >= event.maxCapacity;
  const isRegistrationClosed = (event.registrationClosesAt && new Date() > new Date(event.registrationClosesAt)) || 
                                (event.endDate && new Date() > new Date(event.endDate));

  return (
    <div className="min-h-screen bg-bg text-white">

      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 bg-surface/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate(`/e/${slug}`)} className="text-xl font-bold hover:text-brand transition">
            ← Back to Event
          </button>
          <div className="text-sm text-gray-400">
            {event.currentRegistrations}/{event.maxCapacity || '∞'} registered
          </div>
        </div>
      </nav>

      <div className="px-6 py-12 max-w-2xl mx-auto">

        {/* Event Info */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
            <span>📅 {formatEventDate(event.date)}</span>
            <span>📍 {event.isOnline ? 'Online Event' : event.venue}</span>
            {event.isPaid && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 border border-brand/30 rounded-full text-brand text-xs font-semibold">
                <CreditCard className="w-3 h-3" />
                ₹{event.ticketPrice} · Paid Event
              </span>
            )}
          </div>
        </div>

        {/* Registration Closed Warning */}
        {isRegistrationClosed && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            ⚠️ Registration for this event has closed.
          </div>
        )}

        {/* Capacity Warning */}
        {isFull && !isRegistrationClosed && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            ⚠️ This event has reached maximum capacity. Registrations are now closed.
          </div>
        )}

        {/* Secure checkout notice — paid only */}
        {event.isPaid && !isFull && !isRegistrationClosed && (
          <div className="mb-6 p-4 bg-surface-raised border border-border rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-200">Secure Checkout at the End</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Fill in your details and click{' '}
                <span className="text-white font-medium">"Pay & Register"</span>. Razorpay will
                open securely — total charge:{' '}
                <span className="text-white font-semibold">₹{event.ticketPrice}</span>
                <span className="text-gray-500"> (includes ₹1 platform fee)</span>.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!isFull && !isRegistrationClosed && (
          <div className="bg-surface-raised border border-border rounded-xl p-8">
            <h2 className="text-lg font-semibold mb-1">Your Details</h2>
            <p className="text-gray-400 text-sm mb-6">
              {event.isPaid
                ? 'Complete the form — payment opens automatically when you submit.'
                : 'Fill in the details below to secure your spot.'}
            </p>

            {event.isPaid ? (
              <>
                {/* Hide RegistrationForm's own submit button for paid events */}
                <style>{`
                  #registration-form-wrapper button[type="submit"],
                  #registration-form-wrapper input[type="submit"] {
                    display: none !important;
                  }
                `}</style>

                <div id="registration-form-wrapper">
                  <RegistrationForm
                    formSections={event.formSections}
                    onSubmit={handleRegistrationSubmit}
                    loading={submitting}
                  />
                </div>

                {/* THE one button for paid events */}
                <button
                  type="button"
                  disabled={submitting || paymentPending}
                  onClick={handlePayButtonClick}
                  className="mt-6 w-full flex items-center justify-center gap-2.5 px-6 py-3.5
                             bg-brand hover:bg-brand-light
                             disabled:opacity-60 disabled:cursor-not-allowed
                             text-white font-semibold rounded-xl
                             transition-all duration-200
                             shadow-lg shadow-brand/20 hover:shadow-brand/40"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Completing Registration…
                    </>
                  ) : paymentPending ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Opening Razorpay…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ₹{event.ticketPrice} &amp; Register
                    </>
                  )}
                </button>
              </>
            ) : (
              /* FREE event — untouched flow */
              <RegistrationForm
                formSections={event.formSections}
                onSubmit={handleRegistrationSubmit}
                loading={submitting}
              />
            )}
          </div>
        )}

        {/* Trust badge — paid only */}
        {event.isPaid && !isFull && !isRegistrationClosed && (
          <p className="mt-4 text-center text-xs text-gray-500">
            🔒 Payments processed securely by Razorpay · PCI-DSS compliant
          </p>
        )}
      </div>

      {/* Success Modal — unchanged */}
      <Modal
        isOpen={successModal}
        onClose={() => { setSuccessModal(false); navigate('/'); }}
        title="Registration Successful!"
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-brand" />
          </div>
          <div>
            <p className="text-gray-300 mb-4">
              🎉 You're all set! Check your email for your ticket with a unique QR code.
            </p>
            {successData && (
              <>
                <div className="p-4 bg-surface-overlay border border-border rounded-lg mb-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Your Ticket ID</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-lg text-brand font-semibold">{successData.ticketId}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(successData.ticketId); showToast('Ticket ID copied!', 'success'); }}
                      className="p-2 hover:bg-brand/20 rounded-lg transition text-gray-400 hover:text-brand"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-brand" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-300">Confirmation sent to</p>
                      <p className="text-xs text-gray-400">{successData.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">🎟️ <span className="font-medium">On event day:</span></p>
                  <p className="text-xs text-gray-400">
                    Show your QR code at the entrance. If you lose your ticket, contact the organizer with your Ticket ID.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 flex-col">
            <button
              onClick={() => { if (successData?.ticketId) window.open(`/ticket/${successData.ticketId}`, '_blank'); }}
              className="flex-1 px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              View &amp; Download PDF Ticket
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => { setSuccessModal(false); navigate(`/e/${slug}`); }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-300 hover:text-white transition font-medium"
              >
                View Event
              </button>
              <button
                onClick={() => { setSuccessModal(false); navigate('/'); }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-300 hover:text-white transition font-medium"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default PublicRegistrationPage;