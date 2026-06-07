import React, { useState } from 'react';
import { ChevronLeft, Edit2, Eye, Upload, Loader, Sparkles } from 'lucide-react';
import CertificatePreview from './CertificatePreview.jsx';
import AdvancedCertificatePreview from './AdvancedCertificatePreview.jsx';
import { PREBUILT_TEMPLATES, getTemplateById } from '../utils/prebuiltTemplates.js';

export default function CertificateEditor({
  template,
  event,
  registrationCount,
  onSave,
  onBack,
  isLoading,
}) {
  const [step, setStep] = useState('template-select'); // template-select, editing, advanced-preview
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [editData, setEditData] = useState({
    templateName: template?.templateName || '',
    heading: template?.heading || 'Certificate of Completion',
    headingColor: template?.headingColor || '#000000',
    headingFontSize: template?.headingFontSize || 48,
    subHeading: template?.subHeading || 'This is to certify that',
    subHeadingFontSize: template?.subHeadingFontSize || 24,
    descriptionText: template?.descriptionText || 'Has successfully completed the event',
    descriptionFontSize: template?.descriptionFontSize || 20,
    descriptionColor: template?.descriptionColor || '#000000',
    organizerName: template?.organizerName || '',
    backgroundColor: template?.backgroundColor || '#ffffff',
    accentColor: template?.accentColor || '#3B82F6',
    footerText: template?.footerText || 'Issued on {date}',
    footerFontSize: template?.footerFontSize || 14,
    footerColor: template?.footerColor || '#666666',
    logo: template?.logo || null,
    logoWidth: template?.logoWidth || 100,
    logoHeight: template?.logoHeight || 100,
    organizerSignature: template?.organizerSignature || null,
    borderStyle: template?.borderStyle || 'elegant',
    borderColor: template?.borderColor || '#3B82F6',
    templateDesign: template?.templateDesign || 'landscape',
    recipientNameFontSize: template?.recipientNameFontSize || 36,
    recipientNameColor: template?.recipientNameColor || '#3B82F6',
  });

  const handleChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (field, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditData((prev) => ({
        ...prev,
        [field]: e.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSelectTemplate = (prebuiltTemplate) => {
    setSelectedTemplate(prebuiltTemplate.id);
    setEditData((prev) => ({
      ...prev,
      ...prebuiltTemplate.template,
      templateName: prebuiltTemplate.name,
    }));
    setStep('editing');
  };

  const handleSave = async () => {
    const saveData = {
      eventId: template.eventId || event._id,
      ...editData,
    };
    await onSave(saveData);
  };

  const handleAdvancedSave = (newTemplate) => {
    setEditData(newTemplate);
    setShowAdvancedEdit(false);
  };

  const ColorInput = ({ label, field }) => (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={editData[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-12 h-10 rounded cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          value={editData[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  );

  const TextInput = ({ label, field }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <textarea
        value={editData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  // Step 1: Template Selection
  if (step === 'template-select') {
    return (
      <div>
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Choose a Certificate Template</h2>
          <p className="text-gray-600 text-sm mt-2">
            Select from our 10 professionally designed templates or start from scratch
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Custom Template */}
          <div
            onClick={() => handleSelectTemplate({ id: 0, name: 'Blank', template: editData })}
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center min-h-48"
          >
            <Edit2 size={32} className="text-gray-400 mb-2" />
            <span className="font-semibold text-gray-900">Start from Scratch</span>
            <p className="text-xs text-gray-600 text-center mt-1">Create your own design</p>
          </div>

          {/* Prebuilt Templates */}
          {PREBUILT_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-lg transition flex flex-col"
            >
              <div className="text-4xl mb-3 text-center">{tmpl.preview}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{tmpl.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{tmpl.description}</p>
              <button className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Editing
  if (step === 'editing' && !showAdvancedEdit) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setStep('template-select')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ChevronLeft size={20} />
              Back to Templates
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Edit Certificate Design</h2>
            <p className="text-gray-600 text-sm mt-1">
              For {registrationCount} recipients • {editData.templateName}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={() => setShowAdvancedEdit(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Sparkles size={18} />
              Advanced Edit
            </button>
          </div>
        </div>

        {/* Editor Layout */}
        <div className="bg-gray-50 p-6 rounded-lg max-h-screen overflow-y-auto">
            <div className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={editData.templateName}
                  onChange={(e) => handleChange('templateName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Layout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Layout</label>
                <select
                  value={editData.templateDesign}
                  onChange={(e) => handleChange('templateDesign', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>

              {/* Colors Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Colors & Design</h3>
                <div className="space-y-3">
                  <ColorInput label="Background Color" field="backgroundColor" />
                  <ColorInput label="Accent Color" field="accentColor" />
                  <ColorInput label="Border Color" field="borderColor" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Border Style</label>
                    <select
                      value={editData.borderStyle}
                      onChange={(e) => handleChange('borderStyle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="none">None</option>
                      <option value="simple">Simple</option>
                      <option value="elegant">Elegant</option>
                      <option value="modern">Modern</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logo Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Logo</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('logo', e.target.files[0])}
                      className="w-full"
                    />
                  </div>
                  {editData.logo && (
                    <div>
                      <img src={editData.logo} alt="Logo preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Width (px)</label>
                      <input
                        type="number"
                        value={editData.logoWidth}
                        onChange={(e) => handleChange('logoWidth', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Height (px)</label>
                      <input
                        type="number"
                        value={editData.logoHeight}
                        onChange={(e) => handleChange('logoHeight', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Heading Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Main Heading</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heading Text</label>
                    <input
                      type="text"
                      value={editData.heading}
                      onChange={(e) => handleChange('heading', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <ColorInput label="Heading Color" field="headingColor" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Font Size (px)</label>
                    <input
                      type="number"
                      value={editData.headingFontSize}
                      onChange={(e) => handleChange('headingFontSize', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sub Heading */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Sub Heading</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
                    <input
                      type="text"
                      value={editData.subHeading}
                      onChange={(e) => handleChange('subHeading', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Font Size (px)</label>
                    <input
                      type="number"
                      value={editData.subHeadingFontSize}
                      onChange={(e) => handleChange('subHeadingFontSize', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Name */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Recipient Name</h3>
                <div className="space-y-3">
                  <ColorInput label="Name Color" field="recipientNameColor" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Font Size (px)</label>
                    <input
                      type="number"
                      value={editData.recipientNameFontSize}
                      onChange={(e) => handleChange('recipientNameFontSize', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Description</h3>
                <div className="space-y-3">
                  <TextInput label="Description Text" field="descriptionText" />
                  <ColorInput label="Description Color" field="descriptionColor" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Font Size (px)</label>
                    <input
                      type="number"
                      value={editData.descriptionFontSize}
                      onChange={(e) => handleChange('descriptionFontSize', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Organizer */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Organizer Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organizer Name</label>
                    <input
                      type="text"
                      value={editData.organizerName}
                      onChange={(e) => handleChange('organizerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organizer Signature</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('organizerSignature', e.target.files[0])}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Footer</h3>
                <div className="space-y-3">
                  <TextInput label="Footer Text" field="footerText" />
                  <ColorInput label="Footer Color" field="footerColor" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Font Size (px)</label>
                    <input
                      type="number"
                      value={editData.footerFontSize}
                      onChange={(e) => handleChange('footerFontSize', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 mt-8 pb-8">
          <button
            onClick={() => setStep('template-select')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="animate-spin" size={18} /> : <Edit2 size={18} />}
            Save & Continue
          </button>
        </div>
        
      </div>
    );
  }

  // Step 3: Advanced Preview Edit
  if (showAdvancedEdit) {
    return (
      <AdvancedCertificatePreview
        template={editData}
        recipientName="John Doe"
        eventName={event?.name || 'Sample Event'}
        collegeName={event?.college || 'Sample College'}
        onSave={handleAdvancedSave}
        onBack={() => setShowAdvancedEdit(false)}
        isEditing={true}
      />
    );
  }
}
