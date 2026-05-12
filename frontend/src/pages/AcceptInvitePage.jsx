import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { eventAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';

const AcceptInvitePage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toasts, showToast, removeToast } = useToast();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Checking your team invite...');

  const redirectPath = searchParams.get('redirect') || `/accept-invite/${token}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const registerUrl = `/register?redirect=${encodeURIComponent(redirectPath)}`;

  useEffect(() => {
    if (user) {
      acceptInvite();
    } else {
      setStatus('unauthenticated');
      setMessage('Sign in or register with the invited email to accept your team invitation.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const acceptInvite = async () => {
    try {
      const response = await eventAPI.acceptTeamInvite(token);
      setStatus('accepted');
      setMessage(response.data.message || 'You are now part of the event team.');
      showToast('Team invite accepted', 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1800);
    } catch (error) {
      setStatus('error');
      setMessage(error?.response?.data?.message || 'Unable to accept invite.');
      showToast(error?.response?.data?.message || 'Unable to accept invite', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-surface border border-surface-overlay rounded-3xl p-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Accept Event Team Invite</h1>
        <p className="text-gray-400 mb-8">{message}</p>

        {status === 'unauthenticated' && (
          <div className="space-y-4">
            <Link
              to={loginUrl}
              className="block w-full rounded-xl bg-brand px-6 py-3 text-black font-semibold hover:bg-brand-dark"
            >
              Sign in to accept invite
            </Link>
            <Link
              to={registerUrl}
              className="block w-full rounded-xl border border-surface-overlay px-6 py-3 text-white hover:bg-surface-overlay"
            >
              Register and accept invite
            </Link>
            <p className="text-sm text-gray-500">
              Use the same email address that received this invitation.
            </p>
          </div>
        )}

        {status === 'accepted' && (
          <div className="mt-8">
            <p className="text-green-400">Invite accepted successfully. Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 space-y-4">
            <p className="text-red-400">{message}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Link
                to={loginUrl}
                className="block rounded-xl border border-surface-overlay px-6 py-3 text-white hover:bg-surface-overlay"
              >
                Sign in again
              </Link>
              <Link
                to={registerUrl}
                className="block rounded-xl bg-brand px-6 py-3 text-black font-semibold hover:bg-brand-dark"
              >
                Register with invited email
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default AcceptInvitePage;
