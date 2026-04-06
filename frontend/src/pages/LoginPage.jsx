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
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Background Decorations */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)' }} />

            {/* Hero */}
            <div className="gradient-hero" style={{ padding: '80px 24px 120px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <span style={{ fontSize: 40 }}>🚀</span>
                    </div>
                    <h1 style={{ color: 'white', fontSize: 48, marginBottom: 12, letterSpacing: '-2px', fontWeight: 900 }}>UniServe</h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 1.6, fontWeight: 500, maxWidth: 400, margin: '0 auto' }}>
                        Campus delivery, powered by students.<br />Your hostel essentials, on demand.
                    </p>
                </div>
            </div>

            {/* Card */}
            <div style={{ maxWidth: 480, width: '100%', margin: '-60px auto 0', padding: '0 16px 48px', position: 'relative', zIndex: 10 }}>
                <div className="card slide-up" style={{ borderRadius: 32, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.8)' }}>
                    {/* Mode toggle */}
                    <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 16, padding: 6, marginBottom: 32, border: '1px solid var(--border-strong)' }}>
                        {['login', 'signup'].map((m) => (
                             <button key={m}
                                type="button"
                                className="btn"
                                style={{
                                    flex: 1, borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700,
                                    background: mode === m ? 'white' : 'transparent',
                                    color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: mode === m ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onClick={() => { setMode(m); setErrors({}); }}
                            >
                                {m === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {mode === 'signup' && (
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className={`input${errors.name ? ' error' : ''}`} name="name" placeholder="John Doe" value={form.name} onChange={handleChange} />
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
                            <input className={`input${errors.password ? ' error' : ''}`} type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} />
                            {errors.password && <p className="input-error">{errors.password}</p>}
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Phone Number</label>
                                    <input className={`input${errors.phone ? ' error' : ''}`} type="tel" name="phone" placeholder="10-digit mobile" value={form.phone} onChange={handleChange} maxLength={10} />
                                    {errors.phone && <p className="input-error">{errors.phone}</p>}
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Enrollment Number</label>
                                    <input className={`input${errors.enrollment_no ? ' error' : ''}`} name="enrollment_no" placeholder="e.g. 22BCE001" value={form.enrollment_no} onChange={handleChange} />
                                    {errors.enrollment_no && <p className="input-error">{errors.enrollment_no}</p>}
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn-primary btn-w-full btn-lg" style={{ marginTop: 12, height: 60, fontSize: 17, fontWeight: 800, borderRadius: 18 }} disabled={loading}>
                            {loading ? '⏳ Connecting...' : (mode === 'login' ? 'Sign In' : 'Create My Account')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
                            By continuing, you agree to student verification.<br />
                            Only <strong>@{UNIVERSITY_DOMAIN}</strong> accounts allowed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
