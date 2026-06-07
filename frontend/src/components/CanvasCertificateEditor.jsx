import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Plus, Type, Image as ImageIcon, Square, Circle, Minus,
  Triangle, QrCode, Layers, Save, Undo2, Redo2, Loader, Trash2,
  Copy, Download, FileDown, X,
} from 'lucide-react';
import { createEditorStore } from '../stores/editorStore.js';
import LayerPanel from './editor/LayerPanel.jsx';
import PropertiesPanel from './editor/PropertiesPanel.jsx';
import Toolbar from './editor/Toolbar.jsx';
import Canvas, { getCertificateCanvasElement } from './editor/Canvas.jsx';
import DesignSettingsModal from './editor/DesignSettingsModal.jsx';
import { exportCertificate, exportBulkPDF, exportBulkJPG } from '../services/certificateExport.js';
import { renderCertificateToDOM } from '../services/certificateRenderer.js';
import { generateQRCodeDataURL } from '../utils/qrCodeGenerator.js';

// ─── Build initial elements from a template object ──────────────────────────
function buildTemplateElements(template) {
  if (!template) return [];
  const W = 1050, H = 744, cx = W / 2;
  const els = [];
  let z = 0;
  const push = (el) => els.push({ isLocked:false,isHidden:false,rotation:0,opacity:1, zIndex:z++, ...el });

  if (template.heading) push({ id:'tpl-heading', type:'text', content:template.heading,
    x:cx-400, y:60, width:800, height:80, fontSize:template.headingFontSize||48,
    color:template.headingColor||'#1a1a1a', fontFamily:'Georgia, serif', fontWeight:'bold', align:'center', lineHeight:1.2 });

  if (template.subHeading) push({ id:'tpl-subheading', type:'text', content:template.subHeading,
    x:cx-350, y:165, width:700, height:50, fontSize:template.subHeadingFontSize||22,
    color:template.descriptionColor||'#555', fontFamily:'Georgia, serif', align:'center', lineHeight:1.3 });

  push({ id:'tpl-recipient', type:'text', content:'{name}',
    x:cx-380, y:240, width:760, height:90, fontSize:template.recipientNameFontSize||44,
    color:template.recipientNameColor||'#D4A574', fontFamily:"'Playfair Display', Georgia, serif",
    fontWeight:'bold', fontStyle:'italic', align:'center', lineHeight:1.2 });

  if (template.descriptionText) push({ id:'tpl-description', type:'text', content:template.descriptionText,
    x:cx-350, y:355, width:700, height:60, fontSize:template.descriptionFontSize||18,
    color:template.descriptionColor||'#555', fontFamily:'Georgia, serif', align:'center', lineHeight:1.4 });

  push({ id:'tpl-event', type:'text', content:'{event}',
    x:cx-300, y:435, width:600, height:45, fontSize:20,
    color:template.accentColor||'#3B82F6', fontFamily:'Georgia, serif', fontStyle:'italic', align:'center', lineHeight:1.2 });

  push({ id:'tpl-footer', type:'text', content:`${template.organizerName||'Event Organizer'} • {date}`,
    x:cx-300, y:H-90, width:600, height:40, fontSize:template.footerFontSize||13,
    color:template.footerColor||'#999', fontFamily:'Georgia, serif', align:'center', lineHeight:1.2 });

  if (template.logo) push({ id:'tpl-logo', type:'image', src:template.logo,
    x:cx-(template.logoWidth||80)/2, y:20, width:template.logoWidth||80, height:template.logoHeight||80, objectFit:'contain' });

  return els;
}

const PLACEHOLDERS = [
  { key:'{name}',   desc:'Recipient name' },
  { key:'{event}',  desc:'Event name' },
  { key:'{date}',   desc:'Issue date' },
  { key:'{college}',desc:'College / org' },
  { key:'{code}',   desc:'Unique code' },
];

