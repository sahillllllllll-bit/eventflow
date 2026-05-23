import React from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const pricingItems = [
  { item: 'Event Landing Page', price: '₹0', desc: 'Create unlimited public event pages' },
  { item: 'Custom Registration Forms', price: '₹0', desc: 'Add custom questions & attendee details' },
  { item: 'Event Analytics', price: '₹0', desc: 'Track registrations, attendance & payments' },
  { item: 'Paid Registration Processing', price: '₹1 + gateway fees', desc: 'Per successful registration (+2–3% payment gateway charges)' },
  { item: 'Ticket Generation', price: '₹0', desc: 'Instant downloadable ticket with QR code' },
  { item: 'Reminder / Promo Emails', price: '₹0.20', desc: 'Per email sent to attendees' },
  { item: 'Registration Confirmation Emails', price: '₹0.20', desc: 'Auto ticket & event confirmation emails' },
  { item: 'Certificate Generation', price: '₹0.60', desc: 'Generate custom certificates with QR & branding' },
  { item: 'Certificate Email Delivery', price: 'Included', desc: 'Auto-send certificates to attendees' },
  { item: 'QR Check-in System', price: '₹0', desc: 'Scan attendee tickets during event entry' },
  { item: 'Coordinator Access', price: '₹0', desc: 'Invite team members to manage events' },
  { item: 'Attendee Export', price: '₹0', desc: 'Download attendee data in CSV/Excel format' },
];

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-10 sm:py-16">

      <div className="max-w-6xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-[#12042d] hover:bg-[#1a0640] transition-all text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Heading */}
        <div className="mb-12 text-center">

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            EventGlow Pricing
          </h1>

          <p className="mt-5 text-gray-400 max-w-2xl mx-auto text-sm sm:text-base leading-7">
            Transparent pay-as-you-use pricing for college events,
            registrations, certificates, emails, and attendee management.
          </p>

          <div className="mt-6 h-[2px] w-32 mx-auto bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" />

        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {pricingItems.map((pricing, index) => (
            <div
              key={index}
              className="group bg-[#0d0225] border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-violet-500/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            >

              {/* Top */}
              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="flex items-center gap-3">

                    <CheckCircle2
                      className="text-violet-400 mt-1 flex-shrink-0"
                      size={20}
                    />

                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      {pricing.item}
                    </h2>

                  </div>

                  <p className="mt-4 text-gray-400 text-sm leading-7">
                    {pricing.desc}
                  </p>

                </div>

              </div>

              {/* Price */}
              <div className="mt-6">

                <span className="inline-flex items-center px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-semibold text-sm sm:text-base">
                  {pricing.price}
                </span>

              </div>

            </div>
          ))}

        </div>

        {/* Footer Note */}
        <div className="mt-12 bg-[#12042d] border border-violet-500/20 rounded-3xl p-6 sm:p-8">

          <h3 className="text-2xl font-semibold text-violet-300 mb-4">
            Important Notes
          </h3>

          <ul className="space-y-3 text-gray-300 text-sm sm:text-base leading-7">
            <li>
              • Payment gateway charges are charged separately by Razorpay/Stripe.
            </li>

            <li>
              • Free features remain free unless otherwise mentioned.
            </li>

            <li>
              • Certificate generation pricing applies per generated certificate.
            </li>

            <li>
              • Email pricing applies only to successfully delivered emails.
            </li>

            <li>
              • Pricing may change in future as platform scales.
            </li>
          </ul>

        </div>

      </div>
    </div>
  );
};

export default PricingPage;