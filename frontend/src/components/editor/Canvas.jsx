import React, { useRef, useEffect, useState, useCallback } from 'react';
import CanvasElement from './CanvasElement.jsx';
import SelectionBox from './SelectionBox.jsx';

/**
 * Main Canvas Component
 * Renders elements and handles drag-drop interactions
 */
export default function Canvas({ store, storeState, template }) {
  const canvasRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [rotating, setRotating] = useState(null);

  const { designConfig, elements, selectedElementIds, zoom, panX, panY } = storeState;

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return;
    
    // Click on empty canvas clears selection
    if (e.button === 0) {
      store.clearSelection();
    }
  }, [store]);

  const handleElementMouseDown = useCallback((e, elementId) => {
    e.stopPropagation();

    const element = store.getElement(elementId);
    if (!element || element.isLocked) return;

    const isMultiSelect = e.ctrlKey || e.metaKey;
    store.selectElement(elementId, isMultiSelect);

    if (e.button !== 0) return; // Only left-click for dragging

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setDraggingElement(elementId);
  }, [store]);

  const handleResizeStart = useCallback((e, elementId) => {
    e.stopPropagation();
    setDraggingElement(null);
    setResizing({
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      element: store.getElement(elementId),
    });
  }, [store]);

  const handleRotateStart = useCallback((e, elementId) => {
    e.stopPropagation();
    setDraggingElement(null);
    const element = store.getElement(elementId);
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    setRotating({
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      centerX: rect?.left + rect?.width / 2 || 0,
      centerY: rect?.top + rect?.height / 2 || 0,
      initialRotation: element?.rotation || 0,
    });
  }, [store]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingElement) {
        const element = store.getElement(draggingElement);
        if (!element) return;

        const deltaX = (e.clientX - dragStart.x) / (zoom * 10);
        const deltaY = (e.clientY - dragStart.y) / (zoom * 10);

        store.updateElement(draggingElement, {
          x: Math.max(0, Math.min(100, (element.x || 0) + deltaX)),
          y: Math.max(0, Math.min(100, (element.y || 0) + deltaY)),
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      }

      if (resizing) {
        const deltaX = (e.clientX - resizing.startX) / (zoom * 10);
        const deltaY = (e.clientY - resizing.startY) / (zoom * 10);

        store.updateElement(resizing.elementId, {
          width: Math.max(20, (resizing.element.width || 100) + deltaX),
          height: Math.max(20, (resizing.element.height || 100) + deltaY),
        });

        setResizing({
          ...resizing,
          startX: e.clientX,
          startY: e.clientY,
        });
      }

      if (rotating) {
        const angle = Math.atan2(
          e.clientY - rotating.centerY,
          e.clientX - rotating.centerX
        ) * (180 / Math.PI);

        store.updateElement(rotating.elementId, {
          rotation: (angle + 90) % 360,
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingElement(null);
      setResizing(null);
      setRotating(null);
    };

    if (draggingElement || resizing || rotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingElement, resizing, rotating, dragStart, store, zoom]);

  // Calculate canvas dimensions
  const canvasWidth = designConfig.width || 1050;
  const canvasHeight = designConfig.height || 744;
  const scaledWidth = canvasWidth * zoom;
  const scaledHeight = canvasHeight * zoom;

  // Build background style
  const getBackgroundStyle = () => {
    const bgColor = designConfig.backgroundColor || '#FFFFFF';
    return {
      background: bgColor,
    };
  };

  return (
    <div
      className="flex items-center justify-center w-full h-full bg-gray-950 relative overflow-auto"
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Grid Background */}
      {storeState.showGrid && (
        <svg
          className="absolute inset-0"
          width="100%"
          height="100%"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: `${storeState.gridSize * zoom}px ${storeState.gridSize * zoom}px`,
          }}
        />
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-white shadow-2xl"
        style={{
          width: scaledWidth,
          height: scaledHeight,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          backgroundColor: designConfig.backgroundColor || '#FFFFFF',
          border: `${designConfig.borderWidth}px solid ${designConfig.borderColor}`,
        }}
      >
        {/* Render all elements */}
        {elements.map((element) => (
          !element.isHidden && (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedElementIds.includes(element.id)}
              isDragging={draggingElement === element.id}
              onMouseDown={(e) => handleElementMouseDown(e, element.id)}
              onResizeStart={(e) => handleResizeStart(e, element.id)}
              onRotateStart={(e) => handleRotateStart(e, element.id)}
              onDoubleClick={() => {
                if (element.type === 'text') {
                  store.setTextEditing(element.id);
                }
              }}
            />
          )
        ))}

        {/* Selection Box for multiple selection */}
        {selectedElementIds.length > 0 && (
          <SelectionBox
            elements={selectedElementIds.map(id => store.getElement(id)).filter(Boolean)}
          />
        )}
      </div>

      {/* Hidden canvas for export */}
      <div
        id="certificate-export-canvas"
        className="absolute -left-full -top-full"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: designConfig.backgroundColor || '#FFFFFF',
          border: `${designConfig.borderWidth}px solid ${designConfig.borderColor}`,
        }}
      >
        {elements.map((element) => (
          !element.isHidden && (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={false}
              isDragging={false}
              onMouseDown={() => {}}
              onResizeStart={() => {}}
              onRotateStart={() => {}}
            />
          )
        ))}
      </div>
    </div>
  );
}
