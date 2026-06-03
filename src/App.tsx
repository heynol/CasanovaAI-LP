import { ReactNode, useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    fbq: any;
  }
}
import { ChevronDown, Mail, Shield, Zap, Sparkles, Smartphone, Crosshair, Camera } from 'lucide-react';
import { APP_STORE_BADGE, GOOGLE_PLAY_BADGE } from './badges';
import Lottie from 'lottie-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RizzOnboarding from './pages/RizzOnboarding';
import { trackEvent } from './mixpanel';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Track page view on route change
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
}

// FB Tracking helpers
const trackSubmit = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'SubmitApplication');
  }
};

const trackContact = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Contact');
  }
};


const IOS_LINK = "https://apps.apple.com/de/app/casanova-rizz-app/id6473753089";
const ANDROID_LINK = "https://play.google.com/store/apps/details?id=ai.casanova.datingcopilot";

// Helper components
const SectionTitle = ({ title, subtitle, highlight }: { title: string, subtitle?: string, highlight?: string }) => (
  <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
    <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
      {title} <span className="text-gradient-accent">{highlight}</span>
    </h2>
    {subtitle && <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>{subtitle}</p>}
  </div>
);

function Header() {
  return (
    <header style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6, 6, 8, 0.8)', backdropFilter: 'blur(10px)' }}>
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* We use the app icon next to the specifically styled text */}
          <img src="/AppAssets/App Icons/CasanovaAI Android notification icon.svg" alt="Casanova AI Logo" style={{ height: '36px' }} />
          <span style={{ fontFamily: 'Lato', fontSize: '1.75rem', letterSpacing: '0px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>casanova</span>
            <span style={{ fontWeight: 300, color: 'var(--text-primary)' }}>.AI</span>
          </span>
        </div>
        <div className="flex gap-4">
          <a href="#features" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Features</a>
          <a href="#faq" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>FAQ</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const lottieRef = useRef<any>(null);
  const [glowAnimData, setGlowAnimData] = useState<any>(null);

  useEffect(() => {
    fetch('/AppAssets/App Animations/ColorGlow OnScreen Opaque.json')
      .then((res) => res.json())
      .then((data) => setGlowAnimData(data))
      .catch((err) => console.error('Failed to load glow animation in App.tsx', err));
  }, []);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, []);

  return (
    <section className="section" style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
      {/* Background glowing effects */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-cyan)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-blue)', filter: 'blur(200px)', opacity: 0.1, borderRadius: '50%' }}></div>
      
      <div className="container grid grid-cols-2 gap-8 items-center">
        <div style={{ zIndex: 20, position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Your Ultimate AI Wingman</span>
          </div>
          
          <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Flirt smarter, <br />
            <span className="text-gradient-accent">secure more dates.</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '500px' }}>
            Casanova AI acts as your strategic dating assistant. It automates your chats, decodes the vibe, and generates highly converting replies.
          </p>
          
          <div className="flex gap-4 flex-wrap">
            <a href={IOS_LINK} target="_blank" rel="noreferrer" onClick={trackSubmit} style={{ transition: 'transform 0.2s', display: 'inline-block' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src={APP_STORE_BADGE} alt="Download on App Store" style={{ height: '48px', objectFit: 'contain' }} />
            </a>
            <a href={ANDROID_LINK} target="_blank" rel="noreferrer" onClick={trackSubmit} style={{ transition: 'transform 0.2s', display: 'inline-block' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src={GOOGLE_PLAY_BADGE} alt="Get it on Google Play" style={{ height: '48px', objectFit: 'contain' }} />
            </a>
          </div>
        </div>
        
        <div className="perspective-container flex justify-center animate-float" style={{ zIndex: 10, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '85%', left: '50%', transform: 'translate(-50%, -50%)', width: '1200px', height: '1200px', zIndex: -1, opacity: 0.8, pointerEvents: 'none' }}>
            {glowAnimData && (
              /* @ts-ignore */
              typeof Lottie === 'function' ? <Lottie lottieRef={lottieRef} animationData={glowAnimData} loop={true} /> : <Lottie.default lottieRef={lottieRef} animationData={glowAnimData} loop={true} />
            )}
          </div>
          <div className="device-mockup mockup-angled-left" style={{ width: '320px', height: '650px' }}>
            <img 
              src="/AppScreenshots/Home tile.png" 
              alt="Casanova AI App Screen" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Chat Assistant",
      desc: "The flagship feature. It flirts for you, automates your chats, and generates highly converting replies to help you close the date.",
      icon: "/FeatureLogos/GenReply.svg",
      img: "/AppScreenshots/Generate Rizz Replies.png",
      glow: "/GlowColors/Glow Blue.png",
      colorBg: "rgba(79, 172, 254, 0.15)",
      colorBorder: "rgba(79, 172, 254, 0.4)"
    },
    {
      title: "Rizz Arena",
      desc: "An interactive simulator where you can practice your flirting skills and sharpen your banter before talking to real matches.",
      icon: "/FeatureLogos/RizzArena.svg",
      img: "/AppScreenshots/Rizz Arena.png",
      reverse: true,
      glow: "/GlowColors/Glow Yellow.png",
      colorBg: "rgba(248, 181, 0, 0.15)",
      colorBorder: "rgba(248, 181, 0, 0.4)"
    },
    {
      title: "Analyze Her Profile",
      desc: "Scans a match's profile to provide instant insights, red flag warnings, and highly tailored, copy-paste icebreakers.",
      icon: "/FeatureLogos/HerProfile.svg",
      img: "/AppScreenshots/Profile analysis.png",
      glow: "/GlowColors/Glow Pink.png",
      colorBg: "rgba(255, 113, 154, 0.15)",
      colorBorder: "rgba(255, 113, 154, 0.4)"
    },
    {
      title: "Improve My Profile",
      desc: "Audits your profile with a competitor percentile ranking, a swipe-stopper score, and actionable photo/bio upgrades.",
      icon: "/FeatureLogos/ImproveMy.svg",
      img: "/AppScreenshots/Improve my profile.png",
      reverse: true,
      glow: "/GlowColors/Glow Blue.png",
      colorBg: "rgba(79, 172, 254, 0.15)",
      colorBorder: "rgba(79, 172, 254, 0.4)"
    },
    {
      title: "AI Photo Studio",
      desc: "Transforms basic selfies into high-status, photorealistic lifestyle shots designed to mathematically boost match rates.",
      icon: "/FeatureLogos/AIStudio.svg",
      img: "/AppScreenshots/AI Photo Studio.png",
      glow: "/GlowColors/Glow Green.png",
      colorBg: "rgba(0, 230, 118, 0.15)",
      colorBorder: "rgba(0, 230, 118, 0.4)"
    }
  ];

  return (
    <section id="features" className="section" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="container">
        <SectionTitle 
          title="Supercharge Your" 
          highlight="Dating Life" 
          subtitle="Everything you need to maximize volume, status, and success rates on dating apps."
        />
        
        <div className="flex flex-col gap-32" style={{ marginTop: '8rem' }}>
          {features.map((f, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div key={i} className={`flex items-center gap-12 feature-container ${f.reverse ? 'flex-row-reverse' : ''}`} style={{ flexWrap: 'wrap', position: 'relative' }}>
                <img src={f.glow} alt="" className="feature-glow" />
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div 
                    className="glass-card" 
                    style={{ padding: '3rem', border: `1px solid ${f.colorBorder}`, cursor: f.title === 'Rizz Arena' ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (f.title === 'Rizz Arena') {
                        trackEvent('Rizz Arena Click');
                      }
                    }}
                  >
                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: f.colorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: `1px solid ${f.colorBorder}` }}>
                      <img src={f.icon} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.title}</h3>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{f.desc}</p>
                  </div>
                </div>
                <div className="perspective-container" style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <div className={`device-mockup ${isLeft ? 'mockup-angled-left' : 'mockup-angled-right'}`} style={{ width: '250px', height: '540px' }}>
                    <img src={f.img} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="glass-card" style={{ marginBottom: '1rem', cursor: 'pointer', padding: '1.5rem' }} onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center">
        <h4 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{question}</h4>
        <ChevronDown size={20} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
      </div>
      {open && (
        <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

function FAQ() {
  const faqs = [
    { q: "How does Casanova AI generate message suggestions?", a: "Casanova AI uses advanced AI to analyze the context of your chat and suggests messages that are tailored to keep the conversation engaging and relevant." },
    { q: "Is Casanova AI safe to use?", a: "Absolutely. We prioritize your privacy and security. No personal data is stored or shared." },
    { q: "Can I use Casanova AI across different dating apps?", a: "Yes, Casanova AI is designed to work seamlessly across all popular dating apps for both Android and iOS." },
    { q: "Do I need to switch between apps to use Casanova AI?", a: "Not at all. For Android, it overlays on your current app, and for iOS, it's accessible via a custom keyboard." },
    { q: "Will the app suggest the same messages to different users?", a: "No, all suggestions are unique and generated in real-time, based on the individual conversation's context." },
    { q: "Is there a tutorial on how to use Casanova AI?", a: "Yes, we offer a comprehensive guide within the app and soon also on our website to help you get started." },
    { q: "What if I receive a message suggestion that I don't like?", a: "You have complete control to edit or ignore any suggestion and respond in your own words. Plus, you can always just tap \"generate again\" and get a new set of suggestions." },
    { q: "How can I provide feedback on the message suggestions?", a: "We love user feedback! You can provide feedback directly within the app or at the email below to help us improve our suggestions." }
  ];

  return (
    <section id="faq" className="section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <SectionTitle title="Frequently Asked" highlight="Questions" />
        <div>
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#030304', padding: '4rem 0 2rem', borderTop: '1px solid var(--border-color)' }}>
      <div className="container flex flex-col items-center">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Ready to <span className="text-gradient-accent">upgrade</span> your dating life?</h2>
        <div className="flex gap-4 mb-8">
            <a href={IOS_LINK} target="_blank" rel="noreferrer" onClick={trackSubmit} style={{ transition: 'transform 0.2s', display: 'inline-block' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src={APP_STORE_BADGE} alt="Download on App Store" style={{ height: '48px', objectFit: 'contain' }} />
            </a>
            <a href={ANDROID_LINK} target="_blank" rel="noreferrer" onClick={trackSubmit} style={{ transition: 'transform 0.2s', display: 'inline-block' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src={GOOGLE_PLAY_BADGE} alt="Get it on Google Play" style={{ height: '48px', objectFit: 'contain' }} />
            </a>
        </div>
        
        <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '3rem 0' }}></div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} color="var(--text-secondary)" />
            <a href="mailto:info@getcasanova.ai" onClick={trackContact} style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>info@getcasanova.ai</a>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We value your feedback! ❤️</p>
          
          <div className="flex gap-6 mt-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <Link to="/privacy-policy" className="hover-white" style={{ textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover-white" style={{ textDecoration: 'none' }}>Terms of Service</Link>
          </div>
          
          <p style={{ marginTop: '2rem', color: 'var(--border-hover)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Casanova AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <FAQ />
    </>
  );
}

function App() {
  const location = useLocation();
  const isOnboarding = location.pathname.toLowerCase() === '/rizzonboarding';

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/RizzOnboarding" element={<RizzOnboarding />} />
        </Routes>
      </main>
      {!isOnboarding && <Footer />}
    </div>
  );
}

export default App;
