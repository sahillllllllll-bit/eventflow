import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Calendar, MapPin, Users, Tag, ArrowRight, Share2 } from 'lucide-react';

const PublicEventPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const templateStyles = {
    minimal: 'bg-white text-gray-900',
    bold: 'bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white',
    gradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-purple-900 text-white',
    dark: 'bg-black text-cyan-300',
    glass: 'bg-white/20 backdrop-blur text-white',
  };

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <nav className="border-b border-border px-6 py-4 bg-surface/40 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-xl font-bold hover:text-brand transition">
            ← Back
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Event link copied!', 'success');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-brand text-brand hover:bg-brand/10 rounded-lg transition font-medium"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </nav>

      {/* Hero Section with Template Styling */}
      <section className={`px-6 py-24 ${templateStyles[event.template]}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">{event.title}</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">{event.description}</p>

          <button
            onClick={() => navigate(`/e/${slug}/register`)}
            className={`inline-flex items-center gap-2 px-8 py-4 ${
              event.template === 'minimal'
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-brand hover:bg-brand-light'
            } font-semibold rounded-lg transition mb-8`}
          >
            Register Now <ArrowRight className="w-5 h-5" />
          </button>

          {event.isPaid && (
            <p className="text-sm opacity-80">
              💳 Ticket Price: <span className="font-bold">₹{event.ticketPrice}</span>
            </p>
          )}
        </div>
      </section>

      {/* Event Details */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Date */}
          <div className="p-6 border border-border rounded-xl bg-surface-raised hover:border-brand/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-6 h-6 text-brand" />
              <h3 className="font-semibold">Date & Time</h3>
            </div>
            <p className="text-gray-300">
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {event.endDate && (
              <p className="text-sm text-gray-400 mt-1">
                Until {new Date(event.endDate).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="p-6 border border-border rounded-xl bg-surface-raised hover:border-brand/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-6 h-6 text-brand" />
              <h3 className="font-semibold">Location</h3>
            </div>
            {event.isOnline ? (
              <div>
                <p className="text-gray-300 font-medium">🌐 Online Event</p>
                <a
                  href={event.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-light text-sm mt-2 inline-block"
                >
                  Join Meeting Link →
                </a>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-2">{event.venue}</p>
                {event.venueMapLink && (
                  <a
                    href={event.venueMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-light text-sm"
                  >
                    View on Maps →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="p-6 border border-border rounded-xl bg-surface-raised hover:border-brand/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <Tag className="w-6 h-6 text-brand" />
              <h3 className="font-semibold">Category</h3>
            </div>
            <p className="text-gray-300 capitalize">{event.category}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {event.tags?.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-brand/20 text-brand text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* About Section */}
        {event.description && (
          <div className="border-t border-border pt-12 mb-12">
            <h2 className="text-3xl font-bold mb-6">About This Event</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-lg">
              {event.description}
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="p-12 border border-brand/20 bg-brand/5 rounded-xl text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to join?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Register now to get your personalized ticket with a unique QR code. You'll receive a confirmation email instantly.
          </p>
          <button
            onClick={() => navigate(`/e/${slug}/register`)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
          >
            Register Now <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-gray-500 mt-16">
        <p>&copy; 2024 EventFlow. Powered by college event management.</p>
      </footer>

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

export default PublicEventPage;
