import React from 'react';

export default function CertificatePreview({ template, recipientName = 'Sample Name', eventName = 'Sample Event' }) {
  const borderStyles = {
    none: 'border: none;',
    simple: `border: 3px solid ${template.borderColor};`,
    elegant: `border: 8px double ${template.borderColor}; box-shadow: inset 0 0 0 2px ${template.borderColor};`,
    modern: `border-top: 4px solid ${template.borderColor}; border-bottom: 4px solid ${template.borderColor};`,
  };

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const footerText = template.footerText?.replace('{date}', date) || date;

  const isLandscape = template.templateDesign === 'landscape';

  return (
    <div
      style={{
        width: isLandscape ? '1000px' : '700px',
        height: isLandscape ? '700px' : '950px',
        backgroundColor: template.backgroundColor,
        ...(() => {
          try {
            return {
              borderStyle: template.borderStyle,
              ...(template.borderStyle === 'none' && {}),
              ...(template.borderStyle === 'simple' && { border: `3px solid ${template.borderColor}` }),
              ...(template.borderStyle === 'elegant' && {
                border: `8px double ${template.borderColor}`,
                boxShadow: `inset 0 0 0 2px ${template.borderColor}`,
              }),
              ...(template.borderStyle === 'modern' && {
                borderTop: `4px solid ${template.borderColor}`,
                borderBottom: `4px solid ${template.borderColor}`,
              }),
            };
          } catch {
            return {};
          }
        })(),
      }}
      className="mx-auto p-12 flex flex-col justify-center items-center relative shadow-2xl"
    >
      {/* Logo */}
      {template.logo && (
        <img
          src={template.logo}
          alt="Logo"
          style={{
            width: `${template.logoWidth}px`,
            height: `${template.logoHeight}px`,
            marginBottom: '20px',
            objectFit: 'contain',
          }}
          className="rounded-md"
        />
      )}

      {/* Main Heading */}
      <h1
        style={{
          fontSize: `${template.headingFontSize}px`,
          color: template.headingColor,
          fontWeight: 'bold',
          margin: '15px 0',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {template.heading}
      </h1>

      {/* Sub Heading */}
      <p
        style={{
          fontSize: `${template.subHeadingFontSize}px`,
          color: template.descriptionColor,
          margin: '15px 0',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {template.subHeading}
      </p>

      {/* Recipient Name */}
      <p
        style={{
          fontSize: `${template.recipientNameFontSize}px`,
          color: template.recipientNameColor,
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
          fontSize: `${template.descriptionFontSize}px`,
          color: template.descriptionColor,
          margin: '15px 0',
          textAlign: 'center',
          maxWidth: '800px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {template.descriptionText}
      </p>

      {/* Event Name */}
      <p
        style={{
          fontSize: `${template.descriptionFontSize}px`,
          fontStyle: 'italic',
          color: template.accentColor,
          margin: '10px 0',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        {eventName}
      </p>

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
              borderTop: `2px solid ${template.descriptionColor}`,
              marginTop: '8px',
              paddingTop: '5px',
              fontSize: '14px',
              color: template.descriptionColor,
              fontFamily: 'Georgia, serif',
              minWidth: '200px',
            }}
          >
            {template.organizerName || 'Event Organizer'}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: template.descriptionColor,
              marginTop: '5px',
              fontFamily: 'Georgia, serif',
            }}
          >
            Organizer
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: `${template.footerFontSize}px`,
          color: template.footerColor,
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
          color: template.footerColor,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Cert ID: SAMPLE123
      </div>
    </div>
  );
}
