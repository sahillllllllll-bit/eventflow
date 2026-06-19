import React, { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';

const DISPLAY_FONT = '"Arial Black", Impact, sans-serif';

// Allowed characters validator — blocks SQL, script injection attempts
const containsInjection = (value) => {
  // Block SQL keywords, script tags, and common injection patterns
  const injectionPattern = /(<script|<\/script|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+|DROP\s+|UNION\s+|--|;--|\/\*|\*\/|xp_|EXEC\s+|EXECUTE\s+)/i;
  return injectionPattern.test(value);
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const validateForm = () => {
    const { name, email, college, phone, password, confirmPassword } = formData;

    if (!name.trim() || name.trim().length < 2) {
      return 'Full name must be at least 2 characters.';
    }
    if (name.trim().length > 100) {
      return 'Full name must be under 100 characters.';
    }
    if (containsInjection(name)) {
      return 'Full name contains invalid characters.';
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (containsInjection(email)) {
      return 'Email contains invalid characters.';
    }

    if (!college.trim() || college.trim().length < 2) {
      return 'College name must be at least 2 characters.';
    }
    if (college.trim().length > 150) {
      return 'College name must be under 150 characters.';
    }
    if (containsInjection(college)) {
      return 'College name contains invalid characters.';
    }

    if (phone.trim()) {
      const phoneRegex = /^[+\d\s\-()]{7,20}$/;
      if (!phoneRegex.test(phone.trim())) {
        return 'Please enter a valid phone number.';
      }
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (password.length > 128) {
      return 'Password must be under 128 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null; // no error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        college: formData.college.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      // ✅ Registration truly succeeded — show success then redirect
      setSuccessMessage('Account created! Redirecting...');

      setTimeout(() => {
        const redirect = searchParams.get('redirect') || '/dashboard';
        navigate(redirect);
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldLabelClass =
    'block text-xs font-black uppercase tracking-widest mb-2 text-[#b4b4b4]';
  const inputClass =
    'w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-white/30 outline-none transition text-sm';

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
            Start managing your college events today. It takes less than 2 minutes to set up.
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
              Free To Start, No Card Required
            </span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
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
              New Account
            </span>
          </div>
          <h1
            className="font-black uppercase mb-2"
            style={{ fontFamily: DISPLAY_FONT, fontSize: 'clamp(30px, 6vw, 44px)', letterSpacing: '0.01em' }}
          >
            Create Account
          </h1>
          <p className="text-[#b4b4b4] mb-8 text-sm sm:text-base">Join EventGlow to create amazing events</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error Banner */}
            {formError && (
              <div className="p-4 border-l-[3px] border-[#dc2626] bg-[#dc2626]/10 text-[#ff6b6b] text-sm">
                {formError}
              </div>
            )}

            {/* ✅ Success Banner */}
            {successMessage && (
              <div className="p-4 border-l-[3px] border-[#00b894] bg-[#00b894]/10 text-[#00d9a3] text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            <div>
              <label className={fieldLabelClass} style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="John Doe"
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className={fieldLabelClass} style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}>
                College Name
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className={inputClass}
                placeholder="XYZ College"
                maxLength={150}
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label className={fieldLabelClass} style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="you@college.edu"
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className={fieldLabelClass} style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}>
                Phone <span className="normal-case text-[#555] tracking-normal font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="+91 98765 43210"
                maxLength={20}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className={fieldLabelClass} style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={fieldLabelClass} style={{ fontFamily: DISPLAY_FONT, letterSpacing: '0.14em' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="••••••••"
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!successMessage}
              className="w-full py-3 bg-[#6C47FF] text-white font-black uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6 flex items-center justify-center gap-2 active:scale-95"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {loading ? 'Creating Account...' : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-[#6b7280]">
            <p>
              Already have an account?{' '}
              <Link
                to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="text-[#a29bfe] hover:text-white font-bold uppercase tracking-wide transition"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;