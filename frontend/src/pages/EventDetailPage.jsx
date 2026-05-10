import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventAPI, registrationAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Download, Search, Eye, EyeOff } from 'lucide-react';

const EventDetailPage = () => {
  const { id } = useParams();
  const { toasts, showToast, removeToast } = useToast();
  
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchEventData();
  }, [id, page, activeTab]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      // Fetch event details from slug/ID
      const eventsRes = await eventAPI.getMyEvents({ limit: 100 });
      const foundEvent = eventsRes.data.events.find(e => e._id === id);
      if (foundEvent) setEvent(foundEvent);

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

  const handleExportCSV = async () => {
    try {
      const response = await registrationAPI.exportCSV(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations-${event.title}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
      showToast('CSV exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export CSV', 'error');
      console.error(error);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      
      <div className="ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <p className="text-gray-400 mt-1">{event.slug}</p>
              </div>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-gray-300 max-w-2xl">{event.description}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface border-b border-surface-overlay">
          <div className="max-w-7xl mx-auto px-6 flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                  <h3 className="font-semibold mb-4">Event Details</h3>
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
                  </div>
                </div>

                <div className="p-6 bg-surface border border-surface-overlay rounded-lg">
                  <h3 className="font-semibold mb-4">Stats</h3>
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
                        <span className="text-gray-400">Ticket Price:</span>
                        <span className="text-white">₹{event.ticketPrice}</span>
                      </div>
                    )}
                  </div>
                </div>
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

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="p-12 text-center border-2 border-dashed border-surface-overlay rounded-lg">
              <Download className="w-12 h-12 text-brand mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Export Registration Data</h3>
              <p className="text-gray-400 mb-6">Download all registrations as a CSV file</p>
              <button
                onClick={handleExportCSV}
                className="px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
              >
                Download CSV
              </button>
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
