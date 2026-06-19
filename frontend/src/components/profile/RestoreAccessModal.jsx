import React, { useState } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import axiosInstance from '../../api/axios.js';
import { useAttendee } from '../../context/AttendeeContext.jsx';

// ─────────────────────────────────────────────────────────────
//  RestoreAccessModal
//  Step 1: enter email → request OTP
//  Step 2: enter OTP → verify → restore localStorage
// ─────────────────────────────────────────────────────────────
const RestoreAccessModal = ({ onClose, onRestored }) => {
  const { setAttendee } = useAttendee();
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/attendee/restore', { email: email.trim() });
      setSuccess('OTP sent to your email. Check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/attendee/restore/verify', {
        email: email.trim(),
        otp: otp.trim(),
      });
      const { userId, name, hasPassword, registeredEvents } = res.data;
      setAttendee({ userId, name, email: email.trim().toLowerCase(), hasPassword, registeredEvents });
      setSuccess('Access restored!');
      setTimeout(() => {
        onRestored?.();
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg border border-border w-full max-w-sm p-6 z-10">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-5">
          {step === 1
            ? <Mail className="w-5 h-5 text-brand shrink-0" />
            : <Shield className="w-5 h-5 text-brand shrink-0" />
          }
          <div>
            <h2
              className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.1em' }}
            >
              {step === 1 ? 'Restore Access' : 'Enter OTP'}
            </h2>
            <p className="text-gray-600 text-xs mt-0.5">
              {step === 1
                ? 'Enter your registered email'
                : `OTP sent to ${email}`
              }
            </p>
          </div>
        </div>

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
            {success && <p className="text-green-400 text-xs">{success}</p>}
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              required
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white text-sm px-3 py-2.5 outline-none placeholder-gray-600 transition tracking-widest text-center text-lg font-mono"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 bg-brand hover:bg-brand-light text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-50"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              {loading ? 'Verifying...' : 'Verify & Restore →'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setOtp(''); setSuccess(''); }}
              className="text-gray-600 text-xs hover:text-gray-400 transition text-center"
            >
              ← Use different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RestoreAccessModal;