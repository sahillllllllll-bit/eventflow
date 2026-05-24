import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificateAPI } from '../api/endpoints.js';
import { paymentAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';
import useRazorpay from '../hooks/useRazorpay.js';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  AlertCircle,
  Loader,
  Award,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  IndianRupee,
} from 'lucide-react';
import TemplateSelection from '../components/TemplateSelection.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { getTemplateWithDecorations } from '../utils/prebuiltTemplates.js';
import CanvasCertificateEditor from '../components/CanvasCertificateEditor.jsx';
import { renderCertificateToDOM } from '../services/certificateRenderer.js';

const CERT_PRICE_PER = 0.60; // ₹0.60 per certificate — matches PricingPage

export default function CertificatePage() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [step, setStep] = useState(1);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);
  const [template, setTemplate] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCertificates, setGeneratedCertificates] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // ── Payment state for Step 5 ─────────────────────────────────
  const [certPaymentDone, setCertPaymentDone] = useState(false);
  const [certPaymentId, setCertPaymentId]     = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchPricing();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await certificateAPI.getOrganizerEvents();
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to fetch events', 'error');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await certificateAPI.getPricingInfo();
      setPricingInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const handleSelectEvent = async (event) => {
    try {
      setIsLoading(true);
      setSelectedEvent(event);
      const response = await certificateAPI.getEventRegistrations(event._id);
      setRegistrations(Array.isArray(response.data) ? response.data : []);
      setSelectedRegistrations([]);
      setSelectAll(false);
      // Reset payment state when switching events
      setCertPaymentDone(false);
      setCertPaymentId(null);
      setStep(2);
    } catch (error) {
      showToast('Failed to fetch registrations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAllRegistrations = () => {
    if (selectAll) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(registrations.map((r) => r._id).filter(Boolean));
    }
    setSelectAll(!selectAll);
  };

  const handleToggleRegistration = (registration) => {
    const id = registration._id;
    if (!id) return;
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleContinueToEditor = () => {
    if (selectedRegistrations.length === 0) {
      showToast('Please select at least one registration', 'error');
      return;
    }
    // Reset payment if recipient count changes
    setCertPaymentDone(false);
    setCertPaymentId(null);
    setStep(3);
  };

  const handleSelectTemplate = (selectedTemplate) => {
    const enrichedTemplate = getTemplateWithDecorations(selectedTemplate.id);
    if (enrichedTemplate) {
      setTemplate({
        eventId: selectedEvent._id,
        id: enrichedTemplate.id,
        templateName: enrichedTemplate.name,
        previewVariant: enrichedTemplate.previewVariant,
        ...enrichedTemplate.template,
      });
      setStep(4);
    }
  };

  const handleCustomStart = () => {
    setTemplate({
      eventId: selectedEvent._id,
      templateName: 'Custom Certificate',
      heading: 'Certificate of Completion',
      subHeading: 'This is to certify that',
      descriptionText: 'Has successfully completed the event',
      organizerName: 'Event Organizer',
      backgroundColor: '#ffffff',
      accentColor: '#3B82F6',
      borderStyle: 'elegant',
      borderColor: '#3B82F6',
      templateDesign: 'landscape',
      recipientNameFontSize: 36,
      recipientNameColor: '#3B82F6',
    });
    setStep(4);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      setIsLoading(true);
      if (!templateData.templateName?.trim()) {
        showToast('Template name is required', 'error');
        return;
      }
      if (!selectedEvent?._id) {
        showToast('Event is required', 'error');
        return;
      }
      const response = await certificateAPI.createTemplate({
        ...templateData,
        eventId: selectedEvent._id,
      });
      setTemplateId(response.data._id);
      setTemplate(response.data);
      const pricingCheck = await certificateAPI.checkPricing({
        certificateCount: selectedRegistrations.length,
      });
      setPricingInfo(pricingCheck.data);
      showToast('Template saved successfully!', 'success');
      setStep(5);
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to save template.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCertificates = async (autoSend) => {
    try {
      setIsGenerating(true);
      const response = await certificateAPI.generateCertificates({
        templateId,
        eventId: selectedEvent._id,
        selectedRegistrationIds: selectedRegistrations,
        autoSend,
        paymentId: certPaymentId, // pass payment reference to backend
      });
      setGeneratedCertificates(response.data.certificates);
      fetchPricing();
      showToast(response.data.message, 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to generate certificates', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setIsGenerating(true);
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      let downloadCount = 0;
      const failedCerts = [];

      for (let i = 0; i < generatedCertificates.length; i++) {
        const cert = generatedCertificates[i];
        try {
          console.log(`[${i + 1}/${generatedCertificates.length}] Downloading: ${cert.recipientName}`);
          const response = await certificateAPI.downloadCertificatePDF(cert._id);

          if (!response.data.success) {
            console.error(`Failed to load data for ${cert.recipientName}`);
            failedCerts.push(cert.recipientName);
            continue;
          }

          const { certificate, template, event } = response.data;

          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.top = '-9999px';
          document.body.appendChild(container);

          renderCertificateToDOM(
            { name: certificate.recipientName, uniqueCode: certificate.uniqueCode },
            container,
            template,
            { eventName: event.title, date: new Date(event.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) }
          );

          const certCanvas = container.querySelector('[data-certificate-canvas]');
          if (!certCanvas) {
            document.body.removeChild(container);
            console.error(`Failed to render certificate for ${cert.recipientName}`);
            failedCerts.push(cert.recipientName);
            continue;
          }

          await waitForImagesToLoad(certCanvas);

          const canvas = await html2canvas(certCanvas, {
            scale: 3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            windowHeight: 744,
            windowWidth: 1050,
            logging: false,
          });

          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1050, 744],
          });
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, 1050, 744);
          pdf.save(response.data.fileName);

          document.body.removeChild(container);
          downloadCount++;
          console.log(`✓ Downloaded: ${cert.recipientName}`);

          if (i < generatedCertificates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
        } catch (error) {
          console.error(`Error downloading certificate for ${cert.recipientName}:`, error);
          failedCerts.push(cert.recipientName);
        }
      }

      if (failedCerts.length === 0) {
        showToast(`✓ Successfully downloaded all ${downloadCount} certificates!`, 'success');
      } else if (downloadCount > 0) {
        showToast(`Downloaded ${downloadCount} of ${generatedCertificates.length}. Failed: ${failedCerts.length}`, 'warning');
      } else {
        showToast(`Failed to download any certificates`, 'error');
      }
    } catch (error) {
      showToast(`Failed to download certificates: ${error.message}`, 'error');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmails = async () => {
    try {
      setIsGenerating(true);
      const certificateIds = generatedCertificates.map((c) => c._id);
      const response = await certificateAPI.sendCertificatesEmail({ certificateIds });
      showToast(`${response.data.sentCount} emails sent successfully`, 'success');
      if (response.data.failedEmails?.length > 0) {
        showToast(`${response.data.failedEmails.length} emails failed`, 'error');
      }
    } catch {
      showToast('Failed to send emails', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const STEPS = ['Select Event', 'Recipients', 'Template', 'Canvas Editor', 'Send'];

  const StepHeader = ({ stepNum, title, onBack }) => (
    <div className="bg-surface border-b border-border px-4 sm:px-6 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-brand flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">
              Step {stepNum} of {STEPS.length} — {STEPS[stepNum - 1]}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-border hover:border-brand rounded-lg text-gray-400 hover:text-brand transition text-sm flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-white">
      <Sidebar />

      <div className="lg:ml-60 min-h-screen">
        {/* ── Step 1 ───────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <StepHeader stepNum={1} title="Certificate Generator" />
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <SelectEventStep
                events={events}
                isLoading={isLoading}
                onSelectEvent={handleSelectEvent}
              />
            </div>
          </>
        )}

        {/* ── Step 2 ───────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <StepHeader
              stepNum={2}
              title={`Recipients — ${selectedEvent?.title || 'Event'}`}
              onBack={() => { setStep(1); setSelectedEvent(null); setRegistrations([]); }}
            />
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <SelectRecipientsStep
                event={selectedEvent}
                registrations={registrations}
                selectedRegistrations={selectedRegistrations}
                selectAll={selectAll}
                isLoading={isLoading}
                onToggleRegistration={handleToggleRegistration}
                onSelectAll={handleSelectAllRegistrations}
                onContinue={handleContinueToEditor}
              />
            </div>
          </>
        )}

        {/* ── Step 3 ───────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <StepHeader stepNum={3} title="Choose Certificate Template" onBack={() => setStep(2)} />
            <TemplateSelection
              onSelectTemplate={handleSelectTemplate}
              onCustomStart={handleCustomStart}
              registrationCount={selectedRegistrations.length}
              eventName={selectedEvent?.title}
            />
          </>
        )}

        {/* ── Step 4 ───────────────────────────────────────────────── */}
        {step === 4 && (
          <CanvasCertificateEditor
            template={template}
            event={selectedEvent}
            onSave={handleSaveTemplate}
            onBack={() => setStep(3)}
            isLoading={isLoading}
            registrationCount={selectedRegistrations.length}
            registrations={registrations.filter((r) => selectedRegistrations.includes(r._id))}
            eventName={selectedEvent?.title || ''}
          />
        )}

        {/* ── Step 5 ───────────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <StepHeader stepNum={5} title="Send Certificates" onBack={() => setStep(4)} />
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <SendCertificatesStep
                event={selectedEvent}
                eventId={selectedEvent?._id}
                registrationCount={selectedRegistrations.length}
                pricingInfo={pricingInfo}
                generatedCertificates={generatedCertificates}
                isGenerating={isGenerating}
                onGenerateCertificates={handleGenerateCertificates}
                onDownloadAll={handleDownloadAll}
                onSendEmails={handleSendEmails}
                showToast={showToast}
                // payment props
                certPaymentDone={certPaymentDone}
                setCertPaymentDone={setCertPaymentDone}
                setCertPaymentId={setCertPaymentId}
              />
            </div>
          </>
        )}
      </div>

      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type}
            onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

// ── Step 1: Select Event ──────────────────────────────────────────────────────
function SelectEventStep({ events, isLoading, onSelectEvent }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-brand/30 border-t-brand animate-spin" />
        <p className="text-gray-400">Loading your events…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-16 text-center mt-6">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-white">No Events Found</h3>
        <p className="text-gray-500">
          You need at least one <strong>published</strong> event to generate certificates.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Select an Event</h2>
        <p className="text-gray-400 mt-1">Choose which event to issue certificates for</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((event) => {
          const title    = event.title || 'Untitled Event';
          const location = event.isOnline ? 'Online' : (event.venue || '—');
          const dateStr  = event.date
            ? new Date(event.date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
            : 'Date TBA';

          return (
            <div
              key={event._id}
              onClick={() => onSelectEvent(event)}
              className="group bg-surface-raised border border-border hover:border-brand rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-brand/10"
            >
              {event.coverImage ? (
                <img src={event.coverImage} alt={title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
                  <Award className="w-10 h-10 text-brand/40" />
                </div>
              )}

              <div className="p-5">
                <h3 className="font-bold text-white text-lg leading-snug mb-3 group-hover:text-brand transition-colors line-clamp-2">
                  {title}
                </h3>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-brand/60" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand/60" />
                    <span className="truncate">{location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Users className="w-3.5 h-3.5 text-brand/60" />
                    <span>
                      {event.registrationCount}{' '}
                      {event.registrationCount === 1 ? 'registrant' : 'registrants'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-brand text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Select <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Select Recipients ─────────────────────────────────────────────────
function SelectRecipientsStep({
  event,
  registrations,
  selectedRegistrations,
  selectAll,
  isLoading,
  onToggleRegistration,
  onSelectAll,
  onContinue,
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin w-8 h-8 text-brand" />
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-white mb-1">{event?.title}</h2>
        <p className="text-gray-400 text-sm">Select which registrants will receive certificates</p>
      </div>

      <div className="p-6">
        {registrations.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No registrations found for this event.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={onSelectAll}
                  className="w-4 h-4 accent-brand rounded"
                />
                <span className="font-medium text-white text-sm">
                  Select All ({registrations.length})
                </span>
              </label>
              <span className="text-sm text-gray-400">
                {selectedRegistrations.length} selected
              </span>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto rounded-lg border border-border pr-1">
              {registrations.map((reg) => (
                <label
                  key={reg._id}
                  className="flex items-center gap-3 p-3 hover:bg-brand/5 cursor-pointer rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.includes(reg._id)}
                    onChange={() => onToggleRegistration(reg)}
                    className="w-4 h-4 accent-brand rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{reg.name}</p>
                    <p className="text-xs text-gray-500 truncate">{reg.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <button
          onClick={onContinue}
          disabled={selectedRegistrations.length === 0}
          className="mt-6 w-full px-6 py-3 bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          Continue to Design ({selectedRegistrations.length} recipient
          {selectedRegistrations.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
const waitForImagesToLoad = async (container) => {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map((img) =>
    new Promise((resolve) => {
      if (img.complete) { resolve(); return; }
      img.onload  = resolve;
      img.onerror = resolve; // don't block on broken images
      setTimeout(resolve, 5000);
    })
  );
  await Promise.all(promises);
};

// ── Step 5: Send Certificates ─────────────────────────────────────────────────
function SendCertificatesStep({
  event,
  eventId,
  registrationCount,
  pricingInfo,
  generatedCertificates,
  isGenerating,
  onGenerateCertificates,
  onDownloadAll,
  onSendEmails,
  showToast,
  // payment props from parent
  certPaymentDone,
  setCertPaymentDone,
  setCertPaymentId,
}) {
  const [downloading, setDownloading] = useState(null);
  // Local payment loading/error state
  const [payLoading, setPayLoading]   = useState(false);
  const [payError, setPayError]       = useState('');
  const { openCheckout }              = useRazorpay();

  const totalCost = parseFloat((registrationCount * CERT_PRICE_PER).toFixed(2));

  const handlePay = async () => {
    setPayLoading(true);
    setPayError('');
    try {
      // 1. Create order
      const orderRes = await paymentAPI.createOrder({
        type:    'certificates',
        eventId: eventId,
        count:   registrationCount,
      });
      const { order, amount } = orderRes.data;

      // 2. Open Razorpay checkout
      const paymentResponse = await openCheckout({
        order,
        amount,
        name:        'EventGlow',
        description: `${registrationCount} certificates — ${event?.title || 'Event'}`,
      });

      // 3. Verify
      await paymentAPI.verifyPayment({
        razorpay_order_id:   paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature:  paymentResponse.razorpay_signature,
      });

      // 4. Mark paid
      setCertPaymentDone(true);
      setCertPaymentId(paymentResponse.razorpay_payment_id);
      showToast('Payment successful! You can now generate certificates.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Payment failed';
      if (msg !== 'Payment cancelled') {
        setPayError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setPayLoading(false);
    }
  };

  const downloadSingleCertificate = async (certId, format) => {
    try {
      setDownloading(certId);
      const response = await certificateAPI.downloadCertificatePDF(certId);

      if (!response.data.success) {
        showToast('Failed to load certificate data', 'error');
        return;
      }

      const { certificate, template, event: certEvent } = response.data;

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top  = '-9999px';
      document.body.appendChild(container);

      renderCertificateToDOM(
        { name: certificate.recipientName, uniqueCode: certificate.uniqueCode },
        container,
        template,
        {
          eventName: certEvent.title,
          date: new Date(certEvent.date).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
        }
      );

      const html2canvas = (await import('html2canvas')).default;
      const certCanvas  = container.querySelector('[data-certificate-canvas]');

      if (!certCanvas) throw new Error('Failed to render certificate');

      await waitForImagesToLoad(certCanvas);

      const canvas = await html2canvas(certCanvas, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff',
        windowHeight: 744, windowWidth: 1050, logging: false,
      });

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1050, 744] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1050, 744);
        pdf.save(response.data.fileName);
        showToast('PDF downloaded successfully!', 'success');
      } else if (format === 'jpg') {
        const link = document.createElement('a');
        link.href     = canvas.toDataURL('image/jpeg', 0.95);
        link.download = response.data.fileName.replace('.pdf', '.jpg');
        link.click();
        showToast('JPG downloaded successfully!', 'success');
      }

      document.body.removeChild(container);
    } catch (error) {
      showToast(`Failed to download ${format.toUpperCase()}: ${error.message}`, 'error');
      console.error(error);
    } finally {
      setDownloading(null);
    }
  };

  // ── Before generation: show payment gate ────────────────────
  if (generatedCertificates.length === 0) {
    return (
      <div className="bg-surface-raised border border-border rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Generate Certificates</h2>
        <p className="text-gray-400 mb-6">
          Ready to generate <strong className="text-white">{registrationCount}</strong>{' '}
          certificate{registrationCount !== 1 ? 's' : ''} for{' '}
          <strong className="text-white">{event?.title}</strong>.
        </p>

        {/* Pricing info badge — unchanged from original */}
        {pricingInfo && (
          <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg mb-6 text-sm text-gray-300">
            <p>💳 Free certificates remaining:{' '}
              <strong className="text-white">{pricingInfo.freeRemaining ?? '—'}</strong>
            </p>
          </div>
        )}

        {/* ── Payment gate ─────────────────────────────────────── */}
        {!certPaymentDone ? (
          <div className="mb-6 p-5 bg-surface-overlay border border-border rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Certificate generation cost</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {registrationCount} × ₹{CERT_PRICE_PER} per certificate
                </p>
              </div>
              <p className="text-2xl font-bold text-white">₹{totalCost.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={payLoading || registrationCount === 0}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {payLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4" />
                  Pay ₹{totalCost.toFixed(2)} to Generate
                </>
              )}
            </button>

            {payError && (
              <p className="text-xs text-red-400 text-center">{payError}</p>
            )}
          </div>
        ) : (
          /* ── Payment done: green badge + unlocked buttons ──── */
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-medium text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            Payment successful — choose how to generate your certificates
          </div>
        )}

        {/* Generate buttons — disabled until paid */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onGenerateCertificates(false)}
            disabled={isGenerating || !certPaymentDone}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {isGenerating ? <Loader className="animate-spin w-4 h-4" /> : <Award className="w-4 h-4" />}
            {isGenerating ? 'Generating…' : 'Generate (Download Only)'}
          </button>
          <button
            onClick={() => onGenerateCertificates(true)}
            disabled={isGenerating || !certPaymentDone}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {isGenerating ? <Loader className="animate-spin w-4 h-4" /> : <Mail className="w-4 h-4" />}
            {isGenerating ? 'Generating…' : 'Generate & Email Instantly'}
          </button>
        </div>
      </div>
    );
  }

  // ── After generation: certificate list (unchanged from original) ──
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Award className="w-5 h-5 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {generatedCertificates.length} Certificate{generatedCertificates.length !== 1 ? 's' : ''} Ready!
        </h2>
      </div>
      <p className="text-gray-400 mb-8">Download or send them to your registrants via email.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={onDownloadAll}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-overlay border border-border hover:border-brand text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
        <button
          onClick={onSendEmails}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {isGenerating ? <Loader className="animate-spin w-4 h-4" /> : <Mail className="w-4 h-4" />}
          {isGenerating ? 'Sending…' : 'Send via Email'}
        </button>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-sm font-medium text-gray-400 mb-3">Generated certificates:</p>
        {generatedCertificates.map((cert) => (
          <div key={cert._id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface-overlay rounded-lg border border-border gap-3">
            <div className="flex-1">
              <p className="text-white font-medium">{cert.recipientName}</p>
              <p className="text-gray-500 text-xs">{cert.recipientEmail}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => downloadSingleCertificate(cert._id, 'pdf')}
                disabled={downloading === cert._id}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded transition"
              >
                {downloading === cert._id ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                PDF
              </button>
              <button
                onClick={() => downloadSingleCertificate(cert._id, 'jpg')}
                disabled={downloading === cert._id}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded transition"
              >
                {downloading === cert._id ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                JPG
              </button>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cert.emailStatus === 'sent'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {cert.emailStatus === 'sent' ? '✉ Sent' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}