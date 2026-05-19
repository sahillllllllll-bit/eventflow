import React, { useRef, useState, useCallback, useEffect } from 'react';
import { getDecorationShapes } from '../TemplateRenderer';

const HANDLE_SIZE = 8;

function getBorderCSS(borderStyle, borderColor, borderWidth) {
  const w = borderWidth || 8;
  const c = borderColor || '#D4A574';
  switch (borderStyle) {
    case 'none': return {};
    case 'simple': return { border: `${w}px solid ${c}` };
    case 'double': return { border: `${w}px double ${c}` };
    case 'elegant': return { border: `${w}px double ${c}`, boxShadow: `inset 0 0 0 3px ${c}33` };
    case 'thick': return { border: `${w + 6}px solid ${c}`, boxShadow: `0 0 20px ${c}40` };
    case 'modern': return { borderTop: `${w}px solid ${c}`, borderBottom: `${w}px solid ${c}` };
    case 'shadow': return { boxShadow: `0 0 30px rgba(0,0,0,0.25), inset 0 0 0 2px ${c}` };
    default: return { border: `${w}px solid ${c}` };
  }
}

function ResizeHandle({ position, onMouseDown }) {
  const cursors = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    w: 'w-resize', e: 'e-resize',
    sw: 'sw-resize', s: 's-resize', se: 'se-resize',
  };
  const posStyles = {
    nw: { top: -4, left: -4 }, n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 }, w: { top: '50%', left: -4, transform: 'translateY(-50%)' },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)' },
    sw: { bottom: -4, left: -4 }, s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    se: { bottom: -4, right: -4 },
  };
  return (
    <div
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, position); }}
      style={{
        position: 'absolute',
        width: HANDLE_SIZE, height: HANDLE_SIZE,
        background: '#3B82F6', border: '2px solid white', borderRadius: 2,
        cursor: cursors[position], zIndex: 1000, ...posStyles[position],
      }}
    />
  );
}

function TextElement({ element, isSelected, isEditing, onStartEdit, onEndEdit, onUpdateLive, zoom }) {
  const textRef = useRef(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
  }, [isEditing]);

  return (
    <div
      style={{
        width: '100%', height: '100%',
        fontSize: element.fontSize || 24, color: element.color || '#333',
        fontFamily: element.fontFamily || 'Georgia, serif',
        fontWeight: element.fontWeight || 'normal', fontStyle: element.fontStyle || 'normal',
        textDecoration: element.textDecoration || 'none', textAlign: element.align || 'center',
        letterSpacing: element.letterSpacing || 0, lineHeight: element.lineHeight || 1.3,
        opacity: element.opacity ?? 1, display: 'flex', alignItems: 'center',
        justifyContent: element.align === 'left' ? 'flex-start' : element.align === 'right' ? 'flex-end' : 'center',
        overflow: 'hidden', userSelect: isEditing ? 'text' : 'none',
        cursor: isEditing ? 'text' : 'inherit', padding: '2px 4px',
      }}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
    >
      {isEditing ? (
        <div
          ref={textRef} contentEditable suppressContentEditableWarning
          onBlur={(e) => onEndEdit(e.currentTarget.innerText)}
          onKeyDown={(e) => { if (e.key === 'Escape') onEndEdit(e.currentTarget.innerText); }}
          style={{ outline: 'none', minWidth: 20, width: '100%', textAlign: element.align || 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {element.content}
        </div>
      ) : (
        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', textAlign: element.align || 'center' }}>
          {element.content}
        </span>
      )}
    </div>
  );
}

function ShapeElement({ element }) {
  const { shapeType, fillColor, strokeColor, strokeWidth, width, height } = element;
  if (shapeType === 'circle') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - strokeWidth} ry={height / 2 - strokeWidth}
          fill={fillColor || '#D4A574'} stroke={strokeColor || '#333'} strokeWidth={strokeWidth || 2} />
      </svg>
    );
  }
  if (shapeType === 'line') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2}
          stroke={strokeColor || '#333'} strokeWidth={strokeWidth || 2} />
      </svg>
    );
  }
  if (shapeType === 'triangle') {
    const pts = `${width / 2},0 ${width},${height} 0,${height}`;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polygon points={pts} fill={fillColor || '#D4A574'} stroke={strokeColor || '#333'} strokeWidth={strokeWidth || 2} />
      </svg>
    );
  }
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <rect x={strokeWidth} y={strokeWidth} width={width - strokeWidth * 2} height={height - strokeWidth * 2}
        fill={fillColor || '#D4A574'} stroke={strokeColor || '#333'} strokeWidth={strokeWidth || 2} />
    </svg>
  );
}

