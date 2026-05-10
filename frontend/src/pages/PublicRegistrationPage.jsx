import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, paymentAPI } from '../api/endpoints.js';
import RegistrationForm from '../components/RegistrationForm.jsx';
import Modal from '../components/Modal.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { CheckCircle, Copy, Mail, Zap } from 'lucide-react';

const PublicRegistrationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getEventBySlug(slug);
      setEvent(response.data.event);
    } catch (error) {
      showToast('Event not found', 'error');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSubmit = async (formData) => {
    try {
      setSubmitting(true);

      const payload = {
        eventId: event._id,
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        responses: Object.entries(formData)
          .filter(([key]) => !['name', 'email', 'phone', 'consentPromoEmails'].includes(key))
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {}),
        consentPromoEmails: formData.consentPromoEmails !== false,
      };

      // If paid event, initiate Razorpay payment
      if (event.isPaid) {
        const paymentResponse = await paymentAPI.initiatePayment({
          eventId: event._id,
          amount: event.ticketPrice * 100, // Convert to paise
          registrationData: payload,
        });

        // Open Razorpay checkout
        const options = {
          key: paymentResponse.data.razorpayKeyId,
          amount: event.ticketPrice * 100,
          currency: 'INR',
          name: 'EventFlow',
          description: `${event.title} - Event Ticket`,
          order_id: paymentResponse.data.orderId,
          handler: async (response) => {
            // Payment successful
            const registrationResponse = await registrationAPI.registerForEvent({
              ...payload,
              paymentId: response.razorpay_payment_id,
              paymentStatus: 'paid',
            });

            setSuccessData(registrationResponse.data.registration);
            setSuccessModal(true);
          },
          prefill: {
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#6C47FF',
          },
        };

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        // Free event, direct registration
        const response = await registrationAPI.registerForEvent({
          ...payload,
          paymentStatus: 'free',
        });

        setSuccessData(response.data.registration);
        setSuccessModal(true);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Registration failed', 'error');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <nav className="border-b border-border px-6 py-4 bg-surface/40 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate(`/e/${slug}`)} className="text-xl font-bold hover:text-brand transition">
            ← Back to Event
          </button>
          <div className="text-sm text-gray-400">
            {event.currentRegistrations}/{event.maxCapacity || '∞'} registered
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-12 max-w-2xl mx-auto">
        {/* Event Info */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>📅 {new Date(event.date).toLocaleDateString()}</span>
            <span>📍 {event.isOnline ? 'Online' : event.venue}</span>
          </div>
        </div>

        {/* Capacity Warning */}
        {event.maxCapacity &&
          event.currentRegistrations >=
            event.maxCapacity && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
              ⚠️ This event has reached maximum capacity. No more registrations are being accepted.
            </div>
          )}

        {/* Registration Form */}
        <div className="bg-surface-raised border border-border rounded-xl p-8">
          <RegistrationForm
            formSections={event.formSections}
            onSubmit={handleRegistrationSubmit}
            loading={submitting}
            isPaid={event.isPaid}
            ticketPrice={event.ticketPrice}
          />
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={successModal}
        onClose={() => {
          setSuccessModal(false);
          navigate('/');
        }}
        title="Registration Successful!"
      >
        <div className="space-y-6 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-brand" />
          </div>

          {/* Message */}
          <div>
            <p className="text-gray-300 mb-4">
              🎉 You're all set! Check your email for your ticket with a unique QR code.
            </p>

            {successData && (
              <>
                {/* Ticket ID */}
                <div className="p-4 bg-surface-overlay border border-border rounded-lg mb-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Your Ticket ID</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-lg text-brand font-semibold">
                      {successData.ticketId}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(successData.ticketId);
                        showToast('Ticket ID copied!', 'success');
                      }}
                      className="p-2 hover:bg-brand/20 rounded-lg transition text-gray-400 hover:text-brand"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Email Confirmation */}
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-brand" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-300">Confirmation sent to</p>
                      <p className="text-xs text-gray-400">{successData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Check-in Info */}
                <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">
                    🎟️ <span className="font-medium">On event day:</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Show your QR code at the entrance. If you lose your ticket, contact the organizer with your Ticket ID.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSuccessModal(false);
                navigate(`/e/${slug}`);
              }}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-300 hover:text-white transition font-medium"
            >
              View Event
            </button>
            <button
              onClick={() => {
                setSuccessModal(false);
                navigate('/');
              }}
              className="flex-1 px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg transition font-medium"
            >
              Home
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3">
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

export default PublicRegistrationPage;
