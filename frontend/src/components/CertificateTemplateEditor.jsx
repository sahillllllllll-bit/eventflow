import React from 'react';
import CanvaCertificateEditor from './CanvaCertificateEditor';

/**
 * Certificate Template Editor
 * 
 * This is now a wrapper around the production-grade
 * Canva-style editor built with Fabric.js
 * 
 * Features:
 * - Click to select any element
 * - Drag and resize with handles
 * - Rotate objects
 * - Edit text inline
 * - Upload images/logos
 * - Advanced styling controls
 * - Layer management
 * - Position and dimension controls
 * - Real-time preview
 * - Full customization
 */

export default function CertificateTemplateEditor({
  template,
  event,
  registrationCount,
  onSave,
  onBack,
  isLoading,
}) {
  // Simply pass through to the new Canva-style editor
  return (
    <CanvaCertificateEditor
      template={template}
      event={event}
      registrationCount={registrationCount}
      onSave={onSave}
      onBack={onBack}
      isLoading={isLoading}
    />
  );
}
