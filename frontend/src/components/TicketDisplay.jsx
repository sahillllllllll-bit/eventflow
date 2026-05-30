import React, { useState, useEffect } from 'react';
import { Download, Share2, Check } from 'lucide-react';
import axiosInstance from '../api/axios';

export default function TicketDisplay({ ticketId }) {
  const [ticket, setTicket]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied]     = useState(false);

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
      const baseURL = axiosInstance.defaults.baseURL || '';
      const response = await fetch(`${baseURL}/registrations/ticket/${ticketId}/download-pdf`, {
        method: 'GET',
        headers: {
          ...(axiosInstance.defaults.headers?.common?.Authorization
            ? { Authorization: axiosInstance.defaults.headers.common.Authorization }
            : {}),
        },
      });

      if (!response.ok) throw new Error('PDF download failed');

      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download ticket PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `Check out my ticket for ${ticket?.eventTitle}! Ticket ID: ${ticketId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: ticket?.eventTitle, text: shareText, url: window.location.href });
      } catch (err) {
        console.log('Share cancelled:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
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

  const eventColor = ticket.eventColor || '#6C47FF';

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });

  // ── Extract start time from eventDate if eventTime is missing/TBA ──────────
  const resolveTime = () => {
    if (ticket.eventTime && ticket.eventTime !== 'TBA' && ticket.eventTime.trim() !== '') {
      return ticket.eventTime;
    }
    if (ticket.eventDate) {
      return new Date(ticket.eventDate).toLocaleTimeString('en-US', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return 'TBA';
  };

  const displayTime = resolveTime();

  return (
    <div className="space-y-4">

      {/* ── Action buttons ── */}
      <div className="flex gap-3 justify-end mb-6">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
        >
          {copied ? <Check size={18} className="text-green-600" /> : <Share2 size={18} />}
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          <Download size={18} />
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {/* ── Ticket card ── */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="p-8 text-center text-white" style={{ background: eventColor }}>
          <p className="text-xs font-bold tracking-widest uppercase opacity-70 mb-2">EventGlow</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-1 leading-tight">
            {ticket.eventTitle}
          </h2>
          <p className="text-sm opacity-75 tracking-widest uppercase">✦ Admit One ✦</p>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row">

          {/* Left: info */}
          <div className="flex-1 p-6 sm:p-8 border-b-2 border-dashed md:border-b-0 md:border-r-2 border-gray-200">
            <h3
              className="text-xl sm:text-2xl font-extrabold mb-6 break-words"
              style={{ color: eventColor }}
            >
              {ticket.attendeeName}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">📅 Date</p>
                <p className="text-base font-semibold text-gray-800">{formatDate(ticket.eventDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">🕐 Time</p>
                <p className="text-base font-semibold text-gray-800">{displayTime}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">📍 Location</p>
                <p className="text-base font-semibold text-gray-800">{ticket.eventLocation || 'TBA'}</p>
              </div>
              {(ticket.phone || ticket.email) && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">📞 Contact</p>
                  <p className="text-base font-semibold text-gray-800">{ticket.phone || ticket.email}</p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Ticket ID</p>
                <p className="text-base font-bold font-mono tracking-wider" style={{ color: eventColor }}>
                  {ticket.ticketId}
                </p>
              </div>
            </div>

            {ticket.checkedIn && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Check className="text-green-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-green-900 font-semibold">Checked In</p>
                  <p className="text-sm text-green-700">{new Date(ticket.checkedInAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: QR */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 gap-4 md:min-w-[220px]">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Scan at entry</p>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              {ticket.qrCode ? (
                <img
                  src={ticket.qrCode}
                  alt="Ticket QR Code"
                  className="w-40 h-40 sm:w-48 sm:h-48 block"
                />
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center text-gray-400 text-sm">
                  No QR Code
                </div>
              )}
            </div>
            <p
              className="text-xs font-bold font-mono tracking-wider text-center break-all"
              style={{ color: eventColor }}
            >
              {ticket.ticketId}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 sm:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold">Your Ticket</p>
            <p className="text-base font-bold font-mono" style={{ color: eventColor }}>
              {ticket.ticketId}
            </p>
          </div>
          <p className="text-xs text-gray-500 text-right">
            Non-transferable · Keep this ticket safe
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Download the PDF to save offline, print, or show at the venue. The QR code is required for check-in.
        </p>
      </div>
    </div>
  );
}