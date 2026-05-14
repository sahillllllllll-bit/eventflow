import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Copy,
  Trash2,
  Plus,
  Type,
  Image as ImageIcon,
  Download,
  Eye,
  Loader,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Move,
  Settings,
  Palette,
  Grid3x3,
} from 'lucide-react';

const BORDER_PRESETS = [
  { id: 'none', name: 'None', style: 'none', color: '#000000' },
  { id: 'simple', name: 'Simple', style: 'simple', color: '#D4A574', width: 3 },
  { id: 'elegant', name: 'Elegant', style: 'elegant', color: '#D4A574', width: 8 },
  { id: 'modern', name: 'Modern', style: 'modern', color: '#3B82F6', width: 4 },
  { id: 'thick', name: 'Thick Gold', style: 'thick', color: '#FFD700', width: 15 },
  { id: 'double', name: 'Double Line', style: 'double', color: '#8B7355', width: 2 },
  { id: 'shadow', name: 'Shadow Effect', style: 'shadow', color: '#000000', width: 0 },
  { id: 'gradient-border', name: 'Gradient', style: 'gradient', color: '#FF6B6B', width: 6 },
];

const BG_PATTERNS = [
  { id: 'solid', name: 'Solid', type: 'solid', value: '#FFFFFF' },
  { id: 'cream', name: 'Cream', type: 'solid', value: '#FFFDD0' },
  { id: 'light-gray', name: 'Light Gray', type: 'solid', value: '#F5F5F5' },
  { id: 'gold-gradient', name: 'Gold Gradient', type: 'gradient', value: 'linear-gradient(135deg, #fff8dc 0%, #ffd700 100%)' },
  { id: 'blue-gradient', name: 'Blue Gradient', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'green-gradient', name: 'Green Gradient', type: 'gradient', value: 'linear-gradient(135deg, #0f3d1f 0%, #1a6b3f 100%)' },
  { id: 'purple-gradient', name: 'Purple Gradient', type: 'gradient', value: 'linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%)' },
  { id: 'dots', name: 'Dot Pattern', type: 'pattern', value: 'dots' },
  { id: 'lines', name: 'Line Pattern', type: 'pattern', value: 'lines' },
  { id: 'diagonal', name: 'Diagonal Pattern', type: 'pattern', value: 'diagonal' },
];

const FONT_FAMILIES = [
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times', value: 'Times New Roman, serif' },
  { name: 'Courier', value: 'Courier New, monospace' },
  { name: 'Trebuchet', value: 'Trebuchet MS, sans-serif' },
  { name: 'Playfair', value: "'Playfair Display', serif" },
];

const getPatternBackground = (patternType, bgColor) => {
  const baseColor = bgColor || '#FFFFFF';
  
  switch (patternType) {
    case 'dots':
      return `radial-gradient(circle, #D4A574 1px, transparent 1px)`;
    case 'lines':
      return `repeating-linear-gradient(90deg, transparent, transparent 35px, #D4A574 35px, #D4A574 37px)`;
    case 'diagonal':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, #D4A574 10px, #D4A574 20px)`;
    default:
      return baseColor;
  }
};

