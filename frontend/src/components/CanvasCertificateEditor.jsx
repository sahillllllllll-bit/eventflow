import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Lock,
  Unlock,
  EyeOff,
  Layers,
  Settings,
  Save,
  Undo2,
  Redo2,
  Grid3x3,
  Maximize2,
  Square,
  Circle,
  Triangle,
  Minus,
  Palette,
  Type as TypeIcon,
  Image as ImageIconAlt,
  Sparkles,
  Layout,
  FileDown,
} from 'lucide-react';
import { createEditorStore } from '../stores/editorStore.js';
import LayerPanel from './editor/LayerPanel.jsx';
import PropertiesPanel from './editor/PropertiesPanel.jsx';
import Toolbar from './editor/Toolbar.jsx';
import Canvas from './editor/Canvas.jsx';
import TextEditorPopover from './editor/TextEditorPopover.jsx';
import DesignSettingsModal from './editor/DesignSettingsModal.jsx';
import { exportCertificate } from '../services/certificateExport.js';

/**
 * Production-grade Canva-style Certificate Editor
 * Complete visual editor with drag-drop, resize, text editing, and more
 */
export default function CanvasCertificateEditor({
  template,
  onSave,
  onBack,
  isLoading = false,
  registrationCount = 0,
}) {
  const [editorStore] = useState(() => createEditorStore(template));
  const containerRef = useRef(null);
  const [storeState, setStoreState] = useState(editorStore.getState());
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showDesignSettings, setShowDesignSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = editorStore.subscribe(
      (newState) => {
        setStoreState(newState);
      },
      (state) => ({
        elements: state.elements,
        selectedElementIds: state.selectedElementIds,
        designConfig: state.designConfig,
        zoom: state.zoom,
        panX: state.panX,
        panY: state.panY,
        activeTool: state.activeTool,
        activePanel: state.activePanel,
        textEditing: state.textEditing,
        showGrid: state.showGrid,
        viewMode: state.viewMode,
      })
    );

    return unsubscribe;
  }, [editorStore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editorStore.undo();
      }
      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        editorStore.redo();
      }
      // Ctrl/Cmd + Y: Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        editorStore.redo();
      }
      // Delete: Delete selected
      if (e.key === 'Delete' && storeState.selectedElementIds.length > 0) {
        e.preventDefault();
        editorStore.deleteSelected();
      }
      // Escape: Clear selection
      if (e.key === 'Escape') {
        editorStore.clearSelection();
      }
      // Ctrl/Cmd + D: Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && storeState.selectedElementIds.length > 0) {
        e.preventDefault();
        storeState.selectedElementIds.forEach(id => editorStore.duplicateElement(id));
      }
      // Arrow keys: Move selected elements
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const step = e.shiftKey ? 10 : 2;
        e.preventDefault();
        storeState.selectedElementIds.forEach(id => {
          const element = editorStore.getElement(id);
          if (element) {
            const updates = {};
            if (e.key === 'ArrowUp') updates.y = (element.y || 0) - step;
            if (e.key === 'ArrowDown') updates.y = (element.y || 0) + step;
            if (e.key === 'ArrowLeft') updates.x = (element.x || 0) - step;
            if (e.key === 'ArrowRight') updates.x = (element.x || 0) + step;
            editorStore.updateElement(id, updates);
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storeState.selectedElementIds, editorStore]);

  const handleSave = async () => {
    const editorState = editorStore.getState();
    const certificateData = {
      ...template,
      ...editorState.designConfig,
      customElements: editorState.elements,
    };
    await onSave(certificateData);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const canvasId = 'certificate-export-canvas';
      const filename = `certificate-${Date.now()}`;

      switch (format) {
        case 'png':
          await exportCertificate.toPNG(canvasId, `${filename}.png`);
          break;
        case 'jpg':
          await exportCertificate.toJPG(canvasId, `${filename}.jpg`);
          break;
        case 'pdf':
          await exportCertificate.toPDF(canvasId, `${filename}.pdf`, 'A4');
          break;
        case 'print-png':
          await exportCertificate.toPrintPNG(canvasId, `${filename}-print.png`, 300);
          break;
        default:
          break;
      }
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleAddText = () => {
    editorStore.setActiveTool('text');
    editorStore.addElement({
      type: 'text',
      content: 'New Text',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#333333',
      fontFamily: 'Georgia, serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      opacity: 1,
    });
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        editorStore.addElement({
          type: 'image',
          src: event.target.result,
          x: 20,
          y: 20,
          width: 100,
          height: 100,
          opacity: 1,
          borderRadius: 0,
          rotation: 0,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleAddShape = (shapeType) => {
    editorStore.addElement({
      type: 'shape',
      shapeType, // 'rectangle', 'circle', 'line', 'triangle'
      x: 30,
      y: 30,
      width: 100,
      height: 100,
      fillColor: '#D4A574',
      strokeColor: '#333333',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
    });
  };

  const selectedElement = storeState.selectedElementIds.length === 1
    ? editorStore.getElement(storeState.selectedElementIds[0])
    : null;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-gray-950 border-b border-gray-700 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-lg font-bold text-white">Certificate Designer</h1>
          <span className="text-xs text-gray-500">
            {registrationCount} recipients
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => editorStore.undo()}
            disabled={!editorStore.canUndo()}
            className="p-2 hover:bg-gray-800 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={() => editorStore.redo()}
            disabled={!editorStore.canRedo()}
            className="p-2 hover:bg-gray-800 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={18} />
          </button>
          <div className="border-l border-gray-700 h-6 mx-2" />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
          >
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            Save Template
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 pt-14">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          {/* Tool Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => editorStore.setActivePanel('tools')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                storeState.activePanel === 'tools'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Plus size={16} className="inline mr-1" /> Tools
            </button>
            <button
              onClick={() => editorStore.setActivePanel('layers')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                storeState.activePanel === 'layers'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={16} className="inline mr-1" /> Layers
            </button>
          </div>

          {/* Panel Content */}
          {storeState.activePanel === 'tools' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <button
                onClick={handleAddText}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
              >
                <Type size={16} /> Add Text
              </button>
              <button
                onClick={handleAddImage}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
              >
                <ImageIcon size={16} /> Add Image
              </button>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-400 font-semibold mb-2">Shapes</p>
                <button
                  onClick={() => handleAddShape('rectangle')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
                >
                  <Square size={16} /> Rectangle
                </button>
                <button
                  onClick={() => handleAddShape('circle')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm mt-1"
                >
                  <Circle size={16} /> Circle
                </button>
                <button
                  onClick={() => handleAddShape('line')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm mt-1"
                >
                  <Minus size={16} /> Line
                </button>
              </div>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-400 font-semibold mb-2">Variables</p>
                <div className="space-y-1 text-xs">
                  <button className="w-full text-left px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition">
                    {'{name}'}
                  </button>
                  <button className="w-full text-left px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition">
                    {'{college}'}
                  </button>
                  <button className="w-full text-left px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition">
                    {'{event}'}
                  </button>
                  <button className="w-full text-left px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition">
                    {'{date}'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {storeState.activePanel === 'layers' && (
            <LayerPanel
              store={editorStore}
              elements={storeState.elements}
              selectedIds={storeState.selectedElementIds}
            />
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <Toolbar
            store={editorStore}
            storeState={storeState}
            onDesignSettings={() => setShowDesignSettings(true)}
            onExport={handleExport}
          />

          {/* Canvas Container */}
          <div ref={containerRef} className="flex-1 bg-gray-950 overflow-hidden relative">
            <Canvas store={editorStore} storeState={storeState} template={template} />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {selectedElement && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Properties</h3>
              <p className="text-xs text-gray-400 mt-1">
                {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
              </p>
            </div>
            <PropertiesPanel
              element={selectedElement}
              store={editorStore}
              onTextEdit={() => setShowTextEditor(true)}
            />
          </div>
        )}
      </div>

      {/* Text Editor Popover */}
      {showTextEditor && selectedElement?.type === 'text' && (
        <TextEditorPopover
          element={selectedElement}
          store={editorStore}
          onClose={() => setShowTextEditor(false)}
        />
      )}

      {/* Design Settings Modal */}
      {showDesignSettings && (
        <DesignSettingsModal
          store={editorStore}
          storeState={storeState}
          onClose={() => setShowDesignSettings(false)}
        />
      )}
    </div>
  );
}
