import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StepWizard from '../components/StepWizard.jsx';
import TemplateCard from '../components/TemplateCard.jsx';
import FormBuilder from '../components/FormBuilder.jsx';
import Modal from '../components/Modal.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { eventAPI } from '../api/endpoints.js';
import { Calendar, MapPin, Link, FileText, ChevronRight, ChevronLeft, Save, Eye } from 'lucide-react';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toasts, showToast, removeToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [publishModal, setPublishModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'fest',
    date: '',
    endDate: '',
    isOnline: false,
    venue: '',
    venueMapLink: '',
    meetLink: '',
    description: '',
    coverImage: null,
    tags: '',
    maxCapacity: '',
    template: 'minimal',
    isPaid: false,
    ticketPrice: 0,
    formSections: [],
  });

  const steps = [
    'Event Basics',
    'Ticket Settings',
    'Landing Page',
    'Registration Form',
    'Review & Publish',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.title) {
        showToast('Event title is required', 'error');
        return false;
      }
      if (!formData.date) {
        showToast('Event date is required', 'error');
        return false;
      }
      if (!formData.isOnline && !formData.venue) {
        showToast('Venue is required for offline events', 'error');
        return false;
      }
      if (formData.isOnline && !formData.meetLink) {
        showToast('Meeting link is required for online events', 'error');
        return false;
      }
    }
    if (currentStep === 1) {
      if (formData.isPaid && formData.ticketPrice <= 0) {
        showToast('Ticket price must be greater than 0', 'error');
        return false;
      }
    }
    return true;
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        endDate: formData.endDate,
        venue: formData.venue,
        venueMapLink: formData.venueMapLink,
        isOnline: formData.isOnline,
        meetLink: formData.meetLink,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : null,
        isPaid: formData.isPaid,
        ticketPrice: formData.isPaid ? parseInt(formData.ticketPrice) : 0,
        template: formData.template,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        formSections: formData.formSections,
      };

      const response = await eventAPI.createEvent(payload);
      
      showToast('Event created successfully!', 'success');
      setPublishModal(false);
      
      setTimeout(() => {
        navigate(`/dashboard/events/${response.data.event._id}`);
      }, 1000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        status: 'draft',
      };

      await eventAPI.createEvent(payload);
      showToast('Event saved as draft!', 'success');
      setTimeout(() => navigate('/dashboard/events'), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-white">
      <Sidebar />
      
      <div className="flex-1 ml-60 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
            <p className="text-gray-400">Follow the steps below to set up your event</p>
          </div>

          {/* Step Wizard */}
          <StepWizard
            steps={steps}
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />

          {/* Step 1: Event Basics */}
          {currentStep === 0 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Event Basics</h2>

              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., TechFest 2024"
                  className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                />
              </div>

              {/* Category & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                  >
                    <option>fest</option>
                    <option>workshop</option>
                    <option>hackathon</option>
                    <option>competition</option>
                    <option>seminar</option>
                    <option>other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Capacity</label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              {/* Event Type Toggle */}
              <div className="flex items-center gap-4 p-4 bg-surface-overlay border border-border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={formData.isOnline}
                    onChange={(e) => handleInputChange('isOnline', e.target.checked)}
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span className="font-medium">This is an online event</span>
                </label>
              </div>

              {/* Venue or Meeting Link */}
              {!formData.isOnline ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Venue Name *</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => handleInputChange('venue', e.target.value)}
                      placeholder="e.g., College Auditorium"
                      className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Google Maps Link</label>
                    <input
                      type="url"
                      value={formData.venueMapLink}
                      onChange={(e) => handleInputChange('venueMapLink', e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Link *</label>
                  <input
                    type="url"
                    value={formData.meetLink}
                    onChange={(e) => handleInputChange('meetLink', e.target.value)}
                    placeholder="https://meet.google.com/... or https://zoom.us/..."
                    className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell attendees about your event..."
                  rows="4"
                  className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="e.g., technology, innovation, learning (comma-separated)"
                  className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Ticket Settings */}
          {currentStep === 1 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Ticket Settings</h2>

              <div className="flex items-center gap-4 p-4 bg-surface-overlay border border-border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => handleInputChange('isPaid', e.target.checked)}
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span className="font-medium">This is a paid event</span>
                </label>
              </div>

              {formData.isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Price (₹)</label>
                  <input
                    type="number"
                    value={formData.ticketPrice}
                    onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-3 bg-surface-overlay border border-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
                  />
                </div>
              )}

              <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                <p className="text-sm font-medium text-gray-300 mb-2">💰 Platform Fees:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• ₹1 per ticket</li>
                  {formData.isPaid && <li>• 3% on paid events</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Landing Page Template */}
          {currentStep === 2 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Choose Landing Page Template</h2>
              <p className="text-gray-400 mb-6">Pick a design for your event's public landing page</p>

              <div className="grid grid-cols-5 gap-4">
                {['minimal', 'bold', 'gradient', 'dark', 'glass'].map(template => (
                  <TemplateCard
                    key={template}
                    template={template}
                    isSelected={formData.template === template}
                    onClick={() => handleInputChange('template', template)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Registration Form */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Registration Form Builder</h2>
              <FormBuilder
                sections={formData.formSections}
                onSectionsChange={(sections) => handleInputChange('formSections', sections)}
              />
            </div>
          )}

          {/* Step 5: Review & Publish */}
          {currentStep === 4 && (
            <div className="space-y-6 bg-surface-raised border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Review & Publish</h2>

              <div className="space-y-4">
                <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Event Name</p>
                  <p className="text-lg font-semibold text-white">{formData.title || 'Not set'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</p>
                    <p className="text-sm text-gray-300">{formData.date ? new Date(formData.date).toLocaleString() : 'Not set'}</p>
                  </div>

                  <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                    <p className="text-sm text-gray-300">{formData.isOnline ? 'Online' : formData.venue || 'Not set'}</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-overlay border border-border rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Template</p>
                  <p className="text-sm text-gray-300 capitalize">{formData.template}</p>
                </div>

                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <p className="text-sm text-gray-300">
                    ✅ All looks good! You can publish this event now or save it as a draft to edit later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-border">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 border border-border text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-6 py-3 border border-border text-gray-300 hover:text-white hover:border-brand rounded-lg transition font-medium"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={() => setPublishModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition"
                >
                  <Eye className="w-4 h-4" /> Publish Event
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (validateStep()) {
                      handleNext();
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={publishModal}
        onClose={() => setPublishModal(false)}
        title="Publish Event?"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Your event will be live and available for registration. You can edit it anytime from the dashboard.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setPublishModal(false)}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-300 hover:text-white transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg transition font-medium"
            >
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3">
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
};

export default CreateEventPage;
