import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { BOYS_HOSTELS, GIRLS_HOSTELS } from '../config/campus';
import toast from 'react-hot-toast';

const steps = ['Personal Info', 'Hostel Details', 'Ready! 🎉'];

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
            toast.error('Please fill all fields');
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
            toast.error(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const hostels = form.hostelGender === 'boys' ? BOYS_HOSTELS : form.hostelGender === 'girls' ? GIRLS_HOSTELS : [];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="gradient-hero" style={{ padding: '48px 24px 72px' }}>
                <h1 style={{ color: 'white', marginBottom: 8 }}>Set Up Your Profile</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    Your details are verified and visible to build campus trust
                </p>
                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
                    {steps.slice(0, 2).map((_, i) => (
                        <div key={i} style={{
                            width: i === step ? 24 : 8, height: 8,
                            borderRadius: 4,
                            background: i <= step ? 'white' : 'rgba(255,255,255,0.35)',
                            transition: 'all 0.3s ease',
                        }} />
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 440, width: '100%', margin: '-48px auto 0', padding: '0 16px 32px', flex: 1 }}>
                {step === 0 && (
                    <div className="card slide-up" style={{ borderRadius: 24, padding: 32 }}>
                        <h2 style={{ marginBottom: 24 }}>Personal Info</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Enrollment Number</label>
                                <input className="input" name="enrollment_no" placeholder="e.g. 22BCE001" value={form.enrollment_no} onChange={handleChange} />
                            </div>
                            <button className="btn btn-primary btn-w-full btn-lg" style={{ marginTop: 8 }}
                                onClick={handleNext} disabled={!form.name || !form.enrollment_no}>
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="card slide-up" style={{ borderRadius: 24, padding: 32 }}>
                        <h2 style={{ marginBottom: 24 }}>Hostel Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div className="input-group">
                                <label className="input-label">I Stay In</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {['boys', 'girls'].map((g) => (
                                        <button key={g}
                                            className={`btn btn-w-full ${form.hostelGender === g ? 'btn-primary' : 'btn-ghost'}`}
                                            onClick={() => setForm((f) => ({ ...f, hostelGender: g, hostel: '' }))}>
                                            {g === 'boys' ? '🏠 Boys (C-Block)' : '🏠 Girls (D-Block)'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {form.hostelGender && (
                                <div className="input-group">
                                    <label className="input-label">Hostel Number</label>
                                    <select className="input" name="hostel" value={form.hostel} onChange={handleChange}>
                                        <option value="">Select your hostel</option>
                                        {hostels.map((h) => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Room Number</label>
                                <input className="input" name="room_no" placeholder="e.g. 205" value={form.room_no} onChange={handleChange} />
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button className="btn btn-ghost btn-w-full" onClick={() => setStep(0)}>← Back</button>
                                <button className="btn btn-primary btn-w-full btn-lg"
                                    onClick={handleSubmit}
                                    disabled={loading || !form.hostel || !form.room_no}>
                                    {loading ? '⏳ Saving...' : 'Finish Setup ✓'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="card slide-up" style={{ borderRadius: 24, padding: 32, textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                        <h2 style={{ marginBottom: 8 }}>You&apos;re all set!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                            Your verified campus profile is ready.<br />
                            Start ordering or earn by delivering!
                        </p>
                        <button className="btn btn-primary btn-w-full btn-lg" onClick={() => navigate('/')}>
                            🚀 Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
