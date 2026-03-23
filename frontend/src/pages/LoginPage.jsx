import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, signup } from '../services/api';
import { UNIVERSITY_DOMAIN } from '../config/campus';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        enrollment_no: '',
        phone: '',
        hostel: '',
        room_no: '',
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
            navigate(userData.profile_complete ? '/' : '/setup');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
            {/* Hero */}
            <div className="gradient-hero" style={{ padding: '60px 24px 100px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>🚀</div>
                    <h1 style={{ color: 'white', fontSize: 36, marginBottom: 8 }}>UniServe</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.6 }}>
                        Campus delivery, powered by students.<br />Your hostel essentials, on demand.
                    </p>
                </div>
            </div>

            {/* Card */}
            <div style={{ maxWidth: 440, width: '100%', margin: '-48px auto 0', padding: '0 16px 32px', flex: 1 }}>
                <div className="card slide-up" style={{ borderRadius: 24, padding: 32 }}>
                    {/* Mode toggle */}
                    <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
                        {['login', 'signup'].map((m) => (
                             <button key={m}
                                type="button"
                                className="btn"
                                style={{
                                    flex: 1, borderRadius: 9, padding: '10px 0', fontSize: 14,
                                    background: mode === m ? 'white' : 'transparent',
                                    color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => { setMode(m); setErrors({}); }}
                            >
                                {m === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {mode === 'signup' && (
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className={`input${errors.name ? ' error' : ''}`} name="name" placeholder="Your full name" value={form.name} onChange={handleChange} />
                                {errors.name && <p className="input-error">{errors.name}</p>}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">University Email</label>
                            <input className={`input${errors.email ? ' error' : ''}`} type="email" name="email" placeholder={`you@${UNIVERSITY_DOMAIN}`} value={form.email} onChange={handleChange} />
                            {errors.email && <p className="input-error">{errors.email}</p>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input className={`input${errors.password ? ' error' : ''}`} type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
                            {errors.password && <p className="input-error">{errors.password}</p>}
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Phone Number <span style={{ color: 'var(--primary)' }}>(MUST BE REAL)</span></label>
                                    <input className={`input${errors.phone ? ' error' : ''}`} type="tel" name="phone" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} maxLength={10} />
                                    {errors.phone && <p className="input-error">{errors.phone}</p>}
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Enrollment Number</label>
                                    <input className={`input${errors.enrollment_no ? ' error' : ''}`} name="enrollment_no" placeholder="e.g. 22BCE001" value={form.enrollment_no} onChange={handleChange} />
                                    {errors.enrollment_no && <p className="input-error">{errors.enrollment_no}</p>}
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn-primary btn-w-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
                            {loading ? '⏳ Please wait...' : (mode === 'login' ? '🔑 Sign In' : '🚀 Create Account')}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.5 }}>
                        🔒 Only <strong>@{UNIVERSITY_DOMAIN}</strong> emails accepted.<br />
                        Student identity is verified for everyone's safety.
                    </p>
                </div>
            </div>
        </div>
    );
}
