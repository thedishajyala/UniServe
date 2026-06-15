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
                <h1 className="hero-title">Deliver Anything.<br/>Across Campus.</h1>
                <p className="hero-subtitle">
                    Food. Parcels. Documents. Essentials.<br/>
                    Delivered across campus in real time.
                </p>
                <div className="hero-buttons">
                    <button onClick={handleLaunch} className="btn-launch">Launch App</button>
                    <a href="https://github.com/thedishajyala/UniServe" target="_blank" rel="noreferrer" className="btn-github">GitHub →</a>
                </div>
            </header>

            {/* Social Proof Metrics */}
            <section className="fade-in" style={{ padding: '0 24px 60px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', textAlign: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '32px', color: '#FFFFFF', marginBottom: '4px', fontFamily: 'Outfit, sans-serif' }}>200+</h3>
                    <p style={{ fontSize: '13px', color: 'var(--lp-text-sec)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students Served</p>
                </div>
                <div>
                    <h3 style={{ fontSize: '32px', color: '#FFFFFF', marginBottom: '4px', fontFamily: 'Outfit, sans-serif' }}>800+</h3>
                    <p style={{ fontSize: '13px', color: 'var(--lp-text-sec)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deliveries</p>
                </div>
                <div>
                    <h3 style={{ fontSize: '32px', color: '#10B981', marginBottom: '4px', fontFamily: 'Outfit, sans-serif' }}>98%</h3>
                    <p style={{ fontSize: '13px', color: 'var(--lp-text-sec)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</p>
                </div>
                <div>
                    <h3 style={{ fontSize: '32px', color: '#F59E0B', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Outfit, sans-serif' }}>4.9 <span style={{fontSize: '20px'}}>⭐</span></h3>
                    <p style={{ fontSize: '13px', color: 'var(--lp-text-sec)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Rating</p>
                </div>
            </section>

            {/* Massive Screenshot */}
            <section className="screenshot-section">
                <div className="screenshot-container floating-card" style={{ animationDuration: '6s' }}>
                    <img src="/dashboard.png" alt="UniServe Dashboard" className="hero-screenshot" />
                </div>
            </section>

            {/* Bento Grid Showcase */}
            <section id="features" className="bento-section">
                <div className="bento-header">
                    <h2>Everything you need.</h2>
                    <p>Built exclusively for the Bennett University campus.</p>
                </div>
                <div className="bento-grid">
                    {/* Large Feature 1 */}
                    <div className="bento-card large">
                        <div className="bento-content">
                            <h3>Live Order Tracking</h3>
                            <p>Know exactly where your delivery partner is in real-time on the campus map.</p>
                        </div>
                        <div className="bento-img-wrapper" style={{ height: '400px' }}>
                            <img src="/tracking.png" alt="Tracking Map" className="bento-img" style={{ objectPosition: 'center top' }} />
                        </div>
                    </div>
                    
                    {/* Feature 2 */}
                    <div className="bento-card">
                        <div className="bento-content">
                            <h3>Trusted Network</h3>
                            <p>Every partner is a verified student with public ratings and trust badges.</p>
                        </div>
                        <div className="bento-img-wrapper" style={{ height: '400px' }}>
                            <img src="/profile.png" alt="Partner Profile" className="bento-img" style={{ objectFit: 'contain' }} />
                        </div>
                    </div>
                    
                    {/* Feature 3 */}
                    <div className="bento-card">
                        <div className="bento-content">
                            <h3>Smart Matching</h3>
                            <p>Choose from available partners nearby or let our algorithm find the best match.</p>
                        </div>
                        <div className="bento-img-wrapper" style={{ height: '400px' }}>
                            <img src="/pick-partner.png" alt="Pick Partner" className="bento-img" style={{ objectFit: 'cover', objectPosition: 'top' }} />
                        </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="bento-card large">
                        <div className="bento-content">
                            <h3>Accountability & Quality</h3>
                            <p>Rate and review your delivery experience to maintain high campus standards.</p>
                        </div>
                        <div className="bento-img-wrapper" style={{ height: '350px' }}>
                            <img src="/rate.png" alt="Rate Partner" className="bento-img" style={{ objectFit: 'contain' }} />
                        </div>
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
