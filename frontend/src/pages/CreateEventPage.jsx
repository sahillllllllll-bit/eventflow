// frontend/src/pages/CreateEventPage.jsx
// Changes from original:
//   • Step 2 (Ticket & Email): if paidEmailCredits > 0, show RazorpayButton
//     before user can proceed to next step.
//   • All other logic/UI is completely unchanged.

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

  // ── Email credits payment state ──────────────────────────────
  // Tracks whether the organiser has paid for extra email credits on step 2.
  // Reset whenever paidEmailCredits changes so they must re-pay.
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
    'Registration Form',
    'Review & Publish',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // If credits amount changes, invalidate any prior payment
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
      // If email credits are required, payment must be done first
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
    // Include email credits payment reference if applicable
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

  const inputCls = 'w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none';

  // Computed: does organiser need to pay for email credits?
  const needsEmailPayment =
    formData.sendTicketEmails &&
    formData.paidEmailCredits > 0 &&
    !emailCreditsPaid;

  const emailCreditCost = parseFloat((formData.paidEmailCredits * 0.20).toFixed(2));

  return (
    <div className="flex min-h-screen bg-bg text-white">
      <Sidebar />

      <div className="flex-1 ml-60 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
            <p className="text-gray-400">Follow the steps below to set up your event</p>
          </div>

          <StepWizard steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

          {/* ── Step 1: Event Basics ─────────────────────────────────────── */}
          {currentStep === 0 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Event Basics</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., TechFest 2025"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Short Summary
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    (one-liner shown below the title on the public event page)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Capacity</label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date & Time *</label>
                  <input type="datetime-local" value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date & Time</label>
                  <input type="datetime-local" value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-surface-overlay border border-border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" checked={formData.isOnline}
                    onChange={(e) => handleInputChange('isOnline', e.target.checked)}
                    className="w-4 h-4 accent-brand rounded" />
                  <span className="font-medium">This is an online event</span>
                </label>
              </div>

              {!formData.isOnline ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Venue Name *</label>
                    <input type="text" value={formData.venue}
                      onChange={(e) => handleInputChange('venue', e.target.value)}
                      placeholder="e.g., College Auditorium" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Google Maps Link</label>
                    <input type="url" value={formData.venueMapLink}
                      onChange={(e) => handleInputChange('venueMapLink', e.target.value)}
                      placeholder="https://maps.google.com/..." className={inputCls} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Link *</label>
                  <input type="url" value={formData.meetLink}
                    onChange={(e) => handleInputChange('meetLink', e.target.value)}
                    placeholder="https://meet.google.com/... or https://zoom.us/..." className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description, Rules & Schedule
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    — shown on the event page, Markdown supported
                  </span>
                </label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={(v) => handleInputChange('description', v)}
                  placeholder={`## About the Event\nTell attendees what this event is about…\n\n## Rules\n- Rule one\n- Rule two\n\n## Schedule\n| Time | Activity |\n|------|----------|\n| 9:00 AM | Registration |`}
                  minHeight="320px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <input type="text" value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="technology, innovation, learning (comma-separated)"
                  className={inputCls} />
              </div>
            </div>
          )}

          {/* ── Step 2: Ticket & Email Settings ─────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Ticket & Email Settings</h2>

              <div className="flex items-center gap-4 p-4 bg-surface-overlay border border-border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" checked={formData.isPaid}
                    onChange={(e) => handleInputChange('isPaid', e.target.checked)}
                    className="w-4 h-4 accent-brand rounded" />
                  <span className="font-medium">This is a paid event</span>
                </label>
              </div>

              {formData.isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Price (₹)</label>
                  <input type="number" value={formData.ticketPrice}
                    onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                    placeholder="e.g., 500" className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prizes & Goodies</label>
                <textarea value={formData.prizesAndGoodies}
                  onChange={(e) => handleInputChange('prizesAndGoodies', e.target.value)}
                  placeholder="e.g., Winner gets premium membership, all participants get certificates…"
                  rows="3"
                  className={`${inputCls} resize-none`} />
              </div>

              <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                <p className="text-sm font-medium text-gray-300 mb-2">💰 Platform Fees:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  {formData.isPaid && <li>• 3% on paid events(Payment Gateway fees)</li>}
                </ul>
              </div>

              {/* Email ticket toggle */}
              <div className="rounded-xl border-2 border-border overflow-hidden">
                <div
                  className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${
                    formData.sendTicketEmails
                      ? 'bg-brand/10 border-b border-brand/20'
                      : 'bg-surface-overlay border-b border-border'
                  }`}
                  onClick={() => handleInputChange('sendTicketEmails', !formData.sendTicketEmails)}
                >
                  <div className="flex items-center gap-3">
                    {formData.sendTicketEmails
                      ? <Mail className="w-5 h-5 text-brand" />
                      : <MailX className="w-5 h-5 text-gray-500" />
                    }
                    <div>
                      <p className="font-semibold text-white">
                        {formData.sendTicketEmails ? 'Ticket emails are ON' : 'Ticket emails are OFF'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formData.sendTicketEmails
                          ? 'Each registrant receives their ticket + QR code instantly by email'
                          : 'No email will be sent — registrants can still download from the confirmation page'}
                      </p>
                    </div>
                  </div>

                  <div className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    formData.sendTicketEmails ? 'bg-brand' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.sendTicketEmails ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>

                {formData.sendTicketEmails && (
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-400">
                      First <strong className="text-white">100 emails are free</strong>. Above that, ₹0.20 per email.
                      Pre-purchase credits if you expect more than 100 registrations.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Extra email credits
                          <span className="ml-1 text-xs text-gray-500">(beyond the free 100)</span>
                        </label>
                        <input type="number" min="0" value={formData.paidEmailCredits}
                          onChange={(e) => handleInputChange('paidEmailCredits', Number(e.target.value) || 0)}
                          placeholder="0" className={inputCls} />
                      </div>
                      <div className="rounded-xl border border-border p-4 bg-surface-raised">
                        <p className="text-sm text-gray-400">Estimated charge</p>
                        <p className="text-2xl font-semibold text-white">
                          ₹{emailCreditCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Billed now via Razorpay.</p>
                      </div>
                    </div>

                    {/* ── Pay for Email Credits ─────────────────────── */}
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

          {/* ── Step 3: Landing Page Template ───────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-2">Choose Landing Page Template</h2>
              <p className="text-gray-400 mb-6">Pick a design for your event's public landing page</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {['minimal','bold','gradient','dark','glass'].map(template => (
                  <TemplateCard key={template} template={template}
                    isSelected={formData.template === template}
                    onClick={() => handleInputChange('template', template)} />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Registration Form ────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Registration Form Builder</h2>
              <FormBuilder
                sections={formData.formSections}
                onSectionsChange={(sections) => handleInputChange('formSections', sections)} />
            </div>
          )}

          {/* ── Step 5: Review & Publish ──────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Review & Publish</h2>
              <div className="space-y-4">
                <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Event Name</p>
                  <p className="text-lg font-semibold text-white">{formData.title || 'Not set'}</p>
                  {formData.shortSummary && (
                    <p className="text-sm text-gray-400 mt-1">{formData.shortSummary}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</p>
                    <p className="text-sm text-gray-300">
                      {formData.date ? new Date(formData.date).toLocaleString() : 'Not set'}
                    </p>
                  </div>
                  <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                    <p className="text-sm text-gray-300">
                      {formData.isOnline ? 'Online' : formData.venue || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Template</p>
                    <p className="text-sm text-gray-300 capitalize">{formData.template}</p>
                  </div>
                  <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ticket Emails</p>
                    <p className={`text-sm font-medium ${formData.sendTicketEmails ? 'text-green-400' : 'text-gray-500'}`}>
                      {formData.sendTicketEmails
                        ? `✅ Enabled (${100 + (formData.paidEmailCredits || 0)} total credits)`
                        : '🚫 Disabled'}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <p className="text-sm text-gray-300">
                    ✅ All looks good! Publish now or save as draft to edit later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-border">
            <button onClick={handlePrev} disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 border border-border text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-medium">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-3">
              <button onClick={handleSaveDraft} disabled={loading}
                className="flex items-center gap-2 px-6 py-3 border border-border text-gray-300 hover:text-white hover:border-brand rounded-lg transition font-medium disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Draft
              </button>
              {currentStep === steps.length - 1 ? (
                <button onClick={() => setPublishModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition">
                  <Eye className="w-4 h-4" /> Publish Event
                </button>
              ) : (
                <button onClick={() => { if (validateStep()) handleNext(); }}
                  className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <Modal isOpen={publishModal} onClose={() => setPublishModal(false)} title="Publish Event?">
        <div className="space-y-4">
          <p className="text-gray-300">
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
              className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-300 hover:text-white transition font-medium">
              Cancel
            </button>
            <button onClick={handlePublish} disabled={loading}
              className="flex-1 px-4 py-2 bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg transition font-medium">
              {loading ? 'Publishing…' : 'Publish Event'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type}
            onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default CreateEventPage;