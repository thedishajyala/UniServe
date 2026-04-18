// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { updateProfile, toggleAvailability, getPartnerReviews, replyToReview } from '../services/api';
// import toast from 'react-hot-toast';
// import { ArrowLeft, Save, MapPin, Hash, User as UserIcon, Mail, Shield, Star, Package, DollarSign, Home, TrendingUp, Phone, MessageSquare, Send } from 'lucide-react';
// import { HOSTELS } from '../config/campus';

// export default function ProfilePage() {
//     const { user, updateUser } = useAuth();
//     const navigate = useNavigate();
//     const [saving, setSaving] = useState(false);
//     const [form, setForm] = useState({
//         name: '',
//         hostel: '',
//         room_no: '',
//         enrollment_no: '',
//         phone: '',
//     });
//     const [reviews, setReviews] = useState([]);
//     const [replyingTo, setReplyingTo] = useState(null); // Review ID
//     const [replyText, setReplyText] = useState('');
//     const [submittingReply, setSubmittingReply] = useState(false);

//     useEffect(() => {
//         if (user) {
//             setForm({
//                 name: user.name || '',
//                 hostel: user.hostel || '',
//                 room_no: user.room_no || '',
//                 enrollment_no: user.enrollment_no || '',
//                 phone: user.phone || '',
//             });
//             loadReviews();
//         }
//     }, [user]);

//     const loadReviews = async () => {
//         try {
//             const { data } = await getPartnerReviews(user._id);
//             setReviews(data);
//         } catch { }
//     };

//     const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

//     const handleSave = async () => {
//         if (!form.name.trim() || !form.hostel || !form.room_no.trim()) {
//             return toast.error('Name, hostel, and room are required');
//         }
//         setSaving(true);
//         try {
//             const { data } = await updateProfile(form);
//             updateUser(data);
//             toast.success('Profile updated! ✅');
//         } catch (err) {
//             toast.error(err.response?.data?.message || 'Failed to update');
//         } finally {
//             setSaving(false);
//         }
//     };

//     const handleToggle = async () => {
//         try {
//             const res = await toggleAvailability();
//             updateUser({ is_available: res.data.is_available });
//             toast.success(res.data.message);
//         } catch (err) {
//             toast.error(err.response?.data?.message || 'Failed');
//         }
//     };

//     const handleSendReply = async (reviewId) => {
//         if (!replyText.trim()) return;
//         setSubmittingReply(true);
//         try {
//             await replyToReview(reviewId, { reply_text: replyText });
//             toast.success('Your verdict has been posted! 💬');
//             setReplyText('');
//             setReplyingTo(null);
//             loadReviews(); // Refresh
//         } catch (err) {
//             toast.error(err.response?.data?.message || 'Failed to reply');
//         } finally {
//             setSubmittingReply(false);
//         }
//     };

//     return (
//         <div className="page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
//             {/* Hero Header */}
//             <div className="gradient-hero" style={{ padding: '48px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
//                 <div style={{ position: 'absolute', top: -30, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

//                 <div style={{ position: 'relative', zIndex: 1 }}>
//                     <div style={{
//                         width: 88, height: 88, borderRadius: '50%',
//                         background: 'rgba(255,255,255,0.15)',
//                         backdropFilter: 'blur(10px)',
//                         border: '2px solid rgba(255,255,255,0.3)',
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         color: '#fff', fontWeight: 800, fontSize: 32, fontFamily: 'Outfit, sans-serif',
//                         margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
//                     }}>
//                         {(user?.name || 'U').charAt(0).toUpperCase()}
//                     </div>
//                     <h1 style={{ color: 'white', fontSize: 24, marginBottom: 4, fontFamily: 'Outfit' }}>{user?.name}</h1>
//                     <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 }}>{user?.email}</p>

//                     <div style={{
//                         display: 'inline-flex', alignItems: 'center', gap: 10,
//                         background: user?.is_available ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.15)',
//                         padding: '8px 20px', borderRadius: 999, cursor: 'pointer',
//                         border: '1px solid rgba(255,255,255,0.2)',
//                         backdropFilter: 'blur(8px)'
//                     }} onClick={handleToggle}>
//                         <span style={{ fontSize: 14 }}>{user?.is_available ? '🟢' : '🔴'}</span>
//                         <span style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>
//                             {user?.is_available ? 'Online' : 'Offline'}
//                         </span>
//                     </div>
//                 </div>
//             </div>

