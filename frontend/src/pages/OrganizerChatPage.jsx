import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Megaphone, MessageSquare } from 'lucide-react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useChatRoom } from '../hooks/useChatRoom.js';
import axiosInstance from '../api/axios.js';
import Sidebar from '../components/Sidebar.jsx';

// ── Avatar color ──────────────────────────────────────────────
const AVATAR_COLORS = ['#6c5ce7','#00b894','#e17055','#0984e3','#fd79a8','#fdcb6e','#55efc4','#a29bfe'];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── Message bubble ────────────────────────────────────────────
const MessageBubble = ({ msg, myEmail }) => {
  const isOwn = msg.senderEmail === myEmail;
  const color = avatarColor(msg.senderName);
  const time  = new Date(msg.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  // Organiser announcement
  if (msg.isOrganiser || msg.isAnnouncement) {
    return (
      <div className="flex justify-center my-4 px-2">
        <div className={`w-full max-w-lg px-4 py-3 border ${
          isOwn
            ? 'bg-brand/15 border-brand/50'
            : 'bg-brand/5 border-brand/20'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-brand text-xs font-black uppercase tracking-widest">
              {msg.senderName} {isOwn && '(You)'}
            </span>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed">{msg.text}</p>
          <p className="text-gray-600 text-xs mt-1.5">{time}</p>
        </div>
      </div>
    );
  }

  // Attendee message
  return (
    <div className="flex gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-1"
        style={{ background: color }}
      >
        {initials(msg.senderName)}
      </div>
      <div className="flex flex-col items-start max-w-[72%]">
        <span className="text-xs font-bold mb-1" style={{ color }}>{msg.senderName}</span>
        <div className="bg-white/5 border border-white/10 text-gray-200 px-3 py-2 text-sm leading-relaxed">
          {msg.text}
        </div>
        <span className="text-xs text-gray-600 mt-1">{time}</span>
      </div>
    </div>
  );
};

// ── Select event screen (when no eventId in URL) ──────────────
const SelectEventScreen = ({ events, onSelect }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
    <MessageSquare className="w-12 h-12 text-gray-700 mb-4" />
    <h2 className="text-white font-black uppercase text-lg mb-2"
      style={{ fontFamily: '"Arial Black", sans-serif' }}>
      Select an Event
    </h2>
    <p className="text-gray-500 text-sm mb-8">Choose which event's chatroom to open</p>
    <div className="w-full max-w-sm flex flex-col gap-2">
      {events.length === 0 && (
        <p className="text-gray-600 text-sm text-center">No events found.</p>
      )}
      {events.map(ev => (
        <button
          key={ev._id}
          onClick={() => onSelect(ev._id)}
          className="flex items-center gap-3 px-4 py-3 border border-white/10 hover:border-white/30 text-left transition"
        >
          <MessageSquare className="w-4 h-4 text-brand shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-sm font-bold truncate">{ev.title}</p>
            <p className="text-gray-600 text-xs">{ev.currentRegistrations || 0} registered</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  OrganizerChatPage — dashboard community chatroom
//  Route: /dashboard/chat  OR  /dashboard/chat/:eventId
// ─────────────────────────────────────────────────────────────
const OrganizerChatPage = () => {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [selectedEventId, setSelectedEventId] = useState(paramEventId || null);
  const [myEvents, setMyEvents]               = useState([]);
  const [eventsLoading, setEventsLoading]     = useState(true);
  const [eventInfo, setEventInfo]             = useState(null);
  const [memberCount, setMemberCount]         = useState(null);
  const [input, setInput]                     = useState('');

  const orgOptions = { organizerAuth: true, token: token || localStorage.getItem('token') };

  const { messages, loading, sending, sendMessage, access, bottomRef } =
    useChatRoom(selectedEventId, orgOptions);

  // Fetch organiser's events for selector
  useEffect(() => {
    axiosInstance.get('/events/my', { params: { limit: 100 } })
      .then(r => setMyEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  // Fetch event info when event selected
  useEffect(() => {
    if (!selectedEventId) return;
    axiosInstance.get(`/events/${selectedEventId}/public-info`)
      .then(r => setEventInfo(r.data.event))
      .catch(() => {});
  }, [selectedEventId]);

  // Fetch member count
  useEffect(() => {
    if (!selectedEventId || access !== 'granted') return;
    axiosInstance.get(`/chat/${selectedEventId}/members`, {
      params: { organizerAuth: true },
      headers: { Authorization: `Bearer ${orgOptions.token}` },
    })
      .then(r => setMemberCount(r.data.count))
      .catch(() => {});
  }, [selectedEventId, access]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedEventId) return;
    await sendMessage(input, true); // true = isOrganiser
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  return (
    <div className="min-h-screen bg-bg text-white flex">
      <Sidebar />

      <div className="lg:ml-60 flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay px-4 sm:px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {selectedEventId && (
              <button
                onClick={() => setSelectedEventId(null)}
                className="text-gray-500 hover:text-white transition lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-lg truncate">
                {selectedEventId && eventInfo
                  ? eventInfo.title
                  : 'Community Chatroom'
                }
              </h1>
              {selectedEventId && (
                <p className="text-gray-500 text-xs flex items-center gap-3 mt-0.5">
                  {memberCount !== null && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {memberCount} attendee{memberCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-brand">
                    <Megaphone className="w-3 h-3" />
                    Organiser view
                  </span>
                </p>
              )}
            </div>

            {/* Event switcher dropdown */}
            {selectedEventId && myEvents.length > 1 && (
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="bg-surface-overlay border border-surface-overlay text-white text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-brand"
              >
                {myEvents.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Organiser notice */}
        {selectedEventId && (
          <div className="bg-brand/10 border-b border-brand/20 px-4 py-2 text-center">
            <p className="text-brand text-xs font-bold uppercase tracking-widest">
              📢 Your messages appear as announcements and are emailed to all attendees
            </p>
          </div>
        )}

        {/* Content */}
        {!selectedEventId ? (
          eventsLoading
            ? <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            : <SelectEventScreen events={myEvents} onSelect={setSelectedEventId} />
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl w-full mx-auto">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Megaphone className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-gray-600 text-sm">No messages yet in this chatroom.</p>
                  <p className="text-gray-700 text-xs mt-1">
                    Send an announcement to all attendees below.
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <MessageBubble key={msg._id} msg={msg} myEmail={user?.email} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="sticky bottom-0 bg-bg border-t border-border px-4 py-3">
              <div className="max-w-4xl mx-auto">
                <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <Megaphone className="w-3 h-3 text-brand" />
                  Announcement — visible to all + emailed to registered attendees
                </p>
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                  <div className="flex-1 bg-brand/5 border border-brand/30 focus-within:border-brand/60 transition">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type an announcement for all attendees..."
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
                    className="p-2.5 bg-brand hover:bg-brand-light text-white transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Megaphone className="w-4 h-4" />
                    }
                  </button>
                </form>
                <p className="text-xs text-gray-700 mt-1.5 text-center">
                  Sending as <span className="text-gray-500">{user?.name}</span> (Organiser)
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizerChatPage;