import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import axiosInstance from '../api/axios.js';
import EventCard from '../components/discover/EventCard.jsx';
import SearchBar from '../components/discover/SearchBar.jsx';

const CATEGORIES = ['All', 'Fest', 'Hackathon', 'Seminar', 'Workshop', 'Other'];

const DiscoverPage = () => {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActive] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/events/public');
        setEvents(res.data.events || []);
      } catch (err) {
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchCat = activeCategory === 'All' || e.category?.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = !search.trim() ||
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.shortSummary?.toLowerCase().includes(search.toLowerCase()) ||
        e.venue?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [events, activeCategory, search]);

  return (
    <div className="min-h-screen bg-bg text-white">

      {/* ─── NAVBAR ─── */}
      <nav className="border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-50 bg-bg/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dmhykhefr/image/upload/v1779460044/ChatGPT_Image_May_21__2026__02_47_45_PM-removebg-preview_kww7oj.png"
              alt="EventGlow Logo"
              className="h-10 sm:h-14 w-auto object-contain"
            />
            <span className="text-xl sm:text-2xl font-bold text-white">EventGlow</span>
          </Link>
          <Link
            to="/org"
            className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-light text-white text-xs font-black uppercase tracking-wider transition"
            style={{ fontFamily: '"Arial Black", sans-serif' }}
          >
            Create Event <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ─── HERO HEADER ─── */}
      <div
        className="w-full px-4 sm:px-6 py-16 sm:py-24 text-center"
        style={{
          backgroundColor: '#1a1a1a',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      >
        {/* Label */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <span className="block w-8 sm:w-12 h-px bg-gray-600" />
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs sm:text-sm"
            style={{ letterSpacing: '0.2em' }}>
            Discover Events
          </span>
          <span className="block w-8 sm:w-12 h-px bg-gray-600" />
        </div>

        <h1
          className="text-gray-500 font-black uppercase leading-none w-full mb-8"
          style={{
            fontSize: 'clamp(40px, 10vw, 130px)',
            fontFamily: '"Arial Black", Impact, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          Find. Join. Lead.
        </h1>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition border ${
                activeCategory === cat
                  ? 'bg-white text-gray-900 border-white'
                  : 'bg-transparent text-gray-500 border-white/15 hover:border-white/40 hover:text-gray-300'
              }`}
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.12em' }}
            >
              {cat}
            </button>
          ))}
        </div>
    

      {/* ─── EVENTS GRID ─── */}
      <div
        className="w-full min-h-[60vh] px-4 sm:px-6 py-12"
        
      >
        <div className="max-w-7xl mx-auto">

          {/* Result count */}
          {!loading && !error && (
            <p className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-6"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/5"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-bg h-72 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-24">
              <p
                className="text-gray-700 font-black uppercase text-3xl sm:text-5xl mb-4"
                style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
              >
                No Events Found.
              </p>
              <p className="text-gray-600 text-sm">Try a different filter or search term.</p>
            </div>
          )}

          {/* Grid — gap-px with bg-white/5 creates hairline borders between cards */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/5">
              {filtered.map(event => (
                <div key={event._id} className="bg-bg">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border px-4 sm:px-6 py-10 sm:py-12 text-center text-gray-500 bg-bg/95 backdrop-blur"
        >
        <div className="max-w-7xl mx-auto">
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">&copy; 2024 EventGlow. Made for college events.</p>
          <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm mb-4">
            <Link to="/privacy-policy" className="hover:text-gray-300 transition">Privacy</Link>
            <Link to="/terms-and-conditions" className="hover:text-gray-300 transition">Terms</Link>
            <Link to="/contact" className="hover:text-gray-300 transition">Contact</Link>
            <Link to="/refund-policy" className="hover:text-gray-300 transition">Refund Policy</Link>
          </div>
          <p className="text-xs text-gray-600">
            Designed & crafted by{' '}
            <a href="https://www.linkedin.com/in/sahil-ll" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition underline underline-offset-2">
              Sahil Singh
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
};

export default DiscoverPage;