//             <div className="page-content" style={{ marginTop: -48, paddingBottom: 100, position: 'relative', zIndex: 2 }}>
//                 {/* Stats Row */}
//                 <div className="stat-grid" style={{ marginBottom: 24 }}>
//                     <div className="stat-card">
//                         <Star size={18} style={{ color: '#f59e0b', marginBottom: 6 }} />
//                         <div className="stat-value">
//                             {user?.total_reviews > 0 ? Number(user.rating || 0).toFixed(1) : '—'}
//                         </div>
//                         <div className="stat-label">
//                             {user?.total_reviews > 0 ? `⭐ (${user.total_reviews})` : 'New 🆕'}
//                         </div>
//                     </div>
//                     <div className="stat-card">
//                         <Package size={18} style={{ color: 'var(--primary)', marginBottom: 6 }} />
//                         <div className="stat-value">{user?.total_deliveries || 0}</div>
//                         <div className="stat-label">Deliveries</div>
//                     </div>
//                     <div className="stat-card">
//                         <DollarSign size={18} style={{ color: '#22c55e', marginBottom: 6 }} />
//                         <div className="stat-value">₹{user?.total_earnings || 0}</div>
//                         <div className="stat-label">Earned</div>
//                     </div>
//                 </div>

//                 {/* Editable Fields */}
//                 <div className="card" style={{ padding: 20, marginBottom: 16 }}>
//                     <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
//                         Personal Info
//                     </h3>

//                     <div className="form-group" style={{ marginBottom: 16 }}>
//                         <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
//                             <UserIcon size={14} /> Full Name {user?.name_changed_once && <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 'bold' }}>(LOCKED 🔒)</span>}
//                         </label>
//                         <input className="input" value={form.name}
//                             onChange={(e) => handleChange('name', e.target.value)}
//                             disabled={user?.name_changed_once}
//                             style={{ opacity: user?.name_changed_once ? 0.6 : 1, cursor: user?.name_changed_once ? 'not-allowed' : 'text' }}
//                             placeholder="Your name" />
//                         {!user?.name_changed_once && <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>⚠️ You can only rename this once.</p>}
//                     </div>

//                     <div className="form-group" style={{ marginBottom: 16 }}>
//                         <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
//                             <Mail size={14} /> Email
//                         </label>
//                         <input className="input" value={user?.email || ''} disabled
//                             style={{ opacity: 0.6, cursor: 'not-allowed' }} />
//                         <p style={{ fontSize: 10, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>🔒 This cannot be changed.</p>
//                     </div>

//                     <div className="form-group" style={{ marginBottom: 16 }}>
//                         <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
//                             <Phone size={14} /> Registered Phone
//                         </label>
//                         <input className="input" value={form.phone}
//                             onChange={(e) => handleChange('phone', e.target.value)}
//                             disabled={!!user?.phone}
//                             style={{ opacity: user?.phone ? 0.6 : 1, cursor: user?.phone ? 'not-allowed' : 'text' }}
//                             placeholder="e.g. 98XXXXXXXX" />
//                         <p style={{ fontSize: 10, color: user?.phone ? '#EF4444' : 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
//                             {user?.phone ? '🔒 This cannot be changed.' : '⚠️ Once saved, this cannot be changed.'}
//                         </p>
//                     </div>

//                     <div className="form-group" style={{ marginBottom: 16 }}>
//                         <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
//                             <Shield size={14} /> Enrollment No
//                         </label>
//                         <input className="input" value={form.enrollment_no}
//                             onChange={(e) => handleChange('enrollment_no', e.target.value)}
//                             placeholder="e.g. E22CSEU0001" />
//                     </div>
//                 </div>

//                 <div className="card" style={{ padding: 20, marginBottom: 20 }}>
//                     <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
//                         Hostel Details
//                     </h3>

//                     <div className="form-group" style={{ marginBottom: 16 }}>
//                         <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
//                             <MapPin size={14} /> Hostel Block
//                         </label>
//                         <select className="input" value={form.hostel}
//                             onChange={(e) => handleChange('hostel', e.target.value)}>
//                             <option value="">Select Hostel</option>
//                             {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
//                         </select>
//                     </div>

//                     <div className="form-group" style={{ marginBottom: 0 }}>
//                         <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
//                             <Hash size={14} /> Room Number
//                         </label>
//                         <input className="input" value={form.room_no}
//                             onChange={(e) => handleChange('room_no', e.target.value)}
//                             placeholder="e.g. 405" />
//                     </div>
//                 </div>

