import React, { useState } from 'react';
import { X } from 'lucide-react';

const BORDER_PRESETS = [
  { id: 'none', name: 'None', style: 'none' },
  { id: 'simple', name: 'Simple', style: 'solid' },
  { id: 'elegant', name: 'Elegant', style: 'double' },
  { id: 'modern', name: 'Modern', style: 'dashed' },
  { id: 'thick', name: 'Thick Gold', style: 'solid' },
];

const BG_PATTERNS = [
  { id: 'solid', name: 'Solid', type: 'solid' },
  { id: 'cream', name: 'Cream', type: 'solid', value: '#FFFDD0' },
  { id: 'gold-gradient', name: 'Gold Gradient', type: 'gradient' },
  { id: 'blue-gradient', name: 'Blue Gradient', type: 'gradient' },
  { id: 'green-gradient', name: 'Green Gradient', type: 'gradient' },
];

/**
 * Design Settings Modal
 * Configure certificate background, borders, and overall design
 */
export default function DesignSettingsModal({ store, storeState, onClose }) {
  const { designConfig } = storeState;

  const handleUpdate = (updates) => {
    store.updateDesignConfig(updates);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Design Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Background Color */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Background</h3>
            <div className="space-y-3">
              <label className="block text-xs text-gray-300">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={designConfig.backgroundColor || '#FFFFFF'}
                  onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={designConfig.backgroundColor || '#FFFFFF'}
                  onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600"
                />
              </div>

              {/* Background Patterns */}
              <div>
                <label className="block text-xs text-gray-300 mb-2">Pattern</label>
                <div className="grid grid-cols-2 gap-2">
                  {BG_PATTERNS.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => handleUpdate({ backgroundPattern: pattern.id })}
                      className={`px-3 py-2 rounded text-xs font-medium transition ${
                        designConfig.backgroundPattern === pattern.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pattern.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Border Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-white mb-3">Border</h3>
            <div className="space-y-3">
              {/* Border Style */}
              <div>
                <label className="block text-xs text-gray-300 mb-2">Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {BORDER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleUpdate({ borderStyle: preset.id })}
                      className={`px-3 py-2 rounded text-xs font-medium transition ${
                        designConfig.borderStyle === preset.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Color */}
              <div>
                <label className="block text-xs text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={designConfig.borderColor || '#D4A574'}
                    onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={designConfig.borderColor || '#D4A574'}
                    onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                    className="flex-1 px-3 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600"
                  />
                </div>
              </div>

              {/* Border Width */}
              <div>
                <label className="block text-xs text-gray-300 mb-2">
                  Width: {designConfig.borderWidth || 8}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={designConfig.borderWidth || 8}
                  onChange={(e) => handleUpdate({ borderWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Canvas Dimensions */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-white mb-3">Canvas Size</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-2">
                  Width: {designConfig.width}px
                </label>
                <input
                  type="range"
                  min="800"
                  max="2000"
                  value={designConfig.width || 1050}
                  onChange={(e) => handleUpdate({ width: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-2">
                  Height: {designConfig.height}px
                </label>
                <input
                  type="range"
                  min="600"
                  max="1200"
                  value={designConfig.height || 744}
                  onChange={(e) => handleUpdate({ height: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-4">
              <label className="block text-xs text-gray-300 mb-2">Quick Presets</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    handleUpdate({ width: 1050, height: 744 })
                  }
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                >
                  A4 Landscape
                </button>
                <button
                  onClick={() =>
                    handleUpdate({ width: 744, height: 1050 })
                  }
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                >
                  A4 Portrait
                </button>
                <button
                  onClick={() =>
                    handleUpdate({ width: 1200, height: 800 })
                  }
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                >
                  HD 16:9
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
