import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { BOYS_HOSTELS, GIRLS_HOSTELS } from '../config/campus';
import toast from 'react-hot-toast';
import { User, Home, CheckCircle2, ArrowRight, ArrowLeft, Box } from 'lucide-react';

const steps = ['Identity', 'Habitat', 'Finalized'];

export default function ProfileSetupPage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        enrollment_no: user?.enrollment_no || '',
        hostelGender: '',
        hostel: user?.hostel || '',
        room_no: user?.room_no || '',
    });

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const handleNext = () => setStep((s) => s + 1);

    const handleSubmit = async () => {
        if (!form.name || !form.enrollment_no || !form.hostel || !form.room_no) {
            toast.error('Mission data incomplete');
            return;
        }
        setLoading(true);
        try {
            const res = await updateProfile({
                name: form.name,
                enrollment_no: form.enrollment_no,
                hostel: form.hostel,
                room_no: form.room_no,
            });
            updateUser({ ...res.data, profile_complete: true });
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Protocol failure during save');
        } finally {
            setLoading(false);
        }
    };

    const hostels = form.hostelGender === 'boys' ? BOYS_HOSTELS : form.hostelGender === 'girls' ? GIRLS_HOSTELS : [];

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Plus Jakarta Sans' }}>
            {/* ── LUXE HUD HEADER ── */}
            <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '60px 24px 100px', position: 'relative', overflow: 'hidden' }}>
                {/* Mesh Orbs */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '80%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <User color="#fff" size={24} />
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>V4_PROFILE_INIT</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500 }}>INITIALIZE YOUR CAMPUS CREDENTIALS</p>
                    
                    {/* Progress Bar */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
                        {steps.map((_, i) => (
                            <div key={i} style={{
                                width: step === i ? 40 : 12, height: 6, borderRadius: 10,
                                background: step === i ? '#fff' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── INTERACTIVE FORM ── */}
            <div style={{ maxWidth: 460, width: '100%', margin: '-40px auto 0', padding: '0 20px 60px', position: 'relative', zIndex: 10 }}>
                <div style={{ 
                    background: '#fff', borderRadius: 32, padding: 40, 
                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    
                    {step === 0 && (
                        <div className="slide-up">
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1E293B', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 18, background: '#4F46E5', borderRadius: 4 }} />
                                IDENTITY_LINK
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>LEGAL_NAME</label>
                                    <input style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>ENROLLMENT_KEY</label>
                                    <input style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} name="enrollment_no" placeholder="E23CSEUXXXX" value={form.enrollment_no} onChange={handleChange} />
                                </div>
                                <button onClick={handleNext} disabled={!form.name || !form.enrollment_no} style={{ marginTop: 8, height: 56, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}>
                                    CONTINUE <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="slide-up">
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1E293B', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 18, background: '#7C3AED', borderRadius: 4 }} />
                                HABITAT_LOCATOR
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {['boys', 'girls'].map((g) => (
                                        <button key={g} onClick={() => setForm((f) => ({ ...f, hostelGender: g, hostel: '' }))} style={{ height: 48, borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: form.hostelGender === g ? '#4F46E5' : '#F1F5F9', color: form.hostelGender === g ? '#fff' : '#64748B', transition: 'all 0.2s ease' }}>
                                            {g === 'boys' ? 'B-HOSTEL' : 'G-HOSTEL'}
                                        </button>
                                    ))}
                                </div>
                                {form.hostelGender && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>BLOCK_SELECT</label>
                                        <select style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} name="hostel" value={form.hostel} onChange={handleChange}>
                                            <option value="">BLOCK_NO</option>
                                            {hostels.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>CHAMBER_NO</label>
                                    <input style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} name="room_no" placeholder="E.g. 205" value={form.room_no} onChange={handleChange} />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => setStep(0)} style={{ flex: 1, height: 56, background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>BACK</button>
                                    <button onClick={handleSubmit} disabled={loading || !form.hostel || !form.room_no} style={{ flex: 2, height: 56, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}>
                                        {loading ? 'SYNCING...' : 'FINALIZE_INIT'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ textAlign: 'center' }} className="slide-up">
                            <div style={{ width: 80, height: 80, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22C55E' }}>
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1E293B', marginBottom: 12 }}>Initialization Success</h2>
                            <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
                                YOUR CAMPUS IDENTITY IS NOW ACTIVE AND VERIFIED. <br /> PROCEED TO MISSION DASHBOARD.
                            </p>
                            <button onClick={() => navigate('/')} style={{ width: '100%', height: 56, background: '#1E293B', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                DASHBOARD_HUB <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
