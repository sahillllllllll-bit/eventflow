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
import TemplateSelection from '../components/TemplateSelection.jsx';
import CertificateTemplateEditor from '../components/CertificateTemplateEditor.jsx';
import CertificatePreview from '../components/CertificatePreview.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { getTemplateWithDecorations } from '../utils/prebuiltTemplates.js';

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

  const handleContinueToEditor = () => {
    if (selectedRegistrations.length === 0) {
      showToast('Please select at least one registration', 'error');
      return;
    }
    setStep(3);
  };

  const handleSelectTemplate = (selectedTemplate) => {
    const enrichedTemplate = getTemplateWithDecorations(selectedTemplate.id);
    if (enrichedTemplate) {
      const templateData = {
        eventId: selectedEvent._id,
        id: enrichedTemplate.id,
        templateName: enrichedTemplate.name,
        previewVariant: enrichedTemplate.previewVariant,
        ...enrichedTemplate.template,
      };
      setTemplate(templateData);
      setStep(4);
    }
  };

  const handleCustomStart = () => {
    const customTemplate = {
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
    };
    setTemplate(customTemplate);
    setStep(4);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      setIsLoading(true);
      // organizerId is extracted from JWT in backend auth middleware
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
      setStep(5);
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

  const STEPS = ['Select Event', 'Recipients', 'Template', 'Canvas Editor', 'Send'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-60 min-h-screen">
        {/* Step 1: Select Event */}
        {step === 1 && (
          <>
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-7 h-7 text-blue-600" />
                  <h1 className="text-3xl font-bold">Certificate Generator</h1>
                </div>
                <p className="text-gray-600">Step 1 of {STEPS.length}: Select Event</p>
              </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
              <SelectEventStep
                events={events}
                isLoading={isLoading}
                onSelectEvent={handleSelectEvent}
              />
            </div>
          </>
        )}

        {/* Step 2: Select Recipients */}
        {step === 2 && (
          <>
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-7 h-7 text-blue-600" />
                    <h1 className="text-3xl font-bold">Certificate Generator</h1>
                  </div>
                  <p className="text-gray-600">Step 2 of {STEPS.length}: Select Recipients</p>
                </div>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedEvent(null);
                    setRegistrations([]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-600 text-gray-700 hover:text-blue-600 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
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

        {/* Step 3: Select Template */}
        {step === 3 && (
          <div>
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Step 3 of {STEPS.length}</p>
                  <h1 className="text-2xl font-bold">Choose Certificate Template</h1>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>
            <TemplateSelection
              onSelectTemplate={handleSelectTemplate}
              onCustomStart={handleCustomStart}
              registrationCount={selectedRegistrations.length}
              eventName={selectedEvent?.name}
            />
          </div>
        )}

        {/* Step 4: Template Editor */}
        {step === 4 && (
          <CertificateTemplateEditor
            template={template}
            event={selectedEvent}
            onSave={handleSaveTemplate}
            onBack={() => setStep(3)}
            isLoading={isLoading}
            registrationCount={selectedRegistrations.length}
          />
        )}

        {/* Step 5: Send Certificates */}
        {step === 5 && (
          <>
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-7 h-7 text-blue-600" />
                    <h1 className="text-3xl font-bold">Certificate Generator</h1>
                  </div>
                  <p className="text-gray-600">Step {STEPS.length} of {STEPS.length}: Send Certificates</p>
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-600 text-gray-700 hover:text-blue-600 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
              <SendCertificatesStep
                event={selectedEvent}
                registrationCount={selectedRegistrations.length}
                pricingInfo={pricingInfo}
                generatedCertificates={generatedCertificates}
                isGenerating={isGenerating}
                onGenerateCertificates={handleGenerateCertificates}
                onDownloadAll={handleDownloadAll}
                onSendEmails={handleSendEmails}
              />
            </div>
          </>
        )}
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4 ml-4">Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
        <p className="text-gray-600">Create an event first to generate certificates</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Select an Event</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div
            key={event._id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-600 hover:shadow-lg cursor-pointer transition"
            onClick={() => onSelectEvent(event)}
          >
            {event.eventImage && (
              <img
                src={event.eventImage}
                alt={event.name}
                className="w-full h-40 object-cover rounded mb-4"
              />
            )}
            <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{event.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{event.registrationCount} registrations</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold mb-2">{event?.name}</h2>
        <p className="text-gray-600">Select which registrants will receive certificates</p>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="font-medium">Select All ({registrations.length})</span>
          </label>
          <span className="text-sm text-gray-600">
            {selectedRegistrations.length} selected
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {registrations.map((reg) => (
            <label
              key={reg._id}
              className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selectedRegistrations.includes(reg._id)}
                onChange={() => onToggleRegistration(reg)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <div className="flex-1">
                <p className="font-medium">{reg.name}</p>
                <p className="text-sm text-gray-600">{reg.email}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={onContinue}
          disabled={selectedRegistrations.length === 0}
          className="mt-6 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          Continue to Certificate Design ({selectedRegistrations.length} recipient
          {selectedRegistrations.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}

// Step 5: Send Certificates
function SendCertificatesStep({
  event,
  registrationCount,
  pricingInfo,
  generatedCertificates,
  isGenerating,
  onGenerateCertificates,
  onDownloadAll,
  onSendEmails,
}) {
  if (generatedCertificates.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">Generate & Send Certificates</h2>
        <button
          onClick={() => onGenerateCertificates(false)}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader className="animate-spin w-4 h-4" />
              Generating...
            </>
          ) : (
            'Generate Certificates'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8">
      <h2 className="text-2xl font-semibold mb-4">Certificates Generated!</h2>
      <p className="text-gray-600 mb-6">{generatedCertificates.length} certificates ready to download or send</p>

      <div className="flex gap-4">
        <button
          onClick={onDownloadAll}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
        <button
          onClick={onSendEmails}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          <Mail className="w-4 h-4" />
          Send via Email
        </button>
      </div>
    </div>
  );
}
