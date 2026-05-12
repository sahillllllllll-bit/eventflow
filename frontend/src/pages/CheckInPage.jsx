import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventAPI, registrationAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';

const CheckInPage = () => {
  const { eventId } = useParams();
  const { toasts, showToast, removeToast } = useToast();
  const [event, setEvent] = useState(null);
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getEventById(eventId);
        setEvent(res.data.event);
      } catch (error) {
        showToast('Unable to load event details', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) {
      showToast('Enter a Ticket ID to check in', 'error');
      return;
    }
    try {
      setCheckingIn(true);
      await registrationAPI.checkIn(ticketId.trim());
      showToast('Attendee checked in successfully', 'success');
      setTicketId('');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Check-In</h1>
          <p className="text-gray-400">Scan or manually check in attendees for this event.</p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-surface-overlay bg-surface p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading event details...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-surface-overlay bg-surface p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white">{event?.title}</h2>
                <p className="text-gray-400 mt-2">{event?.description || 'Manage attendee arrivals for your event.'}</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-surface-overlay bg-slate-950 p-4">
                  <div className="text-gray-400 text-sm">Event date</div>
                  <div className="text-white font-semibold mt-1">{new Date(event?.date).toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-surface-overlay bg-slate-950 p-4">
                  <div className="text-gray-400 text-sm">Venue</div>
                  <div className="text-white font-semibold mt-1">{event?.isOnline ? 'Online' : event?.venue || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-surface-overlay bg-surface p-8">
              <h3 className="text-xl font-semibold mb-4">Manual check-in</h3>
              <form onSubmit={handleCheckIn} className="space-y-4">
                <label className="block text-sm text-gray-400">Ticket ID</label>
                <input
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                  placeholder="Enter attendee ticket ID"
                />
                <button
                  type="submit"
                  disabled={checkingIn}
                  className="w-full rounded-2xl bg-brand px-4 py-3 text-black font-semibold hover:bg-brand-dark disabled:opacity-50"
                >
                  {checkingIn ? 'Checking in…' : 'Check in attendee'}
                </button>
              </form>
              <div className="mt-6 rounded-2xl border border-surface-overlay bg-slate-950 p-4 text-sm text-gray-400">
                Currently, QR scanning will be available soon. Use Ticket ID entry to quickly check in attendees.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default CheckInPage;
