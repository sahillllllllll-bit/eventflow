import React, { useRef, useState, useCallback, useEffect } from 'react';
import { getDecorationShapes } from '../TemplateRenderer';

const HANDLE_SIZE = 8;

function getBorderCSS(borderStyle, borderColor, borderWidth) {
  const w = borderWidth || 8;
  const c = borderColor || '#D4A574';
  switch (borderStyle) {
    case 'none':    return {};
    case 'simple':  return { border: `${w}px solid ${c}` };
    case 'double':  return { border: `${w}px double ${c}` };
    case 'elegant': return { border: `${w}px double ${c}`, boxShadow: `inset 0 0 0 3px ${c}33` };
    case 'thick':   return { border: `${w + 6}px solid ${c}`, boxShadow: `0 0 20px ${c}40` };
    case 'modern':  return { borderTop: `${w}px solid ${c}`, borderBottom: `${w}px solid ${c}` };
    case 'shadow':  return { boxShadow: `0 0 30px rgba(0,0,0,0.25), inset 0 0 0 2px ${c}` };
    default:        return { border: `${w}px solid ${c}` };
  }
}

function ResizeHandle({ position, onMouseDown }) {
  const cursors = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    w:  'w-resize',  e: 'e-resize',
    sw: 'sw-resize', s: 's-resize', se: 'se-resize',
  };
  const posStyles = {
    nw: { top: -4, left: -4 },
    n:  { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    w:  { top: '50%', left: -4, transform: 'translateY(-50%)' },
    e:  { top: '50%', right: -4, transform: 'translateY(-50%)' },
    sw: { bottom: -4, left: -4 },
    s:  { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    se: { bottom: -4, right: -4 },
  };
  return (
    <div
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, position); }}
      style={{
        position: 'absolute',
        width: HANDLE_SIZE, height: HANDLE_SIZE,
        background: '#3B82F6', border: '2px solid white', borderRadius: 2,
        cursor: cursors[position], zIndex: 1000,
        ...posStyles[position],
      }}
    />
  );
}

function TextElement({ element, isEditing, onStartEdit, onEndEdit }) {
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

  const justifyContent = element.align === 'left'
    ? 'flex-start'
    : element.align === 'right'
    ? 'flex-end'
    : 'center';

  return (
    <div
      style={{
        width: '100%', height: '100%',
        fontSize: element.fontSize || 24,
        color: element.color || '#333',
        fontFamily: element.fontFamily || 'Georgia, serif',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        textDecoration: element.textDecoration || 'none',
        textAlign: element.align || 'center',
        letterSpacing: element.letterSpacing || 0,
        lineHeight: element.lineHeight || 1.3,
        display: 'flex', alignItems: 'center', justifyContent,
        overflow: 'hidden',
        userSelect: isEditing ? 'text' : 'none',
        padding: '2px 4px',
        boxSizing: 'border-box',
      }}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
    >
      {isEditing ? (
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onEndEdit(e.currentTarget.innerText)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onEndEdit(e.currentTarget.innerText);
            e.stopPropagation();
          }}
          style={{
            outline: 'none', minWidth: 20, width: '100%',
            textAlign: element.align || 'center',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {element.content}
        </div>
      ) : (
        <span style={{
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          width: '100%', textAlign: element.align || 'center',
        }}>
          {element.content}
        </span>
      )}
    </div>
  );
}

function ShapeElement({ element }) {
  const { shapeType, fillColor, strokeColor, strokeWidth = 2, width = 100, height = 100 } = element;

  // ── FIX: treat 'transparent' fillColor correctly in SVG ──────────────────
  const fill = (!fillColor || fillColor === 'transparent') ? 'none' : fillColor;
  const stroke = (!strokeColor || strokeColor === 'transparent') ? 'none' : strokeColor;

  if (shapeType === 'circle') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <ellipse cx={width / 2} cy={height / 2}
          rx={Math.max(1, width / 2 - strokeWidth)}
          ry={Math.max(1, height / 2 - strokeWidth)}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  if (shapeType === 'line') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2}
          stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  if (shapeType === 'triangle') {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polygon points={`${width / 2},0 ${width},${height} 0,${height}`}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  // rectangle (default)
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <rect x={strokeWidth / 2} y={strokeWidth / 2}
        width={Math.max(0, width - strokeWidth)}
        height={Math.max(0, height - strokeWidth)}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}

// ── Helper: is this element visually transparent (no solid fill)? ────────────
// Used to decide whether clicks should pass through to layers below.
function isTransparentElement(element) {
  if (element.type !== 'shape') return false;
  const fill = element.fillColor;
  return !fill || fill === 'transparent' || fill === 'none';
}

