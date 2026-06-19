import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Calendar, Lock } from 'lucide-react';
import { useAttendee } from '../context/AttendeeContext.jsx';
import RestoreAccessModal from '../components/profile/RestoreAccessModal.jsx';
import AttendeeLoginModal from '../components/profile/AttendeeLoginModal.jsx';

// ── Color from event id ───────────────────────────────────────
const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fd79a8', '#fdcb6e'];
const roomColor = (id = '') => COLORS[id.charCodeAt(id.length - 1) % COLORS.length];

const ChatRoomCard = ({ event }) => {
  const color = roomColor(event._id?.toString());
  const date = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'TBA';

  return (
    <Link
      to={`/chat/${event._id}`}
      className="flex items-center gap-4 border border-white/10 hover:border-white/25 p-4 transition group"
    >
      {/* color dot */}
      <div
        className="w-10 h-10 shrink-0 flex items-center justify-center"
        style={{ background: color + '22', border: `1.5px solid ${color}55` }}
      >
        <MessageSquare className="w-4 h-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-white font-black uppercase text-sm truncate"
          style={{ fontFamily: '"Arial Black", sans-serif' }}
        >
          {event.title}
        </p>
        <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {date}
          {event.category && (
            <span className="ml-2 uppercase tracking-widest">{event.category}</span>
          )}
        </p>
      </div>

      <span className="text-gray-700 group-hover:text-gray-400 transition text-xs font-bold uppercase tracking-widest">
        Open →
      </span>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────
//  CommunityPage
// ─────────────────────────────────────────────────────────────
const CommunityPage = () => {
  const { attendee, isLoggedIn } = useAttendee();
  const [showRestore, setShowRestore] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const events = attendee?.registeredEvents || [];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-bg text-white">
        <nav className="border-b border-border px-4 sm:px-6 py-4 bg-bg/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              Community
            </span>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <Lock className="w-10 h-10 text-gray-700 mb-4" />
          <h2
            className="text-white font-black uppercase text-2xl mb-2"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            Join an Event First
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xs">
            Register for any event to access its community chatroom. Already registered on this device before?
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => setShowRestore(true)}
              className="w-full py-2.5 border border-white/20 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest transition"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              Restore via Email OTP
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="w-full py-2.5 bg-brand text-white text-xs font-black uppercase tracking-widest transition"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              Login with Password
            </button>
            <Link
              to="/"
              className="w-full py-2.5 border border-white/10 text-gray-600 hover:text-white text-xs font-black uppercase tracking-widest transition text-center"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              Browse Events
            </Link>
          </div>
        </div>

        {showRestore && <RestoreAccessModal onClose={() => setShowRestore(false)} />}
        {showLogin && <AttendeeLoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <nav className="border-b border-border px-4 sm:px-6 py-4 bg-bg/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/" className="text-gray-500 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              Community
            </span>
            <p className="text-gray-600 text-xs">Your event chatrooms</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <p
          className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-5"
          style={{ fontFamily: '"Arial Black", sans-serif' }}
        >
          {events.length} chatroom{events.length !== 1 ? 's' : ''} available
        </p>

        {events.length === 0 ? (
          <div className="text-center py-20 border border-white/5">
            <p className="text-gray-700 text-sm mb-3">No chatrooms yet.</p>
            <Link to="/" className="text-brand text-xs hover:underline">
              Browse and register for events →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <ChatRoomCard
                key={event._id || event}
                event={typeof event === 'object' ? event : { _id: event, title: 'Event' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;