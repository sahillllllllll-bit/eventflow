import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import EventCard from '../components/EventCard.jsx';
import Modal from '../components/Modal.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { Plus, Search } from 'lucide-react';

const EventsPage = () => {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, eventId: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [page, filterStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        status: filterStatus || undefined,
      };
      const response = await eventAPI.getMyEvents(params);
      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination?.pages || 1);
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

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      
      <div className="ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Events</h1>
            <button
              onClick={() => navigate('/dashboard/events/create')}
              className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-overlay rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition text-white placeholder-gray-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-surface border border-surface-overlay rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
            >
              <option value="">All Events</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="border-2 border-dashed border-surface-overlay rounded-lg p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started'}
              </p>
              {!searchTerm && !filterStatus && (
                <button
                  onClick={() => navigate('/dashboard/events/create')}
                  className="px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition"
                >
                  Create First Event
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onDelete={(id) => setDeleteModal({ open: true, eventId: id })}
                    onShare={(e) => {
                      const shareLink = `${window.location.origin}/e/${e.slug}`;
                      navigator.clipboard.writeText(shareLink);
                      showToast('Link copied to clipboard!', 'success');
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-surface border border-surface-overlay rounded-lg hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-surface border border-surface-overlay rounded-lg hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
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

export default EventsPage;
