import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Edit2,
} from 'lucide-react';

/**
 * Layer Panel Component
 * Manage layers, reorder, lock, visibility, rename
 */
export default function LayerPanel({ store, elements, selectedIds }) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleStartRename = (element) => {
    setRenamingId(element.id);
    setRenameValue(element.name || `${element.type} ${element.id.slice(-4)}`);
  };

  const handleRename = (elementId) => {
    store.updateElement(elementId, { name: renameValue });
    setRenamingId(null);
  };

  const getElementLabel = (element) => {
    if (element.name) return element.name;
    if (element.type === 'text') return `Text: "${element.content?.slice(0, 20)}..."`;
    if (element.type === 'image') return 'Image';
    if (element.type === 'shape') return `${element.shapeType || 'Shape'}`;
    return `${element.type}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No elements yet. Add some!
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Reverse order for display (last added on top) */}
            {[...elements].reverse().map((element) => (
              <div
                key={element.id}
                className={`p-2 rounded border transition ${
                  selectedIds.includes(element.id)
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {renamingId === element.id ? (
                  <div className="flex gap-1 mb-2">
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(element.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(element.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-xs"
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="cursor-pointer mb-1 text-xs truncate"
                      onClick={() => store.selectElement(element.id)}
                      onDoubleClick={() => handleStartRename(element)}
                    >
                      {getElementLabel(element)}
                    </div>

                    <div className="flex gap-1 text-xs">
                      {/* Lock Toggle */}
                      <button
                        onClick={() => store.toggleLock(element.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition"
                        title={element.isLocked ? 'Unlock' : 'Lock'}
                      >
                        {element.isLocked ? (
                          <Lock size={12} />
                        ) : (
                          <Unlock size={12} />
                        )}
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        onClick={() => store.toggleVisibility(element.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition"
                        title={element.isHidden ? 'Show' : 'Hide'}
                      >
                        {element.isHidden ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => store.duplicateElement(element.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition"
                        title="Duplicate"
                      >
                        <Copy size={12} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => store.deleteElement(element.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Layer Ordering */}
                    <div className="flex gap-1 text-xs mt-1">
                      <button
                        onClick={() => store.bringForward(element.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition"
                        title="Bring forward"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => store.sendBackward(element.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition"
                        title="Send backward"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
        <div>{elements.length} element{elements.length !== 1 ? 's' : ''}</div>
        <div>{selectedIds.length} selected</div>
      </div>
    </div>
  );
}
