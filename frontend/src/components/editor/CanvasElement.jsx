import React, { useRef } from 'react';
import { RotateCcw, Maximize2 } from 'lucide-react';

/**
 * Individual Canvas Element Component
 * Renders text, image, or shape elements with selection handles
 */
export default function CanvasElement({
  element,
  isSelected,
  isDragging,
  onMouseDown,
  onResizeStart,
  onRotateStart,
  onDoubleClick,
}) {
  const elementRef = useRef(null);

  const getElementStyle = () => {
    const base = {
      position: 'absolute',
      left: `${element.x || 0}%`,
      top: `${element.y || 0}%`,
      opacity: element.opacity ?? 1,
      cursor: 'move',
      transform: `rotate(${element.rotation || 0}deg)`,
    };

    if (element.type === 'text') {
      return {
        ...base,
        width: `${element.width || 80}%`,
        color: element.color || '#333333',
        fontSize: `${element.fontSize || 24}px`,
        fontFamily: element.fontFamily || 'Georgia, serif',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        textDecoration: element.textDecoration || 'none',
        textAlign: element.align || 'center',
        lineHeight: element.lineHeight || 1.2,
        letterSpacing: `${element.letterSpacing || 0}px`,
        textShadow: element.textShadow ? `${element.textShadow}` : 'none',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
      };
    }

    if (element.type === 'image') {
      return {
        ...base,
        width: `${element.width || 100}%`,
        height: `${element.height || 100}%`,
        overflow: 'hidden',
      };
    }

    if (element.type === 'shape') {
      return {
        ...base,
        width: `${element.width || 100}%`,
        height: `${element.height || 100}%`,
      };
    }

    return base;
  };

  const renderContent = () => {
    if (element.type === 'text') {
      return (
        <div
          className="w-full h-full flex items-center justify-center p-2"
          onDoubleClick={onDoubleClick}
        >
          {element.content}
        </div>
      );
    }

    if (element.type === 'image' && element.src) {
      return (
        <img
          src={element.src}
          alt="Canvas element"
          className="w-full h-full object-cover"
          style={{
            borderRadius: `${element.borderRadius || 0}px`,
          }}
        />
      );
    }

    if (element.type === 'shape') {
      return renderShape();
    }

    return null;
  };

  const renderShape = () => {
    const { shapeType, fillColor, strokeColor, strokeWidth } = element;

    if (shapeType === 'rectangle') {
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
          }}
        />
      );
    }

    if (shapeType === 'circle') {
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: fillColor,
            border: `${strokeWidth}px solid ${strokeColor}`,
            borderRadius: '50%',
          }}
        />
      );
    }

    if (shapeType === 'line') {
      return (
        <svg className="w-full h-full">
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="100%"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    return null;
  };

  return (
    <div
      ref={elementRef}
      data-element-id={element.id}
      className={`group ${isSelected ? 'z-50' : 'z-10'} ${isDragging ? 'opacity-75' : ''}`}
      style={getElementStyle()}
      onMouseDown={onMouseDown}
    >
      {/* Content */}
      <div className="w-full h-full">{renderContent()}</div>

      {/* Selection Box and Handles */}
      {isSelected && (
        <>
          {/* Border */}
          <div
            className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
            style={{ transform: `rotate(${-(element.rotation || 0)}deg)` }}
          />

          {/* Resize Handle - Bottom Right */}
          <button
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize rounded-sm transform translate-x-1.5 translate-y-1.5 hover:scale-125 transition z-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, element.id);
            }}
            style={{ pointerEvents: 'auto' }}
          />

          {/* Rotate Handle - Top Center */}
          <button
            className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 border border-white cursor-grab rounded-sm transform -translate-x-1.5 -translate-y-1.5 hover:scale-125 transition z-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              onRotateStart(e, element.id);
            }}
            style={{ pointerEvents: 'auto' }}
            title="Drag to rotate"
          />

          {/* Resize Handle - Bottom Left */}
          <button
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize rounded-sm transform -translate-x-1.5 translate-y-1.5 hover:scale-125 transition z-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, element.id);
            }}
            style={{ pointerEvents: 'auto' }}
          />

          {/* Resize Handle - Top Right */}
          <button
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize rounded-sm transform translate-x-1.5 -translate-y-1.5 hover:scale-125 transition z-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, element.id);
            }}
            style={{ pointerEvents: 'auto' }}
          />
        </>
      )}
    </div>
  );
}
