import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, toggleAvailability } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, MapPin, Hash, User as UserIcon, Mail, Shield, Star, Package, DollarSign } from 'lucide-react';
import { HOSTELS } from '../config/campus';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        hostel: '',
        room_no: '',
        enrollment_no: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                hostel: user.hostel || '',
                room_no: user.room_no || '',
                enrollment_no: user.enrollment_no || '',
            });
        }
    }, [user]);

    const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleSave = async () => {
        if (!form.name.trim() || !form.hostel || !form.room_no.trim()) {
            return toast.error('Name, hostel, and room are required');
        }
        setSaving(true);
        try {
            const { data } = await updateProfile(form);
            updateUser(data);
            toast.success('Profile updated! ✅');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async () => {
        try {
            const res = await toggleAvailability();
            updateUser({ is_available: res.data.is_available });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn btn-icon btn-ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="page-title">Profile</h1>
                <div style={{ width: 40 }} />
            </div>

            <div className="page-content">
                {/* Avatar & Name Header */}
                <div style={{
                    textAlign: 'center', marginBottom: 24, padding: '24px 0 16px',
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 32, fontFamily: 'Poppins, sans-serif',
                        margin: '0 auto 12px', boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
                    }}>
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</p>

                    {/* Availability toggle */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 12,
                        background: user?.is_available ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        padding: '6px 16px', borderRadius: 999, cursor: 'pointer',
                    }} onClick={handleToggle}>
                        <span style={{ fontSize: 14 }}>{user?.is_available ? '🟢' : '🔴'}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: user?.is_available ? '#16a34a' : '#ef4444' }}>
                            {user?.is_available ? 'Online — Accepting Deliveries' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
                    <div className="stat-card" style={{ textAlign: 'center', padding: 14 }}>
                        <Star size={16} style={{ color: '#f59e0b', marginBottom: 4 }} />
                        <div className="stat-value" style={{ fontSize: 18 }}>{user?.rating?.toFixed(1) || '5.0'}</div>
                        <div className="stat-label">Rating</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center', padding: 14 }}>
                        <Package size={16} style={{ color: 'var(--primary)', marginBottom: 4 }} />
                        <div className="stat-value" style={{ fontSize: 18 }}>{user?.total_deliveries || 0}</div>
                        <div className="stat-label">Deliveries</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center', padding: 14 }}>
                        <DollarSign size={16} style={{ color: '#22c55e', marginBottom: 4 }} />
                        <div className="stat-value" style={{ fontSize: 18 }}>₹{user?.total_earnings || 0}</div>
                        <div className="stat-label">Earned</div>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Personal Info
                    </h3>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <UserIcon size={14} /> Full Name
                        </label>
                        <input className="input" value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Your name" />
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Mail size={14} /> Email
                        </label>
                        <input className="input" value={user?.email || ''} disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Shield size={14} /> Enrollment No
                        </label>
                        <input className="input" value={form.enrollment_no}
                            onChange={(e) => handleChange('enrollment_no', e.target.value)}
                            placeholder="e.g. E22CSEU0001" />
                    </div>
                </div>

                <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Hostel Details
                    </h3>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <MapPin size={14} /> Hostel Block
                        </label>
                        <select className="input" value={form.hostel}
                            onChange={(e) => handleChange('hostel', e.target.value)}>
                            <option value="">Select Hostel</option>
                            {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Hash size={14} /> Room Number
                        </label>
                        <input className="input" value={form.room_no}
                            onChange={(e) => handleChange('room_no', e.target.value)}
                            placeholder="e.g. 405" />
                    </div>
                </div>

                <button className="btn btn-primary btn-w-full btn-lg"
                    onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Saving...' : <><Save size={16} style={{ marginRight: 6 }} /> Save Changes</>}
                </button>
            </div>
        </div>
    );
}
