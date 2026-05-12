import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', prizesAndGoodies: '', sendTicketEmails: true, paidEmailCredits: 0, date: '', venue: '', category: '', ticketPrice: 0, maxCapacity: 0 });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getEventById(id);
        setEvent(res.data.event);
        setForm({
          title: res.data.event.title || '',
          description: res.data.event.description || '',
          prizesAndGoodies: res.data.event.prizesAndGoodies || '',
          sendTicketEmails: res.data.event.sendTicketEmails ?? true,
          paidEmailCredits: res.data.event.paidEmailCredits || 0,
          date: res.data.event.date ? new Date(res.data.event.date).toISOString().slice(0, 16) : '',
          venue: res.data.event.venue || '',
          category: res.data.event.category || 'other',
          ticketPrice: res.data.event.ticketPrice || 0,
          maxCapacity: res.data.event.maxCapacity || 0,
        });
      } catch (error) {
        showToast('Unable to load event', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await eventAPI.updateEvent(id, {
        title: form.title,
        description: form.description,
        prizesAndGoodies: form.prizesAndGoodies,
        sendTicketEmails: form.sendTicketEmails,
        paidEmailCredits: form.sendTicketEmails ? Number(form.paidEmailCredits) : 0,
        date: form.date,
        venue: form.venue,
        category: form.category,
        ticketPrice: Number(form.ticketPrice),
        maxCapacity: Number(form.maxCapacity),
      });
      showToast('Event updated successfully', 'success');
      navigate(`/dashboard/events/${id}`);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Event</h1>
          <p className="text-gray-400">Update the event details and save your changes.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-surface-overlay bg-surface p-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading event details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-surface-overlay bg-surface p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                >
                  <option value="fest">Fest</option>
                  <option value="workshop">Workshop</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="competition">Competition</option>
                  <option value="seminar">Seminar</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Prizes & Goodies</label>
              <textarea
                value={form.prizesAndGoodies}
                onChange={(e) => setForm({ ...form, prizesAndGoodies: e.target.value })}
                rows={4}
                className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                placeholder="Add prizes, goodies, or winner rewards"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Event date</label>
                <input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  type="datetime-local"
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Venue</label>
                <input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ticket price</label>
                <input
                  value={form.ticketPrice}
                  onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
                  type="number"
                  min="0"
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Capacity</label>
                <input
                  value={form.maxCapacity}
                  onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                  type="number"
                  min="0"
                  className="w-full rounded-2xl border border-surface-overlay bg-bg px-4 py-3 text-white focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-surface-overlay border border-border rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendTicketEmails}
                  onChange={(e) => setForm({ ...form, sendTicketEmails: e.target.checked })}
                  className="w-4 h-4 accent-brand rounded"
                />
                <span className="font-medium text-white">Send tickets and confirmation emails</span>
              </label>
              <p className="text-gray-400 text-sm mt-3">
                100 emails free. Above 100 emails, ₹10 per additional email.
              </p>
              {form.sendTicketEmails && (
                <div className="mt-4 grid gap-4 md:grid-cols-2 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Extra email credits</label>
                    <input
                      type="number"
                      min="0"
                      value={form.paidEmailCredits}
                      onChange={(e) => setForm({ ...form, paidEmailCredits: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                      placeholder="Enter extra credits"
                    />
                  </div>
                  <div className="rounded-2xl border border-border p-4 bg-surface-raised">
                    <p className="text-sm text-gray-400">Estimated email charge</p>
                    <p className="text-2xl font-semibold text-white">₹{(form.paidEmailCredits || 0) * 10}</p>
                    <p className="text-xs text-gray-500 mt-1">Pay in full if you require extra delivery capacity.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-brand px-6 py-3 text-black font-semibold hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/events/${id}`)}
                className="rounded-2xl border border-surface-overlay px-6 py-3 text-white hover:bg-surface-overlay"
              >
                Cancel
              </button>
            </div>
          </form>
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

export default EditEventPage;
