import React, { useState } from 'react';
import { Trash2, Edit2, Copy, Plus, GripVertical } from 'lucide-react';
import FormSection from './FormSection.jsx';
import Modal from './Modal.jsx';

const FormBuilder = ({ sections, onSectionsChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const fieldTypes = [
    { type: 'text', label: 'Short Text' },
    { type: 'email', label: 'Email' },
    { type: 'phone', label: 'Phone Number' },
    { type: 'textarea', label: 'Long Text' },
    { type: 'dropdown', label: 'Dropdown' },
    { type: 'radio', label: 'Radio Buttons' },
    { type: 'checkbox', label: 'Checkboxes' },
    { type: 'file', label: 'File Upload' },
    { type: 'heading', label: 'Section Heading' },
    { type: 'divider', label: 'Divider Line' },
    { type: 'google_map', label: 'Google Maps' },
  ];

  const addSection = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type,
      label: fieldTypes.find(f => f.type === type)?.label || type,
      placeholder: '',
      required: type !== 'heading' && type !== 'divider',
      options: type === 'radio' || type === 'dropdown' || type === 'checkbox' ? ['Option 1', 'Option 2'] : [],
      order: sections.length,
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (id, data) => {
    onSectionsChange(
      sections.map(s => (s.id === id ? { ...s, ...data } : s))
    );
    setEditingId(null);
    setEditData(null);
  };

  const deleteSection = (id) => {
    onSectionsChange(sections.filter(s => s.id !== id));
  };

  const duplicateSection = (section) => {
    const newSection = {
      ...section,
      id: Date.now().toString(),
      order: sections.length,
    };
    onSectionsChange([...sections, newSection]);
  };

  const moveSection = (fromIndex, toIndex) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);
    onSectionsChange(newSections.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Toolbox */}
      <div className="col-span-1 bg-surface-raised border border-border rounded-xl p-6 overflow-y-auto">
        <h3 className="font-semibold mb-4 text-white">Add Fields</h3>
        <div className="grid grid-cols-2 gap-3">
          {fieldTypes.map(field => (
            <button
              key={field.type}
              onClick={() => addSection(field.type)}
              className="p-3 bg-surface-overlay border border-border rounded-lg hover:border-brand hover:bg-brand/5 transition text-xs font-medium text-gray-300 hover:text-brand text-center"
            >
              {field.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview & Editor */}
      <div className="col-span-2 space-y-4 overflow-y-auto max-h-96">
        {/* Locked Fields */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Required Fields</h3>
          <div className="space-y-3 opacity-75">
            {[
              { label: 'Full Name', type: 'text' },
              { label: 'Email Address', type: 'email' },
              { label: 'Phone Number', type: 'phone' },
            ].map((field, i) => (
              <div key={i} className="p-3 bg-surface-overlay border border-border/50 rounded-lg">
                <p className="text-sm font-medium text-gray-300">{field.label}</p>
                <p className="text-xs text-gray-500 mt-1">Field is locked and required</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Sections */}
        {sections.length > 0 && (
          <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Custom Fields</h3>
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDraggedId(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId !== null && draggedId !== index) {
                    moveSection(draggedId, index);
                    setDraggedId(null);
                  }
                }}
                className={`p-4 border rounded-lg bg-surface-overlay transition-all ${
                  draggedId === index ? 'opacity-50' : 'opacity-100'
                } ${editingId === section.id ? 'border-brand' : 'border-border'}`}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-gray-500 mt-1 cursor-grab active:cursor-grabbing" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{section.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{section.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(section.id);
                        setEditData(section);
                      }}
                      className="p-2 hover:bg-brand/20 rounded-lg transition text-gray-400 hover:text-brand"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateSection(section)}
                      className="p-2 hover:bg-brand/20 rounded-lg transition text-gray-400 hover:text-brand"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="bg-surface-raised border border-border/50 rounded-xl p-4 opacity-75">
          <div className="flex items-start gap-3">
            <input type="checkbox" className="mt-1" defaultChecked disabled />
            <div>
              <p className="text-sm font-medium text-gray-300">Allow promo emails</p>
              <p className="text-xs text-gray-500 mt-1">Auto-added for attendee consent tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingId && editData && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingId(null);
            setEditData(null);
          }}
          title={`Edit ${editData.label}`}
        >
          <FormSection
            section={editData}
            onChange={(updated) => updateSection(editingId, updated)}
            onClose={() => {
              setEditingId(null);
              setEditData(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default FormBuilder;
