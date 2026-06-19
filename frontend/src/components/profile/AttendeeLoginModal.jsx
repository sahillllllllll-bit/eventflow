import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import axiosInstance from '../../api/axios.js';
import { useAttendee } from '../../context/AttendeeContext.jsx';

const AttendeeLoginModal = ({ onClose, onLoggedIn }) => {
  const { setAttendee } = useAttendee();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/attendee/login', {
        email: email.trim(),
        password,
      });
      const { userId, name, hasPassword, registeredEvents } = res.data;
      setAttendee({ userId, name, email: email.trim().toLowerCase(), hasPassword, registeredEvents });
      onLoggedIn?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg border border-border w-full max-w-sm p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <LogIn className="w-5 h-5 text-brand shrink-0" />
          <div>
            <h2 className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.1em' }}>
              Login
            </h2>
            <p className="text-gray-600 text-xs mt-0.5">Use your email + password</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white text-sm px-3 py-2.5 outline-none placeholder-gray-600 transition"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white text-sm px-3 py-2.5 outline-none placeholder-gray-600 transition"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand hover:bg-brand-light text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-50"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AttendeeLoginModal;