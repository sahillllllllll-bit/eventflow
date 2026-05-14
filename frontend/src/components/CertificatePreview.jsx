import React from 'react';

export default function CertificatePreview({ template, recipientName = 'Sample Name', eventName = 'Sample Event' }) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const footerText = template.footerText?.replace('{date}', date) || date;
  const isLandscape = template.templateDesign === 'landscape';

  // Build background style
  const getBackgroundStyle = () => {
    if (template.backgroundColor?.includes('gradient')) {
      return { background: template.backgroundColor };
    }
    return { backgroundColor: template.backgroundColor || '#ffffff' };
  };

  // Build border style
  const getBorderStyle = () => {
    const borderColor = template.borderColor || '#000000';
    const borderStyle = template.borderStyle || 'elegant';

    switch (borderStyle) {
      case 'simple':
        return { border: `3px solid ${borderColor}` };
      case 'elegant':
        return { border: `8px double ${borderColor}`, boxShadow: `inset 0 0 0 2px ${borderColor}` };
      case 'modern':
        return { borderTop: `4px solid ${borderColor}`, borderBottom: `4px solid ${borderColor}` };
      default:
        return {};
    }
  };

  return (
    <div
      style={{
        width: isLandscape ? '1000px' : '700px',
        height: isLandscape ? '700px' : '950px',
        ...getBackgroundStyle(),
        ...getBorderStyle(),
      }}
      className="mx-auto p-12 flex flex-col justify-center items-center relative shadow-2xl"
    >
      {/* Logo */}
      {template.logo && (
        <img
          src={template.logo}
          alt="Logo"
          style={{
            width: `${template.logoWidth || 100}px`,
            height: `${template.logoHeight || 100}px`,
            marginBottom: '20px',
            objectFit: 'contain',
          }}
          className="rounded-md"
        />
      )}

      {/* Main Heading */}
      <h1
        style={{
          fontSize: `${template.headingFontSize || 48}px`,
          color: template.headingColor || '#000000',
          fontWeight: template.headingFontWeight || 'bold',
          margin: '15px 0',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {template.heading || 'Certificate'}
      </h1>

      {/* Sub Heading */}
      <p
        style={{
          fontSize: `${template.subHeadingFontSize || 22}px`,
          color: template.descriptionColor || '#666666',
          margin: '15px 0',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {template.subHeading || 'This is to certify that'}
      </p>

      {/* Recipient Name */}
      <p
        style={{
          fontSize: `${template.recipientNameFontSize || 36}px`,
          color: template.recipientNameColor || '#3B82F6',
          fontWeight: 'bold',
          margin: '25px 0',
          textDecoration: 'underline',
          textAlign: 'center',
          minWidth: '350px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {recipientName}
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: `${template.descriptionFontSize || 18}px`,
          color: template.descriptionColor || '#333333',
          margin: '15px 0',
          textAlign: 'center',
          maxWidth: '800px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {template.descriptionText || 'Has successfully completed'}
      </p>

      {/* Event Name */}
      {eventName && (
        <p
          style={{
            fontSize: `${(template.descriptionFontSize || 18) - 2}px`,
            fontStyle: 'italic',
            color: template.accentColor || '#3B82F6',
            margin: '10px 0',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
          }}
        >
          {eventName}
        </p>
      )}

      {/* Signature Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '50px',
          maxWidth: '600px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {template.organizerSignature && (
            <img
              src={template.organizerSignature}
              alt="Signature"
              style={{
                height: '50px',
                marginBottom: '8px',
                objectFit: 'contain',
              }}
            />
          )}
          <div
            style={{
              borderTop: `2px solid ${template.descriptionColor || '#333333'}`,
              marginTop: '8px',
              paddingTop: '5px',
              fontSize: '14px',
              color: template.descriptionColor || '#333333',
              fontFamily: 'Georgia, serif',
              minWidth: '200px',
            }}
          >
            {template.organizerName || 'Event Organizer'}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: template.descriptionColor || '#666666',
              marginTop: '5px',
              fontFamily: 'Georgia, serif',
            }}
          >
            Organizer/Director
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: `${template.footerFontSize || 12}px`,
          color: template.footerColor || '#666666',
          marginTop: '40px',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {footerText}
      </p>

      {/* Certificate ID */}
      <div
        style={{
          position: 'absolute',
          bottom: '15px',
          right: '20px',
          fontSize: '10px',
          color: template.footerColor || '#999999',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Cert ID: SAMPLE123
      </div>
    </div>
  );
}
