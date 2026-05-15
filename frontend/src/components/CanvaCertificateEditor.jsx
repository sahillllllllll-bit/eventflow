import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import {
  ChevronLeft,
  Eye,
  Save,
  Loader,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Type,
  Palette,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Image as ImageIcon,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Eye as EyeIcon,
  EyeOff,
  Edit2,
  Settings,
  Grid3x3,
  Layers,
  Maximize2,
  Plus,
  X,
} from 'lucide-react';
import { getDecorationShapes } from './TemplateRenderer';

/**
 * Production-Grade Canva-Style Certificate Editor
 * Features:
 * - Fabric.js-powered canvas for professional editing
 * - Drag, resize, rotate objects
 * - Advanced text styling
 * - Image uploads
 * - Layer management
 * - Position and dimension controls
 * - Real-time preview
 * - Full customization with existing template preservation
 */

export default function CanvaCertificateEditor({
  template,
  event,
  registrationCount,
  onSave,
  onBack,
  isLoading,
}) {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templateData, setTemplateData] = useState({
    ...template,
    customElements: [],
  });
  const [layers, setLayers] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    text: true,
    styling: true,
    position: false,
    layers: true,
  });

  // Google Fonts list
  const googleFonts = [
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Playfair Display',
    'Lora',
    'Montserrat',
    'Open Sans',
    'Roboto',
    'Great Vibes',
  ];

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvas) return;

    // Create canvas with specific dimensions
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 750,
      backgroundColor: template?.backgroundColor || '#1a1a2e',
      selection: true,
      preserveObjectStacking: true,
    });

    // Add decorative background elements (non-editable)
    const decorations = getDecorationShapes(template?.previewVariant || 1);
    if (decorations) {
      const decorDiv = document.createElement('div');
      decorDiv.innerHTML = decorations.props.children
        .map((child) => {
          const style = child.props.style;
          return `<div style="position: absolute; ${Object.entries(style)
            .map(([key, val]) => {
              key = key.replace(/([A-Z])/g, '-$1').toLowerCase();
              return `${key}: ${val}`;
            })
            .join('; ')}; pointer-events: none;"></div>`;
        })
        .join('');
    }

    // Add default template elements to canvas
    const defaultElements = [
      {
        id: 'title',
        type: 'text',
        text: template?.heading || 'Certificate',
        fontSize: template?.headingFontSize || 42,
        fill: template?.headingColor || '#FFD700',
        fontFamily: template?.fontFamily || 'Georgia',
        top: 150,
        left: 600,
        originX: 'center',
        originY: 'center',
      },
      {
        id: 'subtitle',
        type: 'text',
        text: template?.subHeading || 'Presented To',
        fontSize: template?.subHeadingFontSize || 16,
        fill: template?.descriptionColor || '#E0E0E0',
        fontFamily: template?.fontFamily || 'Georgia',
        top: 250,
        left: 600,
        originX: 'center',
        originY: 'center',
      },
      {
        id: 'recipient',
        type: 'text',
        text: template?.recipientName || 'Recipient Name',
        fontSize: template?.recipientNameFontSize || 40,
        fill: template?.recipientNameColor || '#FFA500',
        fontFamily: template?.recipientNameFontFamily || 'Georgia',
        top: 375,
        left: 600,
        originX: 'center',
        originY: 'center',
        fontWeight: 'bold',
      },
      {
        id: 'description',
        type: 'text',
        text: template?.descriptionText || 'Description',
        fontSize: template?.descriptionFontSize || 14,
        fill: template?.descriptionColor || '#D0D0D0',
        fontFamily: template?.fontFamily || 'Georgia',
        top: 500,
        left: 600,
        originX: 'center',
        originY: 'center',
      },
      {
        id: 'footer',
        type: 'text',
        text: template?.footerText || 'Footer',
        fontSize: template?.footerFontSize || 12,
        fill: template?.footerColor || '#B0B0B0',
        fontFamily: template?.fontFamily || 'Georgia',
        top: 700,
        left: 600,
        originX: 'center',
        originY: 'center',
      },
    ];

    // Load elements onto canvas
    defaultElements.forEach((elemConfig) => {
      const fabricText = new fabric.Text(elemConfig.text, {
        ...elemConfig,
        editable: true,
        hasControls: true,
        hasBorders: true,
        borderColor: '#FFD700',
        cornerColor: '#FFD700',
        cornerSize: 8,
        transparentCorners: false,
      });
      canvas.add(fabricText);
    });

    // Handle object selection
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        setSelectedObject(obj);
        updateLayersList(canvas);
      }
    });

    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0];
      if (obj) {
        setSelectedObject(obj);
        updateLayersList(canvas);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    canvas.on('object:modified', () => {
      updateLayersList(canvas);
      saveCanvasState();
    });

    setFabricCanvas(canvas);

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, [template]);

  // Update layers list
  const updateLayersList = (canvas) => {
    const objects = canvas.getObjects().map((obj, index) => ({
      id: obj.data?.id || `layer_${index}`,
      name: obj.data?.name || obj.type === 'text' ? `Text: ${obj.text.substring(0, 20)}` : obj.type,
      type: obj.type,
      visible: !obj.opacity || obj.opacity > 0,
      locked: obj.selectable === false,
      object: obj,
    }));
    setLayers(objects);
  };

  // Save canvas state to template data
  const saveCanvasState = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    const elementsData = objects.map((obj) => ({
      id: obj.data?.id,
      type: obj.type,
      text: obj.text || '',
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      fontSize: obj.fontSize,
      fill: obj.fill,
      fontFamily: obj.fontFamily,
      fontWeight: obj.fontWeight,
      fontStyle: obj.fontStyle,
      textDecoration: obj.textDecoration,
      opacity: obj.opacity,
      angle: obj.angle,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
    }));

    setTemplateData((prev) => ({
      ...prev,
      customElements: elementsData,
    }));
  };

  // Add new text element
  const handleAddText = () => {
    if (!fabricCanvas) return;

    const text = new fabric.Text('New Text', {
      left: fabricCanvas.width / 2,
      top: fabricCanvas.height / 2,
      fontSize: 20,
      fill: '#E0E0E0',
      fontFamily: 'Georgia',
      editable: true,
      hasControls: true,
      hasBorders: true,
      borderColor: '#FFD700',
      cornerColor: '#FFD700',
      cornerSize: 8,
      transparentCorners: false,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  // Add image
  const handleAddImage = (e) => {
    if (!fabricCanvas || !e.target.files[0]) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.scaleToWidth(200);
        img.set({
          left: fabricCanvas.width / 2 - 100,
          top: fabricCanvas.height / 2 - 100,
          hasControls: true,
          hasBorders: true,
          borderColor: '#FFD700',
          cornerColor: '#FFD700',
          cornerSize: 8,
          transparentCorners: false,
        });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
        updateLayersList(fabricCanvas);
      });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Update selected object properties
  const updateSelectedObjectProperty = (property, value) => {
    if (!selectedObject) return;

    if (property === 'text') {
      selectedObject.set({ text: value });
    } else {
      selectedObject.set({ [property]: value });
    }

    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
    saveCanvasState();
  };

  // Delete selected object
  const handleDelete = () => {
    if (!selectedObject) return;
    fabricCanvas.remove(selectedObject);
    setSelectedObject(null);
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  // Duplicate selected object
  const handleDuplicate = () => {
    if (!selectedObject) return;
    const cloned = fabric.util.object.clone(selectedObject);
    cloned.set({
      left: cloned.left + 20,
      top: cloned.top + 20,
    });
    fabricCanvas.add(cloned);
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  // Zoom controls
  const handleZoom = (direction) => {
    let newZoom = zoom;
    if (direction === 'in') {
      newZoom = Math.min(2, zoom + 0.1);
    } else {
      newZoom = Math.max(0.5, zoom - 0.1);
    }
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
  };

  // Save template
  const handleSave = async () => {
    if (!templateData.templateName) {
      alert('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      saveCanvasState();

      const saveData = {
        eventId: template?.eventId || event?._id,
        organizerId: template?.organizerId || event?.organizerId || event?.organizer?._id,
        ...templateData,
        templateName: templateData.templateName,
        designJson: JSON.stringify(fabricCanvas.toJSON()),
        backgroundColor: templateData.backgroundColor || '#1a1a2e',
      };

      console.log('Saving enhanced template:', saveData);
      await onSave(saveData);
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Layer controls
  const handleBringForward = () => {
    if (!selectedObject) return;
    fabricCanvas.bringForward(selectedObject);
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  const handleSendBackward = () => {
    if (!selectedObject) return;
    fabricCanvas.sendBackwards(selectedObject);
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  const toggleLayerVisibility = (layerObj) => {
    layerObj.object.set({ opacity: layerObj.object.opacity ? 0 : 1 });
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  const toggleLayerLock = (layerObj) => {
    layerObj.object.set({ selectable: !layerObj.object.selectable });
    fabricCanvas.renderAll();
    updateLayersList(fabricCanvas);
  };

  const selectLayer = (layerObj) => {
    fabricCanvas.setActiveObject(layerObj.object);
    fabricCanvas.renderAll();
    setSelectedObject(layerObj.object);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Enhanced Left Sidebar */}
      <div className="w-96 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-900 z-20 space-y-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Certificate Editor</h2>
            <p className="text-sm text-slate-300 mt-1">For {registrationCount} recipients</p>
          </div>
        </div>

        {/* Template Name Input */}
        <div className="p-6 border-b border-slate-700 space-y-3">
          <label className="block text-sm font-semibold text-white">Template Name</label>
          <input
            type="text"
            value={templateData.templateName || ''}
            onChange={(e) => setTemplateData({ ...templateData, templateName: e.target.value })}
            placeholder="e.g., Modern Gold Certificate"
            className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Background Color Selection */}
        <div className="p-6 border-b border-slate-700 space-y-3">
          <label className="block text-sm font-semibold text-white">Certificate Background</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={templateData.backgroundColor || '#1a1a2e'}
              onChange={(e) => {
                setTemplateData({ ...templateData, backgroundColor: e.target.value });
                if (fabricCanvas) {
                  fabricCanvas.setBackgroundColor(e.target.value, () => {
                    fabricCanvas.renderAll();
                  });
                }
              }}
              className="w-12 h-10 rounded cursor-pointer border border-slate-600"
            />
            <input
              type="text"
              value={templateData.backgroundColor || '#1a1a2e'}
              onChange={(e) => {
                setTemplateData({ ...templateData, backgroundColor: e.target.value });
                if (fabricCanvas) {
                  fabricCanvas.setBackgroundColor(e.target.value, () => {
                    fabricCanvas.renderAll();
                  });
                }
              }}
              className="flex-1 px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="#1a1a2e"
            />
          </div>
          <p className="text-xs text-slate-400">Dark color recommended for elegant look</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Add Elements Section */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">Add Elements</h3>
            <div className="space-y-2">
              <button
                onClick={handleAddText}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Type size={16} />
                Add Text
              </button>
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  className="hidden"
                />
                <button
                  onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <ImageIcon size={16} />
                  Add Image
                </button>
              </label>
            </div>
          </div>

          {/* Text Styling Section */}
          {selectedObject && selectedObject.type === 'text' && (
            <>
              {/* Text Content */}
              <div className="p-6 border-b border-slate-700">
                <button
                  onClick={() => toggleSection('text')}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="text-sm font-semibold text-white">Text Content</h3>
                  {expandedSections.text ? <ChevronUp size={16} className="text-amber-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {expandedSections.text && (
                  <div className="space-y-3">
                    <textarea
                      value={selectedObject.text}
                      onChange={(e) => updateSelectedObjectProperty('text', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Text Styling */}
              <div className="p-6 border-b border-slate-700">
                <button
                  onClick={() => toggleSection('styling')}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="text-sm font-semibold text-white">Styling</h3>
                  {expandedSections.styling ? <ChevronUp size={16} className="text-amber-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {expandedSections.styling && (
                  <div className="space-y-4">
                    {/* Font Family */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">Font Family</label>
                      <select
                        value={selectedObject.fontFamily || 'Georgia'}
                        onChange={(e) => updateSelectedObjectProperty('fontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {googleFonts.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Font Size: <span className="text-amber-400">{selectedObject.fontSize}px</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="120"
                        value={selectedObject.fontSize || 20}
                        onChange={(e) => updateSelectedObjectProperty('fontSize', parseInt(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    {/* Font Weight */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">Font Weight</label>
                      <select
                        value={selectedObject.fontWeight || 'normal'}
                        onChange={(e) => updateSelectedObjectProperty('fontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="600">Semi-Bold</option>
                        <option value="300">Light</option>
                      </select>
                    </div>

                    {/* Font Style */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">Font Style</label>
                      <select
                        value={selectedObject.fontStyle || 'normal'}
                        onChange={(e) => updateSelectedObjectProperty('fontStyle', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>

                    {/* Text Decoration */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">Decoration</label>
                      <select
                        value={selectedObject.textDecoration || 'none'}
                        onChange={(e) => updateSelectedObjectProperty('textDecoration', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="none">None</option>
                        <option value="underline">Underline</option>
                        <option value="line-through">Strikethrough</option>
                        <option value="overline">Overline</option>
                      </select>
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={selectedObject.fill || '#000000'}
                          onChange={(e) => updateSelectedObjectProperty('fill', e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer border border-slate-600"
                        />
                        <input
                          type="text"
                          value={selectedObject.fill || '#000000'}
                          onChange={(e) => updateSelectedObjectProperty('fill', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Opacity: <span className="text-amber-400">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedObject.opacity || 1}
                        onChange={(e) => updateSelectedObjectProperty('opacity', parseFloat(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Position & Size Section */}
          {selectedObject && (
            <div className="p-6 border-b border-gray-200">
              <button
                onClick={() => toggleSection('position')}
                className="w-full flex items-center justify-between mb-3"
              >
                <h3 className="text-sm font-semibold text-gray-900">Position & Size</h3>
                {expandedSections.position ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedSections.position && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                      <input
                        type="number"
                        value={Math.round(selectedObject.left || 0)}
                        onChange={(e) => updateSelectedObjectProperty('left', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                      <input
                        type="number"
                        value={Math.round(selectedObject.top || 0)}
                        onChange={(e) => updateSelectedObjectProperty('top', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={Math.round(selectedObject.width * (selectedObject.scaleX || 1))}
                        onChange={(e) => {
                          const newWidth = parseInt(e.target.value);
                          updateSelectedObjectProperty('scaleX', newWidth / selectedObject.width);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={Math.round(selectedObject.height * (selectedObject.scaleY || 1))}
                        onChange={(e) => {
                          const newHeight = parseInt(e.target.value);
                          updateSelectedObjectProperty('scaleY', newHeight / selectedObject.height);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rotation</label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={Math.round(selectedObject.angle || 0)}
                      onChange={(e) => updateSelectedObjectProperty('angle', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Layers Section */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => toggleSection('layers')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold text-gray-900">Layers ({layers.length})</h3>
              {expandedSections.layers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.layers && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {layers.map((layer, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedObject === layer.object
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                    }`}
                    onClick={() => selectLayer(layer)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer);
                      }}
                      className="p-1 hover:bg-gray-300 rounded"
                    >
                      {layer.visible ? (
                        <EyeIcon size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer);
                      }}
                      className="p-1 hover:bg-gray-300 rounded"
                    >
                      {layer.locked ? (
                        <Lock size={14} />
                      ) : (
                        <Unlock size={14} />
                      )}
                    </button>
                    <span className="flex-1 text-xs font-medium text-gray-700 truncate">
                      {layer.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Object Controls */}
        {selectedObject && (
          <div className="p-6 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDuplicate}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                title="Duplicate"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={handleBringForward}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                title="Bring Forward"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={handleSendBackward}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                title="Send Backward"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors font-medium text-sm"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-slate-700 space-y-3 bg-slate-900">
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
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
            {templateData.templateName || 'Certificate Editor'}
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleZoom('out')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                setZoom(1);
                fabricCanvas?.setZoom(1);
              }}
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
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-pattern">
          <canvas
            ref={canvasRef}
            className="bg-white rounded-xl shadow-2xl border border-gray-200"
          />
        </div>
      </div>
    </div>
  );
}
