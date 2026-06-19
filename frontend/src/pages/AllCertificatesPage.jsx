import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { certificateAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import {
  Award, Download, ExternalLink, ChevronDown, ChevronRight,
  Calendar, Users, Loader, Search,
} from 'lucide-react';
import { renderCertificateToDOM } from '../services/certificateRenderer.js';

// ── helpers ───────────────────────────────────────────────────
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

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

// ── CertCard ─────────────────────────────────────────────────
const CertCard = ({ cert, onDownload, downloading }) => {
  const isLoading = downloading === cert._id;
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-surface border border-surface-overlay rounded-lg hover:border-brand/30 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{cert.recipientName}</p>
          <p className="text-gray-500 text-xs truncate">{cert.recipientEmail}</p>
          <p className="text-gray-600 text-xs mt-0.5">Issued: {fmtDate(cert.issuedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          cert.emailStatus === 'sent'
            ? 'bg-green-500/15 text-green-400'
            : 'bg-gray-500/15 text-gray-400'
        }`}>
          {cert.emailStatus === 'sent' ? '✉ Sent' : 'Pending'}
        </span>
        <button
          onClick={() => onDownload(cert._id, 'pdf')}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded transition disabled:opacity-50"
        >
          {isLoading
            ? <Loader className="w-3 h-3 animate-spin" />
            : <Download className="w-3 h-3" />
          }
          PDF
        </button>
        <button
          onClick={() => onDownload(cert._id, 'jpg')}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-medium rounded transition disabled:opacity-50"
        >
          {isLoading
            ? <Loader className="w-3 h-3 animate-spin" />
            : <Download className="w-3 h-3" />
          }
          JPG
        </button>
      </div>
    </div>
  );
};

// ── EventGroup ───────────────────────────────────────────────
const EventGroup = ({ group, onDownload, downloading }) => {
  const [open, setOpen] = useState(false);
  const { event, certificates } = group;

  return (
    <div className="border border-surface-overlay rounded-xl overflow-hidden mb-4">
      {/* Event header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-surface-raised hover:bg-surface-overlay transition text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {event.coverImage
            ? <img src={event.coverImage} alt={event.title}
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />
            : <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-brand/50" />
              </div>
          }
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{event.title}</p>
            <p className="text-gray-500 text-xs flex items-center gap-2 mt-0.5">
              <Calendar className="w-3 h-3" /> {fmtDate(event.date)}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
        }
      </button>

      {/* Cert list */}
      {open && (
        <div className="p-4 flex flex-col gap-2 bg-bg">
          {certificates.map(cert => (
            <CertCard
              key={cert._id}
              cert={cert}
              onDownload={onDownload}
              downloading={downloading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  AllCertificatesPage
//  Dashboard route: /dashboard/allcertificates
// ─────────────────────────────────────────────────────────────
const AllCertificatesPage = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    certificateAPI.getAllIssuedByOrganizer()
      .then(r => setGroups(r.data.groups || []))
      .catch(() => showToast('Failed to load certificates', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // ── Download handler (same logic as CertificatePage) ────────
  const handleDownload = async (certId, format) => {
    setDownloading(certId);
    try {
      const res = await certificateAPI.downloadCertificatePDF(certId);
      if (!res.data.success) { showToast('Failed to load certificate', 'error'); return; }

      const { certificate, template, event } = res.data;

      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
      document.body.appendChild(container);

      renderCertificateToDOM(
        { name: certificate.recipientName, uniqueCode: certificate.uniqueCode },
        container,
        template,
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
        backgroundColor: '#ffffff',
        windowHeight: 744, windowWidth: 1050, logging: false,
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
      showToast(`${format.toUpperCase()} downloaded!`, 'success');
    } catch (err) {
      showToast(`Download failed: ${err.message}`, 'error');
    } finally {
      setDownloading(null);
    }
  };

  // ── Filter groups by search ──────────────────────────────────
  const filtered = search.trim()
    ? groups.map(g => ({
        ...g,
        certificates: g.certificates.filter(c =>
          c.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
          c.recipientEmail?.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.certificates.length > 0 ||
        g.event.title?.toLowerCase().includes(search.toLowerCase()))
    : groups;

  const totalCerts = groups.reduce((s, g) => s + g.certificates.length, 0);

  return (
    <div className="min-h-screen bg-bg text-white">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay px-4 sm:px-6 py-5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-brand shrink-0" />
              <div>
                <h1 className="text-2xl font-bold">Issued Certificates</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {totalCerts} certificate{totalCerts !== 1 ? 's' : ''} across {groups.length} event{groups.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or event..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-surface-overlay rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading certificates…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-surface-overlay rounded-xl">
              <Award className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold">
                {search ? 'No certificates match your search.' : 'No certificates issued yet.'}
              </p>
              {!search && (
                <p className="text-gray-600 text-sm mt-1">
                  Go to Certificates to generate and send them to attendees.
                </p>
              )}
            </div>
          ) : (
            filtered.map(group => (
              <EventGroup
                key={group.event._id}
                group={group}
                onDownload={handleDownload}
                downloading={downloading}
              />
            ))
          )}
        </div>
      </div>

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default AllCertificatesPage;