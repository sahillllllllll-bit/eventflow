import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Ticket, Mail, FileText, BarChart3, CheckCircle, ArrowRight, Award } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const features = [
    { 
      icon: Ticket, 
      title: 'Auto QR Tickets', 
      desc: 'Generate beautiful QR code tickets automatically and send via email' 
    },
    { 
      icon: Mail, 
      title: 'Promo Emails', 
      desc: 'Send targeted campaigns to past attendees who opted in' 
    },
    { 
      icon: BarChart3, 
      title: 'Live Analytics', 
      desc: 'Track registrations, check-ins, and revenue in real-time' 
    },
    { 
      icon: FileText, 
      title: 'Custom Forms', 
      desc: 'Build dynamic registration forms with 11 field types' 
    },
    { 
      icon: CheckCircle, 
      title: 'Easy Check-in', 
      desc: 'QR scanner for seamless event check-in' 
    },
    { 
      icon: Zap, 
      title: '5 Templates', 
      desc: 'Minimal, Bold, Gradient, Dark, Glass — pick your style' 
    },
    { 
      icon: Award, 
      title: 'Certificate Generation', 
      desc: 'Auto-generate branded certificates with QR codes and deliver them to every attendee' 
    },
  ];

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

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Navigation */}
     <nav className="border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-50 bg-bg/95 backdrop-blur">
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    
    {/* Logo + Text */}
    <div className="flex items-center gap-3">
      <img
        src="https://res.cloudinary.com/dmhykhefr/image/upload/v1779460044/ChatGPT_Image_May_21__2026__02_47_45_PM-removebg-preview_kww7oj.png"
        alt="EventGlow Logo"
        className="h-10 sm:h-16 w-auto object-contain"
      />

      <span className="text-xl sm:text-2xl font-bold text-white">
        EventGlow
      </span>
    </div>

    {/* Right Side Buttons */}
    <div className="flex gap-2 sm:gap-4">
      {token ? (
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 sm:px-6 py-2 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition text-sm sm:text-base"
        >
          Dashboard
        </button>
      ) : (
        <>
          <Link
            to="/login"
            className="px-3 sm:px-6 py-2 border border-brand text-brand hover:bg-brand/10 font-medium rounded-lg transition text-sm sm:text-base"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-3 sm:px-6 py-2 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition text-sm sm:text-base whitespace-nowrap"
          >
            Get Started Free
          </Link>
        </>
      )}
    </div>
  </div>
</nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 md:py-32 max-w-7xl mx-auto text-center">
        <div className="mb-5 sm:mb-6">
          <span className="inline-block px-3 sm:px-4 py-2 bg-brand/10 border border-brand/30 rounded-full text-brand text-xs sm:text-sm font-medium">
            🎉 College Events Made Easy
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-6 leading-tight">
          Run your college{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-brand">
            events like a pro
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
          Create stunning event pages, auto-generate tickets with QR codes, manage registrations, and analyze attendance, create and generate bulk Certificates automatically   — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-4 sm:px-0">
          <Link
            to="/register"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Get Started Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <button className="px-6 sm:px-8 py-3 sm:py-4 border border-brand text-brand hover:bg-brand/10 font-semibold rounded-lg transition text-sm sm:text-base">
            See Demo
          </button>
        </div>
        <div className="text-xs sm:text-sm text-gray-400">
          ✨ Completely free to start. Pay only for what you use.
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-center">Powerful Features</h2>
          <p className="text-gray-400 text-center mb-10 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
            Everything you need to run professional events
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-6 sm:p-8 border border-border rounded-xl bg-surface-raised hover:border-brand/50 hover:bg-surface-overlay transition-all duration-300 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-brand/40 transition">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-center">Transparent Pricing</h2>
          <p className="text-gray-400 text-center mb-10 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
            Free to create events. Pay only when you send tickets or emails.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
            {pricingItems.map((pricing, i) => (
              <div
                key={i}
                className="p-5 sm:p-8 border border-border rounded-xl bg-surface-raised text-center hover:border-brand/50 transition"
              >
                <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 font-medium uppercase">{pricing.item}</p>
                <p className="text-2xl sm:text-4xl font-bold text-brand mb-2 sm:mb-3">{pricing.price}</p>
                <p className="text-xs sm:text-sm text-gray-500">{pricing.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-8 border border-brand/30 bg-brand/5 rounded-xl">
            <p className="text-center text-gray-300 text-sm sm:text-base">
              💡 <span className="font-semibold">Platform Fee:</span> 2%-3% on paid events (Payment Gateway fees, Razorpay) + ₹1 per ticket. Zero setup fees. Zero monthly charges.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-r from-brand/10 via-transparent to-brand/10 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Ready to host amazing events?</h2>
          <p className="text-gray-400 mb-6 sm:mb-8 text-base sm:text-lg">
            Join college organizers who are already managing events like professionals.
          </p>
          <Link
            to="/register"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition text-sm sm:text-base"
          >
            Start for Free — No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 py-10 sm:py-12 text-center text-gray-500">
        <div className="max-w-7xl mx-auto">
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">&copy; 2024 EventGlow. Made for college events.</p>
          <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <a href="#" className="hover:text-gray-300 transition">Privacy</a>
            <a href="#" className="hover:text-gray-300 transition">Terms</a>
            <a href="#" className="hover:text-gray-300 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;