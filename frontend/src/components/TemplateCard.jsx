import React from 'react';
import { Check } from 'lucide-react';

const TemplateCard = ({ template, isSelected, onClick, preview }) => {
  const templateDescriptions = {
    minimal: 'Clean, minimal design with focus on content',
    bold: 'Full-bleed cover with bold typography',
    gradient: 'Modern gradient hero with glassmorphism',
    dark: 'Dark cyberpunk aesthetic with neon accents',
    glass: 'Frosted glass panels with soft blur backdrop',
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-4 border-2 rounded-xl transition-all duration-200 group ${
        isSelected
          ? 'border-brand bg-brand/5'
          : 'border-border hover:border-brand/50 bg-surface-raised'
      }`}
    >
      {/* Template Preview */}
      <div className={`h-40 rounded-lg mb-4 overflow-hidden border border-border/50 relative`}>
        <div className={`w-full h-full flex items-center justify-center text-sm font-medium
          ${template === 'minimal' && 'bg-white text-gray-900'}
          ${template === 'bold' && 'bg-gradient-to-b from-blue-900 to-black text-white'}
          ${template === 'gradient' && 'bg-gradient-to-br from-purple-600 via-pink-500 to-purple-900'}
          ${template === 'dark' && 'bg-black text-cyan-400'}
          ${template === 'glass' && 'bg-gradient-to-br from-blue-200 to-purple-200 text-gray-800'}
        `}>
          {template.charAt(0).toUpperCase() + template.slice(1)}
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
  );
};

export default TemplateCard;
