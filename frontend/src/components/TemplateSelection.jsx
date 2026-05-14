import React, { useState } from 'react';
import { Edit2, Plus, ChevronRight, Search } from 'lucide-react';
import { PREBUILT_TEMPLATES } from '../utils/prebuiltTemplates.js';

const CertificateTemplateCard = ({ template, isSelected, onClick }) => {
  const bgStyle =
    template.template.backgroundColor.includes('gradient')
      ? { background: template.template.backgroundColor }
      : { backgroundColor: template.template.backgroundColor };

  const shapeStyles = {
    1: (
      <>
        <div className="absolute top-4 left-4 w-16 h-16 bg-blue-900 rounded-br-3xl" />
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-yellow-400 rounded-tl-3xl" />
        <div className="absolute top-6 right-6 w-20 h-4 bg-yellow-400 rounded-full opacity-90" />
      </>
    ),
    2: (
      <>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-20 h-20 rounded-br-full bg-yellow-500 opacity-80" />
          <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full bg-yellow-400 opacity-80" />
          <div className="absolute top-4 left-4 w-14 h-14 rounded-full border-4 border-yellow-300 shadow-xl" />
        </div>
      </>
    ),
    3: (
      <>
        <div className="absolute inset-y-0 left-0 w-24 bg-emerald-700 opacity-90" />
        <div className="absolute top-6 left-8 w-16 h-16 rounded-full bg-yellow-400 shadow-lg" />
      </>
    ),
    4: (
      <>
        <div className="absolute top-4 left-4 w-16 h-16 border border-rose-700 rounded-full opacity-40" />
        <div className="absolute top-4 right-4 w-16 h-16 border border-rose-700 rounded-full opacity-40" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-rose-700 rounded-full shadow-inner" />
      </>
    ),
    5: (
      <>
        <div className="absolute top-0 left-0 w-24 h-24 bg-red-800 skew-y-6" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 skew-y-12" />
        <div className="absolute right-8 top-12 w-16 h-16 bg-red-600 rounded-full border-4 border-yellow-300 shadow-lg" />
      </>
    ),
    6: (
      <>
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-bl-full shadow-lg" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300 rounded-tr-full shadow-lg" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-yellow-500 bg-yellow-100" />
      </>
    ),
    7: (
      <>
        <div className="absolute top-4 left-4 w-16 h-16 bg-violet-600 rounded-br-2xl" />
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-violet-500 rounded-tl-2xl" />
        <div className="absolute inset-x-14 top-0 h-1 bg-violet-300" />
      </>
    ),
    8: (
      <>
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-600 rounded-br-full opacity-80" />
        <div className="absolute bottom-0 right-0 w-32 h-28 bg-yellow-400 rounded-tl-full opacity-85" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-yellow-300 bg-yellow-200 shadow-xl" />
      </>
    ),
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-3xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${
        isSelected
          ? 'border-blue-600 shadow-2xl scale-105'
          : 'border-gray-200 hover:border-blue-400 shadow-lg hover:shadow-2xl'
      }`}
    >
      <div className="relative h-64 overflow-hidden" style={bgStyle}>
        <div className="absolute inset-0 bg-white/0" />
        <div className="absolute inset-0 border-2 border-white/20 rounded-3xl" />
        {shapeStyles[template.previewVariant]}

        <div className="relative z-10 h-full flex flex-col justify-center px-6 py-5 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Certificate</div>
          <div
            className="font-semibold text-lg md:text-xl mb-3"
            style={{ color: template.template.headingColor, fontFamily: template.template.recipientNameFontFamily || 'inherit' }}
          >
            {template.template.heading}
          </div>
          <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] mb-4">
            {template.template.subHeading}
          </div>
          <div
            className="text-2xl font-semibold mb-3"
            style={{ color: template.template.recipientNameColor, fontFamily: template.template.recipientNameFontFamily || 'Georgia, serif' }}
          >
            {template.template.recipientName || 'Recipient Name'}
          </div>
          <div className="text-xs text-gray-500 leading-5 mx-auto max-w-[85%]">
            {template.template.descriptionText}
          </div>
        </div>
      </div>
      <div className="p-4 bg-white">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">{template.name}</h3>
        <p className="text-xs text-gray-600 mb-4">{template.description}</p>
        {/* <button className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all">
          {isSelected ? '✓ Selected' : 'Select Template'}
        </button> */}
      </div>
    </div>
  );
};

const TemplatePreview = ({ template, isSelected, onClick }) => {
  return <CertificateTemplateCard template={template} isSelected={isSelected} onClick={onClick} />;
};

export default function TemplateSelection({ onSelectTemplate, onCustomStart, registrationCount, eventName }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = PREBUILT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (template) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template);
  };

  const handleCustomStart = () => {
    setSelectedTemplate(0);
    onCustomStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose Your Certificate Design</h1>
            <p className="text-lg text-gray-600">
              Creating certificates for <span className="font-semibold text-blue-600">{registrationCount}</span> recipients
              {eventName && <> from <span className="font-semibold text-blue-600">{eventName}</span></>}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-2 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Step 1 of 4</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search templates by name or style..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto">
        {/* Start from Scratch Card */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Own</h2>
          <div
            onClick={handleCustomStart}
            className="cursor-pointer rounded-xl border-2 border-dashed border-blue-400 overflow-hidden transition-all duration-300 hover:border-blue-600 hover:bg-blue-50 p-8"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start from Scratch</h3>
              <p className="text-gray-600 mb-4">
                Create a completely custom certificate design with our intuitive canvas editor
              </p>
              <div className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Create Custom Design
              </div>
            </div>
          </div>
        </div>

        {/* Prebuilt Templates */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Templates</h2>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No templates found. Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <TemplatePreview
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate === template.id}
                  onClick={() => handleSelect(template)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected Template Action */}
        {selectedTemplate && selectedTemplate !== 0 && (
          <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Ready to customize your certificate?</p>
            <button
              onClick={() => {
                const template = PREBUILT_TEMPLATES.find((t) => t.id === selectedTemplate);
                handleSelect(template);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Edit2 size={18} />
              Start Editing
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
