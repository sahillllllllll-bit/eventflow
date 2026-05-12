import React, { useState, useEffect } from 'react';
import { Download, Share2, Check } from 'lucide-react';
import axiosInstance from '../api/axios';
import { generateTicketPDF } from '../utils/pdfGenerator';

export default function TicketDisplay({ ticketId }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await axiosInstance.get(`/registrations/ticket/${ticketId}`);
      setTicket(response.data.ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const ticketElement = document.getElementById('ticket-container');
      
      if (ticketElement) {
        await generateTicketPDF(ticketElement, `ticket-${ticketId}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `Check out my ticket for ${ticket?.eventTitle}! Ticket ID: ${ticketId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket?.eventTitle,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Ticket not found
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Ticket Actions */}
      <div className="flex gap-3 justify-end mb-6">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Share2 size={18} />
          {copied ? <Check size={18} className="text-green-600" /> : 'Share'}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          <Download size={18} />
          {downloading ? 'Generating PDF...' : 'Download as PDF'}
        </button>
      </div>

      {/* Ticket Preview */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden" id="ticket-container">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">{ticket.eventTitle}</h2>
          <p className="text-purple-100">Admit One</p>
        </div>

        {/* Ticket Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-purple-600">{ticket.attendeeName}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">📅 Date</p>
                <p className="text-lg font-medium text-gray-900">{formatDate(ticket.eventDate)}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">🕐 Time</p>
                <p className="text-lg font-medium text-gray-900">{ticket.eventTime || 'TBA'}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">📍 Location</p>
                <p className="text-lg font-medium text-gray-900">{ticket.eventLocation}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">📞 Contact</p>
                <p className="text-lg font-medium text-gray-900">{ticket.phone || ticket.email}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Ticket ID</p>
                <p className="text-lg font-bold text-purple-600 font-mono tracking-wider">{ticket.ticketId}</p>
              </div>
            </div>

            {ticket.checkedIn && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Check className="text-green-600" size={20} />
                  <div>
                    <p className="text-green-900 font-semibold">Checked In</p>
                    <p className="text-sm text-green-700">
                      {new Date(ticket.checkedInAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              <img src={ticket.qrCode} alt="Ticket QR Code" className="w-64 h-64" />
            </div>
            <p className="text-sm text-gray-600 text-center">Scan this code at check-in</p>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-gray-50 border-t px-8 py-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500 font-semibold">Your Ticket</p>
            <p className="text-lg font-bold text-purple-600 font-mono">{ticket.ticketId}</p>
          </div>
          <p className="text-xs text-gray-600 max-w-xs text-right">
            Save this ticket for check-in. Screenshot or print recommended.
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Download as PDF to access it offline, print, or save to your phone. You'll need the QR code for check-in.
        </p>
      </div>
    </div>
  );
}