// ─── Export Panel Modal ──────────────────────────────────────────────────────
function ExportPanel({ onClose, storeState, template, registrations, eventName }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [format, setFormat] = useState('pdf');

  const templateData = {
    ...template,
    customElements: storeState.elements,
    designConfig: storeState.designConfig,
  };

  const handleSingleExport = async () => {
    setExporting(true);
    try {
      const el = getCertificateCanvasElement();
      const ts = Date.now();
      if (format === 'pdf') await exportCertificate.toPDF(el, `certificate-${ts}.pdf`);
      else if (format === 'jpg') await exportCertificate.toJPG(el, `certificate-${ts}.jpg`);
      else if (format === 'png') await exportCertificate.toPNG(el, `certificate-${ts}.png`);
      else if (format === 'print-png') await exportCertificate.toPrintPNG(el, `certificate-print-${ts}.png`, 300);
    } finally {
      setExporting(false);
    }
  };

  const handleBulkExport = async () => {
    if (!registrations?.length) return;
    setExporting(true);
    setProgress({ done: 0, total: registrations.length });
    try {
      const renderFn = (recipient, container) =>
        renderCertificateToDOM(recipient, container, templateData, { eventName });
      if (format === 'jpg') {
        await exportBulkJPG(registrations, renderFn, {
          scale: 2,
          onProgress: (done, total) => setProgress({ done, total }),
        });
      } else {
        await exportBulkPDF(registrations, templateData, renderFn, {
          filename: `all-certificates-${Date.now()}.pdf`,
          imageFormat: 'png',
          scale: 2,
          onProgress: (done, total) => setProgress({ done, total }),
        });
      }
    } finally {
      setExporting(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const hasRecipients = registrations?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full sm:max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Export Certificate</h2>
            {hasRecipients && (
              <p className="text-xs text-gray-400 mt-0.5">{registrations.length} recipients loaded</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Format</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id:'pdf',       label:'PDF',         desc:'Best for sharing' },
                { id:'jpg',       label:'JPG',         desc:'Compressed image' },
                { id:'png',       label:'PNG',         desc:'Lossless image' },
                { id:'print-png', label:'PNG 300 DPI', desc:'Print quality' },
              ].map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-lg border text-left transition ${
                    format === f.id
                      ? 'border-blue-500 bg-blue-600/20 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {exporting && progress.total > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Generating certificates…</span>
                <span>{progress.done} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleSingleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-700 hover:bg-gray-600
                text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              {exporting ? <Loader size={16} className="animate-spin"/> : <Download size={16}/>}
              Download Preview ({format.toUpperCase()})
            </button>

            {hasRecipients && (
              <button
                onClick={handleBulkExport}
                disabled={exporting || format === 'print-png'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700
                  text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
              >
                {exporting ? <Loader size={16} className="animate-spin"/> : <FileDown size={16}/>}
                {format === 'jpg'
                  ? `Download All ${registrations.length} as JPG`
                  : `Download All ${registrations.length} in One PDF`
                }
              </button>
            )}

            {!hasRecipients && (
              <p className="text-xs text-gray-500 text-center">
                Bulk export available after recipients are selected in the previous step.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function CanvasCertificateEditor({
  template,
  onSave,
  onBack,
  isLoading = false,
  registrationCount = 0,
  registrations = [],
  eventName = '',
}) {
  const [editorStore] = useState(() => {
    const store = createEditorStore(template);
    const elements = buildTemplateElements(template);
    if (elements.length) store.getState().loadState({ elements });
    store.getState().saveToHistory();
    return store;
  });

  const [storeState, setStoreState] = useState(editorStore.getState());
  const [showDesignSettings, setShowDesignSettings] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState('tools');

  useEffect(() => {
    return editorStore.subscribe((s) => setStoreState({
      elements: s.elements, selectedElementIds: s.selectedElementIds,
      designConfig: s.designConfig, zoom: s.zoom, panX: s.panX, panY: s.panY,
      activeTool: s.activeTool, activePanel: s.activePanel, textEditing: s.textEditing,
      showGrid: s.showGrid, viewMode: s.viewMode,
      historyIndex: s.historyIndex, historyLength: s.history.length, gridSize: s.gridSize,
    }));
  }, [editorStore]);

  const canUndo = (storeState.historyIndex ?? -1) > 0;
  const canRedo = (storeState.historyIndex ?? -1) < (storeState.historyLength ?? 0) - 1;

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag==='INPUT'||tag==='TEXTAREA'||document.activeElement?.contentEditable==='true') return;
      if ((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey) { e.preventDefault(); editorStore.getState().undo(); }
      if ((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); editorStore.getState().redo(); }
      if (e.key==='Delete'||e.key==='Backspace') { e.preventDefault(); editorStore.getState().deleteSelected(); }
      if (e.key==='Escape') editorStore.getState().clearSelection();
      if ((e.ctrlKey||e.metaKey)&&e.key==='d') {
        e.preventDefault();
        storeState.selectedElementIds.forEach(id => editorStore.getState().duplicateElement(id));
      }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        const step = e.shiftKey ? 10 : 1;
        e.preventDefault();
        storeState.selectedElementIds.forEach(id => {
          const el = editorStore.getState().getElement(id);
          if (!el||el.isLocked) return;
          editorStore.getState().updateElement(id, {
            x: (el.x||0)+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),
            y: (el.y||0)+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0),
          });
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [storeState.selectedElementIds, editorStore]);

  const handleSave = async () => {
    const state = editorStore.getState().serializeState();
    await onSave({ ...template, ...state.designConfig, customElements: state.elements });
  };

  const addText = () => {
    const { width=1050, height=744 } = storeState.designConfig;
    editorStore.getState().addElement({ type:'text', content:'New Text',
      x:width/2-150, y:height/2-30, width:300, height:60,
      fontSize:28, color:'#333', fontFamily:'Georgia, serif', fontWeight:'normal',
      fontStyle:'normal', textDecoration:'none', align:'center', lineHeight:1.3, letterSpacing:0 });
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type='file'; input.accept='image/*';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const { width=1050, height=744 } = storeState.designConfig;
        editorStore.getState().addElement({ type:'image', src:ev.target.result,
          x:width/2-80, y:height/2-80, width:160, height:160, objectFit:'contain', borderRadius:0 });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addShape = (shapeType) => {
    const { width=1050, height=744 } = storeState.designConfig;
    editorStore.getState().addElement({ type:'shape', shapeType,
      x:width/2-60, y:height/2-60, width:120, height:shapeType==='line'?4:120,
      fillColor:'#D4A574', strokeColor:'#333', strokeWidth:2 });
  };

  // ─── QR Code ───────────────────────────────────────────────────────────────
  const addQRCode = async () => {
    try {
      const { width=1050, height=744 } = storeState.designConfig;
      const qrUrl = await generateQRCodeDataURL('{name}-{code}', { width: 200, margin: 1 });
      editorStore.getState().addElement({
        type: 'qrcode',
        src: qrUrl,
        x: width/2-60, y: height/2-60,
        width: 120, height: 120,
        qrText: '{name}-{code}',
        objectFit: 'contain',
      });
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  };

  const insertPlaceholder = (placeholder) => {
    const id = storeState.selectedElementIds[0];
    const el = id && editorStore.getState().getElement(id);
    if (el?.type === 'text')
      editorStore.getState().updateElement(el.id, { content:(el.content||'')+placeholder });
  };

  const selectedElement = storeState.selectedElementIds.length === 1
    ? editorStore.getState().getElement(storeState.selectedElementIds[0])
    : null;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">

      {/* ── TOP HEADER ── */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-gray-950 border-b border-gray-800 z-50 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 hover:bg-gray-800 rounded transition">
            <ChevronLeft size={16}/> Back
          </button>
          <div className="w-px h-5 bg-gray-700"/>
          <span className="text-sm font-semibold text-white">Certificate Designer</span>
          {registrationCount > 0 && <span className="text-xs text-gray-500">• {registrationCount} recipients</span>}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => editorStore.getState().undo()} disabled={!canUndo}
            className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-30 transition" title="Undo (Ctrl+Z)">
            <Undo2 size={16}/>
          </button>
          <button onClick={() => editorStore.getState().redo()} disabled={!canRedo}
            className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-30 transition" title="Redo">
            <Redo2 size={16}/>
          </button>
          <div className="w-px h-5 bg-gray-700"/>
          {/* <button onClick={() => setShowExportPanel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-semibold transition">
            <Download size={14}/> Export
          </button> */}
          <button onClick={handleSave} disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition disabled:opacity-50">
            {isLoading ? <Loader size={14} className="animate-spin"/> : <Save size={14}/>}
            Save And Continue
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex flex-1 pt-12">

        {/* LEFT SIDEBAR */}
        <div className="w-60 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
          <div className="flex border-b border-gray-700 flex-shrink-0">
            {[{key:'tools',label:'Tools',icon:<Plus size={13}/>},{key:'layers',label:'Layers',icon:<Layers size={13}/>}].map(tab => (
              <button key={tab.key} onClick={() => setActiveLeftTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition
                  ${activeLeftTab===tab.key ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeLeftTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 py-1">Elements</p>
              <button onClick={addText} className="w-full flex items-center gap-2.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition">
                <Type size={15} className="text-blue-400"/> Add Text
              </button>
              <button onClick={addImage} className="w-full flex items-center gap-2.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition">
                <ImageIcon size={15} className="text-green-400"/> Add Image
              </button>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 pt-3 pb-1">Shapes</p>
              {[{type:'rectangle',label:'Rectangle',Icon:Square,color:'text-purple-400'},
                {type:'circle',label:'Circle',Icon:Circle,color:'text-pink-400'},
                {type:'line',label:'Line',Icon:Minus,color:'text-yellow-400'},
                {type:'triangle',label:'Triangle',Icon:Triangle,color:'text-orange-400'}].map(({type,label,Icon,color}) => (
                <button key={type} onClick={() => addShape(type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition">
                  <Icon size={15} className={color}/> {label}
                </button>
              ))}

              {/* ─── QR CODE ─── */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 pt-3 pb-1">QR Code</p>
              <button onClick={addQRCode}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition">
                <QrCode size={15} className="text-cyan-400"/> Add QR Code
              </button>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 pt-3 pb-1">Placeholders</p>
              <p className="text-xs text-gray-500 px-1 pb-1">Select a text element first:</p>
              {PLACEHOLDERS.map(({key,desc}) => (
                <button key={key} onClick={() => insertPlaceholder(key)}
                  disabled={!selectedElement||selectedElement.type!=='text'}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-700/60 hover:bg-gray-600
                    rounded text-xs text-gray-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title={desc}>
                  <span className="font-mono text-blue-400">{key}</span>
                  <span className="text-gray-500">{desc}</span>
                </button>
              ))}

              {selectedElement && (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 pt-3 pb-1">Selected</p>
                  <div className="flex gap-1">
                    <button onClick={() => editorStore.getState().duplicateElement(selectedElement.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
                      <Copy size={12}/> Duplicate
                    </button>
                    <button onClick={() => editorStore.getState().deleteElement(selectedElement.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-red-900/50 hover:bg-red-800 rounded text-red-400 transition">
                      <Trash2 size={12}/> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeLeftTab === 'layers' && (
            <LayerPanel store={editorStore} elements={storeState.elements} selectedIds={storeState.selectedElementIds}/>
          )}
        </div>

        {/* CANVAS */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar store={editorStore} storeState={storeState} onDesignSettings={() => setShowDesignSettings(true)}/>
          <div className="flex-1 overflow-hidden">
            <Canvas store={editorStore} storeState={storeState} template={template}/>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className={`flex-shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden transition-all ${selectedElement ? 'w-72' : 'w-0'}`}>
          {selectedElement && (
            <>
              <div className="p-3 border-b border-gray-700 flex-shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Properties</p>
                  <p className="text-xs text-gray-400 capitalize">{selectedElement.type}</p>
                </div>
                <button onClick={() => editorStore.getState().clearSelection()} className="text-xs text-gray-500 hover:text-white transition">✕</button>
              </div>
              <PropertiesPanel element={selectedElement} store={editorStore}/>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDesignSettings && (
        <DesignSettingsModal store={editorStore} storeState={storeState} onClose={() => setShowDesignSettings(false)}/>
      )}

      {showExportPanel && (
        <ExportPanel
          onClose={() => setShowExportPanel(false)}
          storeState={storeState}
          template={template}
          registrations={registrations}
          eventName={eventName}
        />
      )}

      {/* Keyboard hints */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 flex gap-2 text-xs text-gray-700 pointer-events-none select-none">
        {['Ctrl+Z Undo','Ctrl+Y Redo','Del Delete','Ctrl+D Duplicate','Arrows Move','Dbl-click Edit text'].map(h => (
          <span key={h} className="bg-gray-900/80 px-2 py-0.5 rounded border border-gray-800">{h}</span>
        ))}
      </div>
    </div>
  );
}