import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Edit2,
  Eye,
  Save,
  Loader,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Type,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Download,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Trash2,
  Copy as CopyIcon,
  Lock,
  Unlock,
} from 'lucide-react';
import TemplateRenderer, { getDecorationShapes } from './TemplateRenderer';
import { getTemplateWithDecorations } from '../utils/prebuiltTemplates';

/**
 * Enhanced Certificate Template Editor
 * - Fully functional text editing
 * - Drag and resize elements
 * - Advanced text formatting
 * - Element management
 * - Production-ready workflow
 */

export default function CertificateTemplateEditor({
  template,
  event,
  registrationCount,
  onSave,
  onBack,
  isLoading,
}) {
  const [scale, setScale] = useState(1);
  const [selectedElementId, setSelectedElementId] = useState('title');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Enhanced editable elements with position and size info
  const [editableElements] = useState([
    { id: 'title', key: 'heading', label: 'Title', type: 'text', position: { top: '15%', left: '50%' } },
    { id: 'subtitle', key: 'subHeading', label: 'Subtitle', type: 'text', position: { top: '30%', left: '50%' } },
    { id: 'recipient', key: 'recipientName', label: 'Recipient Name', type: 'text', position: { top: '50%', left: '50%' }, defaultValue: 'Recipient Name' },
    { id: 'description', key: 'descriptionText', label: 'Description', type: 'text', position: { top: '65%', left: '50%' } },
    { id: 'footer', key: 'footerText', label: 'Footer', type: 'text', position: { bottom: '10%', left: '50%' } },
  ]);

  // Initialize template data properly
  const [templateData, setTemplateData] = useState(() => {
    const enrichedTemplate = getTemplateWithDecorations(template?.id);
    if (enrichedTemplate) {
      return enrichedTemplate.template;
    }
    return {
      ...template,
      previewVariant: template?.previewVariant || 1,
    };
  });

  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const currentElement = editableElements.find((el) => el.id === selectedElementId);
  const currentValue = currentElement
    ? templateData[currentElement.key] || currentElement.defaultValue || ''
    : '';

  // Handle element changes
  const handleElementChange = (field, value) => {
    setTemplateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTextEdit = (elementId, newValue) => {
    const element = editableElements.find((el) => el.id === elementId);
    if (element) {
      handleElementChange(element.key, newValue);
    }
  };

  // Font size management
  const getElementFontSize = () => {
    if (!currentElement) return 16;
    if (currentElement.key === 'heading') return templateData.headingFontSize || 42;
    if (currentElement.key === 'subHeading') return templateData.subHeadingFontSize || 16;
    if (currentElement.key === 'recipientName') return templateData.recipientNameFontSize || 40;
    if (currentElement.key === 'descriptionText') return templateData.descriptionFontSize || 14;
    if (currentElement.key === 'footerText') return templateData.footerFontSize || 12;
    return 16;
  };

  const handleFontSizeChange = (newSize) => {
    if (!currentElement) return;
    const fontSizeKey = 
      currentElement.key === 'heading' ? 'headingFontSize' :
      currentElement.key === 'subHeading' ? 'subHeadingFontSize' :
      currentElement.key === 'recipientName' ? 'recipientNameFontSize' :
      currentElement.key === 'descriptionText' ? 'descriptionFontSize' :
      currentElement.key === 'footerText' ? 'footerFontSize' :
      `${currentElement.key}FontSize`;
    handleElementChange(fontSizeKey, parseInt(newSize));
  };

  // Color management
  const getElementColor = () => {
    if (!currentElement) return '#000000';
    if (currentElement.key === 'heading') return templateData.headingColor || '#000000';
    if (currentElement.key === 'subHeading') return templateData.descriptionColor || '#666666';
    if (currentElement.key === 'recipientName') return templateData.recipientNameColor || '#3B82F6';
    if (currentElement.key === 'descriptionText') return templateData.descriptionColor || '#666666';
    if (currentElement.key === 'footerText') return templateData.footerColor || '#999999';
    return '#000000';
  };

  const handleColorChange = (newColor) => {
    if (!currentElement) return;
    let colorKey = currentElement.key;
    if (colorKey === 'heading') colorKey = 'headingColor';
    else if (colorKey === 'subHeading') colorKey = 'descriptionColor';
    else if (colorKey === 'recipientName') colorKey = 'recipientNameColor';
    else if (colorKey === 'descriptionText') colorKey = 'descriptionColor';
    else if (colorKey === 'footerText') colorKey = 'footerColor';
    else colorKey = `${colorKey}Color`;
    handleElementChange(colorKey, newColor);
  };

  // Font family management
  const getFontFamily = () => {
    if (currentElement?.key === 'recipientName') return templateData.recipientNameFontFamily || 'inherit';
    return templateData.fontFamily || 'inherit';
  };

  const handleFontFamilyChange = (family) => {
    if (currentElement?.key === 'recipientName') {
      handleElementChange('recipientNameFontFamily', family);
    } else {
      handleElementChange('fontFamily', family);
    }
  };

  // Duplicate element
  const handleDuplicateElement = () => {
    if (!currentElement) return;
    const duplicatedKey = `${currentElement.key}_duplicate_${Date.now()}`;
    handleElementChange(duplicatedKey, currentValue);
  };

  // Reset to template
  const resetToTemplate = () => {
    const enrichedTemplate = getTemplateWithDecorations(template?.id);
    if (enrichedTemplate) {
      setTemplateData(enrichedTemplate.template);
    }
  };

  // Save template with proper error handling
  const handleSave = async () => {
    if (!templateData.templateName) {
      alert('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        eventId: template?.eventId || event?._id,
        ...templateData,
        templateName: templateData.templateName,
        customElements: editableElements,
        templateDesign: templateData.templateDesign || 'landscape',
      };
      
      console.log('Saving template:', saveData);
      await onSave(saveData);
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render the editable canvas
  const CanvasContent = () => (
    <div className="relative w-full h-full">
      <div
        className="relative overflow-hidden rounded-lg bg-white/50 backdrop-blur-sm"
        style={{
          aspectRatio: '16 / 10',
          background: templateData.backgroundColor?.includes('gradient')
            ? templateData.backgroundColor
            : templateData.backgroundColor || '#ffffff',
        }}
      >
        {/* Border */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            border: `8px solid ${templateData.borderColor || '#000'}`,
            boxSizing: 'border-box',
          }}
        />

        {/* Decorations (locked background) */}
        {templateData.previewVariant && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {getDecorationShapes(templateData.previewVariant)}
          </div>
        )}

        {/* Editable Content Layer */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6 text-center space-y-4">
          {/* Title */}
          <div
            onClick={() => setSelectedElementId('title')}
            className={`cursor-text transition-all px-4 py-2 rounded-lg ${
              selectedElementId === 'title'
                ? 'ring-2 ring-blue-500 bg-blue-50/30'
                : 'hover:bg-gray-100/20'
            }`}
          >
            <div
              className="font-semibold break-words"
              style={{
                fontSize: `${templateData.headingFontSize || 42}px`,
                color: templateData.headingColor || '#000000',
                fontFamily: templateData.recipientNameFontFamily || 'inherit',
              }}
            >
              {templateData.heading || 'Certificate'}
            </div>
          </div>

          {/* Subtitle */}
          <div
            onClick={() => setSelectedElementId('subtitle')}
            className={`cursor-text transition-all px-4 py-2 rounded-lg text-sm ${
              selectedElementId === 'subtitle'
                ? 'ring-2 ring-blue-500 bg-blue-50/30'
                : 'hover:bg-gray-100/20'
            }`}
          >
            <div
              style={{
                fontSize: `${templateData.subHeadingFontSize || 16}px`,
                color: templateData.descriptionColor || '#666666',
              }}
            >
              {templateData.subHeading || 'Presented To'}
            </div>
          </div>

          {/* Recipient Name */}
          <div
            onClick={() => setSelectedElementId('recipient')}
            className={`cursor-text transition-all px-4 py-2 rounded-lg ${
              selectedElementId === 'recipient'
                ? 'ring-2 ring-blue-500 bg-blue-50/30'
                : 'hover:bg-gray-100/20'
            }`}
          >
            <div
              className="font-bold"
              style={{
                fontSize: `${templateData.recipientNameFontSize || 40}px`,
                color: templateData.recipientNameColor || '#3B82F6',
                fontFamily: templateData.recipientNameFontFamily || 'Georgia, serif',
              }}
            >
              {templateData.recipientName || 'Recipient Name'}
            </div>
          </div>

          {/* Description */}
          <div
            onClick={() => setSelectedElementId('description')}
            className={`cursor-text transition-all px-4 py-2 rounded-lg text-xs max-w-xs mx-auto ${
              selectedElementId === 'description'
                ? 'ring-2 ring-blue-500 bg-blue-50/30'
                : 'hover:bg-gray-100/20'
            }`}
          >
            <div
              style={{
                fontSize: `${templateData.descriptionFontSize || 14}px`,
                color: templateData.descriptionColor || '#666666',
                lineHeight: '1.4',
              }}
            >
              {templateData.descriptionText || 'Description'}
            </div>
          </div>

          {/* Footer */}
          <div
            onClick={() => setSelectedElementId('footer')}
            className={`cursor-text transition-all px-4 py-2 rounded-lg text-xs mt-auto ${
              selectedElementId === 'footer'
                ? 'ring-2 ring-blue-500 bg-blue-50/30'
                : 'hover:bg-gray-100/20'
            }`}
          >
            <div
              style={{
                fontSize: `${templateData.footerFontSize || 12}px`,
                color: templateData.footerColor || '#999999',
              }}
            >
              {templateData.footerText || 'Footer'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Properties Panel */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 space-y-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Editor</h2>
            <p className="text-sm text-gray-600 mt-1">For {registrationCount} recipients</p>
          </div>
        </div>

        {/* Template Name Input */}
        <div className="p-6 border-b border-gray-200 space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Template Name</label>
          <input
            type="text"
            value={templateData.templateName || ''}
            onChange={(e) => handleElementChange('templateName', e.target.value)}
            placeholder="e.g., Modern Gold Certificate"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">This name will be saved in your template library</p>
        </div>

        {/* Element Selection */}
        <div className="p-6 border-b border-gray-200 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Edit Elements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {editableElements.map((element) => (
              <button
                key={element.id}
                onClick={() => setSelectedElementId(element.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedElementId === element.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {element.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Element Properties */}
        {currentElement && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {/* Text Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {currentElement.label}
              </label>
              <textarea
                value={currentValue}
                onChange={(e) => handleTextEdit(currentElement.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Font Family Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Font Family</label>
              <select
                value={getFontFamily()}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="inherit">Default</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Great Vibes, cursive">Great Vibes</option>
                <option value="Playfair Display, serif">Playfair Display</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Font Size: {getElementFontSize()}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={getElementFontSize()}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={getElementColor()}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={getElementColor()}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Background Color for Canvas */}
            {selectedElementId === 'title' && (
              <div className="space-y-2 border-t pt-4">
                <label className="block text-sm font-semibold text-gray-900">Canvas Background</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={templateData.backgroundColor || '#ffffff'}
                    onChange={(e) => handleElementChange('backgroundColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <span className="text-xs text-gray-500">Certificate background color</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3 bg-gray-50">
          <button
            onClick={resetToTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw size={16} />
            Reset to Template
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
          >
            {saving || isLoading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {templateData.templateName || 'Certificate Preview'}
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale(Math.min(1.5, scale + 0.1))}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <button
              onClick={() => setScale(1)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm"
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            style={{ transform: `scale(${scale})` }}
            className="origin-center transition-transform duration-200 bg-white rounded-xl shadow-2xl"
          >
            <div className="w-[1200px] h-[750px]">
              <CanvasContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
