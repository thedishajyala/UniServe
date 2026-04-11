import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, signup } from '../services/api';
import { UNIVERSITY_DOMAIN } from '../config/campus';
import toast from 'react-hot-toast';
import { Box } from 'lucide-react';

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
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: 'Plus Jakarta Sans' }}>
            {/* ── LUXE MESH BACKGROUND ── */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45vh', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', zIndex: 0 }}>
                {/* Animated Gradient Orbs */}
                <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '100%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%', animation: 'float-bg 20s infinite alternate' }} />
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '80%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 50%)', borderRadius: '50%', animation: 'float-bg 15s infinite alternate-reverse' }} />
            </div>

            {/* ── LOGO HUD ── */}
            <div style={{ position: 'relative', zIndex: 1, padding: '60px 24px 80px', textAlign: 'center' }}>
                <div style={{ 
                    width: 72, height: 72, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', borderRadius: 24, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', 
                    border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ 
                        width: 36, height: 36, background: '#fff', borderRadius: 10, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#4F46E5', fontSize: 20
                    }}>U</div>
                </div>
                <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 900, letterSpacing: '-2px', marginBottom: 8 }}>UniServe</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 500, letterSpacing: '0.02em' }}>THE CAMPUS LOGISTICS HUB</p>
            </div>

            {/* ── SECURITY CARD ── */}
            <div style={{ maxWidth: 460, width: '100%', margin: '-40px auto 0', padding: '0 20px 60px', position: 'relative', zIndex: 10 }}>
                <div style={{ 
                    background: '#fff', borderRadius: 32, padding: 40, 
                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    {/* MODE TERMINAL */}
                    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 18, padding: 6, marginBottom: 32 }}>
                        {['login', 'signup'].map((m) => (
                             <button key={m}
                                type="button"
                                style={{
                                    flex: 1, borderRadius: 14, padding: '12px 0', fontSize: 14, fontWeight: 800,
                                    background: mode === m ? '#fff' : 'transparent',
                                    color: mode === m ? '#4F46E5' : '#64748B',
                                    boxShadow: mode === m ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
                                }}
                                onClick={() => { setMode(m); setErrors({}); }}
                            >
                                {m === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {mode === 'signup' && (
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>LEGAL_NAME</label>
                                <input 
                                    style={{ width: '100%', background: '#F8FAFC', border: `1px solid ${errors.name ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                                    name="name" placeholder="E.g. Disha Jyala" value={form.name} onChange={handleChange} 
                                />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>CAMPUS_IDENTITY</label>
                            <input 
                                style={{ width: '100%', background: '#F8FAFC', border: `1px solid ${errors.email ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                                type="email" name="email" placeholder={`id@${UNIVERSITY_DOMAIN}`} value={form.email} onChange={handleChange} 
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>SECURITY_KEY</label>
                            <input 
                                style={{ width: '100%', background: '#F8FAFC', border: `1px solid ${errors.password ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                                type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} 
                            />
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>MOBILE_LINK</label>
                                        <input 
                                            style={{ width: '100%', background: '#F8FAFC', border: `1px solid ${errors.phone ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                                            type="tel" name="phone" placeholder="98XXXXXXXX" value={form.phone} onChange={handleChange} maxLength={10} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>ENTRY_NO</label>
                                        <input 
                                            style={{ width: '100%', background: '#F8FAFC', border: `1px solid ${errors.enrollment_no ? '#EF4444' : '#E2E8F0'}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                                            name="enrollment_no" placeholder="E23CSEU..." value={form.enrollment_no} onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: '10px 14px' }}>
                                    <p style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, lineHeight: 1.4 }}>
                                        ⚠️ WARNING: Registered Email and Phone Number <strong>cannot be changed</strong> later for security reasons.
                                    </p>
                                </div>
                            </>
                        )}

                        <button 
                            type="submit" 
                            style={{ 
                                marginTop: 8, height: 56, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 16, 
                                fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)', transition: 'all 0.2s ease'
                            }} 
                            className="btn-luxe"
                            disabled={loading}
                        >
                            {loading ? 'Initializing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, lineHeight: 1.6 }}>
                            AUTHORIZED ACCESS ONLY • BENNETT UNIVERSITY<br />
                            <span style={{ color: '#4F46E5', fontWeight: 800 }}>V4_PROTOCOL_ACTIVE</span>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float-bg {
                    from { transform: translate(0, 0) scale(1); }
                    to { transform: translate(10%, 10%) scale(1.1); }
                }
                .btn-luxe:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.5);
                }
                .btn-luxe:active {
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
}
