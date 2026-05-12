import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TicketDisplay from '../components/TicketDisplay.jsx';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <nav className="border-b border-border px-6 py-4 bg-surface/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-xl font-bold">Your Event Ticket</h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <TicketDisplay ticketId={ticketId} />
      </div>
    </div>
  );
};

export default TicketPage;
