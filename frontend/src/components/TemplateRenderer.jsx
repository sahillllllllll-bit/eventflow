import React from 'react';

/**
 * Shared Template Renderer Component
 * Renders certificate templates with full fidelity for both preview and editor
 * Supports: decorations, styling, typography, borders, backgrounds, and overlays
 */

export const getDecorationShapes = (variant) => {
  const decorations = {
    1: (
      <>
        <div className="absolute top-4 left-4 w-16 h-16 bg-blue-900 rounded-br-3xl" />
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-yellow-400 rounded-tl-3xl" />
        <div className="absolute top-6 right-6 w-20 h-4 bg-yellow-400 rounded-full opacity-90" />
      </>
    ),
    2: (
      <>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-20 h-20 rounded-br-full bg-yellow-500 opacity-80" />
          <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full bg-yellow-400 opacity-80" />
          <div className="absolute top-4 left-4 w-14 h-14 rounded-full border-4 border-yellow-300 shadow-xl" />
        </div>
      </>
    ),
    3: (
      <>
        <div className="absolute inset-y-0 left-0 w-24 bg-emerald-700 opacity-90" />
        <div className="absolute top-6 left-8 w-16 h-16 rounded-full bg-yellow-400 shadow-lg" />
      </>
    ),
    4: (
      <>
        <div className="absolute top-4 left-4 w-16 h-16 border border-rose-700 rounded-full opacity-40" />
        <div className="absolute top-4 right-4 w-16 h-16 border border-rose-700 rounded-full opacity-40" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-rose-700 rounded-full shadow-inner" />
      </>
    ),
    5: (
      <>
        <div className="absolute top-0 left-0 w-24 h-24 bg-red-800 skew-y-6" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 skew-y-12" />
        <div className="absolute right-8 top-12 w-16 h-16 bg-red-600 rounded-full border-4 border-yellow-300 shadow-lg" />
      </>
    ),
    6: (
      <>
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-bl-full shadow-lg" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300 rounded-tr-full shadow-lg" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-yellow-500 bg-yellow-100" />
      </>
    ),
    7: (
      <>
        <div className="absolute top-4 left-4 w-16 h-16 bg-violet-600 rounded-br-2xl" />
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-violet-500 rounded-tl-2xl" />
        <div className="absolute inset-x-14 top-0 h-1 bg-violet-300" />
      </>
    ),
    8: (
      <>
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-600 rounded-br-full opacity-80" />
        <div className="absolute bottom-0 right-0 w-32 h-28 bg-yellow-400 rounded-tl-full opacity-85" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-yellow-300 bg-yellow-200 shadow-xl" />
      </>
    ),
  };
  return decorations[variant] || null;
};

const getBorderStyle = (borderStyle, borderColor, borderWidth = 8) => {
  const styles = {
    simple: {
      border: `${borderWidth}px solid ${borderColor}`,
      boxShadow: 'none',
    },
    elegant: {
      border: `${borderWidth}px double ${borderColor}`,
      boxShadow: `inset 0 0 0 ${borderWidth - 4}px rgba(0,0,0,0.05)`,
    },
    thick: {
      border: `${borderWidth + 8}px solid ${borderColor}`,
      boxShadow: `0 0 20px rgba(0,0,0,0.15)`,
    },
    modern: {
      border: `${borderWidth - 2}px solid ${borderColor}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.1)`,
    },
    double: {
      border: `${borderWidth - 4}px double ${borderColor}`,
      boxShadow: `inset 0 0 0 3px ${borderColor}`,
    },
    shadow: {
      border: 'none',
      boxShadow: `0 0 30px rgba(0,0,0,0.2), inset 0 0 0 2px ${borderColor}`,
    },
  };
  return styles[borderStyle] || styles.simple;
};

const TemplateRenderer = ({
  template,
  variant,
  className = '',
  children,
  isEditable = false,
  onElementClick = null,
  selectedElementId = null,
  height = 'h-64',
}) => {
  const bgStyle = template?.backgroundColor?.includes('gradient')
    ? { background: template.backgroundColor }
    : { backgroundColor: template.backgroundColor || '#ffffff' };

  const borderStyle = getBorderStyle(
    template?.borderStyle || 'simple',
    template?.borderColor || '#000000'
  );

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${height} ${className}`}
      style={{
        ...bgStyle,
        ...borderStyle,
      }}
    >
      {/* Overlay - prevents interaction with decorations */}
      <div className="absolute inset-0 bg-white/0" />
      
      {/* Inner border frame */}
      <div className="absolute inset-0 border-2 border-white/20 rounded-lg pointer-events-none" />

      {/* Decorative shapes - locked background */}
      {variant && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {getDecorationShapes(variant)}
        </div>
      )}

      {/* Content area */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 py-5 text-center">
        {children ? (
          children
        ) : (
          <>
            <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
              Certificate
            </div>
            <div
              className="font-semibold text-lg md:text-xl mb-3"
              style={{
                color: template?.headingColor || '#000000',
                fontFamily: template?.recipientNameFontFamily || 'inherit',
              }}
            >
              {template?.heading || 'Certificate'}
            </div>
            <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] mb-4">
              {template?.subHeading || 'Presented To'}
            </div>
            <div
              className="text-2xl font-semibold mb-3"
              style={{
                color: template?.recipientNameColor || '#000000',
                fontFamily: template?.recipientNameFontFamily || 'Georgia, serif',
              }}
            >
              {template?.recipientName || 'Recipient Name'}
            </div>
            <div className="text-xs text-gray-500 leading-5 mx-auto max-w-[85%]">
              {template?.descriptionText || 'Description'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateRenderer;
