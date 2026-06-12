import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { markdownToHtml } from '../components/MarkdownEditor.jsx';
import { formatEventDate } from '../utils/helpers.js';
import { Calendar, MapPin, Users, Tag, ArrowRight, Share2 } from 'lucide-react';

const GRID_BG = {
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
  `,
  backgroundSize: '80px 80px',
};

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a', ...GRID_BG }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-500 uppercase tracking-widest text-xs font-black"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
            Loading Event...
          </p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isRegistrationClosed =
    (event.registrationClosesAt && new Date() > new Date(event.registrationClosesAt)) ||
    (event.endDate && new Date() > new Date(event.endDate));

  const descriptionHtml = event.description ? markdownToHtml(event.description) : '';

  const StampOverlay = ({ size = 'md' }) => (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div
        className="bg-red-600 text-white font-black uppercase tracking-widest border-4 border-red-400"
        style={{
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: size === 'lg' ? 'clamp(22px, 5vw, 56px)' : 'clamp(16px, 3.5vw, 40px)',
          padding: size === 'lg' ? 'clamp(12px, 2vw, 20px) clamp(24px, 4vw, 56px)' : '10px 28px',
          transform: 'rotate(-8deg)',
          letterSpacing: '0.1em',
          textShadow: '2px 2px 0px rgba(0,0,0,0.6)',
          boxShadow: '0 0 0 6px rgba(220,38,38,0.25), inset 0 0 0 3px rgba(255,255,255,0.1)',
        }}
      >
        REGISTRATION CLOSED
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#1a1a1a' }}>

      {/* ── NAV ── */}
      <nav
        className="border-b border-white/10 px-4 sm:px-6 py-4 sticky top-0 z-40 backdrop-blur"
        style={{ backgroundColor: 'rgba(26,26,26,0.95)' }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span
            className="font-black uppercase text-white text-sm sm:text-base tracking-wider truncate max-w-[60%]"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
          >
            {event.title}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Link copied!', 'success');
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative w-full px-4 sm:px-6 lg:px-10 py-8 sm:py-10 lg:py-12"
        style={{ backgroundColor: '#111', ...GRID_BG }}
      >
        {event.coverImage ? (
          <>
            {isRegistrationClosed && <StampOverlay size="lg" />}

            {/* Mobile & Tablet — stacked */}
            <div className="md:hidden flex flex-col gap-5 max-w-2xl mx-auto">
              <div
                className="w-full overflow-hidden border border-white/10"
                style={{ maxHeight: '260px' }}
              >
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full object-cover"
                  style={{ maxHeight: '260px' }}
                />
              </div>
              <div className="text-center py-4 px-2">
                <p
                  className="text-gray-600 uppercase tracking-widest text-xs font-black mb-3"
                  style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.2em' }}
                >
                  — {event.category} —
                </p>
                <h1
                  className="text-gray-300 font-black uppercase leading-none mb-4"
                  style={{
                    fontSize: 'clamp(28px, 7vw, 52px)',
                    fontFamily: '"Arial Black", Impact, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {event.title}
                </h1>
                {event.shortSummary && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-7 max-w-md mx-auto">
                    {event.shortSummary}
                  </p>
                )}
                {!isRegistrationClosed && (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => navigate(`/e/${slug}/register`)}
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand hover:bg-brand-light text-white font-black uppercase tracking-wider transition text-sm"
                      style={{ fontFamily: '"Arial Black", sans-serif' }}
                    >
                      Register Now <ArrowRight className="w-4 h-4" />
                    </button>
                    {event.isPaid && (
                      <span className="text-gray-600 text-xs font-black uppercase tracking-widest"
                        style={{ fontFamily: '"Arial Black", sans-serif' }}>
                        ₹{event.ticketPrice} per ticket
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop — side by side with gap and padding */}
            <div className="hidden md:grid grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
              <div
                className="overflow-hidden border border-white/10 w-full"
                style={{ height: '400px', maxHeight: '440px' }}
              >
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center py-6">
                <p
                  className="text-gray-600 uppercase tracking-widest text-xs font-black mb-4"
                  style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.2em' }}
                >
                  — {event.category} —
                </p>
                <h1
                  className="text-gray-300 font-black uppercase leading-none mb-5"
                  style={{
                    fontSize: 'clamp(28px, 3.5vw, 60px)',
                    fontFamily: '"Arial Black", Impact, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {event.title}
                </h1>
                {event.shortSummary && (
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                    {event.shortSummary}
                  </p>
                )}
                {!isRegistrationClosed && (
                  <div className="flex flex-row flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/e/${slug}/register`)}
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand hover:bg-brand-light text-white font-black uppercase tracking-wider transition text-sm"
                      style={{ fontFamily: '"Arial Black", sans-serif' }}
                    >
                      Register Now <ArrowRight className="w-4 h-4" />
                    </button>
                    {event.isPaid && (
                      <div
                        className="inline-flex items-center px-5 py-3.5 border border-white/10 text-gray-400 text-sm font-black uppercase tracking-wider"
                        style={{ fontFamily: '"Arial Black", sans-serif' }}
                      >
                        ₹{event.ticketPrice}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── NO COVER IMAGE — same padded layout ── */
          <>
            {isRegistrationClosed && <StampOverlay size="lg" />}
            <div className="relative z-10 max-w-4xl mx-auto text-center py-16 sm:py-24 md:py-28 px-2">
              <p
                className="text-gray-600 uppercase tracking-widest text-xs font-black mb-5"
                style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.2em' }}
              >
                — {event.category} —
              </p>
              <h1
                className="text-gray-400 font-black uppercase leading-none mb-6 w-full"
                style={{
                  fontSize: 'clamp(36px, 8vw, 110px)',
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                {event.title}
              </h1>
              {event.shortSummary && (
                <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
                  {event.shortSummary}
                </p>
              )}
              {!isRegistrationClosed && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => navigate(`/e/${slug}/register`)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand hover:bg-brand-light text-white font-black uppercase tracking-wider transition text-sm"
                    style={{ fontFamily: '"Arial Black", sans-serif' }}
                  >
                    Register Now <ArrowRight className="w-4 h-4" />
                  </button>
                  {event.isPaid && (
                    <div
                      className="inline-flex items-center justify-center px-6 py-4 border border-white/15 text-gray-400 text-sm font-black uppercase tracking-wider"
                      style={{ fontFamily: '"Arial Black", sans-serif' }}
                    >
                      ₹{event.ticketPrice}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── INFO STRIP ── */}
      <div
        className="w-full border-y border-white/10 px-4 sm:px-6 py-4"
        style={{ backgroundColor: '#161616' }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap gap-4 sm:gap-8 justify-center sm:justify-start">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: '"Arial Black", sans-serif' }}>
            <Calendar className="w-3.5 h-3.5 text-brand flex-shrink-0" />
            {formatEventDate(event.date)}
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-wider"
            style={{ fontFamily: '"Arial Black", sans-serif' }}>
            <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
            {event.isOnline ? 'Online' : event.venue}
          </div>
          {event.maxCapacity && (
            <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-wider"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              <Users className="w-3.5 h-3.5 text-brand flex-shrink-0" />
              {event.maxCapacity} seats
            </div>
          )}
          {event.isPaid ? (
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              ₹{event.ticketPrice} entry
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-400"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              Free entry
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL CARDS ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/5 mb-16">

          <div className="p-6 sm:p-8 hover:bg-white/[0.03] transition" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brand" />
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest"
                style={{ fontFamily: '"Arial Black", sans-serif' }}>
                Date & Time
              </p>
            </div>
            <p className="text-white text-sm font-semibold mb-1">{formatEventDate(event.date)}</p>
            {event.endDate && (
              <p className="text-gray-500 text-xs">Until: {formatEventDate(event.endDate)}</p>
            )}
            {event.registrationClosesAt && (
              <p className="text-red-500 text-xs mt-2 font-black uppercase tracking-wider"
                style={{ fontFamily: '"Arial Black", sans-serif' }}>
                Reg. closes: {formatEventDate(event.registrationClosesAt)}
              </p>
            )}
          </div>

          <div className="p-6 sm:p-8 hover:bg-white/[0.03] transition" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand" />
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest"
                style={{ fontFamily: '"Arial Black", sans-serif' }}>
                Location
              </p>
            </div>
            {event.isOnline ? (
              <>
                <p className="text-white text-sm font-semibold mb-2">Online Event</p>
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                  className="text-brand hover:text-brand-light text-xs font-black uppercase tracking-wider transition"
                  style={{ fontFamily: '"Arial Black", sans-serif' }}>
                  Join Link →
                </a>
              </>
            ) : (
              <>
                <p className="text-white text-sm font-semibold mb-2">{event.venue}</p>
                {event.venueMapLink && (
                  <a href={event.venueMapLink} target="_blank" rel="noopener noreferrer"
                    className="text-brand hover:text-brand-light text-xs font-black uppercase tracking-wider transition"
                    style={{ fontFamily: '"Arial Black", sans-serif' }}>
                    View on Maps →
                  </a>
                )}
              </>
            )}
          </div>

          <div className="p-6 sm:p-8 hover:bg-white/[0.03] transition" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-brand" />
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest"
                style={{ fontFamily: '"Arial Black", sans-serif' }}>
                Category
              </p>
            </div>
            <p className="text-white text-sm font-black uppercase tracking-wider mb-4"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              {event.category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {event.tags?.slice(0, 4).map((tag, i) => (
                <span key={i}
                  className="px-2 py-0.5 border border-brand/30 text-brand text-[10px] font-black uppercase tracking-wider"
                  style={{ fontFamily: '"Arial Black", sans-serif' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── PRIZES ── */}
        {event.prizesAndGoodies && (
          <div className="mb-16 border-t border-white/10 pt-12">
            <p className="text-gray-600 text-xs font-black uppercase tracking-widest mb-2"
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.2em' }}>
              Prizes & Goodies
            </p>
            <h2 className="text-gray-300 font-black uppercase text-2xl sm:text-3xl mb-6"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
              What you win.
            </h2>
            <div className="p-6 sm:p-8 border border-white/10 hover:border-white/20 transition"
              style={{ backgroundColor: '#161616' }}>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {event.prizesAndGoodies}
              </p>
            </div>
          </div>
        )}

        {/* ── DESCRIPTION ── */}
        {descriptionHtml && (
          <div className="mb-16 border-t border-white/10 pt-12">
            <p className="text-gray-600 text-xs font-black uppercase tracking-widest mb-2"
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.2em' }}>
              About
            </p>
            <h2 className="text-gray-300 font-black uppercase text-2xl sm:text-3xl mb-8"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
              About this event.
            </h2>
            <div className="event-md-body" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="relative border border-white/10 p-8 sm:p-12 md:p-16 text-center overflow-hidden"
          style={{ backgroundColor: '#111', ...GRID_BG }}
        >
          {isRegistrationClosed ? (
            <div className="relative py-8">
              <div
                className="inline-block bg-red-600 text-white font-black uppercase mb-6"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 40px)',
                  padding: 'clamp(10px,1.5vw,20px) clamp(20px,3vw,56px)',
                  transform: 'rotate(-4deg)',
                  letterSpacing: '0.1em',
                  border: '4px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 0 0 5px rgba(220,38,38,0.3)',
                  textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                }}
              >
                Registration Closed
              </div>
              <p className="text-gray-600 text-sm mt-6">
                This event is no longer accepting registrations.
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest mb-3"
                style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.2em' }}>
                — Ready to join? —
              </p>
              <h3
                className="text-gray-300 font-black uppercase leading-none mb-4"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: 'clamp(28px, 5vw, 64px)',
                }}
              >
                Register Now.
              </h3>
              <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
                Get a personalised ticket with a unique QR code.
                {event.sendTicketEmails && " You'll receive a confirmation email instantly."}
              </p>
              <button
                onClick={() => navigate(`/e/${slug}/register`)}
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 bg-brand hover:bg-brand-light text-white font-black uppercase tracking-wider transition text-sm"
                style={{ fontFamily: '"Arial Black", sans-serif' }}
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </button>
              {event.isPaid && (
                <p className="text-gray-600 text-xs mt-4 uppercase tracking-widest font-black"
                  style={{ fontFamily: '"Arial Black", sans-serif' }}>
                  ₹{event.ticketPrice} per ticket
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 px-4 sm:px-6 py-8 text-center" style={{ backgroundColor: '#111' }}>
        <p className="text-gray-700 text-xs font-black uppercase tracking-widest"
          style={{ fontFamily: '"Arial Black", sans-serif' }}>
          © {new Date().getFullYear()} EventGlow · Made for college events.
        </p>
      </footer>

      {/* Toasts */}
      <div className="fixed bottom-6 right-4 sm:right-6 space-y-3 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type}
            onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      <style>{`
        .event-md-body .md-h1 { font-size: 2rem; font-weight: 700; color: #fff; margin: 1.6rem 0 0.6rem; line-height: 1.2; }
        .event-md-body .md-h2 { font-size: 1.5rem; font-weight: 700; color: #e5e5e5; margin: 1.4rem 0 0.5rem; padding-bottom: 0.3rem; border-bottom: 1px solid #2a2a2a; }
        .event-md-body .md-h3 { font-size: 1.15rem; font-weight: 600; color: #d4d4d4; margin: 1rem 0 0.3rem; }
        .event-md-body .md-p  { margin: 0.6rem 0; color: #b4b4b4; line-height: 1.8; font-size: 1.05rem; }
        .event-md-body .md-ul { list-style: disc; padding-left: 1.6rem; margin: 0.6rem 0; }
        .event-md-body .md-ol { list-style: decimal; padding-left: 1.6rem; margin: 0.6rem 0; }
        .event-md-body .md-li { margin: 0.35rem 0; color: #b4b4b4; font-size: 1.05rem; line-height: 1.7; }
        .event-md-body .md-hr { border: none; border-top: 1px solid #2a2a2a; margin: 1.6rem 0; }
        .event-md-body .md-code { background: #1e1e2e; color: #a5f3fc; padding: 0.15em 0.5em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .event-md-body .md-link { color: #818cf8; text-decoration: underline; }
        .event-md-body .md-link:hover { color: #a5b4fc; }
        .event-md-body .md-blockquote { border-left: 3px solid #6C47FF; padding: 0.5rem 1rem; margin: 1rem 0; color: #9ca3af; font-style: italic; background: rgba(108,71,255,0.07); font-size: 1.05rem; }
        .event-md-body strong { color: #fff; }
        .event-md-body em { color: #d4d4d4; }
        .event-md-body del { color: #6b7280; }
      `}</style>
    </div>
  );
};

export default PublicEventPage;