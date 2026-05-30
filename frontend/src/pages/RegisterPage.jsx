import React, { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Eye, EyeOff, CheckCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand/20 to-brand-dark/20 flex-col justify-center items-center p-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Zap className="w-12 h-12 text-brand" />
            <span className="text-4xl font-bold">EventGlow</span>
          </div>
          <p className="text-xl text-gray-300 max-w-md">
            Start managing your college events today. It takes less than 2 minutes to set up.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-12">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-4xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400 mb-8">Join EventGlow to create amazing events</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error Banner */}
            {formError && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {formError}
              </div>
            )}

            {/* ✅ Success Banner */}
            {successMessage && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-sm"
                placeholder="John Doe"
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">College Name</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-sm"
                placeholder="XYZ College"
                maxLength={150}
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-sm"
                placeholder="you@college.edu"
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-sm"
                placeholder="+91 98765 43210"
                maxLength={20}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-sm"
                  placeholder="••••••••"
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-sm"
                placeholder="••••••••"
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!successMessage}
              className="w-full py-2.5 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>
              Already have an account?{' '}
              <Link
                to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="text-brand hover:text-brand-light"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;