//                 <button className="btn btn-primary btn-w-full btn-lg"
//                     onClick={handleSave} disabled={saving} style={{ marginBottom: 32 }}>
//                     {saving ? '⏳ Saving...' : <><Save size={16} style={{ marginRight: 6 }} /> Save Changes</>}
//                 </button>

//                 {/* Reviews Section */}
//                 <div style={{ paddingBottom: 40 }}>
//                     <div className="section-header" style={{ marginBottom: 16 }}>
//                         <h3 className="section-title">💬 Feedback Received</h3>
//                     </div>
//                     {reviews.length === 0 ? (
//                         <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
//                             <p style={{ fontSize: 13 }}>No reviews yet. Keep delivering to build your reputation!</p>
//                         </div>
//                     ) : (
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                             {reviews.map(review => (
//                                 <div key={review._id} className="card" style={{ padding: 16 }}>
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
//                                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                                             <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
//                                                 {review.reviewer_id?.name?.charAt(0) || 'S'}
//                                             </div>
//                                             <span style={{ fontSize: 13, fontWeight: 700 }}>{review.reviewer_id?.name || 'Student'}</span>
//                                         </div>
//                                         <div style={{ color: '#F59E0B', display: 'flex', gap: 2 }}>
//                                             {[...Array(5)].map((_, i) => (
//                                                 <Star key={i} size={12} fill={i < review.rating ? '#F59E0B' : 'transparent'} strokeWidth={2.5} />
//                                             ))}
//                                         </div>
//                                     </div>
//                                     <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: review.review_text ? 'normal' : 'italic' }}>
//                                         {review.review_text || 'No comment provided.'}
//                                     </p>

//                                     {review.reply_text ? (
//                                         <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 12, borderLeft: '3px solid var(--primary)' }}>
//                                             <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase' }}>Your Verdict</p>
//                                             <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{review.reply_text}</p>
//                                         </div>
//                                     ) : (
//                                         replyingTo === review._id ? (
//                                             <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
//                                                 <input className="input" style={{ flex: 1, padding: '8px 12px', fontSize: 13, height: 40 }}
//                                                     placeholder="Write your verdict..." value={replyText}
//                                                     onChange={e => setReplyText(e.target.value)} autoFocus />
//                                                 <button className="btn btn-primary" style={{ padding: '0 12px', height: 40, borderRadius: 10 }}
//                                                     onClick={() => handleSendReply(review._id)} disabled={submittingReply || !replyText.trim()}>
//                                                     <Send size={16} />
//                                                 </button>
//                                                 <button className="btn btn-ghost" style={{ padding: '0 12px', height: 40, border: 'none' }}
//                                                     onClick={() => { setReplyingTo(null); setReplyText(''); }}>
//                                                     Cancel
//                                                 </button>
//                                             </div>
//                                         ) : (
//                                             <button className="btn btn-ghost" style={{ padding: '4px 8px', height: 'auto', fontSize: 11, marginTop: 10, color: 'var(--primary)', fontWeight: 700 }}
//                                                 onClick={() => setReplyingTo(review._id)}>
//                                                 <MessageSquare size={12} style={{ marginRight: 4 }} /> Reply to this review
//                                             </button>
//                                         )
//                                     )}
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Bottom Nav */}
//             <nav className="bottom-nav">
//                 <Link to="/" className="nav-item">
//                     <div className="nav-icon-wrapper"><Home size={20} /></div>
//                     <span className="nav-label">Home</span>
//                 </Link>
//                 <Link to="/earnings" className="nav-item">
//                     <div className="nav-icon-wrapper"><TrendingUp size={20} /></div>
//                     <span className="nav-label">Earnings</span>
//                 </Link>
//                 <Link to="/profile" className="nav-item active">
//                     <div className="nav-icon-wrapper active-pill"><UserIcon size={20} /></div>
//                     <span className="nav-label">Profile</span>
//                 </Link>
//             </nav>
//         </div>
//     );
// }
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    updateProfile,
    toggleAvailability,
    getPartnerReviews,
    replyToReview
} from '../services/api';
import toast from 'react-hot-toast';

import {
    Save,
    MapPin,
    Hash,
    User as UserIcon,
    Mail,
    Shield,
    Star,
    Package,
    DollarSign,
    Home,
    TrendingUp,
    Phone,
    MessageSquare,
    Send,
    Package2
} from 'lucide-react';

import { HOSTELS } from '../config/campus';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();

    const [saving, setSaving] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const [form, setForm] = useState({
        name: '',
        hostel: '',
        room_no: '',
        enrollment_no: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                hostel: user.hostel || '',
                room_no: user.room_no || '',
                enrollment_no: user.enrollment_no || '',
                phone: user.phone || ''
            });

            loadReviews();
        }
    }, [user]);

    const loadReviews = async () => {
        try {
            const { data } = await getPartnerReviews(user._id);
            setReviews(data);
        } catch (error) { }
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.hostel || !form.room_no.trim()) {
            return toast.error('Name, hostel and room are required');
        }

        try {
            setSaving(true);
            const { data } = await updateProfile(form);
            updateUser(data);
            toast.success('Profile updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async () => {
        try {
            const res = await toggleAvailability();

            updateUser({
                is_available: res.data.is_available
            });

            toast.success(res.data.message);
        } catch (error) {
            toast.error('Failed');
        }
    };

    const handleSendReply = async (reviewId) => {
        if (!replyText.trim()) return;

        try {
            setSubmittingReply(true);

            await replyToReview(reviewId, {
                reply_text: replyText
            });

            toast.success('Reply sent');
            setReplyText('');
            setReplyingTo(null);
            loadReviews();
        } catch (error) {
            toast.error('Failed');
        } finally {
            setSubmittingReply(false);
        }
    };

    return (
        <div
            className="page"
            style={{
                background: 'var(--bg)',
                minHeight: '100vh'
            }}
        >
            {/* HEADER */}
            <div
                className="gradient-hero"
                style={{
                    padding: '48px 24px 80px',
                    textAlign: 'center',
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30
                }}
            >
                <div
                    style={{
                        width: 88,
                        height: 88,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 32,
                        margin: '0 auto 16px'
                    }}
                >
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>

                <h1 style={{ color: 'white', fontSize: 24 }}>
                    {user?.name}
                </h1>

                <p
                    style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 13
                    }}
                >
                    {user?.email}
                </p>

                <div
                    onClick={handleToggle}
                    style={{
                        marginTop: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 20px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        background: user?.is_available
                            ? 'rgba(34,197,94,0.2)'
                            : 'rgba(255,255,255,0.15)'
                    }}
                >
                    <span>{user?.is_available ? '🟢' : '🔴'}</span>

                    <span
                        style={{
                            color: 'white',
                            fontWeight: 700
                        }}
                    >
                        {user?.is_available ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* PAGE CONTENT */}
            <div
                className="page-content"
                style={{
                    marginTop: -48,
                    paddingBottom: 120
                }}
            >
                {/* STATS ROW */}
