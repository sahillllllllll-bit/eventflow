import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificateAPI } from '../api/endpoints.js';
import useToast from '../hooks/useToast.jsx';
import CanvasCertificateEditor from '../components/CanvasCertificateEditor.jsx';
import Sidebar from '../components/Sidebar.jsx';

/**
 * EXAMPLE: Integration of the new Canva-style certificate editor
 * This shows how to replace the old editor with the new one
 * 
 * Key changes from old implementation:
 * 1. Use CanvasCertificateEditor instead of CertificateCanvasEditorV2
 * 2. Pass template with new structure
 * 3. Handle editorState which includes customElements and designConfig
 * 4. Template structure now supports all editor features
 */

export default function CertificatePage() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  // State management
  const [step, setStep] = useState(1); // 1: Select Event, 2: Edit Template, 3: Preview
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [template, setTemplate] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await certificateAPI.getOrganizerEvents();
      setEvents(response.data);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = async (event) => {
    try {
      setIsLoading(true);
      setSelectedEvent(event);

      // Get registrations for the event
      const registrationsResponse = await certificateAPI.getEventRegistrations(event._id);
      setRegistrations(registrationsResponse.data);

      // Get or create template
      let templateData = null;
      try {
        const response = await certificateAPI.getTemplate(event._id);
        templateData = response.data;
      } catch (error) {
        // Template doesn't exist, create default
        templateData = {
          eventId: event._id,
          templateName: event.eventName,
          backgroundColor: '#FFFFFF',
          borderStyle: 'elegant',
          borderColor: '#D4A574',
          borderWidth: 8,
          width: 1050,
          height: 744,
          customElements: [
            {
              id: 'title',
              type: 'text',
              content: 'Certificate of Achievement',
              x: 50,
              y: 15,
              fontSize: 52,
              color: '#1a472a',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              align: 'center',
              width: 90,
            },
            {
              id: 'name',
              type: 'text',
              content: '{{name}}',
              x: 50,
              y: 50,
              fontSize: 40,
              color: '#D4A574',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              fontStyle: 'italic',
              align: 'center',
              width: 90,
              textDecoration: 'underline',
            },
            {
              id: 'description',
              type: 'text',
              content: 'has successfully completed the {{event}}',
              x: 50,
              y: 65,
              fontSize: 18,
              color: '#333333',
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              align: 'center',
              width: 85,
            },
            {
              id: 'date',
              type: 'text',
              content: 'Date: {{date}}',
              x: 50,
              y: 85,
              fontSize: 14,
              color: '#666666',
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              align: 'center',
              width: 90,
            },
          ],
        };
      }

      setTemplate(templateData);
      setStep(2); // Move to editor
    } catch (error) {
      showToast('Failed to load template', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle template save from the editor
   * The editorState includes:
   * - designConfig: background, borders, canvas size
   * - customElements: all editor elements
   */
  const handleSaveTemplate = async (editorState) => {
    try {
      setIsLoading(true);

      const templateData = {
        ...template,
        ...editorState.designConfig,
        customElements: editorState.customElements,
        lastModified: new Date().toISOString(),
      };

      // Save to backend
      const response = await certificateAPI.saveTemplate(templateData);

      setTemplate(response.data);
      showToast('Certificate template saved successfully!', 'success');

      // Move to next step (preview/generate)
      setStep(3);
    } catch (error) {
      showToast(
        error.response?.data?.error || 'Failed to save template',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setTemplate(null);
      setSelectedEvent(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  // Step 1: Select Event
  if (step === 1) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold">Certificate Designer</h1>
              <p className="text-gray-600 mt-1">
                Select an event to design its certificate template
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No events found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
                    onClick={() => handleSelectEvent(event)}
                  >
                    <h3 className="text-lg font-semibold">{event.eventName}</h3>
                    <p className="text-gray-600 text-sm mt-2">{event.description}</p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        {event.registrations?.length || 0} registered
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Toast notifications */}
          <div className="fixed bottom-4 right-4 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`px-4 py-3 rounded-lg text-white ${
                  toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Edit Template with NEW EDITOR
  if (step === 2 && template) {
    return (
      <CanvasCertificateEditor
        template={template}
        onSave={handleSaveTemplate}
        onBack={handleBack}
        isLoading={isLoading}
        registrationCount={registrations.length}
      />
    );
  }

  // Step 3: Preview and Generate (you can implement this)
  if (step === 3) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b p-4">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:text-blue-700 mb-2"
            >
              ← Back to Editor
            </button>
            <h1 className="text-2xl font-bold">Generate Certificates</h1>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">
                Ready to generate {registrations.length} certificates?
              </h2>

              <button
                onClick={() => {
                  // Call API to generate certificates
                  showToast('Certificate generation started!', 'success');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generate All Certificates
              </button>

              {/* Show preview of one certificate */}
              {template && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Preview</h3>
                  <div
                    className="border bg-white rounded shadow"
                    style={{
                      width: '800px',
                      height: '566px',
                      backgroundColor: template.backgroundColor,
                      margin: '0 auto',
                    }}
                  >
                    {/* Render template here */}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * API INTEGRATION NOTES
 * 
 * Make sure your backend has these endpoints:
 * 
 * 1. GET /api/certificates/events/:userId
 *    Returns array of events organized by user
 * 
 * 2. GET /api/certificates/events/:eventId/registrations
 *    Returns registrations for event
 * 
 * 3. GET /api/certificates/templates/:eventId
 *    Returns template for event
 *    (404 if not exists - handle gracefully)
 * 
 * 4. POST /api/certificates/templates
 *    Saves or updates template
 *    Body: {
 *      eventId: string,
 *      templateName: string,
 *      backgroundColor: string,
 *      borderStyle: string,
 *      borderColor: string,
 *      borderWidth: number,
 *      width: number,
 *      height: number,
 *      customElements: array
 *    }
 * 
 * 5. POST /api/certificates/generate
 *    Generate certificates for all registrations
 *    Body: {
 *      eventId: string,
 *      templateId: string,
 *      format: 'pdf' | 'png' | 'jpg'
 *    }
 * 
 * 6. POST /api/certificates/generate-bulk
 *    Generate from CSV
 *    Body: {
 *      templateId: string,
 *      csvData: string,
 *      format: string
 *    }
 */
