import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Zap, Ticket, Mail, FileText, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

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
  ];

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Navigation */}
      <nav className="border-b border-border px-6 py-4 sticky top-0 z-50 bg-bg/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="w-8 h-8 text-brand" />
            <span>EventFlow</span>
          </div>
          <div className="flex gap-4">
            {token ? (
              <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="px-6 py-2 border border-brand text-brand hover:bg-brand/10 font-medium rounded-lg transition">
                  Login
                </Link>
                <Link to="/register" className="px-6 py-2 bg-brand hover:bg-brand-light text-white font-medium rounded-lg transition">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-32 max-w-7xl mx-auto text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-brand/10 border border-brand/30 rounded-full text-brand text-sm font-medium">
            🎉 College Events Made Easy
          </span>
        </div>
        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          Run your college <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-brand">events like a pro</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create stunning event pages, auto-generate tickets with QR codes, manage registrations, and analyze attendance — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link to="/register" className="px-8 py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="px-8 py-4 border border-brand text-brand hover:bg-brand/10 font-semibold rounded-lg transition">
            See Demo
          </button>
        </div>
        <div className="text-sm text-gray-400">
          ✨ Completely free to start. Pay only for what you use.
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20 bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Powerful Features</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">Everything you need to run professional events</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-8 border border-border rounded-xl bg-surface-raised hover:border-brand/50 hover:bg-surface-overlay transition-all duration-300 group">
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand/40 transition">
                    <Icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Transparent Pricing</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">Free to create events. Pay only when you send tickets or emails.</p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { item: 'Event Landing Page', price: '₹0', desc: 'Create unlimited events' },
              { item: 'Per Ticket Sent', price: '₹1', desc: 'With QR code & email' },
              { item: 'Per Email Campaign', price: '₹0.50', desc: 'To opted-in attendees' },
            ].map((pricing, i) => (
              <div key={i} className="p-8 border border-border rounded-xl bg-surface-raised text-center hover:border-brand/50 transition">
                <p className="text-gray-400 text-sm mb-3 font-medium uppercase">{pricing.item}</p>
                <p className="text-4xl font-bold text-brand mb-3">{pricing.price}</p>
                <p className="text-sm text-gray-500">{pricing.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-8 border border-brand/30 bg-brand/5 rounded-xl">
            <p className="text-center text-gray-300">
              💡 <span className="font-semibold">Platform Fee:</span> 3% on paid events + ₹1 per ticket. Zero setup fees. Zero monthly charges.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-brand/10 via-transparent to-brand/10 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to host amazing events?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join college organizers who are already managing events like professionals.</p>
          <Link to="/register" className="inline-block px-8 py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition">
            Start for Free — No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12 text-center text-gray-500">
        <div className="max-w-7xl mx-auto">
          <p className="mb-4">&copy; 2024 EventFlow. Made for college events.</p>
          <div className="flex justify-center gap-6 text-sm">
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
