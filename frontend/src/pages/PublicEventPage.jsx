import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { markdownToHtml } from '../components/MarkdownEditor.jsx';
import { Calendar, MapPin, Users, Tag, ArrowRight, Share2 } from 'lucide-react';

const PublicEventPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvent(); }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getEventBySlug(slug);
      setEvent(response.data.event);
    } catch {
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
          <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading event…</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  // ── Template hero styles ─────────────────────────────────────────────────
  const heroStyles = {
    minimal:  { section: 'bg-white text-gray-900', btn: 'bg-gray-900 text-white hover:bg-gray-800' },
    bold:     { section: 'bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white', btn: 'bg-brand hover:bg-brand-light text-white' },
    gradient: { section: 'bg-gradient-to-br from-purple-600 via-pink-500 to-purple-900 text-white', btn: 'bg-white text-purple-700 hover:bg-purple-50' },
    dark:     { section: 'bg-black text-cyan-300', btn: 'bg-cyan-400 text-black hover:bg-cyan-300' },
    glass:    { section: 'bg-white/10 backdrop-blur-md text-white border-b border-white/10', btn: 'bg-white text-gray-900 hover:bg-white/90' },
  };
  const hero = heroStyles[event.template] || heroStyles.minimal;

  // ── Rendered markdown ─────────────────────────────────────────────────────
  const descriptionHtml = event.description ? markdownToHtml(event.description) : '';

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 bg-surface/40 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="font-bold text-lg truncate max-w-xs">{event.title}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Link copied!', 'success');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-brand text-brand hover:bg-brand/10 rounded-lg transition text-sm font-medium"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className={`px-6 py-24 ${hero.section}`}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">{event.title}</h1>

          {/* Short summary — NEW: displayed below title */}
          {event.shortSummary && (
            <p className="text-lg md:text-xl opacity-80 mb-8 max-w-2xl mx-auto leading-relaxed">
              {event.shortSummary}
            </p>
          )}

          <button
            onClick={() => navigate(`/e/${slug}/register`)}
            className={`inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-lg transition mb-6 ${hero.btn}`}
          >
            Register Now <ArrowRight className="w-5 h-5" />
          </button>

          {event.isPaid && (
            <p className="text-sm opacity-75 mt-2">
              💳 Ticket Price: <span className="font-bold">₹{event.ticketPrice}</span>
            </p>
          )}
        </div>
      </section>

      {/* ── Details cards ─────────────────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
          {/* Date */}
          <div className="p-6 border border-border rounded-xl bg-surface-raised hover:border-brand/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-brand flex-shrink-0" />
              <h3 className="font-semibold">Date & Time</h3>
            </div>
            <p className="text-gray-300 text-sm">
              {new Date(event.date).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              {event.endDate && ` – ${new Date(event.endDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>

          {/* Location */}
          <div className="p-6 border border-border rounded-xl bg-surface-raised hover:border-brand/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-brand flex-shrink-0" />
              <h3 className="font-semibold">Location</h3>
            </div>
            {event.isOnline ? (
              <>
                <p className="text-gray-300 font-medium text-sm">🌐 Online Event</p>
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                  className="text-brand hover:text-brand-light text-sm mt-2 inline-block">
                  Join Meeting →
                </a>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm">{event.venue}</p>
                {event.venueMapLink && (
                  <a href={event.venueMapLink} target="_blank" rel="noopener noreferrer"
                    className="text-brand hover:text-brand-light text-sm mt-2 inline-block">
                    View on Maps →
                  </a>
                )}
              </>
            )}
          </div>

          {/* Category + tags */}
          <div className="p-6 border border-border rounded-xl bg-surface-raised hover:border-brand/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <Tag className="w-5 h-5 text-brand flex-shrink-0" />
              <h3 className="font-semibold">Category</h3>
            </div>
            <p className="text-gray-300 capitalize text-sm mb-3">{event.category}</p>
            <div className="flex flex-wrap gap-2">
              {event.tags?.slice(0, 4).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-brand/20 text-brand text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Description (Markdown rendered) ─────────────────────────────── */}
        {descriptionHtml && (
          <div className="border-t border-border pt-12 mb-12">
            <h2 className="text-3xl font-bold mb-8">About This Event</h2>

            {/* Rendered markdown — uses same CSS classes as the editor preview */}
            <div
              className="event-md-body"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
        )}

        {/* ── Prizes ──────────────────────────────────────────────────────── */}
        {event.prizesAndGoodies && (
          <div className="border-t border-border pt-12 mb-12">
            <h2 className="text-3xl font-bold mb-6">🎁 Prizes & Goodies</h2>
            <div className="p-6 bg-surface-raised border border-border rounded-xl">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{event.prizesAndGoodies}</p>
            </div>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="p-12 border border-brand/20 bg-brand/5 rounded-xl text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to join?</h3>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Register now and get a personalised ticket with a unique QR code.
            {event.sendTicketEmails && ' You\'ll receive a confirmation email instantly.'}
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
      <footer className="border-t border-border px-6 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} EventGlow · Powered by college event management.</p>
      </footer>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type}
            onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/*
        ── Global prose styles for rendered markdown on the public page ──────
        These expand on the same md-* classes used in MarkdownEditor's preview
        with sizes more appropriate for a public landing page.
      */}
      <style>{`
        .event-md-body .md-h1 { font-size: 2rem; font-weight: 700; color: #fff; margin: 1.6rem 0 0.6rem; line-height: 1.2; }
        .event-md-body .md-h2 { font-size: 1.5rem; font-weight: 700; color: #e5e5e5; margin: 1.4rem 0 0.5rem; padding-bottom: 0.3rem; border-bottom: 1px solid #2a2a3a; }
        .event-md-body .md-h3 { font-size: 1.15rem; font-weight: 600; color: #d4d4d4; margin: 1rem 0 0.3rem; }
        .event-md-body .md-p  { margin: 0.6rem 0; color: #b4b4b4; line-height: 1.8; font-size: 1.05rem; }
        .event-md-body .md-ul { list-style: disc; padding-left: 1.6rem; margin: 0.6rem 0; }
        .event-md-body .md-ol { list-style: decimal; padding-left: 1.6rem; margin: 0.6rem 0; }
        .event-md-body .md-li { margin: 0.35rem 0; color: #b4b4b4; font-size: 1.05rem; line-height: 1.7; }
        .event-md-body .md-hr { border: none; border-top: 1px solid #2a2a3a; margin: 1.6rem 0; }
        .event-md-body .md-code { background: #1e1e2e; color: #a5f3fc; padding: 0.15em 0.5em; border-radius: 5px; font-family: monospace; font-size: 0.9em; }
        .event-md-body .md-link { color: #818cf8; text-decoration: underline; }
        .event-md-body .md-link:hover { color: #a5b4fc; }
        .event-md-body .md-img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.2rem 0; max-height: 600px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
        .event-md-body .md-blockquote {
          border-left: 3px solid #6C47FF;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          color: #9ca3af;
          font-style: italic;
          background: rgba(108,71,255,0.07);
          border-radius: 0 8px 8px 0;
          font-size: 1.05rem;
        }
        .event-md-body strong { color: #fff; }
        .event-md-body em { color: #d4d4d4; }
        .event-md-body del { color: #6b7280; }
      `}</style>
    </div>
  );
};

export default PublicEventPage;