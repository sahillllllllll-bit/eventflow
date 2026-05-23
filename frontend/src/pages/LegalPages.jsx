import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PageWrapper = ({ title, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-10 sm:py-16">
      
      <div className="max-w-4xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-[#12042d] hover:bg-[#1a0640] transition-all text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            {title}
          </h1>

          <div className="mt-4 h-[2px] w-24 sm:w-32 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" />
        </div>

        {/* Content */}
        <div className="bg-[#0d0225] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl">

          <div className="space-y-5 sm:space-y-6 text-gray-300 leading-7 sm:leading-8 text-sm sm:text-[15px] md:text-base">

            {children}

          </div>

        </div>

      </div>
    </div>
  );
};

// ================= PRIVACY POLICY =================

export const PrivacyPolicyPage = () => {
  return (
    <PageWrapper title="Privacy Policy">

      <p>
        EventGlow respects your privacy and is committed to protecting your
        personal information.
      </p>

      <p>
        We may collect information such as your name, email address,
        registration details, and event participation data to provide
        event-related services.
      </p>

      <p>
        Your information is used only for:
      </p>

      <ul className="list-disc pl-5 sm:pl-6 space-y-2">
        <li>Event registrations</li>
        <li>Communication regarding events</li>
        <li>Certificates and participation tracking</li>
        <li>Platform improvements and analytics</li>
      </ul>

      <p>
        We do not sell or share your personal information with unauthorized
        third parties.
      </p>

      <p>
        By using EventGlow, you agree to the collection and usage of
        information as described in this policy.
      </p>

    </PageWrapper>
  );
};

// ================= TERMS =================

export const TermsPage = () => {
  return (
    <PageWrapper title="Terms & Conditions">

      <p>
        By accessing and using EventGlow, you agree to comply with all platform
        policies and applicable laws.
      </p>

      <p>
        Event organizers are responsible for the accuracy of event details,
        schedules, pricing, and communication.
      </p>

      <p>
        Users must not misuse the platform for fraudulent activities,
        unauthorized access, or harmful actions.
      </p>

      <p>
        EventGlow reserves the right to suspend accounts or remove content
        violating platform policies.
      </p>

      <p>
        We may update these terms periodically without prior notice.
      </p>

    </PageWrapper>
  );
};

// ================= CONTACT =================

export const ContactPage = () => {
  return (
    <PageWrapper title="Contact Us">

      <p>
        Have questions, suggestions, or issues?
      </p>

      <div className="bg-black/40 border border-violet-500/30 rounded-2xl p-5 sm:p-6">

        <h2 className="text-lg sm:text-xl font-semibold text-violet-300 mb-3">
          Contact Information
        </h2>

        <p className="text-gray-300 mb-2">
          📧 Email:
        </p>

        <a
          href="mailto:imaginesahill@gmail.com"
          className="text-blue-400 hover:text-blue-300 underline break-all text-sm sm:text-base"
        >
          imaginesahill@gmail.com
        </a>

      </div>

      <p>
        We usually respond within 24-48 hours.
      </p>

    </PageWrapper>
  );
};

// ================= REFUND POLICY =================

export const RefundPolicyPage = () => {
  return (
    <PageWrapper title="Refund Policy">

      <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-5 sm:p-6">

        <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">
          Important Refund Notice
        </h2>

        <p className="text-red-200 text-base sm:text-lg leading-7 sm:leading-8">
          After successful registration/payment for any event,
          refund requests must be directly discussed with the
          respective event organizer or organizing committee.
        </p>

      </div>

      <p>
        EventGlow acts only as a platform for hosting and managing events.
      </p>

      <p>
        Refund approval, cancellation policies, and payment disputes are
        handled entirely by the event organizers.
      </p>

      <p>
        Users are advised to review the event details carefully before
        completing payment or registration.
      </p>

      <p>
        For refund-related queries, please contact the organizer mentioned
        on the respective event page.
      </p>

    </PageWrapper>
  );
};