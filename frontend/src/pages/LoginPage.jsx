import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, signup } from '../services/api';
import { UNIVERSITY_DOMAIN } from '../config/campus';
import toast from 'react-hot-toast';
import './landing.css'; // Shared premium dark styles

export default function LoginPage() {
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', enrollment_no: '', phone: '', hostel: '', room_no: '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.email) errs.email = 'Email is required';
        else if (!form.email.endsWith(`@${UNIVERSITY_DOMAIN}`))
            errs.email = `Must be a @${UNIVERSITY_DOMAIN} email`;
        if (!form.password || form.password.length < 6)
            errs.password = 'Password must be at least 6 characters';
        if (mode === 'signup') {
            if (!form.name) errs.name = 'Name is required';
            if (!form.enrollment_no) errs.enrollment_no = 'Enrollment number is required';
            if (!form.phone || form.phone.length !== 10 || !/^\d+$/.test(form.phone)) {
                errs.phone = 'Valid 10-digit phone number strictly required';
            }
        }
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            let res;
            if (mode === 'login') {
                res = await login({ email: form.email, password: form.password });
            } else {
                res = await signup(form);
            }
            const { token, ...userData } = res.data;
            loginUser(userData, token);
            toast.success(mode === 'login' ? `Welcome back, ${userData.name}! 👋` : `Welcome to UniServe! 🎉`);
            navigate(userData.profile_complete ? '/app' : '/setup');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-split-page">
            {/* Top Navbar specifically for auth page */}
            <nav className="auth-nav">
                <Link to="/" className="nav-brand">UniServe</Link>
                <div className="nav-cta">
                    <button onClick={() => setMode('login')} className="nav-login">Login</button>
                    <button onClick={() => setMode('signup')} className="btn-get-started">Get Started →</button>
                </div>
            </nav>

            <div className="split-container">
                {/* Left Side: Branding / Marketing */}
                <div className="split-left">
                    <div className="left-content">
                        <h1 className="hero-title" style={{ textAlign: 'left', fontSize: '3rem', marginBottom: '2rem' }}>
                            The Operating System<br/>for Campus Deliveries.
                        </h1>
                        <div className="auth-features">
                            <div className="auth-feature-item">
                                <span className="feature-icon">⚡</span>
                                <div>
                                    <h3>Real-Time Tracking</h3>
                                    <p>Live updates on your delivery status.</p>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <span className="feature-icon">🧠</span>
                                <div>
                                    <h3>Smart Matching</h3>
                                    <p>Connect with the best delivery partner.</p>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <span className="feature-icon">💬</span>
                                <div>
                                    <h3>Instant Communication</h3>
                                    <p>Coordinate seamlessly in real-time.</p>
                                </div>
                            </div>
                            <div className="auth-feature-item">
                                <span className="feature-icon">💳</span>
                                <div>
                                    <h3>Secure Payments</h3>
                                    <p>Safe and frictionless transactions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="split-right">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h2>{mode === 'login' ? 'Sign in to UniServe' : 'Create an account'}</h2>
                            <p>{mode === 'login' ? 'Welcome back. Let\'s get started.' : 'Join the campus delivery network.'}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {mode === 'signup' && (
                                <div className="form-group">
                                    <label>FULL NAME</label>
                                    <input 
                                        type="text" name="name" placeholder="E.g. Disha Jyala" 
                                        value={form.name} onChange={handleChange} 
                                        className={errors.name ? 'error-input' : ''}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>UNIVERSITY EMAIL</label>
                                <input 
                                    type="email" name="email" placeholder={`id@${UNIVERSITY_DOMAIN}`} 
                                    value={form.email} onChange={handleChange} 
                                    className={errors.email ? 'error-input' : ''}
                                />
                            </div>

                            <div className="form-group">
                                <label>PASSWORD</label>
                                <input 
                                    type="password" name="password" placeholder="••••••••" 
                                    value={form.password} onChange={handleChange} 
                                    className={errors.password ? 'error-input' : ''}
                                />
                            </div>

                            {mode === 'signup' && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>PHONE NUMBER</label>
                                        <input 
                                            type="tel" name="phone" placeholder="98XXXXXXXX" 
                                            value={form.phone} onChange={handleChange} maxLength={10} 
                                            className={errors.phone ? 'error-input' : ''}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ENROLLMENT NO</label>
                                        <input 
                                            type="text" name="enrollment_no" placeholder="E23CSEU..." 
                                            value={form.enrollment_no} onChange={handleChange} 
                                            className={errors.enrollment_no ? 'error-input' : ''}
                                        />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Get Started')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
