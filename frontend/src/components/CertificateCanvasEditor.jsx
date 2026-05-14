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
  FolderUp,
} from 'lucide-react';

export default function CertificateCanvasEditor({
  template,
  onSave,
  onBack,
  isLoading,
  registrationCount,
}) {
  const [scale, setScale] = useState(1);
  const [elements, setElements] = useState(() => {
    const defaultElements = [
      {
        id: 1,
        type: 'text',
        content: template?.heading || 'Certificate',
        x: 50,
        y: 20,
        fontSize: template?.headingFontSize || 48,
        color: template?.headingColor || '#000000',
        fontWeight: 'bold',
        fontFamily: 'Georgia',
        width: 80,
      },
      {
        id: 2,
        type: 'text',
        content: template?.subHeading || 'This is to certify that',
        x: 50,
        y: 35,
        fontSize: template?.subHeadingFontSize || 24,
        color: template?.descriptionColor || '#666666',
        fontFamily: 'Georgia',
        width: 80,
      },
      {
        id: 3,
        type: 'text',
        content: 'Recipient Name',
        x: 50,
        y: 50,
        fontSize: template?.recipientNameFontSize || 36,
        color: template?.recipientNameColor || '#3B82F6',
        fontWeight: 'bold',
        fontFamily: 'Georgia',
        width: 80,
      },
      {
        id: 4,
        type: 'text',
        content: template?.descriptionText || 'Has successfully completed',
        x: 50,
        y: 65,
        fontSize: template?.descriptionFontSize || 18,
        color: template?.descriptionColor || '#666666',
        fontFamily: 'Georgia',
        width: 80,
      },
      {
        id: 5,
        type: 'text',
        content: `${template?.organizerName || 'Event Organizer'} • ${new Date().getFullYear()}`,
        x: 50,
        y: 85,
        fontSize: 12,
        color: '#999999',
        fontFamily: 'Georgia',
        width: 80,
      },
    ];
    return defaultElements;
  });

  const [selectedElement, setSelectedElement] = useState(elements[0].id);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);

  const getSelectedElement = () => elements.find((el) => el.id === selectedElement);
  const selected = getSelectedElement();

  const updateElement = (updates) => {
    setElements(elements.map((el) => (el.id === selectedElement ? { ...el, ...updates } : el)));
  };

  const addTextElement = () => {
    const newId = Math.max(...elements.map((e) => e.id), 0) + 1;
    setElements([
      ...elements,
      {
        id: newId,
        type: 'text',
        content: 'New Text',
        x: 50,
        y: 50,
        fontSize: 18,
        color: '#000000',
        fontFamily: 'Georgia',
        width: 80,
      },
    ]);
    setSelectedElement(newId);
  };

  const addImageElement = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const newId = Math.max(...elements.map((e) => e.id), 0) + 1;
        setElements([
          ...elements,
          {
            id: newId,
            type: 'image',
            src: event.target.result,
            x: 50,
            y: 40,
            width: 20,
            height: 20,
          },
        ]);
        setSelectedElement(newId);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteElement = () => {
    setElements(elements.filter((el) => el.id !== selectedElement));
    if (elements.length > 1) {
      setSelectedElement(elements[0].id);
    }
  };

  const duplicateElement = () => {
    const element = getSelectedElement();
    if (!element) return;

    const newId = Math.max(...elements.map((e) => e.id), 0) + 1;
    const newElement = {
      ...element,
      id: newId,
      x: element.x + 5,
      y: element.y + 5,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newId);
  };

  const resetCanvasStyle = () => {
    setScale(1);
  };

  const generateCertificateData = () => {
    return {
      ...template,
      customElements: elements,
      templateDesign: template.templateDesign || 'landscape',
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const certificateData = generateCertificateData();
      await onSave(certificateData);
    } finally {
      setSaving(false);
    }
  };

  // Canvas preview rendering
  const Canvas = ({ width = 1200, height = 800, scale: s = 1 }) => {
    const bgStyle = template.backgroundColor?.includes('gradient')
      ? { background: template.backgroundColor }
      : { backgroundColor: template.backgroundColor };

    return (
      <div
        ref={canvasRef}
        className="relative bg-white overflow-auto"
        style={{
          ...bgStyle,
          width: `${width * s}px`,
          height: `${height * s}px`,
          transform: `scale(${s})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `8px solid ${template.borderColor || '#000'}`,
            boxSizing: 'border-box',
          }}
        />

        {/* Elements */}
        {elements.map((el) => {
          const isSelected = el.id === selectedElement;
          return (
            <div
              key={el.id}
              onClick={() => setSelectedElement(el.id)}
              className={`absolute cursor-move transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width || el.x}%`,
              }}
            >
              {el.type === 'text' ? (
                <div
                  className="whitespace-normal break-words"
                  style={{
                    fontSize: `${el.fontSize * s}px`,
                    color: el.color,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    textAlign: el.align || 'center',
                    lineHeight: '1.2',
                  }}
                >
                  {el.content}
                </div>
              ) : (
                <img
                  src={el.src}
                  alt="Element"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: `${el.width}px`,
                    maxHeight: `${el.height}px`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Properties */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h2 className="text-xl font-bold text-gray-900">Canvas Editor</h2>
          <p className="text-sm text-gray-600 mt-1">For {registrationCount} recipients</p>
        </div>

        {/* Element Selection */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Design Elements</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {elements.map((el) => (
              <button
                key={el.id}
                onClick={() => setSelectedElement(el.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  selectedElement === el.id
                    ? 'bg-blue-100 border border-blue-500 text-blue-900'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium truncate">
                  {el.type === 'text' ? (
                    <>
                      <Type size={14} className="inline mr-2" />
                      {el.content.substring(0, 20)}
                    </>
                  ) : (
                    <>
                      <ImageIcon size={14} className="inline mr-2" />
                      Image
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Add Elements */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={addTextElement}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <Type size={16} />
              Add Text
            </button>
            <button
              onClick={addImageElement}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              <ImageIcon size={16} />
              Add Image
            </button>
          </div>
        </div>

        {/* Selected Element Properties */}
        {selected && (
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {selected.type === 'text' ? 'Text Properties' : 'Image Properties'}
            </h3>

            {selected.type === 'text' && (
              <div className="space-y-4">
                {/* Text Content */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={selected.content}
                    onChange={(e) => updateElement({ content: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Font Size: {selected.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={selected.fontSize}
                    onChange={(e) => updateElement({ fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                  <select
                    value={selected.fontFamily || 'Georgia'}
                    onChange={(e) => updateElement({ fontFamily: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Georgia</option>
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Courier New</option>
                    <option>Trebuchet MS</option>
                  </select>
                </div>

                {/* Font Weight */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Font Weight</label>
                  <div className="flex gap-2">
                    {['normal', 'bold'].map((weight) => (
                      <button
                        key={weight}
                        onClick={() => updateElement({ fontWeight: weight })}
                        className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                          (selected.fontWeight || 'normal') === weight
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {weight === 'bold' ? 'Bold' : 'Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateElement({ color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={selected.color}
                      onChange={(e) => updateElement({ color: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Alignment</label>
                  <div className="flex gap-2">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => updateElement({ align })}
                        className={`flex-1 py-1 rounded transition-colors ${
                          (selected.align || 'center') === align
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {align === 'left' ? (
                          <AlignLeft size={16} className="mx-auto" />
                        ) : align === 'right' ? (
                          <AlignRight size={16} className="mx-auto" />
                        ) : (
                          <AlignCenter size={16} className="mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    X Position: {selected.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selected.x}
                    onChange={(e) => updateElement({ x: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Y Position: {selected.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selected.y}
                    onChange={(e) => updateElement({ y: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {selected.type === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Width: {selected.width}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    value={selected.width}
                    onChange={(e) => updateElement({ width: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    X Position: {selected.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selected.x}
                    onChange={(e) => updateElement({ x: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Y Position: {selected.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selected.y}
                    onChange={(e) => updateElement({ y: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Element Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={duplicateElement}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Copy size={16} />
                Duplicate
              </button>
              <button
                onClick={deleteElement}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700 w-16 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(1.5, scale + 0.1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <div className="w-px h-8 bg-gray-300" />
            <button
              onClick={resetCanvasStyle}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              title="Reset"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
          <Canvas scale={scale} />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-96 overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <Canvas scale={0.6} width={1200} height={800} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
