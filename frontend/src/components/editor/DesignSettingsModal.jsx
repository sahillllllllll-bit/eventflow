import React, { useState } from 'react';
import { X } from 'lucide-react';

const BORDER_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'simple', label: 'Simple' },
  { id: 'elegant', label: 'Elegant Double' },
  { id: 'thick', label: 'Thick' },
  { id: 'double', label: 'Double' },
  { id: 'modern', label: 'Modern (T+B)' },
  { id: 'shadow', label: 'Shadow' },
];

const BG_PRESETS = [
  { label: 'White', value: '#FFFFFF', gradient: null },
  { label: 'Cream', value: '#FFFDD0', gradient: null },
  { label: 'Light Gray', value: '#F5F5F5', gradient: null },
  { label: 'Gold Gradient', value: '#FFF8DC', gradient: 'linear-gradient(135deg, #fff8dc 0%, #ffd700 100%)' },
  { label: 'Elegant Dark', value: '#1a1a2e', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  { label: 'Blue Gradient', value: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Green Forest', value: '#0f3d1f', gradient: 'linear-gradient(135deg, #0f3d1f 0%, #1a6b3f 100%)' },
  { label: 'Rose Gold', value: '#f8d7d7', gradient: 'linear-gradient(135deg, #f8d7d7 0%, #c9a8a8 100%)' },
  { label: 'Navy', value: '#1e3a5f', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)' },
];

export default function DesignSettingsModal({ store, storeState, onClose }) {
  const { designConfig } = storeState;
  const update = (updates) => store.getState().updateDesignConfig(updates);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Design Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Background */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Background</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => update({ backgroundColor: preset.value, backgroundGradient: preset.gradient })}
                  className={`p-2 rounded border transition text-xs text-center ${
                    designConfig.backgroundColor === preset.value
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{
                    background: preset.gradient || preset.value,
                    color: preset.value.startsWith('#1') || preset.value.startsWith('#0') ? '#fff' : '#333',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Custom Color</p>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={designConfig.backgroundColor || '#FFFFFF'}
                  onChange={(e) => update({ backgroundColor: e.target.value, backgroundGradient: null })}
                  className="w-10 h-9 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={designConfig.backgroundColor || '#FFFFFF'}
                  onChange={(e) => update({ backgroundColor: e.target.value, backgroundGradient: null })}
                  className="flex-1 bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded"
                />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">Custom Gradient CSS</p>
              <input
                type="text"
                value={designConfig.backgroundGradient || ''}
                onChange={(e) => update({ backgroundGradient: e.target.value || null })}
                placeholder="linear-gradient(135deg, #fff 0%, #ccc 100%)"
                className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded"
              />
            </div>
          </div>

          {/* Border */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Border</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 mb-3">
              {BORDER_STYLES.map(bs => (
                <button
                  key={bs.id}
                  onClick={() => update({ borderStyle: bs.id })}
                  className={`py-1.5 px-2 text-xs rounded transition ${
                    designConfig.borderStyle === bs.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {bs.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Color</p>
                <div className="flex gap-2">
                  <input type="color" value={designConfig.borderColor || '#D4A574'}
                    onChange={(e) => update({ borderColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border-0" />
                  <input type="text" value={designConfig.borderColor || '#D4A574'}
                    onChange={(e) => update({ borderColor: e.target.value })}
                    className="flex-1 bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Width</p>
                <input type="number" min={1} max={40} value={designConfig.borderWidth || 8}
                  onChange={(e) => update({ borderWidth: Number(e.target.value) })}
                  className="w-20 bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded" />
              </div>
            </div>
          </div>

          {/* Canvas Size */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Canvas Size</p>
            <div className="flex gap-3 mb-2">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Width (px)</p>
                <input type="number" min={400} max={3000} value={designConfig.width || 1050}
                  onChange={(e) => update({ width: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Height (px)</p>
                <input type="number" min={300} max={3000} value={designConfig.height || 744}
                  onChange={(e) => update({ height: Number(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { label: 'A4 Landscape', w: 1050, h: 744 },
                { label: 'A4 Portrait', w: 744, h: 1050 },
                { label: 'HD (16:9)', w: 1280, h: 720 },
                { label: 'Square', w: 900, h: 900 },
              ].map(p => (
                <button key={p.label} onClick={() => update({ width: p.w, height: p.h })}
                  className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-700">
          <button onClick={onClose}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}