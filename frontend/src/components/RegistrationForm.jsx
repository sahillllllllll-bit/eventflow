import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const RegistrationForm = ({ formSections, onSubmit, loading = false, isPaid = false, ticketPrice = 0 }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: null,
      }));
    }
  };

  const handleFileChange = (fieldId, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: 'File size must be less than 5MB',
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [fieldId]: file,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    formSections.forEach(section => {
      if (section.required && !formData[section.id]) {
        newErrors[section.id] = `${section.label} is required`;
      }
    });

    // Validate email format
    formSections.forEach(section => {
      if (section.type === 'email' && formData[section.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[section.id])) {
          newErrors[section.id] = 'Please enter a valid email address';
        }
      }
    });

    // Validate phone format
    formSections.forEach(section => {
      if (section.type === 'phone' && formData[section.id]) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData[section.id].replace(/\D/g, ''))) {
          newErrors[section.id] = 'Please enter a valid 10-digit phone number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      onSubmit(formData);
    }
  };

  const renderField = (section) => {
    const fieldId = section.id;
    const value = formData[fieldId] || '';
    const error = errors[fieldId];

    const fieldClasses = `w-full px-4 py-3 bg-surface-overlay border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition ${
      error ? 'border-red-500/50' : 'border-border'
    }`;

    switch (section.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            placeholder={section.placeholder}
            className={fieldClasses}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            placeholder={section.placeholder}
            className={fieldClasses}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={section.placeholder || '10-digit phone number'}
            className={fieldClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            placeholder={section.placeholder}
            rows="4"
            className={fieldClasses}
          />
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            className={fieldClasses}
          >
            <option value="">Select an option...</option>
            {section.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {section.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={fieldId}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleChange(fieldId, e.target.value)}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {section.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={fieldId}
                  value={opt}
                  checked={(value || []).includes(opt)}
                  onChange={(e) => {
                    const checked = value || [];
                    if (e.target.checked) {
                      handleChange(fieldId, [...checked, opt]);
                    } else {
                      handleChange(fieldId, checked.filter(item => item !== opt));
                    }
                  }}
                  className="w-4 h-4 accent-brand rounded"
                />
                <span className="text-sm text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => handleFileChange(fieldId, e.target.files?.[0])}
            className={`${fieldClasses} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand file:text-white file:cursor-pointer`}
          />
        );

      case 'heading':
        return <h3 className="text-lg font-semibold text-white mt-2">{section.label}</h3>;

      case 'divider':
        return <hr className="border-border my-2" />;

      case 'google_map':
        return (
          <input
            type="text"
            placeholder="Your location (Google Maps)"
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            className={fieldClasses}
          />
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Fields */}
      {formSections.map((section) => (
        <div key={section.id}>
          {['heading', 'divider'].includes(section.type) ? (
            renderField(section)
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {section.label}
                {section.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {renderField(section)}
              {errors[section.id] && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {errors[section.id]}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Consent Checkbox */}
      <div className="border-t border-border pt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentPromoEmails !== false}
            onChange={(e) => handleChange('consentPromoEmails', e.target.checked)}
            className="w-4 h-4 accent-brand rounded mt-1"
          />
          <span className="text-sm text-gray-300">
            Keep me updated with future events and special offers from the organizer
          </span>
        </label>
      </div>

      {/* Pricing Info */}
      {isPaid && (
        <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">Ticket Price:</span> ₹{ticketPrice}
          </p>
          <p className="text-xs text-gray-400 mt-1">You'll be redirected to Razorpay for payment after submission.</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
      >
        {loading ? 'Processing...' : 'Complete Registration'}
      </button>
    </form>
  );
};

export default RegistrationForm;
