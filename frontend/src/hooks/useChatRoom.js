import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axiosInstance from '../api/axios.js';
import { useAttendee } from '../context/AttendeeContext.jsx';

// ─────────────────────────────────────────────────────────────
//  useChatRoom
//  Works for both attendees and organisers
//  orgOptions = { organizerAuth: true, token: '...' } for organiser
// ─────────────────────────────────────────────────────────────
export const useChatRoom = (eventId, orgOptions = null) => {
  const { attendee } = useAttendee();
  const isOrganiser  = !!orgOptions?.organizerAuth;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sending, setSending]   = useState(false);
  const [access, setAccess]     = useState(null); // 'granted'|'denied'|null
  const bottomRef               = useRef(null);
  const socketRef               = useRef(null);

  // ── Fetch messages ───────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    // Organiser: always has access; Attendee: needs userId
    if (!isOrganiser && !attendee?.userId) return;

    setLoading(true);
    try {
      const params = isOrganiser
        ? { organizerAuth: true }
        : { userId: attendee.userId };

      const headers = isOrganiser && orgOptions?.token
        ? { Authorization: `Bearer ${orgOptions.token}` }
        : {};

      const res = await axiosInstance.get(`/chat/${eventId}/messages`, { params, headers });
      setMessages(res.data.messages || []);
      setAccess('granted');
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) setAccess('denied');
      else setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [eventId, attendee?.userId, isOrganiser, orgOptions?.token]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── Socket.io real-time ──────────────────────────────────────
  useEffect(() => {
    if (access !== 'granted' || !eventId) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: isOrganiser && orgOptions?.token ? { token: orgOptions.token } : undefined,
    });
    socketRef.current = socket;
    socket.emit('join_room', eventId);

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leave_room', eventId);
      socket.disconnect();
    };
  }, [access, eventId, isOrganiser, orgOptions?.token]);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (text, asOrganiser = false) => {
    if (!text?.trim()) return;
    setSending(true);
    try {
      const headers = asOrganiser && orgOptions?.token
        ? { Authorization: `Bearer ${orgOptions.token}` }
        : {};

      const body = asOrganiser
        ? { text: text.trim(), isOrganiser: true }
        : { userId: attendee?.userId, text: text.trim() };

      const res = await axiosInstance.post(`/chat/${eventId}/messages`, body, { headers });

      setMessages(prev => {
        if (prev.find(m => m._id === res.data.message._id)) return prev;
        return [...prev, res.data.message];
      });
    } catch (err) {
      console.error('Send failed:', err.response?.data?.message);
    } finally {
      setSending(false);
    }
  }, [eventId, attendee?.userId, orgOptions?.token]);

  return { messages, loading, error, access, sending, sendMessage, bottomRef };
};