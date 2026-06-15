import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './landing.css';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLaunch = () => {
        if (user) navigate('/app');
        else navigate('/login');
    };

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', boxShadow: '0 0 40px rgba(124,58,237,0.15)', borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link to="/" className="nav-brand" style={{ lineHeight: 1 }}>UniServe</Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></div>
                            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE</span>
                        </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--lp-text-sec)', fontWeight: 600, letterSpacing: '0.05em', marginTop: 4 }}>CAMPUS DELIVERY NETWORK</span>
                </div>
                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#tech">Technology</a>
                    <a href="https://github.com/thedishajyala/UniServe" target="_blank" rel="noreferrer">GitHub</a>
                </div>
                <div className="nav-cta">
                    <Link to="/login" className="nav-login">Login</Link>
                    <Link to="/login" className="btn-get-started">Get Started →</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-badge">
                    <span>⚡ Real-Time Campus Logistics</span>
                </div>
                <h1 className="hero-title">Deliver Anything.<br/>Anywhere.<br/>Across Campus.</h1>
                <p className="hero-subtitle">
                    Food. Parcels. Documents. Essentials.<br/>
                    Delivered across campus in real time.
                </p>
                <div className="hero-buttons">
                    <button onClick={handleLaunch} className="btn-launch">Launch App</button>
                    <a href="https://github.com/thedishajyala/UniServe" target="_blank" rel="noreferrer" className="btn-github">GitHub →</a>
                </div>
            </header>

            {/* Massive Screenshot */}
            <section className="screenshot-section">
                <div className="screenshot-container">
                    <img src="/hero-mockup.png" alt="UniServe Dashboard" className="hero-screenshot" />
                </div>
            </section>

            {/* Features (4 Cards) */}
            <section id="features" className="features-section">
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Real-Time</h3>
                        <p>Live tracking and updates.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>Smart Matching</h3>
                        <p>Connect with the best delivery partner.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💬</div>
                        <h3>Instant Chat</h3>
                        <p>Coordinate seamlessly.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💳</div>
                        <h3>Payments</h3>
                        <p>Secure and frictionless.</p>
                    </div>
                </div>
            </section>

            {/* Built For Students */}
            <section className="built-for-section">
                <h2>
                    Built for Students.<br/>
                    Verified campus users.<br/>
                    Student-powered deliveries.<br/>
                    Real-world logistics.
                </h2>
            </section>

            {/* Tech Stack */}
            <section id="tech" className="tech-section">
                <p className="tech-subtitle">POWERED BY</p>
                <div className="tech-chips">
                    <span className="tech-chip react">React</span>
                    <span className="tech-chip node">Node.js</span>
                    <span className="tech-chip mongo">MongoDB</span>
                    <span className="tech-chip socket">Socket.io</span>
                    <span className="tech-chip razorpay">Razorpay</span>
                    <span className="tech-chip leaflet">Leaflet</span>
                </div>
            </section>

            {/* The Secret Sauce */}
            <section className="secret-sauce-section">
                <h2>
                    Built by a student.<br/>
                    Designed for thousands.<br/>
                    Engineered in real time.
                </h2>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">UniServe</div>
                    <div className="footer-copyright">© {new Date().getFullYear()} UniServe. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
}
