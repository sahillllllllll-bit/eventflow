import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Text Editor Popover Component
 * Advanced text editing interface
 */
export default function TextEditorPopover({ element, store, onClose }) {
  const [content, setContent] = useState(element.content || '');

  const handleSave = () => {
    store.updateElement(element.id, { content });
    onClose();
  };

  const handleInsertVariable = (variable) => {
    setContent(content + variable);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Edit Text</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Text Area */}
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            rows={6}
            placeholder="Enter text here..."
          />

          {/* Variables */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2">Insert Variables:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleInsertVariable('{{name}}')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              >
                {'{name}'}
              </button>
              <button
                onClick={() => handleInsertVariable('{{college}}')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              >
                {'{college}'}
              </button>
              <button
                onClick={() => handleInsertVariable('{{event}}')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              >
                {'{event}'}
              </button>
              <button
                onClick={() => handleInsertVariable('{{date}}')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              >
                {'{date}'}
              </button>
              <button
                onClick={() => handleInsertVariable('{{certificate_id}}')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              >
                {'{certificate_id}'}
              </button>
              <button
                onClick={() => handleInsertVariable('{{grade}}')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
              >
                {'{grade}'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2">Preview:</p>
            <div
              className="p-4 bg-gray-900 rounded border border-gray-700 text-sm"
              style={{
                color: element.color,
                fontSize: `${element.fontSize}px`,
                fontFamily: element.fontFamily,
                fontWeight: element.fontWeight,
                fontStyle: element.fontStyle,
                textAlign: element.align,
              }}
            >
              {content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
