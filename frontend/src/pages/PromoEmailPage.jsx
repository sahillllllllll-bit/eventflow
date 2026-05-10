import React, { useState, useEffect } from 'react';
import { eventAPI, promoAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Send, Calendar, Users } from 'lucide-react';

const PromoEmailPage = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [promoHistory, setPromoHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const eventsRes = await eventAPI.getMyEvents({ limit: 100, status: 'completed' });
      setEvents(eventsRes.data.events || []);

      const historyRes = await promoAPI.getHistory();
      setPromoHistory(historyRes.data.emails || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSendPromo = async () => {
    if (!formData.subject || !formData.body) {
      showToast('Subject and body are required', 'error');
      return;
    }

    if (selectedEvents.length === 0) {
      showToast('Select at least one event', 'error');
      return;
    }

    try {
      await promoAPI.sendPromoEmail({
        targetEventIds: selectedEvents,
        subject: formData.subject,
        body: formData.body,
        consentOnly: true,
      });
      showToast('Promo email sent successfully!', 'success');
      setStep(1);
      setSelectedEvents([]);
      setFormData({ subject: '', body: '' });
      fetchData();
    } catch (error) {
      showToast('Failed to send promo email', 'error');
      console.error(error);
    }
  };

  const completedEvents = events.filter((e) => e.status === 'completed');
  const selectedEventsData = events.filter((e) => selectedEvents.includes(e._id));
  const totalRecipients = selectedEventsData.reduce((sum, e) => sum + e.currentRegistrations, 0);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      
      <div className="ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold">Promo Emails</h1>
            <p className="text-gray-400 mt-1">Send updates to past attendees</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Compose Section */}
            <div className="lg:col-span-2">
              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <div className="mb-6">
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex-1">
                        <button
                          onClick={() => setStep(s)}
                          className={`w-full py-2 px-3 rounded-lg font-medium transition ${
                            step === s
                              ? 'bg-brand text-white'
                              : 'bg-surface-overlay text-gray-400 hover:text-white'
                          }`}
                        >
                          Step {s}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 1: Select Events */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Select Events</h3>
                    <p className="text-gray-400 text-sm">
                      Choose which events' attendees you want to reach
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {completedEvents.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">
                          No completed events. Finish an event to send promo emails.
                        </p>
                      ) : (
                        completedEvents.map((event) => (
                          <label
                            key={event._id}
                            className="flex items-center gap-3 p-3 bg-surface-overlay rounded-lg cursor-pointer hover:border-brand border border-surface-overlay transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedEvents.includes(event._id)}
                              onChange={() => handleEventToggle(event._id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{event.title}</p>
                              <p className="text-xs text-gray-400">
                                {event.currentRegistrations} attendees
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      disabled={selectedEvents.length === 0}
                      className="w-full py-2.5 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                      Next: Compose Email
                    </button>
                  </div>
                )}

                {/* Step 2: Compose */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Compose Email</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                        placeholder="Event update or announcement..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white h-32 resize-none"
                        placeholder="Your message here..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 border border-surface-overlay text-gray-300 hover:text-white font-semibold rounded-lg transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 py-2.5 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Review & Send</h3>
                    <div className="p-4 bg-surface-overlay rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Subject:</p>
                      <p className="font-medium mb-4">{formData.subject}</p>
                      <p className="text-xs text-gray-400 mb-2">Message:</p>
                      <p className="text-sm mb-4 whitespace-pre-wrap">{formData.body}</p>
                    </div>
                    <div className="p-4 bg-brand/20 border border-brand/30 rounded-lg">
                      <p className="text-sm">
                        Sending to <strong>{totalRecipients}</strong> attendees from{' '}
                        <strong>{selectedEvents.length}</strong> event{selectedEvents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-2.5 border border-surface-overlay text-gray-300 hover:text-white font-semibold rounded-lg transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSendPromo}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Recipients & History */}
            <div className="space-y-6">
              {/* Recipients Summary */}
              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Recipients</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-brand" />
                    <div>
                      <p className="text-xs text-gray-400">Total Recipients</p>
                      <p className="text-2xl font-bold">{totalRecipients}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Only attendees who consented to updates will receive this email.
                  </p>
                </div>
              </div>

              {/* History */}
              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Recent Emails</h3>
                {promoHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No emails sent yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {promoHistory.slice(0, 5).map((email) => (
                      <div key={email._id} className="p-3 bg-surface-overlay rounded text-xs">
                        <p className="font-medium truncate">{email.subject}</p>
                        <p className="text-gray-400 mt-1">
                          {email.totalSent} recipients • {new Date(email.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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

export default PromoEmailPage;
