import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const FormSection = ({ section, onChange, onClose }) => {
  const [data, setData] = useState(section);

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    onChange(updated);
  };

  const addOption = () => {
    const newOptions = [...(data.options || []), `Option ${(data.options?.length || 0) + 1}`];
    handleChange('options', newOptions);
  };

  const updateOption = (index, value) => {
    const newOptions = [...data.options];
    newOptions[index] = value;
    handleChange('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = data.options.filter((_, i) => i !== index);
    handleChange('options', newOptions);
  };

  const needsOptions = ['radio', 'dropdown', 'checkbox'].includes(data.type);
  const isTextLike = ['text', 'email', 'phone', 'textarea'].includes(data.type);

  return (
    <div className="space-y-6">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Field Label</label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => handleChange('label', e.target.value)}
          className="w-full px-4 py-2 bg-surface-overlay border border-border rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
          placeholder="e.g., Which session are you interested in?"
        />
      </div>

      {/* Placeholder */}
      {isTextLike && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Placeholder Text</label>
          <input
            type="text"
            value={data.placeholder}
            onChange={(e) => handleChange('placeholder', e.target.value)}
            className="w-full px-4 py-2 bg-surface-overlay border border-border rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none"
            placeholder="Optional placeholder text"
          />
        </div>
      )}

      {/* Options */}
      {needsOptions && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-300">Options</label>
            <button
              onClick={addOption}
              className="flex items-center gap-1 px-3 py-1 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {data.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-surface-overlay border border-border rounded-lg text-white focus:ring-2 focus:ring-brand focus:border-transparent transition outline-none text-sm"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Toggle */}
      {!['heading', 'divider'].includes(data.type) && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="required"
            checked={data.required}
            onChange={(e) => handleChange('required', e.target.checked)}
            className="w-4 h-4 accent-brand rounded"
          />
          <label htmlFor="required" className="text-sm font-medium text-gray-300">
            Make this field required
          </label>
        </div>
      )}

      {/* Field Type Info */}
      <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-gray-300">Type:</span> {data.type}
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-surface-overlay hover:bg-surface-overlay/80 border border-border rounded-lg text-white font-medium transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default FormSection;
