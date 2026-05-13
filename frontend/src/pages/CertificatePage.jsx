import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificateAPI } from '../api/endpoints.js';
import useToast, { Toast } from '../hooks/useToast.jsx';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Check,
  AlertCircle,
  Loader,
  Award,
} from 'lucide-react';
import CertificateEditor from '../components/CertificateEditor.jsx';
import CertificatePreview from '../components/CertificatePreview.jsx';
import Sidebar from '../components/Sidebar.jsx';

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

  useEffect(() => {
    fetchEvents();
    fetchPricing();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await certificateAPI.getOrganizerEvents();
      setEvents(response.data);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to fetch events', 'error');
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
      setRegistrations(response.data);
      setSelectedRegistrations([]);
      setSelectAll(false);
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
    if (!id) {
      showToast('Registration ID is invalid', 'error');
      return;
    }
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleContinueToEditor = async () => {
    if (selectedRegistrations.length === 0) {
      showToast('Please select at least one registration', 'error');
      return;
    }
    const newTemplate = {
      eventId: selectedEvent._id,
      templateName: `Certificate - ${selectedEvent.name}`,
      heading: 'Certificate of Completion',
      subHeading: 'This is to certify that',
      descriptionText: 'Has successfully completed the event',
      organizerName: 'Event Organizer',
      backgroundColor: '#ffffff',
      accentColor: '#3B82F6',
    };
    setTemplate(newTemplate);
    setStep(3);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      setIsLoading(true);
      const response = await certificateAPI.createTemplate(templateData);
      setTemplateId(response.data._id);
      setTemplate(response.data);
      const pricingCheck = await certificateAPI.checkPricing({
        certificateCount: selectedRegistrations.length,
      });
      setPricingInfo(pricingCheck.data);
      setStep(4);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to save template', 'error');
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
      for (const cert of generatedCertificates) {
        const response = await certificateAPI.downloadCertificatePDF(cert._id);
        const printWindow = window.open('', '', 'width=1200,height=800');
        printWindow.document.write(response.data.html);
        printWindow.document.close();
        printWindow.print();
      }
      showToast('All certificates downloaded', 'success');
    } catch (error) {
      showToast('Failed to download certificates', 'error');
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
        showToast(`${response.data.failedEmails.length} emails failed to send`, 'error');
      }
    } catch (error) {
      showToast('Failed to send emails', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const STEPS = ['Select Event', 'Recipients', 'Design', 'Send'];

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />

      <div className="ml-60 min-h-screen">
        {/* Header */}
        <div className="bg-surface border-b border-surface-overlay p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-7 h-7 text-brand" />
              <h1 className="text-3xl font-bold">Certificate Generator</h1>
            </div>
            {step > 1 && (
              <button
                onClick={() => {
                  setStep(step - 1);
                  if (step === 2) { setSelectedEvent(null); setRegistrations([]); }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-surface-overlay rounded-lg hover:border-brand text-gray-400 hover:text-white transition text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Steps Indicator */}
          <div className="mb-6 bg-surface border border-surface-overlay rounded-lg p-4">
            <div className="flex items-center">
              {STEPS.map((label, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        step > index + 1
                          ? 'bg-green-500 text-white'
                          : step === index + 1
                          ? 'bg-brand text-white'
                          : 'bg-surface-overlay text-gray-500'
                      }`}
                    >
                      {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        step >= index + 1 ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 mx-3 h-px ${step > index + 1 ? 'bg-green-500' : 'bg-surface-overlay'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-surface border border-surface-overlay rounded-lg p-6">
            {step === 1 && (
              <SelectEventStep
                events={events}
                isLoading={isLoading}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {step === 2 && (
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
            )}

            {step === 3 && (
              <CertificateEditor
                template={template}
                event={selectedEvent}
                registrationCount={selectedRegistrations.length}
                onSave={handleSaveTemplate}
                onBack={() => setStep(2)}
                isLoading={isLoading}
              />
            )}

            {step === 4 && (
              <SendCertificatesStep
                event={selectedEvent}
                registrationCount={selectedRegistrations.length}
                pricingInfo={pricingInfo}
                generatedCertificates={generatedCertificates}
                isGenerating={isGenerating}
                onGenerateCertificates={handleGenerateCertificates}
                onDownloadAll={handleDownloadAll}
                onSendEmails={handleSendEmails}
                onBack={() => setStep(3)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Step 1: Select Event
function SelectEventStep({ events, isLoading, onSelectEvent }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto" />
        <p className="text-gray-400 mt-4 ml-4">Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border-2 border-dashed border-surface-overlay rounded-lg p-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
        <p className="text-gray-400">Create an event first to generate certificates</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Select an Event</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div
            key={event._id}
            className="bg-bg border border-surface-overlay rounded-lg p-5 hover:border-brand cursor-pointer transition group"
            onClick={() => onSelectEvent(event)}
          >
            {event.eventImage && (
              <img
                src={event.eventImage}
                alt={event.name}
                className="w-full h-36 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="font-semibold text-white group-hover:text-brand transition mb-1">
              {event.name}
            </h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{event.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {new Date(event.startDate).toLocaleDateString()}
              </span>
              <span className="text-xs bg-surface-overlay text-gray-300 px-2 py-1 rounded-full">
                {event.registrationCount} registrations
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 2: Select Recipients
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
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Select Recipients</h2>
      <p className="text-gray-400 text-sm mb-5">{event?.name}</p>

      {/* Select All */}
      <div className="mb-4 p-4 bg-bg border border-surface-overlay rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={onSelectAll}
            className="w-4 h-4 accent-brand rounded"
          />
          <span className="text-sm font-medium text-white">
            Select All ({registrations.length} registrations)
          </span>
        </label>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {registrations.map((registration, index) => {
          const checked = selectedRegistrations.includes(registration._id);
          return (
            <div
              key={registration._id || index}
              onClick={() => onToggleRegistration(registration)}
              className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${
                checked
                  ? 'border-brand bg-brand/10'
                  : 'border-surface-overlay bg-bg hover:border-gray-500'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {}}
                className="w-4 h-4 accent-brand rounded pointer-events-none"
              />
              <div>
                <p className="font-medium text-white text-sm">{registration.name || 'N/A'}</p>
                <p className="text-xs text-gray-400">{registration.email}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-6">
        <span className="text-sm text-gray-400 self-center">
          {selectedRegistrations.length} selected
        </span>
        <button
          onClick={onContinue}
          disabled={selectedRegistrations.length === 0 || isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Step 4: Send Certificates
function SendCertificatesStep({
  event,
  registrationCount,
  pricingInfo,
  generatedCertificates,
  isGenerating,
  onGenerateCertificates,
  onDownloadAll,
  onSendEmails,
  onBack,
}) {
  const [certificatesGenerated, setCertificatesGenerated] = useState(false);

  const handleGenerate = async (autoSend) => {
    await onGenerateCertificates(autoSend);
    setCertificatesGenerated(true);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Certificate Summary</h2>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-bg border border-surface-overlay rounded-lg p-5">
          <p className="text-xs text-gray-400 mb-1">Event</p>
          <p className="font-semibold text-white">{event?.name}</p>
        </div>
        <div className="bg-bg border border-surface-overlay rounded-lg p-5">
          <p className="text-xs text-gray-400 mb-1">Recipients</p>
          <p className="font-semibold text-white">{registrationCount}</p>
        </div>
      </div>

      {/* Pricing Info */}
      {pricingInfo && (
        <div className="mb-6 bg-bg border border-surface-overlay rounded-lg p-5">
          <h3 className="font-semibold text-white mb-3">Pricing Information</h3>
          <p className="text-sm text-gray-400 mb-4">{pricingInfo.message}</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Free Available</p>
              <p className="text-2xl font-bold text-white">{pricingInfo.freeCertificatesAvailable}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Paid Needed</p>
              <p className="text-2xl font-bold text-white">{Math.max(0, pricingInfo.paidCertificates)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-brand">₹{pricingInfo.totalCost}</p>
            </div>
          </div>
        </div>
      )}

      {!certificatesGenerated ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-2">Choose how you want to distribute the certificates:</p>

          <button
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
            className="w-full p-5 bg-bg border border-surface-overlay rounded-lg hover:border-brand transition disabled:opacity-50 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white group-hover:text-brand transition mb-1">
                  Download All Certificates
                </h3>
                <p className="text-sm text-gray-400">Generate certificates for offline download</p>
              </div>
              {isGenerating
                ? <Loader className="animate-spin text-gray-400 w-5 h-5" />
                : <Download className="w-5 h-5 text-gray-400 group-hover:text-brand transition" />}
            </div>
          </button>

          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="w-full p-5 bg-bg border border-surface-overlay rounded-lg hover:border-brand transition disabled:opacity-50 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white group-hover:text-brand transition mb-1">
                  Auto-Send via Email
                </h3>
                <p className="text-sm text-gray-400">Generate and send certificates directly to recipients</p>
              </div>
              {isGenerating
                ? <Loader className="animate-spin text-gray-400 w-5 h-5" />
                : <Mail className="w-5 h-5 text-gray-400 group-hover:text-brand transition" />}
            </div>
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-5 p-5 bg-bg border border-surface-overlay rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-semibold text-white">Certificates Generated Successfully!</p>
              <p className="text-sm text-gray-400">{generatedCertificates.length} certificates are ready</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onDownloadAll}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isGenerating ? <Loader className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
              Download All as PDF
            </button>

            <button
              onClick={onSendEmails}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-surface-overlay hover:border-brand text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isGenerating ? <Loader className="animate-spin w-4 h-4" /> : <Mail className="w-4 h-4" />}
              Send via Email
            </button>

            <button
              onClick={onBack}
              className="w-full px-6 py-3 border border-surface-overlay rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition text-sm"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}