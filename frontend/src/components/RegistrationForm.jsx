import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const RegistrationForm = ({ formSections, onSubmit, loading = false }) => {
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
    
    // Validate locked fields
    lockedFields.forEach(field => {
      if (!formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    // Validate locked fields formats
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (formData.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }
    
    // Validate required custom fields
    formSections.forEach(section => {
      if (section.required && !formData[section.id]) {
        newErrors[section.id] = `${section.label} is required`;
      }
    });

    // Validate email format in custom fields
    formSections.forEach(section => {
      if (section.type === 'email' && formData[section.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[section.id])) {
          newErrors[section.id] = 'Please enter a valid email address';
        }
      }
    });

    // Validate phone format in custom fields
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

  // Locked/required fields that always appear
  const lockedFields = [
    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
    { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your.email@example.com', required: true },
    { id: 'phone', label: 'Phone Number', type: 'phone', placeholder: '10-digit phone number', required: true },
  ];

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
      {/* Locked Required Fields */}
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Required Information</h3>
          <div className="space-y-4">
            {lockedFields.map((field) => {
              const error = errors[field.id];
              const value = formData[field.id] || '';

              const fieldClasses = `w-full px-4 py-3 bg-surface-overlay border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition ${
                error ? 'border-red-500/50' : 'border-border'
              }`;

              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field.label} <span className="text-red-400">*</span>
                  </label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={fieldClasses}
                    />
                  )}
                  {field.type === 'email' && (
                    <input
                      type="email"
                      value={value}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={fieldClasses}
                    />
                  )}
                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      value={value}
                      onChange={(e) => handleChange(field.id, e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={field.placeholder}
                      className={fieldClasses}
                    />
                  )}
                  {error && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Form Fields */}
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
