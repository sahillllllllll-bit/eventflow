import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Calendar, MapPin, Shield, ShieldCheck, LogOut } from 'lucide-react';
import { useAttendee } from '../context/AttendeeContext.jsx';
import axiosInstance from '../api/axios.js';
import RestoreAccessModal from '../components/profile/RestoreAccessModal.jsx';
import SetPasswordModal from '../components/profile/SetPasswordModal.jsx';
import AttendeeLoginModal from '../components/profile/AttendeeLoginModal.jsx';

// ── Event card in profile ─────────────────────────────────────
const JoinedEventCard = ({ event }) => {
  const date = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date TBA';

  const isPast = event.endDate ? new Date(event.endDate) < new Date() : false;

  return (
    <div className="border border-white/10 hover:border-white/20 transition p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-white font-black uppercase text-sm truncate"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{date}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2 mt-0.5 text-gray-500 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
        </div>
        {isPast && (
          <span className="text-xs text-gray-600 border border-white/10 px-2 py-0.5 shrink-0">Past</span>
        )}
      </div>
      <Link
        to={`/chat/${event._id}`}
        className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest transition"
        style={{
          fontFamily: '"Arial Black", sans-serif',
          letterSpacing: '0.12em',
          borderLeft: '3px solid #6c5ce7',
          background: 'rgba(108,92,231,0.08)',
          color: '#a29bfe',
        }}
      >
        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
        Open Chatroom
      </Link>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ProfilePage
// ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { attendee, isLoggedIn, logout } = useAttendee();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!attendee?.userId) return;
    setLoading(true);
    axiosInstance.get('/attendee/profile', { params: { userId: attendee.userId } })
      .then((r) => setProfile(r.data.profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attendee?.userId]);

  // ── Not logged in ────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-bg text-white">
        <nav className="border-b border-border px-4 sm:px-6 py-4 bg-bg/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span
              className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              My Profile
            </span>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-center">
          <p className="text-gray-500 text-sm mb-6">
            Register for an event to create your profile. Already registered?
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
          </div>
          <Link to="/" className="text-gray-700 text-xs mt-6 hover:text-gray-500 transition">
            Browse events →
          </Link>
        </div>

        {showRestore && <RestoreAccessModal onClose={() => setShowRestore(false)} />}
        {showLogin && <AttendeeLoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  const events = profile?.registeredEvents || [];

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Nav */}
      <nav className="border-b border-border px-4 sm:px-6 py-4 bg-bg/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span
              className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              My Profile
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-gray-600 hover:text-white text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear session</span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Profile card */}
        <div className="border border-white/10 p-5 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-white font-black uppercase text-xl"
                style={{ fontFamily: '"Arial Black", sans-serif' }}
              >
                {attendee.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{attendee.email}</p>
            </div>
            {/* Security badge */}
            {attendee.hasPassword
              ? <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Secured</span>
                </div>
              : <div className="flex items-center gap-1.5 text-gray-600 text-xs font-bold">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Basic</span>
                </div>
            }
          </div>

          {/* Expiry info */}
          {attendee.expiresAt && (
            <p className="text-gray-700 text-xs mt-3">
              Session active until {new Date(attendee.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* Security toggle */}
          <div className="mt-4 pt-4 border-t border-white/5">
            {!attendee.hasPassword ? (
              <button
                onClick={() => setShowSetPassword(true)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Set a password to access from any device</span>
                <span className="ml-auto text-brand text-xs font-bold">Enable →</span>
              </button>
            ) : (
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Password set — you can login from any device anytime.
              </p>
            )}
          </div>
        </div>

        {/* Joined events */}
        <div>
          <p
            className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-4"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            {events.length} joined event{events.length !== 1 ? 's' : ''}
          </p>

          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-12 border border-white/5">
              <p className="text-gray-700 text-sm">No events joined yet.</p>
              <Link to="/" className="text-brand text-xs mt-2 inline-block hover:underline">
                Browse events →
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <JoinedEventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      <div className="mt-8">
         <p
            className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-4"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            Issued Certificates
          </p>
      </div>
      </div>

      {showSetPassword && <SetPasswordModal onClose={() => setShowSetPassword(false)} />}

    </div>
  );
};

export default ProfilePage;