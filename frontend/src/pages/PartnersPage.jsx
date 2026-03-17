import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAvailablePartners, assignPartner } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Star } from 'lucide-react';

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function PartnersPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAvailablePartners(orderId);
                setPartners(res.data.partners);
            } catch {
                toast.error('Failed to load delivery partners');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId]);

    const handleSelect = async (partnerId) => {
        setAssigning(partnerId);
        try {
            await assignPartner({ order_id: orderId, partner_id: partnerId });
            toast.success('Delivery partner assigned! Chat started 💬');
            navigate(`/order/${orderId}/chat`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign partner');
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn btn-icon btn-ghost" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
                <div>
                    <h1 className="page-title">Choose Delivery Partner</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {partners.length} available · AI-ranked for you
                    </p>
                </div>
            </div>

            <div className="page-content">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
                    </div>
                ) : partners.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">😔</div>
                        <p className="empty-state-title">No partners available</p>
                        <p className="empty-state-sub">No one is online right now. Try again in a few minutes!</p>
                        <button className="btn btn-outline" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>
                            🔄 Refresh
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {partners.map((p, i) => (
                            <div key={p._id} className={`partner-card fade-in ${p.best_match ? 'best' : ''}`}
                                style={{ animationDelay: `${i * 0.08}s` }}>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div className="avatar avatar-lg">{getInitials(p.name)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <h3 style={{ fontSize: 16 }}>{p.name}</h3>
                                                    {p.best_match && <span className="badge badge-primary">⚡ Best Match</span>}
                                                </div>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                    {p.enrollment_no} · {p.hostel} Room {p.room_no}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Star size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>{p.rating?.toFixed(1)}</span>
                                            </div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                📦 {p.total_deliveries} deliveries
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                ⚡ ~{Math.round(p.avg_response_time || 5)} min
                                            </span>
                                        </div>

                                        {/* AI Score bar */}
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>AI Match Score</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{Math.round((p.ai_score || 0) * 100)}%</span>
                                            </div>
                                            <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${(p.ai_score || 0) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: 3 }} />
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-primary btn-sm btn-w-full"
                                            onClick={() => handleSelect(p._id)}
                                            disabled={assigning === p._id}>
                                            {assigning === p._id ? '⏳ Assigning...' : '✅ Select Partner'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
