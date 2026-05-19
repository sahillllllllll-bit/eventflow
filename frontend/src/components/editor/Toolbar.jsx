import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Grid3x3, Eye, EyeOff, Download, Settings } from 'lucide-react';

export default function Toolbar({ store, storeState, onDesignSettings, onExport }) {
  const { zoom, showGrid } = storeState;
  const s = store.getState();

  return (
    <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => s.setZoom(zoom - 0.1)}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-gray-400 font-mono w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => s.setZoom(zoom + 0.1)}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => s.setZoom(0.7)}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
          title="Reset Zoom"
        >
          <RotateCcw size={14} />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Zoom presets */}
        {[0.5, 0.75, 1].map(z => (
          <button
            key={z}
            onClick={() => s.setZoom(z)}
            className={`px-2 py-0.5 text-xs rounded transition ${
              Math.abs(zoom - z) < 0.02
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {Math.round(z * 100)}%
          </button>
        ))}
      </div>

      {/* Center: View options */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => s.setShowGrid(!showGrid)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
            showGrid ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 size={14} />
          <span>Grid</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDesignSettings}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-white rounded transition"
          title="Design Settings"
        >
          <Settings size={14} />
          <span>Design</span>
        </button>
      </div>
    </div>
  );
}