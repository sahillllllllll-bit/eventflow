import React from 'react';
import { Calendar, Users, IndianRupee, MoreVertical, Share2, Edit2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

const EventCard = ({ event, onDelete, onShare }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 bg-surface border border-surface-overlay rounded-lg hover:border-brand/50 transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-white truncate">{event.title}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {event.slug}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-surface-overlay rounded-lg transition"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-surface-raised border border-surface-overlay rounded-lg shadow-lg z-10 min-w-max">
              <button
                onClick={() => {
                  navigate(`/dashboard/events/${event._id}`);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-surface-overlay text-sm text-gray-300 w-full text-left"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button
                onClick={() => {
                  navigate(`/dashboard/events/${event._id}/edit`);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-surface-overlay text-sm text-gray-300 w-full text-left"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => {
                  onShare?.(event);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-surface-overlay text-sm text-gray-300 w-full text-left"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={() => {
                  onDelete?.(event._id);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-sm text-red-400 w-full text-left"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status and Meta */}
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={event.status} />
        <div className="flex gap-2 text-xs text-gray-400">
          <span className="px-2 py-1 bg-surface-overlay rounded">
            {event.category}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="p-2 bg-surface-overlay rounded">
          <p className="text-gray-500">Registrations</p>
          <p className="font-semibold text-white">{event.currentRegistrations}/{event.maxCapacity || '∞'}</p>
        </div>
        <div className="p-2 bg-surface-overlay rounded">
          <p className="text-gray-500">Revenue</p>
          <p className="font-semibold text-white">₹{event.isPaid ? event.ticketPrice * event.currentRegistrations : '0'}</p>
        </div>
        <div className="p-2 bg-surface-overlay rounded">
          <p className="text-gray-500">Date</p>
          <p className="font-semibold text-white text-xs">{formatDate(event.date)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-overlay text-xs">
        <div className="flex items-center gap-1 text-gray-400">
          <Calendar className="w-3 h-3" />
          {formatDate(event.createdAt)}
        </div>
        {event.isPaid && (
          <div className="flex items-center gap-1 text-green-400">
            <IndianRupee className="w-3 h-3" />
            Paid Event
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
