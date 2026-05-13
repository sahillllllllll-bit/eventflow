import React, { useState } from 'react';
import { ChevronLeft, Copy, Download, X, Edit2 } from 'lucide-react';

export default function AdvancedCertificatePreview({
  template,
  recipientName = 'John Doe',
  eventName = 'Sample Event',
  collegeName = 'Sample College',
  onSave,
  onBack,
  isEditing = true,
}) {
  const [positions, setPositions] = useState({
    logo: { top: 20, left: '50%', transform: 'translateX(-50%)' },
    heading: { top: 80, left: '50%', transform: 'translateX(-50%)' },
    subHeading: { top: 140, left: '50%', transform: 'translateX(-50%)' },
    recipientName: { top: 220, left: '50%', transform: 'translateX(-50%)' },
    description: { top: 300, left: '50%', transform: 'translateX(-50%)' },
    eventName: { top: 380, left: '50%', transform: 'translateX(-50%)' },
    collegeName: { top: 440, left: '50%', transform: 'translateX(-50%)' },
    signature: { top: 520, left: '50%', transform: 'translateX(-50%)' },
    footer: { top: 630, left: '50%', transform: 'translateX(-50%)' },
  });

  const [draggingElement, setDraggingElement] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    recipientName,
    eventName,
    collegeName,
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isLandscape = template.templateDesign === 'landscape';
  const containerWidth = isLandscape ? 1000 : 700;
  const containerHeight = isLandscape ? 700 : 950;

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const footerText = template.footerText?.replace('{date}', date) || date;

  const handleMouseDown = (element, e) => {
    if (!isEditing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingElement(element);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingElement || !isEditing) return;

    const container = document.getElementById('certificate-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    let newTop = e.clientY - containerRect.top - dragOffset.y;
    let newLeft = e.clientX - containerRect.left - dragOffset.x;

    // Constrain to container
    newTop = Math.max(0, Math.min(newTop, containerHeight - 50));
    newLeft = Math.max(0, Math.min(newLeft, containerWidth - 50));

    setPositions((prev) => ({
      ...prev,
      [draggingElement]: {
        top: newTop,
        left: newLeft,
        transform: 'none',
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    onSave({
      ...template,
      customData: {
        positions,
        recipientName: editValues.recipientName,
        eventName: editValues.eventName,
        collegeName: editValues.collegeName,
      },
    });
    setEditingField(null);
  };

  const EditModal = ({ field, label, value }) => {
    if (editingField !== field) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold mb-4">{label}</h3>
          <textarea
            value={editValues[field]}
            onChange={(e) => handleEditChange(field, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditingField(null)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DraggableElement = ({ id, children, className = '' }) => (
    <div
      onMouseDown={(e) => handleMouseDown(id, e)}
      style={{
        position: 'absolute',
        ...positions[id],
        cursor: isEditing ? 'move' : 'default',
      }}
      className={`${isEditing ? 'border-2 border-dashed border-blue-400 bg-blue-50/50 p-2' : ''} ${className}`}
    >
      {children}
    </div>
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Certificate Preview</h2>
            {isEditing && (
              <p className="text-sm text-gray-600">Drag elements to reposition • Click to edit text</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Back
            </button>
          )}
          {onSave && (
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save & Continue
            </button>
          )}
        </div>
      </div>

      {/* Edit Controls */}
      {isEditing && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Quick Edit</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setEditingField('recipientName')}
              className="p-3 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm font-medium"
            >
              <Edit2 size={16} className="inline mr-2" />
              Recipient Name
            </button>
            <button
              onClick={() => setEditingField('collegeName')}
              className="p-3 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm font-medium"
            >
              <Edit2 size={16} className="inline mr-2" />
              College Name
            </button>
            <button
              onClick={() => setEditingField('eventName')}
              className="p-3 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm font-medium"
            >
              <Edit2 size={16} className="inline mr-2" />
              Event Name
            </button>
          </div>
        </div>
      )}

      {/* Certificate Preview Container */}
      <div className="flex justify-center overflow-auto bg-gray-100 p-8 rounded-lg">
        <div
          id="certificate-container"
          style={{
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
            backgroundColor: template.backgroundColor,
            backgroundImage:
              template.backgroundColor?.startsWith('linear-gradient') ? template.backgroundColor : 'none',
            position: 'relative',
            overflow: 'hidden',
            borderStyle: template.borderStyle !== 'none' ? 'solid' : 'none',
            ...(template.borderStyle === 'simple' && {
              border: `3px solid ${template.borderColor}`,
            }),
            ...(template.borderStyle === 'elegant' && {
              border: `8px double ${template.borderColor}`,
              boxShadow: `inset 0 0 0 2px ${template.borderColor}`,
            }),
            ...(template.borderStyle === 'modern' && {
              borderTop: `4px solid ${template.borderColor}`,
              borderBottom: `4px solid ${template.borderColor}`,
            }),
          }}
          className="shadow-2xl"
        >
          {/* Logo */}
          {template.logo && (
            <DraggableElement id="logo">
              <img
                src={template.logo}
                alt="Logo"
                style={{
                  width: `${template.logoWidth}px`,
                  height: `${template.logoHeight}px`,
                  objectFit: 'contain',
                }}
                className="rounded-md"
              />
            </DraggableElement>
          )}

          {/* Main Heading */}
          <DraggableElement id="heading" className="max-w-2xl text-center">
            <h1
              style={{
                fontSize: `${template.headingFontSize}px`,
                color: template.headingColor,
                fontWeight: 'bold',
                fontFamily: 'Georgia, serif',
              }}
            >
              {template.heading}
            </h1>
          </DraggableElement>

          {/* Sub Heading */}
          <DraggableElement id="subHeading" className="max-w-2xl text-center">
            <p
              style={{
                fontSize: `${template.subHeadingFontSize}px`,
                color: template.descriptionColor,
                fontFamily: 'Georgia, serif',
              }}
            >
              {template.subHeading}
            </p>
          </DraggableElement>

          {/* Recipient Name */}
          <DraggableElement
            id="recipientName"
            className="max-w-2xl text-center cursor-pointer hover:bg-yellow-100/50"
            onClick={() => isEditing && setEditingField('recipientName')}
          >
            <p
              style={{
                fontSize: `${template.recipientNameFontSize}px`,
                color: template.recipientNameColor,
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontFamily: 'Georgia, serif',
                minWidth: '300px',
              }}
            >
              {editValues.recipientName}
            </p>
          </DraggableElement>

          {/* Description */}
          <DraggableElement id="description" className="max-w-2xl text-center">
            <p
              style={{
                fontSize: `${template.descriptionFontSize}px`,
                color: template.descriptionColor,
                fontFamily: 'Georgia, serif',
              }}
            >
              {template.descriptionText}
            </p>
          </DraggableElement>

          {/* Event Name */}
          <DraggableElement
            id="eventName"
            className="max-w-2xl text-center cursor-pointer hover:bg-yellow-100/50"
            onClick={() => isEditing && setEditingField('eventName')}
          >
            <p
              style={{
                fontSize: `${template.descriptionFontSize}px`,
                color: template.accentColor,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
              }}
            >
              {editValues.eventName}
            </p>
          </DraggableElement>

          {/* College Name */}
          <DraggableElement
            id="collegeName"
            className="max-w-2xl text-center cursor-pointer hover:bg-yellow-100/50"
            onClick={() => isEditing && setEditingField('collegeName')}
          >
            <p
              style={{
                fontSize: `${template.descriptionFontSize}px`,
                color: template.accentColor,
                fontFamily: 'Georgia, serif',
                fontWeight: '500',
              }}
            >
              {editValues.collegeName}
            </p>
          </DraggableElement>

          {/* Signature Section */}
          {template.organizerSignature && (
            <DraggableElement id="signature" className="text-center">
              <img
                src={template.organizerSignature}
                alt="Signature"
                style={{
                  height: '50px',
                  objectFit: 'contain',
                }}
              />
            </DraggableElement>
          )}

          {/* Footer */}
          <DraggableElement id="footer" className="text-center">
            <p
              style={{
                fontSize: `${template.footerFontSize}px`,
                color: template.footerColor,
                fontFamily: 'Georgia, serif',
              }}
            >
              {footerText}
            </p>
          </DraggableElement>
        </div>
      </div>

      {/* Edit Modals */}
      <EditModal field="recipientName" label="Edit Recipient Name" value={editValues.recipientName} />
      <EditModal field="collegeName" label="Edit College Name" value={editValues.collegeName} />
      <EditModal field="eventName" label="Edit Event Name" value={editValues.eventName} />
    </div>
  );
}
