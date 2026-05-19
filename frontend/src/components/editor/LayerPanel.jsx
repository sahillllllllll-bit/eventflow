import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Image, Square, QrCode, GripVertical } from 'lucide-react';

const typeIcon = (type) => {
  switch (type) {
    case 'text': return <Type size={12} />;
    case 'image': return <Image size={12} />;
    case 'shape': return <Square size={12} />;
    case 'qrcode': return <QrCode size={12} />;
    default: return <Square size={12} />;
  }
};

const typeLabel = (el) => {
  if (el.type === 'text') return el.content?.substring(0, 20) || 'Text';
  if (el.type === 'image') return 'Image';
  if (el.type === 'shape') return `Shape (${el.shapeType || 'rect'})`;
  if (el.type === 'qrcode') return 'QR Code';
  return el.type;
};

export default function LayerPanel({ store, elements, selectedIds }) {
  // Render in reverse so top layers are at top of list
  const layersReversed = [...elements].reverse();

  return (
    <div className="flex-1 overflow-y-auto">
      {layersReversed.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-xs mt-4">
          No layers yet. Add elements from Tools tab.
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {layersReversed.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onClick={() => store.getState().selectElement(el.id)}
                className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition group ${
                  isSelected
                    ? 'bg-blue-600/30 border border-blue-500/50'
                    : 'hover:bg-gray-700 border border-transparent'
                }`}
              >
                <GripVertical size={12} className="text-gray-600 flex-shrink-0" />
                <span className={`flex-shrink-0 ${el.isHidden ? 'opacity-30' : 'text-gray-400'}`}>
                  {typeIcon(el.type)}
                </span>
                <span className={`flex-1 text-xs truncate ${el.isHidden ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                  {typeLabel(el)}
                </span>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); store.getState().toggleVisibility(el.id); }}
                    className="p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition"
                    title={el.isHidden ? 'Show' : 'Hide'}
                  >
                    {el.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); store.getState().toggleLock(el.id); }}
                    className={`p-0.5 rounded hover:bg-gray-600 transition ${el.isLocked ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}
                    title={el.isLocked ? 'Unlock' : 'Lock'}
                  >
                    {el.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); store.getState().deleteElement(el.id); }}
                    className="p-0.5 rounded hover:bg-red-900 text-gray-400 hover:text-red-400 transition"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}