export default function CertificateCanvasEditorV2({
  template,
  onSave,
  onBack,
  isLoading,
  registrationCount,
}) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.7);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [saving, setSaving] = useState(false);

  const [designConfig, setDesignConfig] = useState({
    backgroundColor: template?.backgroundColor || '#FFFFFF',
    backgroundPattern: 'solid',
    borderPreset: 'elegant',
    borderColor: template?.borderColor || '#D4A574',
  });

  const [elements, setElements] = useState([
    {
      id: 'title',
      type: 'text',
      content: template?.heading || 'Certificate of Achievement',
      x: 50,
      y: 15,
      fontSize: template?.headingFontSize || 52,
      color: template?.headingColor || '#1a472a',
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      align: 'center',
      width: 90,
    },
    {
      id: 'subtitle',
      type: 'text',
      content: template?.subHeading || 'This is to certify that',
      x: 50,
      y: 35,
      fontSize: template?.subHeadingFontSize || 22,
      color: template?.descriptionColor || '#333333',
      fontFamily: 'Georgia, serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
      width: 90,
    },
    {
      id: 'recipient',
      type: 'text',
      content: 'Recipient Name',
      x: 50,
      y: 50,
      fontSize: template?.recipientNameFontSize || 40,
      color: template?.recipientNameColor || '#D4A574',
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fontStyle: 'italic',
      align: 'center',
      width: 90,
      decoration: 'underline',
    },
    {
      id: 'description',
      type: 'text',
      content: template?.descriptionText || 'has successfully completed the course and demonstrated exceptional commitment to learning',
      x: 50,
      y: 65,
      fontSize: 18,
      color: '#333333',
      fontFamily: 'Georgia, serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
      width: 85,
    },
    {
      id: 'footer',
      type: 'text',
      content: `Date: ${new Date().toLocaleDateString()} | ${template?.organizerName || 'Event Organizer'} • 2026`,
      x: 50,
      y: 88,
      fontSize: 12,
      color: '#666666',
      fontFamily: 'Georgia, serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
      width: 90,
    },
  ]);

  const selectedElement = elements.find((e) => e.id === selectedElementId);

  const updateElement = (id, updates) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const updateDesign = (updates) => {
    setDesignConfig({ ...designConfig, ...updates });
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedElementId(null);
      return;
    }

    const elementId = e.target.dataset.elementId;
    if (elementId) {
      setSelectedElementId(elementId);
      const element = elements.find((el) => el.id === elementId);
      if (element) {
        const rect = e.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setDragOffset({
          x: e.clientX - centerX,
          y: e.clientY - centerY,
        });
        setDraggingElement(elementId);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointerCenterX = e.clientX - (dragOffset?.x || 0);
    const pointerCenterY = e.clientY - (dragOffset?.y || 0);

    const x = ((pointerCenterX - rect.left) / rect.width) * 100;
    const y = ((pointerCenterY - rect.top) / rect.height) * 100;

    updateElement(draggingElement, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleCanvasMouseUp = () => {
    setDraggingElement(null);
  };

  const handleElementDoubleClick = (e, elementId) => {
    e.stopPropagation();
    setEditingText(elementId);
  };

  const handleTextChange = (e) => {
    if (editingText) {
      updateElement(editingText, { content: e.target.value });
    }
  };

  const addElement = (type) => {
    const newId = `element-${Date.now()}`;
    const newElement = {
      id: newId,
      type,
      ...(type === 'text' && {
        content: 'New Text',
        x: 50,
        y: 50,
        fontSize: 24,
        color: '#333333',
        fontFamily: 'Georgia, serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        align: 'center',
        width: 80,
      }),
      ...(type === 'image' && {
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        src: null,
      }),
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newId);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const newId = `element-${Date.now()}`;
        setElements([
          ...elements,
          {
            id: newId,
            type: 'image',
            src: event.target.result,
            x: 10,
            y: 10,
            width: 80,
            height: 80,
          },
        ]);
        setSelectedElementId(newId);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteElement = () => {
    setElements(elements.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
  };

  const getBackgroundStyle = () => {
    const { backgroundColor, backgroundPattern } = designConfig;
    if (backgroundPattern === 'solid') {
      return { background: backgroundColor };
    }
    const bgPattern = BG_PATTERNS.find((p) => p.id === backgroundPattern);
    if (bgPattern?.type === 'gradient') {
      return { background: bgPattern.value };
    }
    if (bgPattern?.type === 'pattern') {
      return {
        background: `${backgroundColor} url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='%23D4A574' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '20px 20px',
      };
    }
    return { background: backgroundColor };
  };

  const getBorderStyle = () => {
    const borderPreset = BORDER_PRESETS.find((b) => b.id === designConfig.borderPreset);
    if (!borderPreset) return {};

    const { style, color, width } = borderPreset;
    switch (style) {
      case 'none':
        return {};
      case 'simple':
        return { border: `${width}px solid ${color}` };
      case 'elegant':
        return { border: `${width}px double ${color}`, boxShadow: `inset 0 0 0 2px ${color}` };
      case 'modern':
        return { borderTop: `${width}px solid ${color}`, borderBottom: `${width}px solid ${color}` };
      case 'thick':
        return { border: `${width}px solid ${color}`, boxShadow: `0 0 20px ${color}40` };
      case 'double':
        return { border: `3px double ${color}` };
      case 'shadow':
        return { boxShadow: `0 0 30px rgba(0, 0, 0, 0.3), inset 0 0 0 2px ${color}` };
      case 'gradient':
        return { border: `${width}px solid transparent`, boxShadow: `0 0 0 ${width}px ${color}` };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const certificateData = {
        ...template,
        ...designConfig,
        customElements: elements,
      };
      await onSave(certificateData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar - Element Manager */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h2 className="text-lg font-bold text-white">Canvas Editor</h2>
          <p className="text-xs text-gray-400 mt-1">For {registrationCount} recipients</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-700 border-b-2 border-blue-500">
            <Move size={16} className="inline mr-2" />
            Elements
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">
            <Palette size={16} className="inline mr-2" />
            Design
          </button>
        </div>

        {/* Element List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2 mb-4">
            {elements.map((el) => (
              <div
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedElementId === el.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {el.type === 'text' ? (
                    <Type size={16} />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  <span className="text-sm font-medium flex-1 truncate">
                    {el.type === 'text' ? el.content.substring(0, 30) : 'Image'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Elements */}
          <div className="space-y-2 border-t border-gray-700 pt-4">
            <button
              onClick={() => addElement('text')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Text
            </button>
            <button
              onClick={handleImageUpload}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Image
            </button>
          </div>
        </div>
      </div>

      {/* Right Properties Sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
        {/* Design Settings */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Palette size={16} />
            Design Settings
          </h3>

          {/* Background Pattern */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-300 mb-2">Background Pattern</label>
            <div className="grid grid-cols-2 gap-2">
              {BG_PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => updateDesign({ backgroundPattern: pattern.id })}
                  className={`p-2 text-xs rounded transition-all ${
                    designConfig.backgroundPattern === pattern.id
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pattern.name}
                </button>
              ))}
            </div>
          </div>

          {/* Border Preset */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-300 mb-2">Border Style</label>
            <div className="space-y-2">
              {BORDER_PRESETS.map((border) => (
                <button
                  key={border.id}
                  onClick={() => updateDesign({ borderPreset: border.id })}
                  className={`w-full text-left p-2 text-xs rounded transition-all ${
                    designConfig.borderPreset === border.id
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {border.name}
                </button>
              ))}
            </div>
          </div>

          {/* Border Color */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-300 mb-2">Border Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={designConfig.borderColor}
                onChange={(e) => updateDesign({ borderColor: e.target.value })}
                className="w-12 h-8 rounded cursor-pointer border border-gray-600"
              />
              <input
                type="text"
                value={designConfig.borderColor}
                onChange={(e) => updateDesign({ borderColor: e.target.value })}
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-white rounded"
              />
            </div>
          </div>
        </div>

        {/* Element Properties */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedElement ? (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">
                {selectedElement.type === 'text' ? 'Text Properties' : 'Image Properties'}
              </h4>

              {selectedElement.type === 'text' && (
                <>
                  {/* Text Content */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Content</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Font</label>
                    <select
                      value={selectedElement.fontFamily}
                      onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {FONT_FAMILIES.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Font Size: {selectedElement.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="80"
                      value={selectedElement.fontSize}
                      onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Font Weight */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Weight</label>
                    <div className="flex gap-2">
                      {['normal', 'bold', '600'].map((weight) => (
                        <button
                          key={weight}
                          onClick={() => updateElement(selectedElement.id, { fontWeight: weight })}
                          className={`flex-1 py-2 text-xs rounded transition-all ${
                            selectedElement.fontWeight === weight
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {weight === 'normal' ? 'Normal' : weight === 'bold' ? 'Bold' : '600'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Style */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Style</label>
                    <div className="flex gap-2">
                      {['normal', 'italic'].map((style) => (
                        <button
                          key={style}
                          onClick={() => updateElement(selectedElement.id, { fontStyle: style })}
                          className={`flex-1 py-2 text-xs rounded transition-all ${
                            selectedElement.fontStyle === style
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {style === 'italic' ? 'Italic' : 'Normal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Decoration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Decoration</label>
                    <div className="flex gap-2">
                      {['none', 'underline', 'line-through'].map((decoration) => (
                        <button
                          key={decoration}
                          onClick={() => updateElement(selectedElement.id, { decoration })}
                          className={`flex-1 py-2 text-xs rounded transition-all ${
                            selectedElement.decoration === decoration
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {decoration === 'none' ? 'None' : decoration === 'underline' ? 'Under' : 'Strike'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedElement.color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="w-12 h-8 rounded cursor-pointer border border-gray-600"
                      />
                      <input
                        type="text"
                        value={selectedElement.color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-white rounded"
                      />
                    </div>
                  </div>

                  {/* Alignment */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Alignment</label>
                    <div className="flex gap-2">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateElement(selectedElement.id, { align })}
                          className={`flex-1 py-2 rounded transition-all ${
                            selectedElement.align === align
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {align === 'left' ? (
                            <AlignLeft size={14} className="mx-auto" />
                          ) : align === 'center' ? (
                            <AlignCenter size={14} className="mx-auto" />
                          ) : (
                            <AlignRight size={14} className="mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      X: {selectedElement.x}% | Y: {selectedElement.y}%
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Width: {selectedElement.width}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Width: {selectedElement.width}px
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      X: {selectedElement.x}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.x}
                      onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Y: {selectedElement.y}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Delete Button */}
              <button
                onClick={deleteElement}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium mt-4 border-t border-gray-700 pt-4"
              >
                <Trash2 size={16} />
                Delete Element
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Settings size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select an element to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScale(Math.max(0.3, scale - 0.1))}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium text-gray-300 w-16 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(1.2, scale + 0.1))}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <div className="w-px h-8 bg-gray-700" />
            <button
              onClick={() => setScale(0.7)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
              title="Reset"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 hover:text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors disabled:opacity-50"
            >
              {saving || isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Save & Continue
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-900"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div
            ref={canvasRef}
            style={{
              width: '1200px',
              height: '800px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              ...getBackgroundStyle(),
              ...getBorderStyle(),
            }}
            className="relative bg-white shadow-2xl"
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Canvas Elements */}
            {elements.map((element) => (
              <div
                key={element.id}
                data-element-id={element.id}
                onClick={() => setSelectedElementId(element.id)}
                onDoubleClick={(e) => handleElementDoubleClick(e, element.id)}
                style={{
                  position: 'absolute',
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: element.type === 'text' ? `${element.width}%` : `${element.width}px`,
                  cursor: 'move',
                  transform: 'translate(-50%, -50%)',
                  ...(selectedElementId === element.id && {
                    outline: '2px solid #3B82F6',
                    outlineOffset: '2px',
                  }),
                }}
                className="select-none"
              >
                {element.type === 'text' && editingText !== element.id && (
                  <div
                    style={{
                      fontSize: `${element.fontSize}px`,
                      color: element.color,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textAlign: element.align,
                      textDecoration: element.decoration === 'none' ? 'none' : element.decoration,
                      wordWrap: 'break-word',
                      overflow: 'visible',
                      lineHeight: '1.4',
                      whiteSpace: 'normal',
                    }}
                    className="pointer-events-none"
                  >
                    {element.content}
                  </div>
                )}

                {element.type === 'text' && editingText === element.id && (
                  <textarea
                    autoFocus
                    value={element.content}
                    onChange={handleTextChange}
                    onBlur={() => setEditingText(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingText(null);
                      }
                    }}
                    style={{
                      fontSize: `${element.fontSize}px`,
                      color: element.color,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textAlign: element.align,
                      width: '100%',
                      border: '2px solid #3B82F6',
                      padding: '4px',
                      boxSizing: 'border-box',
                    }}
                    className="resize-none"
                  />
                )}

                {element.type === 'image' && element.src && (
                  <img
                    src={element.src}
                    alt="Element"
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    className="pointer-events-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-96 overflow-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
              <h3 className="text-2xl font-bold text-white">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-gray-900">
              <div
                style={{
                  width: '1200px',
                  height: '800px',
                  ...getBackgroundStyle(),
                  ...getBorderStyle(),
                }}
                className="relative bg-white shadow-2xl mx-auto"
              >
                {elements.map((element) => (
                  <div
                    key={element.id}
                    style={{
                      position: 'absolute',
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: element.type === 'text' ? `${element.width}%` : `${element.width}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {element.type === 'text' && (
                      <div
                        style={{
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontFamily: element.fontFamily,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          textAlign: element.align,
                          textDecoration: element.decoration === 'none' ? 'none' : element.decoration,
                          wordWrap: 'break-word',
                          lineHeight: '1.4',
                          whiteSpace: 'normal',
                        }}
                      >
                        {element.content}
                      </div>
                    )}
                    {element.type === 'image' && element.src && (
                      <img src={element.src} alt="Element" style={{ width: '100%', height: 'auto' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
