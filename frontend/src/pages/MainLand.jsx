import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {

  return (
    <div className="min-h-screen bg-bg text-white">

      {/* ─── NAVBAR (unchanged) ─── */}
      <nav className="border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-50 bg-bg/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dmhykhefr/image/upload/v1779460044/ChatGPT_Image_May_21__2026__02_47_45_PM-removebg-preview_kww7oj.png"
              alt="EventGlow Logo"
              className="h-10 sm:h-16 w-auto object-contain"
            />
            <span className="text-xl sm:text-2xl font-bold text-white">EventGlow</span>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        className="w-full min-h-[80vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 sm:py-32"
        style={{
          backgroundColor: '#1a1a1a',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      >
          <div className="mb-5 flex justify-center items-center gap-3">
            <span className="block w-8 sm:w-12 h-px bg-gray-600" />
            <span
                className="text-gray-500 font-bold uppercase tracking-widest text-xs sm:text-sm"
                style={{ letterSpacing: '0.2em' }}
            >
                College Events Made Easy
            </span>
            <span className="block w-8 sm:w-12 h-px bg-gray-600" />
            </div>

        {/* <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-6 leading-tight max-w-5xl">
          Run your college{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-brand">
            events like a pro
          </span>
        </h1> */}

        <h1
  className="text-gray-500 font-black uppercase leading-none tracking-tight mb-5 sm:mb-6 w-full"
  style={{
    fontSize: 'clamp(60px, 14vw, 180px)',
    fontStretch: 'condensed',
    letterSpacing: '-0.02em',
    fontFamily: '"Arial Black", "Impact", sans-serif',
  }}
>
 

Find it. Host it. Own it.
</h1>

        {/* <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl leading-relaxed">
          Create stunning event pages, auto-generate tickets with QR codes, manage registrations,
          and analyze attendance — all in one platform.
        </p> */}

        {/* <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            to="/org"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Create Event <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          <Link
            to="/org"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
          > 
             Explore Events <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div> */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8">
  <Link
    to="/org"
    className="flex items-center justify-center gap-2 text-gray-900 font-black uppercase tracking-wide text-sm sm:text-base transition-transform hover:scale-105"
    style={{
      fontFamily: '"Arial Black", Impact, sans-serif',
      background: '#d4d4d4',
      padding: '16px 36px',
      letterSpacing: '0.08em',
      maskImage: `
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) bottom left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-y,
        radial-gradient(circle, transparent 5px, white 5px) top right / 14px 14px repeat-y,
        linear-gradient(white, white) center / calc(100% - 14px) calc(100% - 14px) no-repeat
      `,
      WebkitMaskImage: `
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) bottom left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-y,
        radial-gradient(circle, transparent 5px, white 5px) top right / 14px 14px repeat-y,
        linear-gradient(white, white) center / calc(100% - 14px) calc(100% - 14px) no-repeat
      `,
      maskComposite: 'intersect',
      WebkitMaskComposite: 'source-in',
    }}
  >
    Create Event <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
  </Link>

  <Link
    to="/discover"
    className="flex items-center justify-center gap-2 text-gray-900 font-black uppercase tracking-wide text-sm sm:text-base transition-transform hover:scale-105"
    style={{
      fontFamily: '"Arial Black", Impact, sans-serif',
      background: '#d4d4d4',
      padding: '16px 36px',
      letterSpacing: '0.08em',
      maskImage: `
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) bottom left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-y,
        radial-gradient(circle, transparent 5px, white 5px) top right / 14px 14px repeat-y,
        linear-gradient(white, white) center / calc(100% - 14px) calc(100% - 14px) no-repeat
      `,
      WebkitMaskImage: `
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) bottom left / 14px 14px repeat-x,
        radial-gradient(circle, transparent 5px, white 5px) top left / 14px 14px repeat-y,
        radial-gradient(circle, transparent 5px, white 5px) top right / 14px 14px repeat-y,
        linear-gradient(white, white) center / calc(100% - 14px) calc(100% - 14px) no-repeat
      `,
      maskComposite: 'intersect',
      WebkitMaskComposite: 'source-in',
    }}
  >
    Explore Events <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
  </Link>
</div>

        <div className="text-xs sm:text-sm text-gray-500 mt-6">
          ✨ Completely free to start. Pay only for what you use.
        </div>
      </section>

      {/* ─── FOOTER (unchanged) ─── */}
      <footer className="border-t border-border px-4 sm:px-6 py-10 sm:py-12 text-center text-gray-500">
            <div className="max-w-7xl mx-auto">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">&copy; 2024 EventGlow. Made for college events.</p>
                <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm mb-4">
                <Link to="/privacy-policy" className="hover:text-gray-300 transition">Privacy</Link>
                <Link to="/terms-and-conditions" className="hover:text-gray-300 transition">Terms</Link>
                <Link to="/contact" className="hover:text-gray-300 transition">Contact</Link>
                <Link to="/refund-policy" className="hover:text-gray-300 transition">Refund Policy</Link>
                </div>
                <p className="text-xs text-gray-600" >
                Designed & crafted by{' '}
                
                    <a
                    href="https://www.linkedin.com/in/sahil-ll"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition underline underline-offset-2"
                >
                    Sahil Singh
                </a>
                </p>
            </div>
            </footer>

    </div>
  );
};

export default LandingPage;