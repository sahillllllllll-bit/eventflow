import React from 'react';
import {
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

/**
 * Properties Panel Component
 * Edit properties of selected element
 */
export default function PropertiesPanel({ element, store, onTextEdit }) {
  if (!element) return null;

  const handleUpdate = (updates) => {
    store.updateElement(element.id, updates);
  };

  const renderTextProperties = () => {
    return (
      <div className="space-y-4">
        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Content
          </label>
          <textarea
            value={element.content || ''}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
            rows={3}
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Font
          </label>
          <select
            value={element.fontFamily || 'Georgia, serif'}
            onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="Georgia, serif">Georgia</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times</option>
            <option value="Courier New, monospace">Courier</option>
            <option value="Trebuchet MS, sans-serif">Trebuchet</option>
            <option value="'Playfair Display', serif">Playfair</option>
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Size: {element.fontSize || 24}px
          </label>
          <input
            type="range"
            min="8"
            max="120"
            value={element.fontSize || 24}
            onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Weight
          </label>
          <select
            value={element.fontWeight || 'normal'}
            onChange={(e) => handleUpdate({ fontWeight: e.target.value })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
            <option value="900">Heavy</option>
          </select>
        </div>

        {/* Text Style */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              handleUpdate({
                fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
              })
            }
            className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition ${
              element.fontStyle === 'italic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Italic
          </button>
          <button
            onClick={() =>
              handleUpdate({
                textDecoration:
                  element.textDecoration === 'underline' ? 'none' : 'underline',
              })
            }
            className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition ${
              element.textDecoration === 'underline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Underline
          </button>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={element.color || '#333333'}
              onChange={(e) => handleUpdate({ color: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.color || '#333333'}
              onChange={(e) => handleUpdate({ color: e.target.value })}
              className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Alignment
          </label>
          <select
            value={element.align || 'center'}
            onChange={(e) => handleUpdate({ align: e.target.value })}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Letter Spacing: {element.letterSpacing || 0}px
          </label>
          <input
            type="range"
            min="-5"
            max="20"
            value={element.letterSpacing || 0}
            onChange={(e) => handleUpdate({ letterSpacing: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Line Height: {(element.lineHeight || 1.2).toFixed(1)}
          </label>
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={element.lineHeight || 1.2}
            onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const renderImageProperties = () => {
    return (
      <div className="space-y-4">
        {/* Border Radius */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Border Radius: {element.borderRadius || 0}px
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={element.borderRadius || 0}
            onChange={(e) => handleUpdate({ borderRadius: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Opacity: {Math.round((element.opacity || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={element.opacity || 1}
            onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const renderShapeProperties = () => {
    return (
      <div className="space-y-4">
        {/* Fill Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Fill Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={element.fillColor || '#D4A574'}
              onChange={(e) => handleUpdate({ fillColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.fillColor || '#D4A574'}
              onChange={(e) => handleUpdate({ fillColor: e.target.value })}
              className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Stroke Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={element.strokeColor || '#333333'}
              onChange={(e) => handleUpdate({ strokeColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.strokeColor || '#333333'}
              onChange={(e) => handleUpdate({ strokeColor: e.target.value })}
              className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Stroke Width: {element.strokeWidth || 2}px
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={element.strokeWidth || 2}
            onChange={(e) => handleUpdate({ strokeWidth: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Opacity: {Math.round((element.opacity || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={element.opacity || 1}
            onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const renderCommonProperties = () => {
    return (
      <div className="space-y-4 border-t border-gray-700 pt-4">
        {/* Position X */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            X: {Math.round((element.x || 0) * 100) / 100}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={element.x || 0}
            onChange={(e) => handleUpdate({ x: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Position Y */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Y: {Math.round((element.y || 0) * 100) / 100}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={element.y || 0}
            onChange={(e) => handleUpdate({ y: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Width: {Math.round((element.width || 80) * 100) / 100}%
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={element.width || 80}
            onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {element.type !== 'text' && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Height: {Math.round((element.height || 80) * 100) / 100}%
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={element.height || 80}
              onChange={(e) => handleUpdate({ height: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {/* Rotation */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Rotation: {Math.round((element.rotation || 0) % 360)}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={element.rotation || 0}
            onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        {element.type !== 'text' && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Opacity: {Math.round((element.opacity || 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={element.opacity || 1}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {element.type === 'text' && renderTextProperties()}
      {element.type === 'image' && renderImageProperties()}
      {element.type === 'shape' && renderShapeProperties()}

      {renderCommonProperties()}
    </div>
  );
}
