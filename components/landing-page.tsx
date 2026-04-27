"use client";

import React from "react"

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div style={{ background: 'linear-gradient(160deg, #0ea5e9 0%, #06b6d4 60%, #0284c7 100%)', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/Atlas.png" alt="Atlas" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span style={{ color: 'white', fontSize: '28px', fontWeight: 600 }}>Atlas</span>
        </div>
        <button
          onClick={onGetStarted}
          style={{ padding: '8px 22px', borderRadius: '20px', border: '1.5px solid rgba(255,255,255,0.5)', background: 'transparent', color: 'white', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}
        >
          Sign in
        </button>
      </header>

      {/* Desktop layout — two columns, Mobile — single column */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 60px 100px' }}>

        {/* TOP SECTION — two col on desktop, single on mobile */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px', marginBottom: '48px', justifyContent: 'center' }}>

          {/* LEFT — text content */}
          <div style={{ flex: '1 1 320px', maxWidth: '500px', textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '5px 14px', marginBottom: '20px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#86efac' }} />
              <span style={{ color: 'white', fontSize: '12px' }}>Your AI Travel Companion</span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 600, color: 'white', margin: '0 0 20px', lineHeight: 1.15 }}>
              Explore smarter.<br />Travel better.
            </h1>
            <p style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.85)', margin: '0 0 36px', lineHeight: 1.7, maxWidth: '460px' }}>
              Meet your personal AI guide — have real voice conversations, detect landmarks and get travel advice wherever you go.
            </p>

            <button
              onClick={onGetStarted}
              style={{ padding: '14px 44px', borderRadius: '14px', border: 'none', background: 'white', color: '#0ea5e9', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}
            >
              Get Started Free
            </button>
          </div>

          {/* RIGHT — avatar trio */}
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '90px', height: '116px', borderRadius: '16px', border: '2.5px solid white', overflow: 'hidden', zIndex: 2, transform: 'rotate(-6deg) translateX(18px)', flexShrink: 0 }}>
                <img src="https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FSage-face.png?alt=media&token=71d00ae7-30ec-496f-9c61-6e8832cd55a5" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Sage" />
              </div>
              <div style={{ width: '116px', height: '150px', borderRadius: '20px', border: '3px solid white', overflow: 'hidden', zIndex: 4, flexShrink: 0 }}>
                <img src="https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FLuna-face.png?alt=media&token=ec2858ba-1ba9-4e85-8abf-15bbe52bc93d" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Luna" />
              </div>
              <div style={{ width: '90px', height: '116px', borderRadius: '16px', border: '2.5px solid white', overflow: 'hidden', zIndex: 2, transform: 'rotate(6deg) translateX(-18px)', flexShrink: 0 }}>
                <img src="https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FBlaze-face.png?alt=media&token=8727b250-55d4-435b-872e-83486603d92a" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Blaze" />
              </div>
            </div>

            {/* All 6 avatar faces in a row below */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
              {[
                { url: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FLuna-face.png?alt=media&token=ec2858ba-1ba9-4e85-8abf-15bbe52bc93d', name: 'Luna' },
                { url: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FNova-face.png?alt=media&token=aef92065-8111-4c56-822e-0aa5f82f6683', name: 'Nova' },
                { url: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FSage-face.png?alt=media&token=71d00ae7-30ec-496f-9c61-6e8832cd55a5', name: 'Sage' },
                { url: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FBlaze-face.png?alt=media&token=8727b250-55d4-435b-872e-83486603d92a', name: 'Blaze' },
                { url: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FOrion-face.png?alt=media&token=acd5e8c9-4fa8-40c8-b992-3b4bce23a19f', name: 'Orion' },
                { url: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Ffaces%2FRex-face.png?alt=media&token=e253df50-0a62-4fd1-ac0f-5eec1626669f', name: 'Rex' },
              ].map(a => (
                <div key={a.name} style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', overflow: 'hidden' }}>
                  <img src={a.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={a.name} />
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: 0 }}>Choose from 6 AI travel companions</p>
          </div>
        </div>

        {/* BOTTOM SECTION — feature cards + chat bubble */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'stretch' }}>

          <div style={{ flex: '1 1 260px', background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>AI-powered voice conversations</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: 1.5 }}>Talk naturally to your avatar and get spoken travel advice in real time</div>
            </div>
          </div>

          <div style={{ flex: '1 1 260px', background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Instant landmark detection</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: 1.5 }}>Point your camera at any landmark and get history, facts and tips instantly</div>
            </div>
          </div>

          <div style={{ flex: '1 1 260px', background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Smart travel chat</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: 1.5 }}>Ask about restaurants, culture and hidden gems and get personalised recommendations</div>
            </div>
          </div>

          <div style={{ flex: '1 1 260px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em' }}>ATLAS</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
              "The Colosseum was completed in 80 AD and could hold 80,000 spectators. Want to know the best time to visit?"
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
