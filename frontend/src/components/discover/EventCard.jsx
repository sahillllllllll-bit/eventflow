import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  fest:       { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  hackathon:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  seminar:    { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
  workshop:   { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
  other:      { bg: 'bg-gray-500/10',   text: 'text-gray-400',   border: 'border-gray-500/20'   },
};

const EventCard = ({ event }) => {
  const cat = CATEGORY_COLORS[event.category?.toLowerCase()] || CATEGORY_COLORS.other;
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date TBD';

  return (
    <Link
      to={`/e/${event.slug}`}
      className="group block border border-white/10 hover:border-white/25 transition-all duration-200 bg-white/[0.03] hover:bg-white/[0.06]"
    >
      {/* Cover Image */}
      <div className="w-full h-44 overflow-hidden bg-white/5 relative">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <span className="text-gray-700 text-4xl font-black uppercase"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
              {event.title?.charAt(0)}
            </span>
          </div>
        )}

        {/* Category badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2 py-1 border ${cat.bg} ${cat.text} ${cat.border}`}
          style={{ fontFamily: '"Arial Black", sans-serif' }}>
          {event.category || 'Other'}
        </span>

        {/* Paid badge */}
        {event.isPaid && (
          <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-brand/20 text-brand border border-brand/30"
            style={{ fontFamily: '"Arial Black", sans-serif' }}>
            ₹{event.ticketPrice}
          </span>
        )}
        {!event.isPaid && (
          <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-brand/20 text-brand border border-brand/30"
            style={{ fontFamily: '"Arial Black", sans-serif' }}>
            Free
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3
          className="text-white font-black uppercase text-base leading-tight mb-3 group-hover:text-gray-300 transition line-clamp-2"
          style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
        >
          {event.title}
        </h3>

        {event.shortSummary && (
          <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">
            {event.shortSummary}
          </p>
        )}

        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          {(event.venue || event.isOnline) && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.isOnline ? 'Online' : event.venue}</span>
            </div>
          )}
          {event.maxCapacity && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{event.maxCapacity} seats</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-gray-600 text-xs">
            {event.organizer?.name || 'Organizer'}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
};

export default EventCard;