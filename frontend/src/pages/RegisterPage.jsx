import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error } = useContext(AuthContext);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        college: formData.college,
        phone: formData.phone,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed');
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
            <span className="text-4xl font-bold">EventFlow</span>
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
          <p className="text-gray-400 mb-8">Join EventFlow to create amazing events</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {formError}
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
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
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
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Already have an account? <Link to="/login" className="text-brand hover:text-brand-light">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