<div
  className="stat-grid"
  style={{
    marginBottom: 24,
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",   // 2 top + 2 bottom
    gap: 12
  }}
>
  {/* Rating */}
  <div className="stat-card">
    <Star size={18} style={{ color: "#f59e0b", marginBottom: 6 }} />

    <div className="stat-value">
      {user?.total_reviews > 0
        ? Number(user.rating || 0).toFixed(1)
        : "—"}
    </div>

    <div className="stat-label">
      {user?.total_reviews > 0
        ? `⭐ (${user.total_reviews})`
        : "New 🆕"}
    </div>
  </div>

  {/* Deliveries */}
  <div className="stat-card">
    <Package
      size={18}
      style={{ color: "var(--primary)", marginBottom: 6 }}
    />

    <div className="stat-value">
      {user?.total_deliveries || 0}
    </div>

    <div className="stat-label">
      Deliveries
    </div>
  </div>

  {/* Earned */}
  <div className="stat-card">
    <DollarSign
      size={18}
      style={{ color: "#22c55e", marginBottom: 6 }}
    />

    <div className="stat-value">
      ₹{user?.total_earnings || 0}
    </div>

    <div className="stat-label">
      Earned
    </div>
  </div>

  {/* Orders Bottom Right */}
  <Link
    to="/my-orders"
    className="stat-card"
    style={{
      textDecoration: "none",
      background:
        "linear-gradient(135deg,#4F46E5,#6366F1)",
      color: "white"
    }}
  >
    <Package2 size={18} style={{ marginBottom: 6 }} />

    <div
      className="stat-value"
      style={{
        color: "white",
        fontSize: 18
      }}
    >
      View
    </div>

    <div
      className="stat-label"
      style={{
        color: "rgba(255,255,255,0.9)"
      }}
    >
      Orders
    </div>
  </Link>
