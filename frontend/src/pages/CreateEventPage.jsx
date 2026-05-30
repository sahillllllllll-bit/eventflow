import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StepWizard from '../components/StepWizard.jsx';
import TemplateCard from '../components/TemplateCard.jsx';
import FormBuilder from '../components/FormBuilder.jsx';
import Modal from '../components/Modal.jsx';
import MarkdownEditor from '../components/MarkdownEditor.jsx';
import RazorpayButton from '../components/RazorpayButton.jsx';
import DesktopNudge from '../components/DesktopNudge.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { eventAPI } from '../api/endpoints.js';
import {
  ChevronRight, ChevronLeft, Save, Eye, Mail, MailX,
} from 'lucide-react';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toasts, showToast, removeToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [publishModal, setPublishModal] = useState(false);

  const [emailCreditsPaid, setEmailCreditsPaid] = useState(false);
  const [emailCreditsPaymentId, setEmailCreditsPaymentId] = useState(null);

  const [formData, setFormData] = useState({
    title:            '',
    shortSummary:     '',
    category:         'fest',
    date:             '',
    endDate:          '',
    isOnline:         false,
    venue:            '',
    venueMapLink:     '',
    meetLink:         '',
    description:      '',
    coverImage:       null,
    tags:             '',
    maxCapacity:      '',
    template:         'minimal',
    isPaid:           false,
    ticketPrice:      0,
    sendTicketEmails: true,
    paidEmailCredits: 0,
    prizesAndGoodies: '',
    formSections:     [],
  });

  const steps = [
    'Event Basics',
    'Ticket & Email',
    'Landing Page',
    'Reg. Form',
    'Review',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'paidEmailCredits') {
      setEmailCreditsPaid(false);
      setEmailCreditsPaymentId(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.title.trim()) {
        showToast('Event title is required', 'error'); return false;
      }
      if (!formData.date) {
        showToast('Event date is required', 'error'); return false;
      }
      if (!formData.isOnline && !formData.venue.trim()) {
        showToast('Venue is required for offline events', 'error'); return false;
      }
      if (formData.isOnline && !formData.meetLink.trim()) {
        showToast('Meeting link is required for online events', 'error'); return false;
      }
    }
    if (currentStep === 1) {
      if (formData.isPaid && formData.ticketPrice <= 0) {
        showToast('Ticket price must be greater than 0', 'error'); return false;
      }
      if (
        formData.sendTicketEmails &&
        formData.paidEmailCredits > 0 &&
        !emailCreditsPaid
      ) {
        showToast('Please complete payment for email credits before continuing', 'error');
        return false;
      }
    }
    return true;
  };

  const buildPayload = (status = 'published') => ({
    title:            formData.title,
    shortSummary:     formData.shortSummary || undefined,
    description:      formData.description,
    category:         formData.category,
    date:             formData.date    || undefined,
    endDate:          formData.endDate || undefined,
    venue:            formData.venue   || undefined,
    venueMapLink:     formData.venueMapLink || undefined,
    isOnline:         formData.isOnline,
    meetLink:         formData.meetLink || undefined,
    maxCapacity:      formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
    isPaid:           formData.isPaid,
    ticketPrice:      formData.isPaid ? parseInt(formData.ticketPrice) : 0,
    sendTicketEmails: formData.sendTicketEmails,
    paidEmailCredits: formData.sendTicketEmails ? Number(formData.paidEmailCredits) : 0,
    template:         formData.template,
    prizesAndGoodies: formData.prizesAndGoodies || undefined,
    tags:             formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    formSections:     formData.formSections,
    status,
    ...(emailCreditsPaymentId && { emailCreditsPaymentId }),
  });

  const handlePublish = async () => {
    try {
      setLoading(true);
      const res = await eventAPI.createEvent(buildPayload('published'));
      const eventId = res.data.event._id;
      await eventAPI.publishEvent(eventId);
      showToast('Event published successfully!', 'success');
      setPublishModal(false);
      setTimeout(() => navigate(`/dashboard/events/${eventId}`), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to publish event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await eventAPI.createEvent(buildPayload('draft'));
      showToast('Event saved as draft!', 'success');
      setTimeout(() => navigate('/dashboard/events'), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none text-sm';
  const cardCls  = 'space-y-4 sm:space-y-6 bg-surface-raised border border-border rounded-xl p-4 sm:p-8';

  const emailCreditCost = parseFloat((formData.paidEmailCredits * 0.20).toFixed(2));

  return (
    <div className="flex min-h-screen bg-bg text-white">
      <Sidebar />

      {/* ── Desktop nudge banner (mobile only) ── */}
      <DesktopNudge
        storageKey="create_event_nudge"
        message="Creating and configuring events is much easier on a larger screen. Open EventGlow on your laptop or desktop for the best experience."
      />

      {/* Main content — offset for sidebar on lg+, full width on mobile */}
      <div className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Create New Event</h1>
            <p className="text-sm sm:text-base text-gray-400">Follow the steps below to set up your event</p>
          </div>

          {/* Step wizard — scrollable on mobile */}
          <div className="overflow-x-auto pb-2 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            <StepWizard steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
          </div>

          {/* ── Step 1: Event Basics ─────────────────────────────── */}
          {currentStep === 0 && (
            <div className={cardCls}>
              <h2 className="text-xl sm:text-2xl font-bold">Event Basics</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Event Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., TechFest 2025"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-1">
                  Short Summary
                  <span className="ml-1.5 text-xs text-gray-500 font-normal block sm:inline mt-0.5 sm:mt-0">
                    (one-liner shown below the title on the event page)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.shortSummary}
                  onChange={(e) => handleInputChange('shortSummary', e.target.value)}
                  placeholder="e.g., The biggest inter-college hackathon of 2025 — 48 hours, ₹1L+ in prizes"
                  maxLength={160}
                  className={inputCls}
                />
                <p className="text-xs text-gray-600 mt-1 text-right">{formData.shortSummary.length}/160</p>
              </div>

              {/* Category + Capacity: stacked on mobile, side-by-side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={inputCls}
                  >
                    {['fest','workshop','hackathon','competition','seminar','other'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Max Capacity</label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Dates: stacked on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Start Date & Time *</label>
                  <input type="datetime-local" value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">End Date & Time</label>
                  <input type="datetime-local" value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Online toggle */}
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" checked={formData.isOnline}
                    onChange={(e) => handleInputChange('isOnline', e.target.checked)}
                    className="w-4 h-4 accent-brand rounded flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">This is an online event</span>
                </label>
              </div>

              {!formData.isOnline ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Venue Name *</label>
                    <input type="text" value={formData.venue}
                      onChange={(e) => handleInputChange('venue', e.target.value)}
                      placeholder="e.g., College Auditorium" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Google Maps Link</label>
                    <input type="url" value={formData.venueMapLink}
                      onChange={(e) => handleInputChange('venueMapLink', e.target.value)}
                      placeholder="https://maps.google.com/..." className={inputCls} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Meeting Link *</label>
                  <input type="url" value={formData.meetLink}
                    onChange={(e) => handleInputChange('meetLink', e.target.value)}
                    placeholder="https://meet.google.com/... or https://zoom.us/..." className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Description, Rules & Schedule
                  <span className="ml-1.5 text-xs text-gray-500 font-normal block sm:inline mt-0.5 sm:mt-0">
                    — Markdown supported
                  </span>
                </label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={(v) => handleInputChange('description', v)}
                  placeholder={`## About the Event\nTell attendees what this event is about…\n\n## Rules\n- Rule one\n- Rule two\n\n## Schedule\n| Time | Activity |\n|------|----------|\n| 9:00 AM | Registration |`}
                  minHeight="240px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Tags</label>
                <input type="text" value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="technology, innovation, learning (comma-separated)"
                  className={inputCls} />
              </div>
            </div>
          )}

          {/* ── Step 2: Ticket & Email ───────────────────────────── */}
          {currentStep === 1 && (
            <div className={cardCls}>
              <h2 className="text-xl sm:text-2xl font-bold">Ticket & Email Settings</h2>

              <div className="flex items-center gap-3 p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" checked={formData.isPaid}
                    onChange={(e) => handleInputChange('isPaid', e.target.checked)}
                    className="w-4 h-4 accent-brand rounded flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">This is a paid event</span>
                </label>
              </div>

              {formData.isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Ticket Price (₹)</label>
                  <input type="number" value={formData.ticketPrice}
                    onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                    placeholder="e.g., 500" className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Prizes & Goodies</label>
                <textarea value={formData.prizesAndGoodies}
                  onChange={(e) => handleInputChange('prizesAndGoodies', e.target.value)}
                  placeholder="e.g., Winner gets premium membership, all participants get certificates…"
                  rows="3"
                  className={`${inputCls} resize-none`} />
              </div>

              {formData.isPaid && (
                <div className="p-3 sm:p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-300 mb-1">💰 Platform Fees:</p>
                  <p className="text-sm text-gray-400">• 3% on paid events (Payment Gateway fees)</p>
                </div>
              )}

              {/* Email toggle */}
              <div className="rounded-xl border-2 border-border overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 sm:p-5 cursor-pointer transition-colors ${
                    formData.sendTicketEmails
                      ? 'bg-brand/10 border-b border-brand/20'
                      : 'bg-surface-overlay border-b border-border'
                  }`}
                  onClick={() => handleInputChange('sendTicketEmails', !formData.sendTicketEmails)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
                    {formData.sendTicketEmails
                      ? <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-brand flex-shrink-0" />
                      : <MailX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base leading-tight">
                        {formData.sendTicketEmails ? 'Ticket emails ON' : 'Ticket emails OFF'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                        {formData.sendTicketEmails
                          ? 'Each registrant receives their ticket + QR code by email'
                          : 'No email sent — registrants download from confirmation page'}
                      </p>
                    </div>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    formData.sendTicketEmails ? 'bg-brand' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.sendTicketEmails ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>

                {formData.sendTicketEmails && (
                  <div className="p-4 sm:p-5 space-y-4">
                    <p className="text-sm text-gray-400">
                      First <strong className="text-white">100 emails are free</strong>. Above that, ₹0.20 per email.
                    </p>
                    {/* Credits input + cost: stacked on mobile */}
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 sm:items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                          Extra email credits
                          <span className="ml-1 text-xs text-gray-500">(beyond free 100)</span>
                        </label>
                        <input type="number" min="0" value={formData.paidEmailCredits}
                          onChange={(e) => handleInputChange('paidEmailCredits', Number(e.target.value) || 0)}
                          placeholder="0" className={inputCls} />
                      </div>
                      <div className="rounded-xl border border-border p-3 sm:p-4 bg-surface-raised">
                        <p className="text-xs sm:text-sm text-gray-400">Estimated charge</p>
                        <p className="text-xl sm:text-2xl font-semibold text-white">
                          ₹{emailCreditCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Billed now via Razorpay.</p>
                      </div>
                    </div>

                    {formData.paidEmailCredits > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm text-gray-400 mb-3">
                          Pay for <strong className="text-white">{formData.paidEmailCredits}</strong> extra email credits (₹{emailCreditCost.toFixed(2)}) to proceed.
                        </p>
                        <RazorpayButton
                          type="email_credits"
                          count={formData.paidEmailCredits}
                          label={`Pay ₹${emailCreditCost.toFixed(2)} for Email Credits`}
                          description={`${formData.paidEmailCredits} email credits`}
                          disabled={emailCreditsPaid}
                          onSuccess={({ paymentId: pid }) => {
                            setEmailCreditsPaid(true);
                            setEmailCreditsPaymentId(pid);
                            showToast('Email credits payment successful!', 'success');
                          }}
                          onError={(err) => {
                            if (err.message !== 'Payment cancelled')
                              showToast(err.message || 'Payment failed', 'error');
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Template ─────────────────────────────────── */}
          {currentStep === 2 && (
            <div className={cardCls}>
              <h2 className="text-xl sm:text-2xl font-bold">Choose Landing Page Template</h2>
              <p className="text-sm sm:text-base text-gray-400">Pick a design for your event's public landing page</p>
              {/* 2 cols on mobile, up to 5 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {['minimal','bold','gradient','dark','glass'].map(template => (
                  <TemplateCard key={template} template={template}
                    isSelected={formData.template === template}
                    onClick={() => handleInputChange('template', template)} />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Form Builder ─────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold">Registration Form Builder</h2>
              <FormBuilder
                sections={formData.formSections}
                onSectionsChange={(sections) => handleInputChange('formSections', sections)} />
            </div>
          )}

          {/* ── Step 5: Review & Publish ─────────────────────────── */}
          {currentStep === 4 && (
            <div className={cardCls}>
              <h2 className="text-xl sm:text-2xl font-bold">Review & Publish</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Event Name</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{formData.title || 'Not set'}</p>
                  {formData.shortSummary && (
                    <p className="text-sm text-gray-400 mt-1">{formData.shortSummary}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</p>
                    <p className="text-sm text-gray-300">
                      {formData.date ? new Date(formData.date).toLocaleString() : 'Not set'}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                    <p className="text-sm text-gray-300">
                      {formData.isOnline ? 'Online' : formData.venue || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Template</p>
                    <p className="text-sm text-gray-300 capitalize">{formData.template}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ticket Emails</p>
                    <p className={`text-sm font-medium ${formData.sendTicketEmails ? 'text-green-400' : 'text-gray-500'}`}>
                      {formData.sendTicketEmails
                        ? `✅ Enabled (${100 + (formData.paidEmailCredits || 0)} total credits)`
                        : '🚫 Disabled'}
                    </p>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <p className="text-sm text-gray-300">
                    ✅ All looks good! Publish now or save as draft to edit later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ───────────────────────────────── */}
          {/* On mobile: fixed to bottom above the nudge banner */}
          <div className="
            fixed bottom-0 inset-x-0 z-40
            lg:static lg:z-auto
            flex justify-between items-center
            px-4 py-3 sm:px-0 sm:py-0
            mt-0 lg:mt-10 lg:pt-8 lg:border-t lg:border-border
            bg-bg/95 backdrop-blur-sm border-t border-border
            lg:bg-transparent lg:backdrop-blur-none lg:border-none
          ">
            <button onClick={handlePrev} disabled={currentStep === 0}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-border text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-medium text-sm">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Back</span>
            </button>

            <div className="flex gap-2 sm:gap-3">
              <button onClick={handleSaveDraft} disabled={loading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 border border-border text-gray-300 hover:text-white hover:border-brand rounded-lg transition font-medium disabled:opacity-50 text-sm">
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Draft</span>
              </button>
              {currentStep === steps.length - 1 ? (
                <button onClick={() => setPublishModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition text-sm">
                  <Eye className="w-4 h-4" />
                  <span>Publish</span>
                </button>
              ) : (
                <button onClick={() => { if (validateStep()) handleNext(); }}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition text-sm">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom spacer so fixed nav doesn't cover content on mobile */}
          <div className="h-20 lg:hidden" />
        </div>
      </div>

      {/* Publish Modal */}
      <Modal isOpen={publishModal} onClose={() => setPublishModal(false)} title="Publish Event?">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm sm:text-base">
            Your event will be live and open for registration. You can edit it anytime from the dashboard.
          </p>
          {!formData.sendTicketEmails && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ Ticket emails are <strong>disabled</strong>. Registrants won't receive a confirmation email.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setPublishModal(false)}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-gray-300 hover:text-white transition font-medium text-sm">
              Cancel
            </button>
            <button onClick={handlePublish} disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg transition font-medium text-sm">
              {loading ? 'Publishing…' : 'Publish Event'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 space-y-3 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type}
            onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default CreateEventPage;