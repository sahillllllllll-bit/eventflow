import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import axiosInstance from '../../api/axios.js';
import { useAttendee } from '../../context/AttendeeContext.jsx';

// ─────────────────────────────────────────────────────────────
//  SetPasswordModal
//  Step 1: request OTP to email
//  Step 2: enter OTP + new password → save
// ─────────────────────────────────────────────────────────────
const SetPasswordModal = ({ onClose }) => {
  const { attendee, setAttendee } = useAttendee();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOTP = async () => {
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/attendee/set-password/request', { email: attendee.email });
      setSuccess('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await axiosInstance.post('/attendee/set-password', {
        email: attendee.email,
        otp: otp.trim(),
        password,
      });
      // Update context
      setAttendee({ ...attendee, hasPassword: true });
      setSuccess('Password set! You can now login from any device.');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
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
          <Lock className="w-5 h-5 text-brand shrink-0" />
          <div>
            <h2 className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.1em' }}>
              Secure Your Account
            </h2>
            <p className="text-gray-600 text-xs mt-0.5">
              Set a password to login from any device
            </p>
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-gray-500 text-xs">
              We'll send a one-time code to <strong className="text-gray-300">{attendee?.email}</strong> to verify it's you.
            </p>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleRequestOTP}
              disabled={loading}
              className="w-full py-2.5 bg-brand hover:bg-brand-light text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-50"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              {loading ? 'Sending...' : 'Send Verification Code →'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSetPassword} className="flex flex-col gap-3">
            {success && <p className="text-green-400 text-xs">{success}</p>}
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              required
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white text-sm px-3 py-2.5 outline-none placeholder-gray-600 transition tracking-widest text-center font-mono"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              required
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white text-sm px-3 py-2.5 outline-none placeholder-gray-600 transition"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
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
              {loading ? 'Setting...' : 'Set Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPasswordModal;