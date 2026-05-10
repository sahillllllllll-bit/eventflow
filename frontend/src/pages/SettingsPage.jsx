import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { User, Lock, Trash2, Eye, EyeOff } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const { toasts, showToast, removeToast } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    college: user?.college || '',
    phone: user?.phone || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    showToast('Profile updated successfully', 'success');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    showToast('Password changed successfully', 'success');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      
      <div className="ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-4xl mx-auto">
          {/* Profile Settings */}
          <div className="p-6 bg-surface border border-surface-overlay rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-brand" />
              <h2 className="text-xl font-semibold">Profile Information</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">College</label>
                <input
                  type="text"
                  value={profileForm.college}
                  onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
              >
                Save Profile
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 bg-surface border border-surface-overlay rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-brand" />
              <h2 className="text-xl font-semibold">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-2.5 text-gray-400"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-2.5 text-gray-400"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-2.5 text-gray-400"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Organizer Slug */}
          <div className="p-6 bg-surface border border-surface-overlay rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Organizer Profile</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Public Profile URL</label>
              <input
                type="text"
                value={`eventflow.in/o/${user?.organizerSlug}`}
                readOnly
                className="w-full px-4 py-2.5 bg-surface-overlay border border-surface-overlay rounded-lg text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-2">Share this link to showcase all your events</p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
            </div>
            <p className="text-sm text-red-300/80 mb-4">
              Delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition border border-red-500/50">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
