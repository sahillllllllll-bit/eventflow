import React, { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

const DISPLAY_FONT = '"Arial Black", Impact, sans-serif';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, error } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      await login(formData.email, formData.password);
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Left Side */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 border-r border-white/10 relative"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          backgroundColor: '#111',
        }}
      >
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            {/* <Zap className="w-9 h-9" style={{ color: '#6C47FF' }} /> */}
            <span
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              EventGlow
            </span>
          </div>
          <p className="text-lg text-[#b4b4b4] leading-relaxed">
            Manage your college events with ease. Create, promote, and track everything in one place.
          </p>
          <div className="mt-10 flex justify-center">
            <span
              className="inline-block px-4 py-2 border-l-[3px] text-xs font-black uppercase tracking-widest"
              style={{
                fontFamily: DISPLAY_FONT,
                borderLeftColor: '#6c5ce7',
                background: 'rgba(108,92,231,0.08)',
                color: '#a29bfe',
              }}
            >
              Built for College Organizers
            </span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            {/* <Zap className="w-7 h-7" style={{ color: '#6C47FF' }} /> */}
            <span
              className="text-xl font-black uppercase tracking-widest"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              EventGlow
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="block w-8 h-px bg-gray-600" />
            <span
              className="text-[#6b7280] tracking-widest text-xs font-bold uppercase"
              style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.16em' }}
            >
              Account Access
            </span>
          </div>
          <h1
            className="font-black uppercase mb-2"
            style={{ fontFamily: DISPLAY_FONT, fontSize: 'clamp(32px, 6vw, 48px)', letterSpacing: '0.01em' }}
          >
            Welcome Back
          </h1>
          <p className="text-[#b4b4b4] mb-10 text-sm sm:text-base">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-4 border-l-[3px] border-[#dc2626] bg-[#dc2626]/10 text-[#ff6b6b] text-sm">
                {formError}
              </div>
            )}

            <div>
              <label
                className="block text-xs font-black uppercase tracking-widest mb-2 text-[#b4b4b4]"
                style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                className="block text-xs font-black uppercase tracking-widest mb-2 text-[#b4b4b4]"
                style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#6C47FF] text-white font-black uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {loading ? 'Signing In...' : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-[#6b7280]">
            <p>
              Don't have an account?{' '}
              <Link
                to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="text-[#a29bfe] hover:text-white font-bold uppercase tracking-wide transition"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-xs text-[#6b7280] hover:text-white uppercase tracking-widest font-bold transition"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;