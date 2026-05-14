import React from 'react';

/**
 * Selection Box Component
 * Shows bounding box for multiple selected elements
 */
export default function SelectionBox({ elements }) {
  if (elements.length === 0) return null;

  // Calculate bounding box
  const getBounds = () => {
    if (elements.length === 0) return null;

    let minX = 100, minY = 100, maxX = 0, maxY = 0;

    elements.forEach((el) => {
      if (!el) return;
      const x = el.x || 0;
      const y = el.y || 0;
      const w = el.width || 80;
      const h = el.height || 60;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const bounds = getBounds();
  if (!bounds) return null;

  return (
    <div
      className="absolute border-2 border-blue-400 border-dashed pointer-events-none"
      style={{
        left: `${bounds.x}%`,
        top: `${bounds.y}%`,
        width: `${bounds.width}%`,
        height: `${bounds.height}%`,
      }}
    />
  );
}
