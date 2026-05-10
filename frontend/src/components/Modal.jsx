import React from 'react';

const Modal = ({ isOpen, title, children, onClose, actions }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-surface border border-surface-overlay rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-surface-overlay flex items-center justify-between">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-overlay rounded transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Actions */}
          {actions && (
            <div className="px-6 py-4 border-t border-surface-overlay flex gap-3 justify-end">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    action.variant === 'danger'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : action.variant === 'secondary'
                      ? 'bg-surface-overlay text-gray-300 hover:bg-surface-overlay/80'
                      : 'bg-brand hover:bg-brand-light text-white'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;
