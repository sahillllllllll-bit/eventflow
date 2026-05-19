import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { eventAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import MetricCard from '../components/MetricCard.jsx';
import EventCard from '../components/EventCard.jsx';
import Modal from '../components/Modal.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Plus, TrendingUp, Users, IndianRupee, Mail } from 'lucide-react';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toasts, showToast, removeToast } = useToast();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, eventId: null });
  const [shareModal, setShareModal] = useState({ open: false, event: null });

  // Calculate metrics
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
  const totalRevenue = events.reduce((sum, e) => {
    if (e.isPaid) {
      return sum + (e.ticketPrice * e.currentRegistrations || 0);
    }
    return sum;
  }, 0);
  const publishedEvents = events.filter(e => e.status === 'published').length;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getMyEvents({ limit: 100 });
      setEvents(response.data.events || []);
    } catch (error) {
      showToast('Failed to load events', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await eventAPI.deleteEvent(deleteModal.eventId);
      setEvents(events.filter(e => e._id !== deleteModal.eventId));
      showToast('Event deleted successfully', 'success');
      setDeleteModal({ open: false, eventId: null });
    } catch (error) {
      showToast('Failed to delete event', 'error');
      console.error(error);
    }
  };

  const handleShareEvent = (event) => {
    const shareLink = `${window.location.origin}/e/${event.slug}`;
    navigator.clipboard.writeText(shareLink);
    showToast('Link copied to clipboard!', 'success');
    setShareModal({ open: false, event: null });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      
      <div className="lg:ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-4 sm:p-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-gray-400 mt-1 text-sm">{user?.college}</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/events/create')}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition text-sm sm:text-base whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Metrics */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              icon={TrendingUp}
              label="Total Events"
              value={totalEvents}
              trend={12}
              trendUp={true}
            />
            <MetricCard
              icon={Users}
              label="Total Registrations"
              value={totalRegistrations}
              trend={8}
              trendUp={true}
            />
            <MetricCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${totalRevenue.toLocaleString()}`}
              trend={15}
              trendUp={true}
            />
            <MetricCard
              icon={Mail}
              label="Published Events"
              value={publishedEvents}
              trend={5}
              trendUp={true}
            />
          </div>

          {/* Events Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Events</h2>
              <select className="px-4 py-2 bg-surface border border-surface-overlay rounded-lg text-white focus:ring-2 focus:ring-brand outline-none">
                <option value="">All Events</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="border-2 border-dashed border-surface-overlay rounded-lg p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                <p className="text-gray-400 mb-6">Create your first event to get started</p>
                <button
                  onClick={() => navigate('/dashboard/events/create')}
                  className="px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
                >
                  Create First Event
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event._id}
                    onClick={() => navigate(`/dashboard/events/${event._id}`)}
                    event={event}
                    onDelete={(id) => setDeleteModal({ open: true, eventId: id })}
                    onShare={(e) => {
                      setShareModal({ open: true, event: e });
                      handleShareEvent(e);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        title="Delete Event"
        onClose={() => setDeleteModal({ open: false, eventId: null })}
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setDeleteModal({ open: false, eventId: null }),
          },
          {
            label: 'Delete',
            variant: 'danger',
            onClick: handleDeleteEvent,
          },
        ]}
      >
        <p className="text-gray-300">Are you sure you want to delete this event? This action cannot be undone.</p>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={shareModal.open}
        title="Share Event"
        onClose={() => setShareModal({ open: false, event: null })}
        actions={[
          {
            label: 'Close',
            variant: 'secondary',
            onClick: () => setShareModal({ open: false, event: null }),
          },
        ]}
      >
        {shareModal.event && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Link</label>
              <input
                type="text"
                value={`${window.location.origin}/e/${shareModal.event.slug}`}
                readOnly
                className="w-full px-4 py-2 bg-surface-overlay border border-surface-overlay rounded-lg text-white text-sm"
              />
            </div>
          </div>
        )}
      </Modal>

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

export default DashboardHome;