function CanvasElement({ element, isSelected, store, zoom, editingId, setEditingId }) {
  const handleMouseDown = useCallback((e) => {
    if (element.isLocked) return;
    if (editingId === element.id) return;
    e.stopPropagation();
    store.getState().selectElement(element.id, e.shiftKey);

    const startX = e.clientX, startY = e.clientY;
    const origX = element.x || 0, origY = element.y || 0;

    const onMove = (me) => {
      store.getState().updateElementLive(element.id, {
        x: origX + (me.clientX - startX) / zoom,
        y: origY + (me.clientY - startY) / zoom,
      });
    };
    const onUp = () => {
      store.getState().commitLiveUpdate();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [element, zoom, store, editingId]);

  const handleResizeMouseDown = useCallback((e, handle) => {
    if (element.isLocked) return;
    e.preventDefault(); e.stopPropagation();

    const startX = e.clientX, startY = e.clientY;
    const origX = element.x || 0, origY = element.y || 0;
    const origW = element.width || 200, origH = element.height || 60;

    const onMove = (me) => {
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;
      let newX = origX, newY = origY, newW = origW, newH = origH;
      if (handle.includes('e')) newW = Math.max(40, origW + dx);
      if (handle.includes('s')) newH = Math.max(20, origH + dy);
      if (handle.includes('w')) { newX = origX + dx; newW = Math.max(40, origW - dx); }
      if (handle.includes('n')) { newY = origY + dy; newH = Math.max(20, origH - dy); }
      store.getState().updateElementLive(element.id, { x: newX, y: newY, width: newW, height: newH });
    };
    const onUp = () => {
      store.getState().commitLiveUpdate();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [element, zoom, store]);

  if (element.isHidden) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x || 0, top: element.y || 0,
        width: element.width || 200, height: element.height || 60,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: 'center center',
        cursor: element.isLocked ? 'default' : 'move',
        zIndex: element.zIndex || 0, opacity: element.opacity ?? 1,
        outline: isSelected ? '2px solid #3B82F6' : 'none',
        outlineOffset: 1, boxSizing: 'border-box',
      }}
      onMouseDown={handleMouseDown}
    >
      {element.type === 'text' && (
        <TextElement
          element={element} isSelected={isSelected} isEditing={editingId === element.id}
          onStartEdit={() => setEditingId(element.id)}
          onEndEdit={(text) => { store.getState().updateElement(element.id, { content: text }); setEditingId(null); }}
          zoom={zoom}
        />
      )}
      {element.type === 'image' && (
        <img src={element.src} alt="" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: element.objectFit || 'contain', borderRadius: element.borderRadius || 0, pointerEvents: 'none' }}
        />
      )}
      {element.type === 'shape' && <ShapeElement element={element} />}
      {element.type === 'qrcode' && (
        <img src={element.src} alt="QR" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      )}

      {isSelected && !element.isLocked && (
        ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(h => (
          <ResizeHandle key={h} position={h} onMouseDown={handleResizeMouseDown} />
        ))
      )}

      {element.isLocked && isSelected && (
        <div style={{ position: 'absolute', top: -16, right: 0, fontSize: 10, color: '#f59e0b', background: '#1f2937', padding: '1px 4px', borderRadius: 3 }}>🔒</div>
      )}
    </div>
  );
}

// ─── ADDITION 1: Module-level ref so certificateExport.js can grab the DOM node ───
// Export this function — certificateExport.js calls getCertificateCanvasElement()
// instead of document.getElementById() which never worked.
let _canvasNode = null;
export function getCertificateCanvasElement() {
  return _canvasNode;
}

export default function Canvas({ store, storeState, template, canvasRef: externalRef }) {
  // ─── ADDITION 2: internal ref that also writes to the module-level var ───
  const canvasWrapRef = useRef(null);
  const [editingId, setEditingId] = useState(null);

  // ─── ADDITION 3: callback ref that syncs to module var + optional external ref ───
  const setCanvasRef = useCallback((node) => {
    canvasWrapRef.current = node;
    _canvasNode = node;                          // ← makes getCertificateCanvasElement() work
    if (externalRef) externalRef.current = node; // ← optional forwarded ref from parent
  }, [externalRef]);

  const { elements, selectedElementIds, designConfig, zoom, showGrid } = storeState;

  const bgStyle = designConfig.backgroundGradient
    ? { background: designConfig.backgroundGradient }
    : { backgroundColor: designConfig.backgroundColor || '#FFFFFF' };

  const borderCSS = getBorderCSS(designConfig.borderStyle, designConfig.borderColor, designConfig.borderWidth);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasWrapRef.current || e.target.dataset.canvasBg) {
      store.getState().clearSelection();
      setEditingId(null);
    }
  }, [store]);

  const { width = 1050, height = 744 } = designConfig;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', flexShrink: 0 }}>
        <div
          ref={setCanvasRef}                   // ← CHANGED: was ref={canvasWrapRef}
          data-certificate-canvas="true"       // ← CHANGED: was data-canvas-bg="true"
          onClick={handleCanvasClick}
          style={{
            position: 'relative', width, height,
            ...bgStyle, ...borderCSS,
            boxSizing: 'border-box', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}
        >
          {showGrid && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 999,
              backgroundImage: `linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)`,
              backgroundSize: `${storeState.gridSize || 20}px ${storeState.gridSize || 20}px`,
            }} />
          )}

          {template?.previewVariant && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
              {getDecorationShapes(template.previewVariant)}
            </div>
          )}

          {[...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => (
            <CanvasElement
              key={el.id} element={el}
              isSelected={selectedElementIds.includes(el.id)}
              store={store} zoom={zoom} editingId={editingId} setEditingId={setEditingId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}