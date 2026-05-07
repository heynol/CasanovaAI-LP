import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ppText from '../assets/legal/pp.txt?raw';

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
        <ArrowLeft size={20} />
        <span>Back to Home</span>
      </Link>
      
      <div className="glass-card" style={{ padding: '4rem' }}>
        <h1 className="text-gradient-accent" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Privacy Policy</h1>
        <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'break-word', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8' }}>
          {ppText}
        </div>
      </div>
    </div>
  );
}
