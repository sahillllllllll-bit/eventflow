import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Lock, Megaphone } from 'lucide-react';
import { useChatRoom } from '../hooks/useChatRoom.js';
import { useAttendee } from '../context/AttendeeContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import axiosInstance from '../api/axios.js';
import RestoreAccessModal from '../components/profile/RestoreAccessModal.jsx';

// ── Avatar color ──────────────────────────────────────────────
const AVATAR_COLORS = ['#6c5ce7','#00b894','#e17055','#0984e3','#fd79a8','#fdcb6e','#55efc4','#a29bfe'];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── Message bubble ────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn, isOrgMsg }) => {
  const color = avatarColor(msg.senderName);
  const time  = new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Organiser announcement — full-width banner
  if (msg.isOrganiser || msg.isAnnouncement) {
    return (
      <div className="flex justify-center my-4 px-2">
        <div className="w-full max-w-lg border border-brand/40 bg-brand/10 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-brand text-xs font-black uppercase tracking-widest">
              {msg.senderName}
            </span>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed">{msg.text}</p>
          <p className="text-gray-600 text-xs mt-1.5">{time}</p>
        </div>
      </div>
    );
  }

  // Regular attendee bubble
  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-1"
          style={{ background: color }}
        >
          {initials(msg.senderName)}
        </div>
      )}
      <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs font-bold mb-1" style={{ color }}>{msg.senderName}</span>
        )}
        <div className={`px-3 py-2 text-sm leading-relaxed ${
          isOwn ? 'bg-brand text-white' : 'bg-white/5 border border-white/10 text-gray-200'
        }`}>
          {msg.text}
        </div>
        <span className="text-xs text-gray-600 mt-1">{time}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ChatRoomPage
//  Works for both attendees (/chat/:eventId)
//  and organisers (/dashboard/chat/:eventId)
// ─────────────────────────────────────────────────────────────
const ChatRoomPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  // Attendee identity
  const { attendee, isLoggedIn: isAttendeeLoggedIn } = useAttendee();
  // Organiser identity (from dashboard JWT)
  const authCtx   = useContext(AuthContext);
  const orgUser   = authCtx?.user;
  const orgToken  = authCtx?.token || localStorage.getItem('token');

  // Is this page being accessed as organiser?
  const isOrganiser = !!orgUser && !!orgToken;

  const { messages, loading, error, access, sending, sendMessage, bottomRef } =
    useChatRoom(eventId, isOrganiser ? { organizerAuth: true, token: orgToken } : null);

  const [input, setInput]           = useState('');
  const [eventInfo, setEventInfo]   = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [showRestore, setShowRestore] = useState(false);

  // Fetch event info for header
  useEffect(() => {
    axiosInstance.get(`/events/${eventId}/public-info`)
      .then(r => setEventInfo(r.data.event))
      .catch(() => {});
  }, [eventId]);

  // Fetch member count (organiser uses JWT, attendee uses userId)
  useEffect(() => {
    if (access !== 'granted') return;
    const params = isOrganiser
      ? { organizerAuth: true }
      : { userId: attendee?.userId };
    axiosInstance.get(`/chat/${eventId}/members`, { params })
      .then(r => setMemberCount(r.data.count))
      .catch(() => {});
  }, [eventId, access, isOrganiser, attendee?.userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input, isOrganiser);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  // ── Not logged in as either ──────────────────────────────────
  if (!isOrganiser && !isAttendeeLoggedIn) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center px-4">
        <Lock className="w-12 h-12 text-gray-600 mb-4" />
        <h2 className="text-xl font-black uppercase mb-2" style={{ fontFamily: '"Arial Black", sans-serif' }}>
          Access Required
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Register for this event to join the chatroom.
        </p>
        <button
          onClick={() => setShowRestore(true)}
          className="px-4 py-2 border border-white/20 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest transition mb-3"
        >
          Already registered? Restore access
        </button>
        <Link to={`/events/${eventId}`} className="text-brand text-sm hover:underline">
          Go to event page
        </Link>
        {showRestore && <RestoreAccessModal onClose={() => setShowRestore(false)} />}
      </div>
    );
  }

  // ── Attendee not a member ────────────────────────────────────
  if (!isOrganiser && access === 'denied') {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center px-4">
        <Lock className="w-12 h-12 text-gray-600 mb-4" />
        <h2 className="text-xl font-black uppercase mb-2" style={{ fontFamily: '"Arial Black", sans-serif' }}>
          Not Registered
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          You need to register for this event to access the chatroom.
        </p>
        <Link to={`/events/${eventId}`}
          className="px-4 py-2 bg-brand text-white text-xs font-black uppercase tracking-widest">
          Register Now
        </Link>
      </div>
    );
  }

  const myEmail = isOrganiser ? orgUser?.email : attendee?.email;

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-white font-black uppercase truncate text-sm sm:text-base"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              {eventInfo?.title || 'Event Chatroom'}
            </h1>
            <p className="text-gray-500 text-xs flex items-center gap-2 mt-0.5">
              {memberCount !== null && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </span>
              )}
              {isOrganiser && (
                <span className="flex items-center gap-1 text-brand">
                  <Megaphone className="w-3 h-3" />
                  Organiser view
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Organiser notice bar ─────────────────────────────────── */}
      {isOrganiser && (
        <div className="bg-brand/10 border-b border-brand/20 px-4 py-2 text-center">
          <p className="text-brand text-xs font-bold uppercase tracking-widest">
            📢 Messages you send appear as announcements and are emailed to all attendees
          </p>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl w-full mx-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-600 text-sm">No messages yet.</p>
            <p className="text-gray-700 text-xs mt-1">
              {isOrganiser ? 'Send an announcement to all attendees 📢' : 'Be the first to say hi 👋'}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isOwn={msg.senderEmail === myEmail}
            isOrgMsg={msg.isOrganiser}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-bg border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {isOrganiser && (
            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-brand" />
              Your message will be shown as an announcement + emailed to all attendees
            </p>
          )}
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <div className={`flex-1 border focus-within:border-white/30 transition ${
              isOrganiser ? 'bg-brand/5 border-brand/30' : 'bg-white/5 border-white/10'
            }`}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOrganiser
                  ? 'Send announcement to all attendees...'
                  : 'Type a message...'
                }
                rows={1}
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none outline-none"
                style={{ maxHeight: '120px' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={`p-2.5 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                isOrganiser ? 'bg-brand/80 hover:bg-brand' : 'bg-brand hover:bg-brand-light'
              }`}
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : isOrganiser ? <Megaphone className="w-4 h-4" /> : <Send className="w-4 h-4" />
              }
            </button>
          </form>
          <p className="text-xs text-gray-700 mt-1.5 text-center">
            {isOrganiser
              ? `Sending as ${orgUser?.name} (Organiser)`
              : `Chatting as ${attendee?.name}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;