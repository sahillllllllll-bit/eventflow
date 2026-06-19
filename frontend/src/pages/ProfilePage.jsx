import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, Calendar, MapPin,
  Shield, ShieldCheck, LogOut, Award, Download, Loader,
  ExternalLink, Ticket, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAttendee } from '../context/AttendeeContext.jsx';
import axiosInstance from '../api/axios.js';
import { certificateAPI, registrationAPI } from '../api/endpoints.js';
import RestoreAccessModal from '../components/profile/RestoreAccessModal.jsx';
import SetPasswordModal from '../components/profile/SetPasswordModal.jsx';
import AttendeeLoginModal from '../components/profile/AttendeeLoginModal.jsx';
import { renderCertificateToDOM } from '../services/certificateRenderer.js';

// ── helpers ───────────────────────────────────────────────────
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'TBA';

const waitForImages = (container) => {
  const imgs = container.querySelectorAll('img');
  return Promise.all(Array.from(imgs).map(img =>
    new Promise(res => {
      if (img.complete) { res(); return; }
      img.onload = img.onerror = res;
      setTimeout(res, 5000);
    })
  ));
};

// ─────────────────────────────────────────────────────────────
//  JoinedEventCard
//  Shows event info + chatroom + ticket download + event page
// ─────────────────────────────────────────────────────────────
const JoinedEventCard = ({ event, attendeeEmail }) => {
  const isPast        = event.endDate ? new Date(event.endDate) < new Date() : false;
  const [ticket, setTicket]         = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError]     = useState('');
  const [expanded, setExpanded]     = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch ticket details for this event+email on expand
  const loadTicket = async () => {
    if (ticket || ticketLoading) return;
    setTicketLoading(true);
    setTicketError('');
    try {
      // Find ticketId by looking up registration by email+event
      // We use the public ticket search: GET /registrations/ticket/:ticketId
      // But we need ticketId — so we search via a helper endpoint
      // Since we don't have a direct "get my ticket for event" endpoint,
      // we use the event slug + email pattern via axiosInstance
      const res = await axiosInstance.get('/registrations/my-ticket', {
        params: { eventId: event._id, email: attendeeEmail },
      });
      setTicket(res.data.ticket || null);
    } catch {
      setTicketError('Ticket not found for this event.');
    } finally {
      setTicketLoading(false);
    }
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadTicket();
  };

  const handleDownloadPDF = async () => {
    if (!ticket?.ticketId) return;
    setDownloading(true);
    try {
      const res = await axiosInstance.get(
        `/registrations/ticket/${ticket.ticketId}/download-pdf`,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `ticket-${ticket.ticketId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // fallback to HTML download
      try {
        const res = await axiosInstance.get(
          `/registrations/download/${ticket.ticketId}`,
          { responseType: 'blob' }
        );
        const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
        const link = document.createElement('a');
        link.href     = url;
        link.download = `ticket-${ticket.ticketId}.html`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Ticket download failed:', e);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="border border-white/10 hover:border-white/20 transition flex flex-col">
      {/* Main row */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-white font-black uppercase text-sm truncate"
              style={{ fontFamily: '"Arial Black", sans-serif' }}
            >
              {event.title}
            </p>
            <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{fmtDate(event.date)}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2 mt-0.5 text-gray-500 text-xs">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
          </div>
          {isPast && (
            <span className="text-xs text-gray-600 border border-white/10 px-2 py-0.5 shrink-0">
              Past
            </span>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2">
          {/* Open chatroom */}
          <Link
            to={`/chat/${event._id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-widest transition flex-1 min-w-0 justify-center"
            style={{
              fontFamily: '"Arial Black", sans-serif',
              letterSpacing: '0.1em',
              borderLeft: '3px solid #6c5ce7',
              background: 'rgba(108,92,231,0.08)',
              color: '#a29bfe',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Chatroom</span>
          </Link>

          {/* View event landing page */}
          {event.slug && (
            <a
              href={`/e/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-widest border border-white/10 hover:border-white/30 text-gray-500 hover:text-white transition"
              style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.1em' }}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Event Detail</span>
            </a>
          )}

          {/* Ticket expand toggle */}
          <button
            onClick={handleExpand}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-widest border border-white/10 hover:border-white/30 text-gray-500 hover:text-white transition"
            style={{ fontFamily: '"Arial Black", sans-serif', letterSpacing: '0.1em' }}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span>Ticket</span>
            {expanded
              ? <ChevronUp className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />
            }
          </button>
        </div>
      </div>

      {/* Expandable ticket section */}
      {expanded && (
        <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3">
          {ticketLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
              <Loader className="w-3.5 h-3.5 animate-spin" />
              Loading ticket…
            </div>
          )}

          {ticketError && (
            <p className="text-gray-600 text-xs py-2">{ticketError}</p>
          )}

          {ticket && !ticketLoading && (
            <div className="flex flex-col gap-3">
              {/* Ticket details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div>
                  <p className="text-gray-600 uppercase tracking-widest text-[10px]">Ticket ID</p>
                  <p className="text-white font-mono font-bold mt-0.5">{ticket.ticketId}</p>
                </div>
                <div>
                  <p className="text-gray-600 uppercase tracking-widest text-[10px]">Status</p>
                  <p className={`font-bold mt-0.5 ${ticket.checkedIn ? 'text-green-400' : 'text-gray-400'}`}>
                    {ticket.checkedIn ? '✓ Checked In' : '◯ Not checked in'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 uppercase tracking-widest text-[10px]">Name</p>
                  <p className="text-gray-300 mt-0.5">{ticket.attendeeName}</p>
                </div>
                <div>
                  <p className="text-gray-600 uppercase tracking-widest text-[10px]">Registered</p>
                  <p className="text-gray-300 mt-0.5">{fmtDate(ticket.registeredAt)}</p>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-white/15 hover:border-white/30 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-50 w-full"
                style={{ fontFamily: '"Arial Black", sans-serif' }}
              >
                {downloading
                  ? <Loader className="w-3.5 h-3.5 animate-spin" />
                  : <Download className="w-3.5 h-3.5" />
                }
                {downloading ? 'Downloading…' : 'Download Ticket PDF'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Certificate card (attendee) ───────────────────────────────
const AttendeeCertCard = ({ cert, onDownload, downloading }) => {
  const isLoading = downloading === cert._id;
  return (
    <div className="border border-white/10 hover:border-white/20 transition p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">
            {cert.event?.title || 'Certificate'}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">Issued: {fmtDate(cert.issuedAt)}</p>
          {cert.uniqueCode && (
            <p className="text-gray-600 text-xs font-mono mt-0.5">{cert.uniqueCode}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onDownload(cert._id, 'pdf')}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded transition disabled:opacity-50"
        >
          {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          PDF
        </button>
        <button
          onClick={() => onDownload(cert._id, 'jpg')}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-medium rounded transition disabled:opacity-50"
        >
          {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          JPG
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ProfilePage
// ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { attendee, isLoggedIn, logout } = useAttendee();
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [certs, setCerts]               = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [downloading, setDownloading]   = useState(null);
  const [showRestore, setShowRestore]   = useState(false);
  const [showSetPw, setShowSetPw]       = useState(false);
  const [showLogin, setShowLogin]       = useState(false);

  useEffect(() => {
    if (!attendee?.userId) return;
    setLoading(true);
    axiosInstance.get('/attendee/profile', { params: { userId: attendee.userId } })
      .then(r => setProfile(r.data.profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [attendee?.userId]);

  useEffect(() => {
    if (!attendee?.email) return;
    setCertsLoading(true);
    certificateAPI.getCertificatesByEmail(attendee.email)
      .then(r => setCerts(r.data.certificates || []))
      .catch(() => {})
      .finally(() => setCertsLoading(false));
  }, [attendee?.email]);

  const handleCertDownload = async (certId, format) => {
    setDownloading(certId);
    try {
      const res = await certificateAPI.downloadCertificatePDF(certId);
      if (!res.data.success) return;
      const { certificate, template, event } = res.data;
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
      document.body.appendChild(container);
      renderCertificateToDOM(
        { name: certificate.recipientName, uniqueCode: certificate.uniqueCode },
        container, template,
        {
          eventName: event.title,
          date: new Date(event.date).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
        }
      );
      const html2canvas = (await import('html2canvas')).default;
      const certCanvas  = container.querySelector('[data-certificate-canvas]');
      if (!certCanvas) throw new Error('Render failed');
      await waitForImages(certCanvas);
      const canvas = await html2canvas(certCanvas, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', windowHeight: 744, windowWidth: 1050, logging: false,
      });
      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1050, 744] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1050, 744);
        pdf.save(res.data.fileName);
      } else {
        const link = document.createElement('a');
        link.href     = canvas.toDataURL('image/jpeg', 0.95);
        link.download = res.data.fileName.replace('.pdf', '.jpg');
        link.click();
      }
      document.body.removeChild(container);
    } catch (err) {
      console.error('Cert download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  // ── Not logged in ────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-bg text-white">
        <nav className="border-b border-border px-4 sm:px-6 py-4 bg-bg/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              My Profile
            </span>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-center">
          <p className="text-gray-500 text-sm mb-6">
            Register for an event to create your profile. Already registered?
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={() => setShowRestore(true)}
              className="w-full py-2.5 border border-white/20 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest transition"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              Restore via Email OTP
            </button>
            <button onClick={() => setShowLogin(true)}
              className="w-full py-2.5 bg-brand text-white text-xs font-black uppercase tracking-widest transition"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              Login with Password
            </button>
          </div>
          <Link to="/" className="text-gray-700 text-xs mt-6 hover:text-gray-500 transition">
            Browse events →
          </Link>
        </div>
        {showRestore && <RestoreAccessModal onClose={() => setShowRestore(false)} />}
        {showLogin && <AttendeeLoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  const events = profile?.registeredEvents || [];

  return (
    <div className="min-h-screen bg-bg text-white">
      <nav className="border-b border-border px-4 sm:px-6 py-4 bg-bg/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-white font-black uppercase text-sm"
              style={{ fontFamily: '"Arial Black", sans-serif' }}>
              My Profile
            </span>
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-gray-600 hover:text-white text-xs transition">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear session</span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Profile card */}
        <div className="border border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white font-black uppercase text-xl"
                style={{ fontFamily: '"Arial Black", sans-serif' }}>
                {attendee.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{attendee.email}</p>
            </div>
            {attendee.hasPassword
              ? <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Secured</span>
                </div>
              : <div className="flex items-center gap-1.5 text-gray-600 text-xs font-bold">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Basic</span>
                </div>
            }
          </div>
          {attendee.expiresAt && (
            <p className="text-gray-700 text-xs mt-3">
              Session active until {fmtDate(attendee.expiresAt)}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-white/5">
            {!attendee.hasPassword ? (
              <button onClick={() => setShowSetPw(true)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition w-full">
                <Shield className="w-3.5 h-3.5" />
                <span>Set a password to access from any device</span>
                <span className="ml-auto text-brand text-xs font-bold">Enable →</span>
              </button>
            ) : (
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Password set — you can login from any device anytime.
              </p>
            )}
          </div>
        </div>

        {/* Joined events */}
        <div>
          <p className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-4"
            style={{ fontFamily: '"Arial Black", sans-serif' }}>
            {events.length} joined event{events.length !== 1 ? 's' : ''}
          </p>
          {loading && (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => <div key={i} className="h-28 bg-white/5 animate-pulse" />)}
            </div>
          )}
          {!loading && events.length === 0 && (
            <div className="text-center py-12 border border-white/5">
              <p className="text-gray-700 text-sm">No events joined yet.</p>
              <Link to="/" className="text-brand text-xs mt-2 inline-block hover:underline">
                Browse events →
              </Link>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {events.map(event => (
              <JoinedEventCard
                key={event._id}
                event={event}
                attendeeEmail={attendee.email}
              />
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div>
          <p className="text-gray-600 text-xs uppercase tracking-widest font-bold mb-4"
            style={{ fontFamily: '"Arial Black", sans-serif' }}>
            Your issued certificates
          </p>
          {certsLoading && (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse" />)}
            </div>
          )}
          {!certsLoading && certs.length === 0 && (
            <div className="text-center py-12 border border-white/5">
              <Award className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-700 text-sm">No certificates issued to you yet.</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {certs.map(cert => (
              <AttendeeCertCard
                key={cert._id}
                cert={cert}
                onDownload={handleCertDownload}
                downloading={downloading}
              />
            ))}
          </div>
        </div>

      </div>

      {showSetPw && <SetPasswordModal onClose={() => setShowSetPw(false)} />}
    </div>
  );
};

export default ProfilePage;