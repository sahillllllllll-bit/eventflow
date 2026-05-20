import React, { useState } from 'react';
import { Check, Eye } from 'lucide-react';
import Modal from './Modal.jsx';

const TemplateCard = ({ template, isSelected, onClick, preview }) => {
  const [showPreview, setShowPreview] = useState(false);

  const templateDescriptions = {
    minimal: 'Clean, minimal design with focus on content',
    bold: 'Full-bleed cover with bold typography',
    gradient: 'Modern gradient hero with glassmorphism',
    dark: 'Dark cyberpunk aesthetic with neon accents',
    glass: 'Frosted glass panels with soft blur backdrop',
  };

  const templateStyles = {
    minimal: 'bg-white text-gray-900 border-gray-200',
    bold: 'bg-gradient-to-b from-blue-900 to-black text-white',
    gradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-purple-900 text-white',
    dark: 'bg-black text-cyan-400 border-cyan-400',
    glass: 'bg-gradient-to-br from-blue-200 to-purple-200 text-gray-800 border-gray-300',
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={onClick}
          className={`relative p-4 border-2 rounded-xl transition-all duration-200 group w-full ${
            isSelected
              ? 'border-brand bg-brand/5'
              : 'border-border hover:border-brand/50 bg-surface-raised'
          }`}
        >
          {/* Template Preview */}
          <div className={`h-40 rounded-lg mb-4 overflow-hidden border border-border/50 relative ${templateStyles[template]}`}>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">Sample Event Title</h3>
              <p className="text-sm opacity-80 mb-2">Sample event description goes here...</p>
              <div className="text-xs opacity-60">Date: Sample Date</div>
            </div>
          </div>

          {/* Template Name */}
          <h4 className="font-semibold text-white mb-1 capitalize">{template}</h4>

          {/* Description */}
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            {templateDescriptions[template]}
          </p>

          {/* Selected Indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </button>

        {/* Preview Button */}
        <button
          onClick={() => setShowPreview(true)}
          className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 hover:bg-black/70 text-white text-xs rounded flex items-center gap-1 transition"
        >
          <Eye className="w-3 h-3" /> Preview
        </button>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`${template.charAt(0).toUpperCase() + template.slice(1)} Template Preview`}
      >
        <div className={`min-h-96 rounded-lg border ${templateStyles[template]} p-6`}>
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Sample Event Title</h1>
            <p className="mb-4 opacity-90">This is a preview of how your event landing page will look with the {template} template. The design focuses on {templateDescriptions[template].toLowerCase()}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/10 rounded">
                <div className="text-sm font-semibold">Date & Time</div>
                <div className="text-sm opacity-80">Sample Date</div>
              </div>
              <div className="p-4 bg-black/10 rounded">
                <div className="text-sm font-semibold">Location</div>
                <div className="text-sm opacity-80">Sample Venue</div>
              </div>
            </div>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Register Now
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TemplateCard;