</div>

                {/* PERSONAL INFO */}
                <div
                    className="card"
                    style={{
                        padding: 20,
                        marginBottom: 16
                    }}
                >
                    <h3 style={{ marginBottom: 16 }}>
                        Personal Info
                    </h3>

                    <input
                        className="input"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={(e) =>
                            handleChange('name', e.target.value)
                        }
                        style={{ marginBottom: 12 }}
                    />

                    <input
                        className="input"
                        value={user?.email || ''}
                        disabled
                        style={{ marginBottom: 12 }}
                    />

                    <input
                        className="input"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) =>
                            handleChange('phone', e.target.value)
                        }
                        style={{ marginBottom: 12 }}
                    />

                    <input
                        className="input"
                        placeholder="Enrollment Number"
                        value={form.enrollment_no}
                        onChange={(e) =>
                            handleChange(
                                'enrollment_no',
                                e.target.value
                            )
                        }
                    />
                </div>

                {/* HOSTEL */}
                <div
                    className="card"
                    style={{
                        padding: 20,
                        marginBottom: 18
                    }}
                >
                    <h3 style={{ marginBottom: 16 }}>
                        Hostel Details
                    </h3>

                    <select
                        className="input"
                        value={form.hostel}
                        onChange={(e) =>
                            handleChange('hostel', e.target.value)
                        }
                        style={{ marginBottom: 12 }}
                    >
                        <option value="">
                            Select Hostel
                        </option>

                        {HOSTELS.map((hostel) => (
                            <option
                                key={hostel}
                                value={hostel}
                            >
                                {hostel}
                            </option>
                        ))}
                    </select>

                    <input
                        className="input"
                        placeholder="Room Number"
                        value={form.room_no}
                        onChange={(e) =>
                            handleChange(
                                'room_no',
                                e.target.value
                            )
                        }
                    />
                </div>

                {/* SAVE */}
                <button
                    className="btn btn-primary btn-w-full btn-lg"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        marginBottom: 30
                    }}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>

                {/* REVIEWS */}
                <div style={{ paddingBottom: 40 }}>
                    <h3 style={{ marginBottom: 16 }}>
                        💬 Feedback Received
                    </h3>

                    {reviews.length === 0 ? (
                        <div
                            className="card"
                            style={{ padding: 20 }}
                        >
                            No reviews yet
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div
                                key={review._id}
                                className="card"
                                style={{
                                    padding: 16,
                                    marginBottom: 12
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent:
                                            'space-between',
                                        marginBottom: 8
                                    }}
                                >
                                    <strong>
                                        {review.reviewer_id
                                            ?.name || 'Student'}
                                    </strong>

                                    <div>
                                        {[...Array(5)].map(
                                            (_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    fill={
                                                        i <
                                                            review.rating
                                                            ? '#f59e0b'
                                                            : 'transparent'
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>

                                <p>
                                    {review.review_text ||
                                        'No comment'}
                                </p>

                                {review.reply_text ? (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            padding: 10,
                                            background:
                                                '#EEF2FF',
                                            borderRadius: 10
                                        }}
                                    >
                                        {review.reply_text}
                                    </div>
                                ) : replyingTo ===
                                    review._id ? (
                                    <div
                                        style={{
                                            marginTop: 10
                                        }}
                                    >
                                        <input
                                            className="input"
                                            placeholder="Write reply"
                                            value={replyText}
                                            onChange={(e) =>
                                                setReplyText(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                marginTop: 8
                                            }}
                                            onClick={() =>
                                                handleSendReply(
                                                    review._id
                                                )
                                            }
                                        >
                                            Send
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-ghost"
                                        style={{
                                            marginTop: 10
                                        }}
                                        onClick={() =>
                                            setReplyingTo(
                                                review._id
                                            )
                                        }
                                    >
                                        Reply
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* BOTTOM NAV */}
            <nav className="bottom-nav">
                <Link to="/" className="nav-item">
                    <div className="nav-icon-wrapper">
                        <Home size={20} />
                    </div>
                    <span className="nav-label">
                        Home
                    </span>
                </Link>

                <Link
                    to="/earnings"
                    className="nav-item"
                >
                    <div className="nav-icon-wrapper">
                        <TrendingUp size={20} />
                    </div>
                    <span className="nav-label">
                        Earnings
                    </span>
                </Link>

                <Link
                    to="/profile"
                    className="nav-item active"
                >
                    <div className="nav-icon-wrapper active-pill">
                        <UserIcon size={20} />
                    </div>
                    <span className="nav-label">
                        Profile
                    </span>
                </Link>
            </nav>
        </div>
    );
}