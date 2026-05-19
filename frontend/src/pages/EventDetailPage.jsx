import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { eventAPI, registrationAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Download } from 'lucide-react';

const EventDetailPage = () => {
  const { id } = useParams();
  const { toasts, showToast, removeToast } = useToast();
  
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamRole, setTeamRole] = useState('coordinator');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false); // ← NEW
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventData();
  }, [id, page, activeTab]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const eventRes = await eventAPI.getEventById(id);
      setEvent(eventRes.data.event);

      if (activeTab === 'registrations') {
        const regRes = await registrationAPI.getEventRegistrations(id, { page, limit: 20, search: searchTerm });
        setRegistrations(regRes.data.registrations || []);
      }

      if (activeTab === 'analytics') {
        const analyticsRes = await eventAPI.getAnalytics(id);
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (error) {
      showToast('Failed to load event data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message, 'success');
    } catch (error) {
      showToast('Unable to copy link', 'error');
    }
  };

  const handleSendReminder = async () => {
    if (!reminderMessage.trim()) {
      showToast('Please enter a reminder message', 'error');
      return;
    }

    try {
      setSendingReminder(true);
      const res = await eventAPI.sendReminder(id, { message: reminderMessage });
      showToast(res.data.message || 'Reminder sent successfully', 'success');
      setReminderMessage('');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to send reminder', 'error');
      console.error(error);
    } finally {
      setSendingReminder(false);
    }
  };

  const handleInviteMember = async (event) => {
    event.preventDefault();

    if (!teamEmail.trim()) {
      showToast('Please enter an email', 'error');
      return;
    }

    try {
      const res = await eventAPI.inviteTeamMember(id, { email: teamEmail, role: teamRole });
      setEvent((prev) => ({ ...prev, teamMembers: res.data.teamMembers }));
      setTeamEmail('');
      setTeamRole('member');
      showToast('Team member invited', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not invite member', 'error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await eventAPI.removeTeamMember(id, memberId);
      setEvent((prev) => ({ ...prev, teamMembers: res.data.teamMembers }));
      showToast('Team member removed', 'success');
    } catch (error) {
      showToast('Unable to remove member', 'error');
    }
  };

  // ─── FIXED CSV Export ────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);

      // Try API export first
      try {
        const response = await registrationAPI.exportCSV(id, {
          responseType: 'blob', // ← critical: tell axios to return raw binary
        });

        // Determine blob — response.data might already be a Blob or raw text
        const blob = response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `registrations-${event?.title || id}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast('CSV exported successfully', 'success');
        return;
      } catch (apiError) {
        console.warn('API CSV export failed, building client-side CSV:', apiError);
      }

      // ── Fallback: build CSV from already-loaded registrations ──────────
      // Fetch ALL registrations (no page limit) for export
      const regRes = await registrationAPI.getEventRegistrations(id, { limit: 10000 });
      const allRegs = regRes.data.registrations || regRes.data || [];

      if (!allRegs.length) {
        showToast('No registrations to export', 'error');
        return;
      }

      // Collect all unique field keys from all registrations
      // This handles custom form fields automatically
      const allKeys = Array.from(
        new Set(
          allRegs.flatMap((reg) => {
            const base = ['name', 'email', 'phone', 'ticketId', 'checkedIn', 'registeredAt'];
            // Include any custom form field answers
            const customKeys = reg.formAnswers
              ? Object.keys(reg.formAnswers).map((k) => `field_${k}`)
              : [];
            return [...base, ...customKeys];
          })
        )
      );

      // Build CSV rows
      const escape = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const getValue = (reg, key) => {
        if (key.startsWith('field_')) {
          const fieldKey = key.replace('field_', '');
          return reg.formAnswers?.[fieldKey] ?? '';
        }
        if (key === 'checkedIn') return reg.checkedIn ? 'Yes' : 'No';
        if (key === 'registeredAt') return reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : '';
        return reg[key] ?? '';
      };

      const header = allKeys.map(escape).join(',');
      const rows = allRegs.map((reg) =>
        allKeys.map((key) => escape(getValue(reg, key))).join(',')
      );

      const csvContent = [header, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      // ↑ \uFEFF = BOM so Excel opens with correct encoding

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations-${event?.title || id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Exported ${allRegs.length} registrations`, 'success');
    } catch (error) {
      console.error('CSV export error:', error);
      showToast('Failed to export CSV', 'error');
    } finally {
      setExportingCSV(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-gray-400">Event not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'registrations', label: 'Registrations' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'checkin', label: 'Check-in' },
    { id: 'export', label: 'Export' },
  ];

  const organizerId = event?.organizer?._id?.toString?.() || event?.organizer?.toString?.();
  const isOrganizer = organizerId === user?.id;
  const isCoordinator = event?.teamMembers?.some(
    (member) => member.userId?.toString() === user?.id && member.role === 'coordinator'
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const publicUrl = `${window.location.origin}/e/${event.slug}`;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      
      <div className="ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <p className="text-gray-400 mt-1">{event.slug}</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => navigate(`/dashboard/events/${id}/edit`)}
                  className="px-4 py-2 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark"
                >
                  Edit event
                </button>
                <button
                  onClick={() => handleCopyLink(publicUrl, 'Landing page link copied')}
                  className="px-4 py-2 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay"
                >
                  Copy landing link
                </button>
                <StatusBadge status={event.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface border-b border-surface-overlay">
          <div className="max-w-7xl mx-auto px-6 flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'checkin') {
                    navigate(`/checkin/${id}`);
                    return;
                  }
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`py-4 font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-brand text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid xl:grid-cols-[1.6fr_1fr] gap-6">
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 bg-surface border border-surface-overlay rounded-lg p-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Organizer tools</h2>
                      <p className="text-gray-400 mt-1">Share the event, invite teammates, and manage check-in workflows from one page.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        onClick={() => navigate(`/dashboard/events/${id}/edit`)}
                        className="w-full px-4 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark"
                      >
                        Edit details
                      </button>
                      <button
                        onClick={() => navigate(`/checkin/${id}`)}
                        className="w-full px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay"
                      >
                        Open check-in
                      </button>
                      <button
                        onClick={() => handleCopyLink(publicUrl, 'Landing page link copied')}
                        className="w-full px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay"
                      >
                        Copy landing link
                      </button>
                      <button
                        onClick={() => window.open(`${publicUrl}/register`, '_blank')}
                        className="w-full px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay"
                      >
                        Open registration page
                      </button>
                    </div>
                    {(isOrganizer || isCoordinator) && (
                      <div className="mt-6 p-6 bg-surface border border-border rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-3">Send reminder email</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Send a quick reminder to all registered attendees. Enter your message and click send.
                        </p>
                        <textarea
                          value={reminderMessage}
                          onChange={(e) => setReminderMessage(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                          placeholder="Write your reminder message here..."
                        />
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-gray-500">
                            Reminder emails are sent only to registered attendees.
                          </p>
                          <button
                            onClick={handleSendReminder}
                            disabled={sendingReminder}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-brand text-black font-semibold hover:bg-brand-dark disabled:opacity-50"
                          >
                            {sendingReminder ? 'Sending...' : 'Send reminder'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                      <h3 className="font-semibold mb-4">Event details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white">{event.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white">{formatDate(event.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Venue:</span>
                          <span className="text-white">{event.isOnline ? 'Online' : event.venue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Capacity:</span>
                          <span className="text-white">{event.maxCapacity || '∞'}</span>
                        </div>
                        {event.venueMapLink && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Map link:</span>
                            <a href={event.venueMapLink} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                              Open map
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                      <h3 className="font-semibold mb-4">Event stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Registrations:</span>
                          <span className="text-white font-semibold">{event.currentRegistrations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Template:</span>
                          <span className="text-white capitalize">{event.template}</span>
                        </div>
                        {event.isPaid && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ticket price:</span>
                            <span className="text-white">₹{event.ticketPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                    <h3 className="font-semibold mb-4">Public registration landing page</h3>
                    <div className="rounded-2xl bg-slate-950 p-4 border border-surface-overlay">
                      <p className="text-gray-400 text-sm break-all">{publicUrl}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleCopyLink(publicUrl, 'Landing page link copied')}
                          className="px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay"
                        >
                          Copy link
                        </button>
                        <button
                          onClick={() => window.open(`${publicUrl}/register`, '_blank')}
                          className="px-4 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark"
                        >
                          Open registration page
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                    <h3 className="font-semibold mb-4">Team access</h3>
                    <p className="text-gray-400 text-sm mb-4">Invite coordinators and members by email and assign access.</p>
                    <form onSubmit={handleInviteMember} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                        <input
                          value={teamEmail}
                          onChange={(e) => setTeamEmail(e.target.value)}
                          type="email"
                          placeholder="team@example.com"
                          className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white focus:ring-2 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Role</label>
                        <select
                          value={teamRole}
                          onChange={(e) => setTeamRole(e.target.value)}
                          className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white"
                        >
                          <option value="coordinator">Coordinator</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full px-4 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark">
                        Send invite
                      </button>
                    </form>
                  </div>

                  {/* <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                    <h3 className="font-semibold mb-4">Invite by email</h3>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Join the ${event.title} team`)}&body=${encodeURIComponent(`You have been invited to help manage the event "${event.title}". View the dashboard here: ${window.location.origin}/dashboard/events/${id}`)}`}
                      className="block w-full text-center px-4 py-3 rounded-lg bg-slate-950 text-white border border-surface-overlay hover:bg-slate-900"
                    >
                      Open mail client
                    </a>
                  </div> */}
                </aside>
              </div>

              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Team members</h3>
                {event.teamMembers?.length > 0 ? (
                  <div className="space-y-3">
                    {event.teamMembers.map((member) => (
                      <div key={member._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-overlay p-4 bg-slate-950">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{member.email}</p>
                            {!member.active && (
                              <span className="text-xs text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded-full">Pending</span>
                            )}
                            {member.active && (
                              <span className="text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded-full">Accepted</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="px-3 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No coordinators or members invited yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Registrations Tab */}
          {activeTab === 'registrations' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white placeholder-gray-500"
              />
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-overlay">
                      <th className="text-left py-3 px-4 text-gray-400">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400">Email</th>
                      <th className="text-left py-3 px-4 text-gray-400">Ticket ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="border-b border-surface-overlay hover:bg-surface-overlay/50 transition">
                        <td className="py-3 px-4 text-white">{reg.name}</td>
                        <td className="py-3 px-4 text-gray-300">{reg.email}</td>
                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">{reg.ticketId}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={reg.checkedIn ? 'paid' : 'pending'} />
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(reg.registeredAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Check-in Rate</h3>
                <div className="text-4xl font-bold text-brand mb-2">{analytics.checkInRate}%</div>
                <p className="text-gray-400">
                  {analytics.checkedInCount} of {analytics.totalRegistrations} attendees
                </p>
              </div>

              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Revenue</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ₹{analytics.totalRevenue}
                </div>
                <p className="text-gray-400">{analytics.paidRegistrations} paid registrations</p>
              </div>
            </div>
          )}

          {/* Check-in Tab */}
          {activeTab === 'checkin' && (
            <div className="p-12 text-center border-2 border-dashed border-surface-overlay rounded-lg">
              <p className="text-gray-400 mb-4">QR Code Scanner - Coming Soon</p>
              <p className="text-sm text-gray-500">This feature will be available shortly.</p>
            </div>
          )}

          {/* Export Tab — FIXED */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="p-12 text-center border-2 border-dashed border-surface-overlay rounded-lg">
                <Download className="w-12 h-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Export Registration Data</h3>
                <p className="text-gray-400 mb-2">
                  Download all registrations as a CSV file — includes name, email, phone, ticket ID,
                  check-in status, registration date, and all custom form fields.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  {event.currentRegistrations} total registrations
                </p>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  className="px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {exportingCSV ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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

export default EventDetailPage;