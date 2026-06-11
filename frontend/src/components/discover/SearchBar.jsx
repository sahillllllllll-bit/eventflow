import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full max-w-2xl mx-auto">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search events..."
      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-none pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-white/30 transition"
      style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.05em' }}
    />
  </div>
);

export default SearchBar;