function CanvasElement({ element, isSelected, store, zoom, editingId, setEditingId, onClickThrough }) {
  const handleMouseDown = useCallback((e) => {
    if (element.isLocked) return;
    if (editingId === element.id) return;

    // ── FIX: if transparent AND not selected, let click fall through ─────────
    // Only allow interaction if the element is already selected OR has a fill
    if (isTransparentElement(element) && !isSelected) {
      // Don't call stopPropagation — let the event bubble to the canvas
      // which will then try to hit-test the next element
      onClickThrough && onClickThrough(e, element);
      return;
    }

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
  }, [element, zoom, store, editingId, isSelected, onClickThrough]);

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

  // ── FIX: transparent unselected shapes use pointer-events:none on their
  // inner content so SVG doesn't swallow mouse events, BUT the wrapper div
  // still needs to be clickable when selected (to allow drag/resize).
  const isTransparent = isTransparentElement(element);
  const pointerEventsStyle = isTransparent && !isSelected ? 'none' : 'auto';

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x || 0, top: element.y || 0,
        width: element.width || 200, height: element.height || 60,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: 'center center',
        // ── FIX: transparent unselected → pass pointer events through ────────
        pointerEvents: pointerEventsStyle,
        cursor: element.isLocked ? 'default' : (isTransparent && !isSelected ? 'default' : 'move'),
        zIndex: element.zIndex || 0,
        opacity: element.opacity ?? 1,
        outline: isSelected ? '2px solid #3B82F6' : 'none',
        outlineOffset: 1,
        boxSizing: 'border-box',
      }}
      onMouseDown={handleMouseDown}
    >
      {element.type === 'text' && (
        <TextElement
          element={element}
          isEditing={editingId === element.id}
          onStartEdit={() => setEditingId(element.id)}
          onEndEdit={(text) => {
            store.getState().updateElement(element.id, { content: text });
            setEditingId(null);
          }}
        />
      )}
      {(element.type === 'image') && (
        <img src={element.src} alt="" draggable={false} style={{
          width: '100%', height: '100%',
          objectFit: element.objectFit || 'contain',
          borderRadius: element.borderRadius || 0,
          pointerEvents: 'none',
        }} />
      )}
      {element.type === 'shape' && <ShapeElement element={element} />}
      {element.type === 'qrcode' && (
        <img src={element.src} alt="QR" draggable={false} style={{
          width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none',
        }} />
      )}

      {/* Resize handles — always shown when selected, use auto pointer events */}
      {isSelected && !element.isLocked && (
        ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(h => (
          <ResizeHandle key={h} position={h} onMouseDown={handleResizeMouseDown} />
        ))
      )}

      {element.isLocked && isSelected && (
        <div style={{
          position: 'absolute', top: -16, right: 0,
          fontSize: 10, color: '#f59e0b',
          background: '#1f2937', padding: '1px 4px', borderRadius: 3,
          pointerEvents: 'none',
        }}>🔒</div>
      )}
    </div>
  );
}

// Module-level ref for export service
let _canvasNode = null;
export function getCertificateCanvasElement() { return _canvasNode; }

export default function Canvas({ store, storeState, template, canvasRef: externalRef }) {
  const canvasWrapRef = useRef(null);
  const [editingId, setEditingId] = useState(null);

  const setRef = useCallback((node) => {
    canvasWrapRef.current = node;
    _canvasNode = node;
    if (externalRef) externalRef.current = node;
  }, [externalRef]);

  const { elements, selectedElementIds, designConfig, zoom, showGrid, gridSize } = storeState;
  const { width = 1050, height = 744 } = designConfig;

  const bgStyle = designConfig.backgroundGradient
    ? { background: designConfig.backgroundGradient }
    : { backgroundColor: designConfig.backgroundColor || '#FFFFFF' };

  const borderCSS = getBorderCSS(
    designConfig.borderStyle,
    designConfig.borderColor,
    designConfig.borderWidth,
  );

  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasWrapRef.current || e.target.dataset?.canvasBg) {
      store.getState().clearSelection();
      setEditingId(null);
    }
  }, [store]);

  // ── FIX: handle click-through from transparent elements ───────────────────
  // When a transparent element passes its click, we try to hit-test the
  // element directly below it (next lower zIndex at same position).
  const handleClickThrough = useCallback((e, transparentEl) => {
    const { elements: els } = store.getState();
    const rect = canvasWrapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top)  / zoom;

    // Find the topmost non-transparent element under the cursor (excluding the transparent one)
    const candidates = [...els]
      .filter(el => el.id !== transparentEl.id && !el.isHidden)
      .filter(el => {
        const x = el.x || 0, y = el.y || 0;
        const w = el.width || 200, h = el.height || 60;
        return canvasX >= x && canvasX <= x + w && canvasY >= y && canvasY <= y + h;
      })
      .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)); // highest zIndex first

    if (candidates.length > 0) {
      store.getState().selectElement(candidates[0].id, e.shiftKey);
    } else {
      store.getState().clearSelection();
    }
  }, [store, zoom]);

  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#111827',
    }}>
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', flexShrink: 0 }}>
        <div
          ref={setRef}
          data-certificate-canvas="true"
          onClick={handleCanvasClick}
          style={{
            position: 'relative', width, height,
            ...bgStyle, ...borderCSS,
            boxSizing: 'border-box', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Grid */}
          {showGrid && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 999,
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize || 20}px ${gridSize || 20}px`,
            }} />
          )}

          {/* Template decorations (background layer) */}
          {template?.previewVariant && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
              {getDecorationShapes(template.previewVariant)}
            </div>
          )}

          {/* Elements */}
          {sortedElements.map(el => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={selectedElementIds.includes(el.id)}
              store={store}
              zoom={zoom}
              editingId={editingId}
              setEditingId={setEditingId}
              onClickThrough={handleClickThrough}
            />
          ))}
        </div>
      </div>
    </div>
  );
}