import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Maximize2,
  Palette,
  Eye,
  Download,
} from 'lucide-react';

/**
 * Canvas Toolbar Component
 * Controls for zoom, pan, grid, and canvas settings
 */
export default function Toolbar({ store, storeState, onDesignSettings, onExport }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const handleZoomIn = () => {
    store.setZoom(Math.min(4, storeState.zoom + 0.1));
  };

  const handleZoomOut = () => {
    store.setZoom(Math.max(0.1, storeState.zoom - 0.1));
  };

  const handleZoomReset = () => {
    store.setZoom(1);
  };

  const handleZoomFit = () => {
    store.setZoom(0.7);
  };

  return (
    <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left Group - Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-800 rounded transition"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>

        <div className="px-3 py-1 bg-gray-800 rounded text-sm min-w-[80px] text-center">
          {Math.round(storeState.zoom * 100)}%
        </div>

        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-800 rounded transition"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={handleZoomReset}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition"
          title="Reset zoom"
        >
          1:1
        </button>

        <button
          onClick={handleZoomFit}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition"
          title="Fit to screen"
        >
          Fit
        </button>
      </div>

      {/* Center Group - Canvas Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => store.setShowGrid(!storeState.showGrid)}
          className={`p-2 rounded transition ${
            storeState.showGrid
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-800 text-gray-300'
          }`}
          title="Toggle grid"
        >
          <Grid3x3 size={18} />
        </button>

        <button
          onClick={onDesignSettings}
          className="p-2 hover:bg-gray-800 rounded transition"
          title="Design settings"
        >
          <Palette size={18} />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 hover:bg-gray-800 rounded transition flex items-center gap-1"
            title="Export"
          >
            <Download size={18} />
            <span className="text-xs">Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
              <button
                onClick={() => onExport('png')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition text-xs"
              >
                Export as PNG
              </button>
              <button
                onClick={() => onExport('jpg')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition text-xs"
              >
                Export as JPG
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition text-xs"
              >
                Export as PDF
              </button>
              <button
                onClick={() => onExport('print-png')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition text-xs border-t border-gray-700"
              >
                Print-Ready PNG (300dpi)
              </button>
            </div>
          )}
        </div>

        <button
          className="p-2 hover:bg-gray-800 rounded transition"
          title="Toggle preview"
        >
          <Eye size={18} />
        </button>
      </div>

      {/* Right Group - Info */}
      <div className="text-xs text-gray-400">
        Canvas {storeState.designConfig.width}×{storeState.designConfig.height}px
      </div>
    </div>
  );
}
