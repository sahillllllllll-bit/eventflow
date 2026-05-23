import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { eventAPI, registrationAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Download, X, Eye, Menu } from 'lucide-react';

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
  const [exportingCSV, setExportingCSV] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  // ← NEW: mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleInviteMember = async (e) => {
    e.preventDefault();
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

  // ─── FIXED CSV Export — includes ALL custom fields, responses, file URLs ──
  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);

      // Try API export first
      try {
        const response = await registrationAPI.exportCSV(id, {
          responseType: 'blob',
        });
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

      // Fetch ALL registrations for export
      const regRes = await registrationAPI.getEventRegistrations(id, { limit: 10000 });
      const allRegs = regRes.data.registrations || regRes.data || [];

      if (!allRegs.length) {
        showToast('No registrations to export', 'error');
        return;
      }

      // ── Collect base + all custom response keys + file upload keys ──
      const responseKeys = new Set();
      const fileKeys = new Set();

      allRegs.forEach((reg) => {
        // responses can be a Map (if returned as object from JSON)
        const responses = reg.responses;
        if (responses) {
          if (responses instanceof Map) {
            responses.forEach((_, k) => responseKeys.add(k));
          } else if (typeof responses === 'object') {
            Object.keys(responses).forEach((k) => responseKeys.add(k));
          }
        }
        const fileUploads = reg.fileUploads;
        if (fileUploads) {
          if (fileUploads instanceof Map) {
            fileUploads.forEach((_, k) => fileKeys.add(k));
          } else if (typeof fileUploads === 'object') {
            Object.keys(fileUploads).forEach((k) => fileKeys.add(k));
          }
        }
      });

      // Build human-readable labels for custom fields using event.formSections
      const getFieldLabel = (fieldId) => {
        const section = event?.formSections?.find((s) => s.id === fieldId);
        return section?.label || fieldId;
      };

      const baseKeys = ['name', 'email', 'phone', 'ticketId', 'checkedIn', 'registeredAt', 'checkedInAt', 'paymentStatus'];
      const responseKeyArr = Array.from(responseKeys);
      const fileKeyArr = Array.from(fileKeys);

      const allKeys = [
        ...baseKeys,
        ...responseKeyArr.map((k) => `response:${k}`),
        ...fileKeyArr.map((k) => `file:${k}`),
      ];

      const headers = [
        'Name', 'Email', 'Phone', 'Ticket ID', 'Checked In', 'Registered At', 'Checked In At', 'Payment Status',
        ...responseKeyArr.map((k) => getFieldLabel(k)),
        ...fileKeyArr.map((k) => `${getFieldLabel(k)} (File URL)`),
      ];

      const escape = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const getVal = (reg, key) => {
        if (key === 'checkedIn') return reg.checkedIn ? 'Yes' : 'No';
        if (key === 'registeredAt') return reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : '';
        if (key === 'checkedInAt') return reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : '';
        if (key.startsWith('response:')) {
          const fieldId = key.replace('response:', '');
          const responses = reg.responses;
          if (!responses) return '';
          if (responses instanceof Map) return responses.get(fieldId) ?? '';
          return responses[fieldId] ?? '';
        }
        if (key.startsWith('file:')) {
          const fieldId = key.replace('file:', '');
          const fileUploads = reg.fileUploads;
          if (!fileUploads) return '';
          let fileData;
          if (fileUploads instanceof Map) {
            fileData = fileUploads.get(fieldId);
          } else {
            fileData = fileUploads[fieldId];
          }
          if (!fileData) return '';
          return fileData.url || fileData.filename || '';
        }
        return reg[key] ?? '';
      };

      const headerRow = headers.map(escape).join(',');
      const rows = allRegs.map((reg) =>
        allKeys.map((key) => escape(getVal(reg, key))).join(',')
      );

      const csvContent = [headerRow, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

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

  // Helper: normalize Mongoose Map-like values and plain objects
  const normalizeMapLike = (value) => {
    if (!value) return null;
    if (typeof value.toObject === 'function') {
      return value.toObject();
    }
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    }
    return value;
  };

  // Helper: get value from responses (Map-like or plain object)
  const getResponseValue = (responses, key) => {
    const normalized = normalizeMapLike(responses);
    if (!normalized) return null;
    return normalized[key];
  };

  // Helper: get entries from responses or fileUploads (Map-like or plain object)
  const getEntries = (mapOrObj) => {
    const normalized = normalizeMapLike(mapOrObj);
    if (!normalized) return [];
    return Object.entries(normalized);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* Main content — offset on lg+ */}
      <div className="lg:ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Mobile menu button */}
            <button
              className="lg:hidden mb-4 p-2 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
                <p className="text-gray-400 mt-1 text-sm">{event.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                <button
                  onClick={() => navigate(`/dashboard/events/${id}/edit`)}
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark text-sm"
                >
                  Edit event
                </button>
                <button
                  onClick={() => handleCopyLink(publicUrl, 'Landing page link copied')}
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay text-sm"
                >
                  Copy link
                </button>
                <StatusBadge status={event.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="bg-surface border-b border-surface-overlay overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-4 sm:gap-8 min-w-max">
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
                className={`py-4 font-medium border-b-2 transition whitespace-nowrap text-sm sm:text-base ${
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
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid xl:grid-cols-[1.6fr_1fr] gap-6">
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 bg-surface border border-surface-overlay rounded-lg p-4 sm:p-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-white">Organizer tools</h2>
                      <p className="text-gray-400 mt-1 text-sm">Share the event, invite teammates, and manage check-in workflows from one page.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate(`/dashboard/events/${id}/edit`)}
                        className="w-full px-4 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark text-sm"
                      >
                        Edit details
                      </button>
                      <button
                        onClick={() => navigate(`/checkin/${id}`)}
                        className="w-full px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay text-sm"
                      >
                        Open check-in
                      </button>
                      <button
                        onClick={() => handleCopyLink(publicUrl, 'Landing page link copied')}
                        className="w-full px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay text-sm"
                      >
                        Copy landing link
                      </button>
                      <button
                        onClick={() => window.open(`${publicUrl}/register`, '_blank')}
                        className="w-full px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay text-sm"
                      >
                        Open registration page
                      </button>
                    </div>
                    {(isOrganizer || isCoordinator) && (
                      <div className="mt-4 p-4 sm:p-6 bg-surface border border-border rounded-xl">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Send reminder email</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Send a quick reminder to all registered attendees. Enter your message and click send.
                        </p>
                        <textarea
                          value={reminderMessage}
                          onChange={(e) => setReminderMessage(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent resize-none text-sm"
                          placeholder="Write your reminder message here..."
                        />
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-gray-500">
                            Reminder emails are sent only to registered attendees.
                          </p>
                          <button
                            onClick={handleSendReminder}
                            disabled={sendingReminder}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-brand text-black font-semibold hover:bg-brand-dark disabled:opacity-50 text-sm"
                          >
                            {sendingReminder ? 'Sending...' : 'Send reminder'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                      <h3 className="font-semibold mb-4 text-sm sm:text-base">Event details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400 shrink-0">Category:</span>
                          <span className="text-white text-right">{event.category}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400 shrink-0">Date:</span>
                          <span className="text-white text-right">{formatDate(event.date)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400 shrink-0">Venue:</span>
                          <span className="text-white text-right">{event.isOnline ? 'Online' : event.venue}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400 shrink-0">Capacity:</span>
                          <span className="text-white">{event.maxCapacity || '∞'}</span>
                        </div>
                        {event.venueMapLink && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400 shrink-0">Map link:</span>
                            <a href={event.venueMapLink} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                              Open map
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                      <h3 className="font-semibold mb-4 text-sm sm:text-base">Event stats</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400">Registrations:</span>
                          <span className="text-white font-semibold">{event.currentRegistrations}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400">Template:</span>
                          <span className="text-white capitalize">{event.template}</span>
                        </div>
                        {event.isPaid && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400">Ticket price:</span>
                            <span className="text-white">₹{event.ticketPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">Public registration landing page</h3>
                    <div className="rounded-2xl bg-slate-950 p-4 border border-surface-overlay">
                      <p className="text-gray-400 text-xs sm:text-sm break-all">{publicUrl}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleCopyLink(publicUrl, 'Landing page link copied')}
                          className="px-4 py-3 rounded-lg border border-surface-overlay text-white hover:bg-surface-overlay text-sm"
                        >
                          Copy link
                        </button>
                        <button
                          onClick={() => window.open(`${publicUrl}/register`, '_blank')}
                          className="px-4 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark text-sm"
                        >
                          Open registration page
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">Team access</h3>
                    <p className="text-gray-400 text-sm mb-4">Invite coordinators and members by email and assign access.</p>
                    <form onSubmit={handleInviteMember} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                        <input
                          value={teamEmail}
                          onChange={(e) => setTeamEmail(e.target.value)}
                          type="email"
                          placeholder="team@example.com"
                          className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white focus:ring-2 focus:ring-brand text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Role</label>
                        <select
                          value={teamRole}
                          onChange={(e) => setTeamRole(e.target.value)}
                          className="w-full px-4 py-3 bg-bg border border-surface-overlay rounded-lg text-white text-sm"
                        >
                          <option value="coordinator">Coordinator</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full px-4 py-3 rounded-lg bg-brand text-black font-semibold hover:bg-brand-dark text-sm">
                        Send invite
                      </button>
                    </form>
                  </div>
                </aside>
              </div>

              <div className="p-4 sm:p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4 text-sm sm:text-base">Team members</h3>
                {event.teamMembers?.length > 0 ? (
                  <div className="space-y-3">
                    {event.teamMembers.map((member) => (
                      <div key={member._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-overlay p-4 bg-slate-950">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-white font-medium text-sm">{member.email}</p>
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
                          className="px-3 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No coordinators or members invited yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Registrations Tab — shows ALL custom fields ── */}
          {activeTab === 'registrations' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand text-white placeholder-gray-500 text-sm"
              />

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-overlay">
                      <th className="text-left py-3 px-4 text-gray-400">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400">Email</th>
                      <th className="text-left py-3 px-4 text-gray-400">Phone</th>
                      <th className="text-left py-3 px-4 text-gray-400">Ticket ID</th>
                      <th className="text-left py-3 px-4 text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400">Registered</th>
                      <th className="text-left py-3 px-4 text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="border-b border-surface-overlay hover:bg-surface-overlay/50 transition">
                        <td className="py-3 px-4 text-white">{reg.name}</td>
                        <td className="py-3 px-4 text-gray-300">{reg.email}</td>
                        <td className="py-3 px-4 text-gray-300">{reg.phone || '-'}</td>
                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">{reg.ticketId}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={reg.checkedIn ? 'Checked In' : 'pending'} />
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(reg.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedRegistration(reg)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs font-medium transition"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {registrations.map((reg) => (
                  <div key={reg._id} className="bg-surface border border-surface-overlay rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-medium text-sm">{reg.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{reg.email}</p>
                      </div>
                      <StatusBadge status={reg.checkedIn ? 'completed' : 'pending'} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Phone</span>
                        <p className="text-gray-300 mt-0.5">{reg.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Ticket ID</span>
                        <p className="text-gray-300 font-mono mt-0.5 truncate">{reg.ticketId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Registered</span>
                        <p className="text-gray-300 mt-0.5">{new Date(reg.registeredAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* Show custom form responses inline on mobile */}
                    {getEntries(reg.responses).length > 0 && (
                      <div className="pt-2 border-t border-surface-overlay space-y-1">
                        {getEntries(reg.responses).map(([fieldId, value]) => {
                          const section = event?.formSections?.find((s) => s.id === fieldId);
                          const label = section?.label || fieldId;
                          return (
                            <div key={fieldId} className="text-xs">
                              <span className="text-gray-500">{label}: </span>
                              <span className="text-gray-300">{value || '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedRegistration(reg)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs font-medium transition w-full justify-center"
                    >
                      <Eye size={14} />
                      View all details
                    </button>
                  </div>
                ))}
              </div>

              {registrations.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">No registrations found.</div>
              )}
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {activeTab === 'analytics' && analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Check-in Rate</h3>
                <div className="text-4xl font-bold text-brand mb-2">{analytics.checkInRate}%</div>
                <p className="text-gray-400 text-sm">
                  {analytics.checkedInCount} of {analytics.totalRegistrations} attendees
                </p>
              </div>

              <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                <h3 className="font-semibold mb-4">Revenue</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ₹{analytics.totalRevenue}
                </div>
                <p className="text-gray-400 text-sm">{analytics.paidRegistrations} paid registrations</p>
              </div>
            </div>
          )}

          {/* ── Check-in Tab ── */}
          {activeTab === 'checkin' && (
            <div className="p-8 sm:p-12 text-center border-2 border-dashed border-surface-overlay rounded-lg">
              <p className="text-gray-400 mb-4">QR Code Scanner - Coming Soon</p>
              <p className="text-sm text-gray-500">This feature will be available shortly.</p>
            </div>
          )}

          {/* ── Export Tab ── */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="p-8 sm:p-12 text-center border-2 border-dashed border-surface-overlay rounded-lg">
                <Download className="w-10 h-10 sm:w-12 sm:h-12 text-brand mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Export Registration Data</h3>
                <p className="text-gray-400 mb-2 text-sm">
                  Download all registrations as a CSV file — includes name, email, phone, ticket ID,
                  check-in status, registration date, and <strong>all custom form fields and file upload URLs</strong>.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  {event.currentRegistrations} total registrations
                </p>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  className="px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2 mx-auto text-sm"
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

      {/* ── Registration Details Modal — shows ALL custom fields + files ── */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-surface border border-surface-overlay rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-surface-overlay bg-surface">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Registration Details</h2>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="p-1 hover:bg-surface-overlay rounded transition"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">Name</p>
                    <p className="text-white font-medium text-sm">{selectedRegistration.name}</p>
                  </div>
                  <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
                    <p className="text-white font-medium text-sm break-all">{selectedRegistration.email}</p>
                  </div>
                  <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">Phone</p>
                    <p className="text-white font-medium text-sm">{selectedRegistration.phone || '-'}</p>
                  </div>
                  <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">Ticket ID</p>
                    <p className="text-white font-mono text-xs sm:text-sm">{selectedRegistration.ticketId}</p>
                  </div>
                  <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">Registered</p>
                    <p className="text-white font-medium text-sm">
                      {new Date(selectedRegistration.registeredAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-gray-400 uppercase mb-1">Status</p>
                    <p className="text-white font-medium text-sm">
                      {selectedRegistration.checkedIn ? '✓ Checked In' : '◯ Not Checked In'}
                    </p>
                  </div>
                  {selectedRegistration.paymentStatus && (
                    <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                      <p className="text-xs text-gray-400 uppercase mb-1">Payment</p>
                      <p className="text-white font-medium text-sm capitalize">{selectedRegistration.paymentStatus}</p>
                    </div>
                  )}
                  {selectedRegistration.checkedInAt && (
                    <div className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                      <p className="text-xs text-gray-400 uppercase mb-1">Checked In At</p>
                      <p className="text-white font-medium text-sm">
                        {new Date(selectedRegistration.checkedInAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Custom Form Responses (Map or plain object) ── */}
              {getEntries(selectedRegistration.responses).length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-4">Form Responses</h3>
                  <div className="space-y-3">
                    {getEntries(selectedRegistration.responses).map(([fieldId, value]) => {
                      const section = event?.formSections?.find((s) => s.id === fieldId);
                      const label = section?.label || fieldId;
                      return (
                        <div key={fieldId} className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                          <p className="text-xs text-gray-400 uppercase mb-1">{label}</p>
                          <p className="text-white text-sm break-words">{String(value) || '-'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── File Uploads (Map or plain object) ── */}
              {getEntries(selectedRegistration.fileUploads).length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-4">File Uploads</h3>
                  <div className="space-y-3">
                    {getEntries(selectedRegistration.fileUploads).map(([fieldId, fileData]) => {
                      const section = event?.formSections?.find((s) => s.id === fieldId);
                      const label = section?.label || fieldId;
                      const url = typeof fileData === 'string'
                        ? fileData
                        : fileData?.url || fileData?.path || fileData?.secure_url;
                      const fileName = typeof fileData === 'string' ? 'Uploaded file' : fileData?.filename || 'Uploaded file';
                      return (
                        <div key={fieldId} className="bg-surface-overlay p-3 sm:p-4 rounded-lg">
                          <p className="text-xs text-gray-400 uppercase mb-2">{label}</p>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium break-words">{fileName}</p>
                              {typeof fileData !== 'string' && (
                                <p className="text-gray-400 text-xs mt-1">
                                  {fileData.size ? `${(fileData.size / 1024).toFixed(2)} KB` : 'Size unknown'}
                                  {fileData.mimeType && ` · ${fileData.mimeType}`}
                                </p>
                              )}
                            </div>
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs font-medium transition whitespace-nowrap"
                              >
                                Open file
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No custom fields */}
              {getEntries(selectedRegistration.responses).length === 0 &&
                getEntries(selectedRegistration.fileUploads).length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No custom form responses or file uploads</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;