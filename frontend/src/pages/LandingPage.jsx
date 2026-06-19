import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Ticket, Mail, FileText, BarChart3, CheckCircle, ArrowRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    { item: 'Paid Registration Processing', price: '1% platform fees + gateway fees', desc: 'Per successful registration (+2–3% payment gateway charges)' },
    { item: 'Ticket Generation', price: '₹0', desc: 'Instant downloadable ticket with QR code' },
    { item: 'Reminder / Promo Emails', price: '₹0.20', desc: 'Per email sent to attendees' },
    { item: 'Registration Confirmation Emails', price: '₹0', desc: 'Auto ticket & event confirmation emails' },
    { item: 'Certificate Generation', price: '₹0.20', desc: 'Generate custom certificates with QR & branding' },
    { item: 'Certificate Email Delivery', price: 'Included', desc: 'Auto-send certificates to attendees' },
    { item: 'QR Check-in System', price: '₹0', desc: 'Scan attendee tickets during event entry' },
    { item: 'Coordinator Access', price: '₹0', desc: 'Invite team members to manage events' },
    { item: 'Attendee Export', price: '₹0', desc: 'Download attendee data in CSV/Excel format' },
  ];

  const SectionLabel = ({ children }) => (
    <div className="flex items-center justify-center gap-3 mb-4">
      <span className="block w-8 h-px bg-gray-600" />
      <span
        className="text-gray-500 tracking-widest text-xs font-bold uppercase"
        style={{ fontFamily: '"Arial Black", Impact, sans-serif', letterSpacing: '0.16em' }}
      >
        {children}
      </span>
      <span className="block w-8 h-px bg-gray-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 px-4 sm:px-6 py-4 sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo + Text */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dmhykhefr/image/upload/v1779460044/ChatGPT_Image_May_21__2026__02_47_45_PM-removebg-preview_kww7oj.png"
              alt="EventGlow Logo"
              className="h-8 sm:h-12 w-auto object-contain"
            />
            <Link
              to="/"
              className="text-lg sm:text-xl text-white font-black uppercase tracking-widest"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              EventGlow
            </Link>
          </div>

          {/* Right Side Buttons */}
          <div className="flex gap-2 sm:gap-3">
            {token ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 sm:px-6 py-2 bg-[#6C47FF] text-white font-black uppercase tracking-widest text-xs sm:text-sm transition active:scale-95"
                style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
              >
                Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 sm:px-6 py-2 border border-white/20 text-gray-400 hover:text-white hover:border-white/40 font-black uppercase tracking-widest text-xs sm:text-sm transition active:scale-95 flex items-center"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 sm:px-6 py-2 bg-[#6C47FF] text-white font-black uppercase tracking-widest text-xs sm:text-sm transition active:scale-95 whitespace-nowrap flex items-center"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="px-4 sm:px-6 py-20 sm:py-28 md:py-36 text-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          backgroundColor: '#1a1a1a',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8 flex justify-center">
            <span
              className="inline-block px-4 py-2 border-l-[3px] text-xs sm:text-sm font-black uppercase tracking-widest"
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                borderLeftColor: '#6c5ce7',
                background: 'rgba(108,92,231,0.08)',
                color: '#a29bfe',
              }}
            >
              College Events Made Easy
            </span>
          </div>
          <h1
            className="font-black uppercase mb-6 sm:mb-8 leading-[0.95]"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 'clamp(40px, 9vw, 110px)',
              letterSpacing: '0.01em',
            }}
          >
            Run your college
            <br />
            <span style={{ color: '#a29bfe' }}>events like a pro</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#b4b4b4] mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
            Create stunning event pages, auto-generate tickets with QR codes, manage registrations, and analyze
            attendance, create and generate bulk Certificates automatically — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-4 sm:px-0">
            <Link
              to="/register"
              className="px-8 sm:px-10 py-4 bg-[#6C47FF] text-white font-black uppercase tracking-widest transition flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
            >
              Get Started Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
          <div className="text-xs sm:text-sm text-[#6b7280] uppercase tracking-widest font-bold">
            Completely free to start. Pay only for what you use.
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>What You Get</SectionLabel>
          <h2
            className="font-black uppercase mb-3 sm:mb-4 text-center"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Powerful Features
          </h2>
          <p className="text-[#b4b4b4] text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
            Everything you need to run professional events
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-6 sm:p-8 bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-150 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-[#6C47FF]/40 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-[#6C47FF]/10 transition">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#a29bfe' }} />
                  </div>
                  <h3
                    className="text-sm sm:text-base font-black uppercase tracking-widest mb-2 sm:mb-3"
                    style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-[#b4b4b4] text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Pricing</SectionLabel>
          <h2
            className="font-black uppercase mb-3 sm:mb-4 text-center"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Transparent Pricing
          </h2>
          <p className="text-[#b4b4b4] text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
            Free to create events. Pay only when you send tickets or emails.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 mb-10 sm:mb-12">
            {pricingItems.map((pricing, i) => (
              <div
                key={i}
                className="p-5 sm:p-8 bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-center transition"
              >
                <p
                  className="text-[#6b7280] text-xs mb-2 sm:mb-3 font-black uppercase tracking-widest"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
                >
                  {pricing.item}
                </p>
                <p
                  className="text-xl sm:text-3xl font-black mb-2 sm:mb-3"
                  style={{ fontFamily: '"Arial Black", Impact, sans-serif', color: '#a29bfe' }}
                >
                  {pricing.price}
                </p>
                <p className="text-xs sm:text-sm text-[#6b7280]">{pricing.desc}</p>
              </div>
            ))}
          </div>

          <div
            className="p-5 sm:p-8 border-l-[3px]"
            style={{ borderLeftColor: '#6c5ce7', background: 'rgba(108,92,231,0.08)' }}
          >
            <p className="text-center text-[#b4b4b4] text-sm sm:text-base">
              <span className="font-black uppercase tracking-widest" style={{ fontFamily: '"Arial Black", Impact, sans-serif', color: '#a29bfe' }}>
                Platform Fee:
              </span>{' '}
              2%-3% on paid events (Payment Gateway fees, Razorpay) + 1% per ticket. Zero setup fees. Zero monthly
              charges.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="px-4 sm:px-6 py-16 sm:py-24 border-y border-white/10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          backgroundColor: '#111',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="font-black uppercase mb-3 sm:mb-4"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Ready to host amazing events?
          </h2>
          <p className="text-[#b4b4b4] mb-8 sm:mb-10 text-base sm:text-lg">
            Join college organizers who are already managing events like professionals.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 sm:px-10 py-4 bg-[#6C47FF] text-white font-black uppercase tracking-widest transition text-sm sm:text-base active:scale-95"
            style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}
          >
            Start for Free 
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 sm:px-6 py-10 sm:py-12 text-center text-[#6b7280]">
        <div className="max-w-7xl mx-auto">
          <p
            className="mb-4 sm:mb-5 text-xs sm:text-sm uppercase tracking-widest font-bold"
          >
            &copy; 2026 EventGlow.
          </p>
          <div className="flex justify-center flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm uppercase tracking-widest">
            <Link to="/privacy-policy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-white transition">
              Contact
            </Link>
            <Link to="/refund-policy" className="hover:text-white transition">
              Refund Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;