import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, toggleAvailability } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, MapPin, Hash, User as UserIcon, Mail, Shield, Star, Package, DollarSign, Home, TrendingUp, Phone } from 'lucide-react';
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
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                hostel: user.hostel || '',
                room_no: user.room_no || '',
                enrollment_no: user.enrollment_no || '',
                phone: user.phone || '',
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
        <div className="page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            {/* Hero Header */}
            <div className="gradient-hero" style={{ padding: '48px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
                <div style={{ position: 'absolute', top: -30, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: 88, height: 88, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 32, fontFamily: 'Outfit, sans-serif',
                        margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                    }}>
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h1 style={{ color: 'white', fontSize: 24, marginBottom: 4, fontFamily: 'Outfit' }}>{user?.name}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 }}>{user?.email}</p>

                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        background: user?.is_available ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.15)',
                        padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)'
                    }} onClick={handleToggle}>
                        <span style={{ fontSize: 14 }}>{user?.is_available ? '🟢' : '🔴'}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>
                            {user?.is_available ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="page-content" style={{ marginTop: -48, paddingBottom: 100, position: 'relative', zIndex: 2 }}>
                {/* Stats Row */}
                <div className="stat-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <Star size={18} style={{ color: '#f59e0b', marginBottom: 6 }} />
                        <div className="stat-value">
                            {user?.total_reviews > 0 ? Number(user.rating || 0).toFixed(1) : '—'}
                        </div>
                        <div className="stat-label">
                            {user?.total_reviews > 0 ? `⭐ (${user.total_reviews})` : 'New 🆕'}
                        </div>
                    </div>
                    <div className="stat-card">
                        <Package size={18} style={{ color: 'var(--primary)', marginBottom: 6 }} />
                        <div className="stat-value">{user?.total_deliveries || 0}</div>
                        <div className="stat-label">Deliveries</div>
                    </div>
                    <div className="stat-card">
                        <DollarSign size={18} style={{ color: '#22c55e', marginBottom: 6 }} />
                        <div className="stat-value">₹{user?.total_earnings || 0}</div>
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
                            <UserIcon size={14} /> Full Name {user?.name_changed_once && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 'bold' }}>(LOCKED 🔒)</span>}
                        </label>
                        <input className="input" value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            disabled={user?.name_changed_once}
                            style={{ opacity: user?.name_changed_once ? 0.6 : 1, cursor: user?.name_changed_once ? 'not-allowed' : 'text' }}
                            placeholder="Your name" />
                        {!user?.name_changed_once && <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>⚠️ You can only rename this once.</p>}
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Mail size={14} /> Email
                        </label>
                        <input className="input" value={user?.email || ''} disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        <p style={{ fontSize: 10, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>🔒 This cannot be changed.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Phone size={14} /> Registered Phone
                        </label>
                        <input className="input" value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            disabled={!!user?.phone}
                            style={{ opacity: user?.phone ? 0.6 : 1, cursor: user?.phone ? 'not-allowed' : 'text' }}
                            placeholder="e.g. 98XXXXXXXX" />
                        <p style={{ fontSize: 10, color: user?.phone ? '#EF4444' : 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
                            {user?.phone ? '🔒 This cannot be changed.' : '⚠️ Once saved, this cannot be changed.'}
                        </p>
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

            {/* Bottom Nav */}
            <nav className="bottom-nav">
                <Link to="/" className="nav-item">
                    <div className="nav-icon-wrapper"><Home size={20} /></div>
                    <span className="nav-label">Home</span>
                </Link>
                <Link to="/order/create" className="nav-item">
                    <div className="nav-icon-wrapper"><Package size={20} /></div>
                    <span className="nav-label">Order</span>
                </Link>
                <Link to="/earnings" className="nav-item">
                    <div className="nav-icon-wrapper"><TrendingUp size={20} /></div>
                    <span className="nav-label">Earnings</span>
                </Link>
                <Link to="/profile" className="nav-item active">
                    <div className="nav-icon-wrapper active-pill"><UserIcon size={20} /></div>
                    <span className="nav-label">Profile</span>
                </Link>
            </nav>
        </div>
    );
}
