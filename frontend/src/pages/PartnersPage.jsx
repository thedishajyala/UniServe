import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAvailablePartners, requestPartner, getPartnerReviews, getOrderById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Zap, Award, Clock, Send, MessageCircle } from 'lucide-react';

export default function PartnersPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();

    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [requestedIds, setRequestedIds] = useState([]);
    const [order, setOrder] = useState(null);

    // Profile Modal State
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [profileReviews, setProfileReviews] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const fetchPartners = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, oRes] = await Promise.all([
                getAvailablePartners(orderId),
                getOrderById(orderId)
            ]);
            setPartners(pRes.data.partners);
            setOrder(oRes.data);
            setRequestedIds(oRes.data.requested_partner_ids.map(p => p._id || p));
        } catch {
            toast.error('Failed to load partners');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    // Listen for partner's accept/decline response
    useEffect(() => {
        if (!socket || !user) return;

        socket.emit('join_user_room', { userId: user._id });

        socket.on('order_request_response', ({ order_id, response, partner, partnerName }) => {
            if (order_id !== orderId) return;

            if (response === 'accepted') {
                toast.success(`${partner.name} accepted your request! Chat is open 🎉`);
                navigate(`/chat/${orderId}`);
            } else {
                toast.error(`${partnerName} declined. Pick someone else.`);
                fetchPartners();
            }
        });

        return () => {
            socket.off('order_request_response');
        };
    }, [socket, user, orderId, navigate, fetchPartners]);

    const handleRequest = async (partner) => {
        if (requesting || requestedIds.includes(partner._id)) return;
        setRequesting(true);
        try {
            await requestPartner({ order_id: orderId, partner_id: partner._id });
            setRequestedIds(prev => [...prev, partner._id]);
            toast.success(`Request sent to ${partner.name}!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send request');
        } finally {
            setRequesting(false);
        }
    };

    const handleCancelRequest = () => {
        setWaitingResponse(false);
        setRequestedPartnerId(null);
        setRequestedPartnerName('');
        // Navigate back to let them create a new order or refresh
        toast('Request cancelled. You can pick a different partner.');
        fetchPartners();
    };

    const handleViewProfile = async (partner) => {
        setSelectedProfile(partner);
        setLoadingProfile(true);
        try {
            const { data } = await getPartnerReviews(partner._id);
            setProfileReviews(data);
        } catch {
            toast.error('Could not load reviews');
        } finally {
            setLoadingProfile(false);
        }
    };

    const getMatchColor = (score) => {
        if (score >= 85) return '#22c55e';
        if (score >= 70) return '#f59e0b';
        return '#6366f1';
    };

    return (
        <div className="page" style={{ paddingBottom: 40, background: 'var(--bg)' }}>
            {/* Hero Header */}
            <div className="gradient-hero" style={{ marginBottom: '50px', padding: '40px 24px 80px', textAlign: 'left', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
                <div style={{ position: 'absolute', top: -30, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-icon" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none', color: 'white' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Outfit' }}>Pick Your Partner</h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Choose who delivers your order</p>
                    </div>
                </div>
            </div>

            <div className="page-content" style={{ marginTop: -48 }}>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Finding partners near you...</p>
                    </div>
                ) : partners.length === 0 ? (
                    <div className="empty-state fade-in" style={{ background: 'var(--surface-2)', borderRadius: 24, padding: '60px 24px', border: '1px solid var(--border)', marginTop: 20 }}>
                        <div className="empty-state-icon" style={{ fontSize: '4rem', marginBottom: 20 }}>😴</div>
                        <h3 className="empty-state-title" style={{ fontSize: 20, marginBottom: 12 }}>No partners online</h3>
                        <p className="empty-state-sub" style={{ marginBottom: 32, maxWidth: 280, margin: '0 auto 32px' }}>
                            No delivery partners are available right now. Try again in a few minutes!
                        </p>
                        <button 
                            className="btn btn-primary btn-lg" 
                            onClick={fetchPartners}
                            style={{ minWidth: 200, boxShadow: '0 10px 25px rgba(79, 70, 229, 0.2)' }}
                        >
                            🔄 Check Again
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="section-label">{partners.length} partner{partners.length > 1 ? 's' : ''} available</p>
                        <div className="partners-list">
                            {partners.map((partner, idx) => (
                                <div key={partner._id} className="card hover-lift" style={{ flexShrink: 0, padding: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, marginBottom: 16, position: 'relative' }}>
                                    {idx === 0 && (
                                        <div style={{ position: 'absolute', top: -10, right: 20, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 10px rgba(139,92,246,0.3)' }}>
                                            <Award size={12} /> BEST MATCH
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, flexShrink: 0 }}>
                                            {partner.name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h4 style={{ fontSize: 18, fontWeight: 800 }}>{partner.name}</h4>
                                                <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>🟢 Online</span>
                                            </div>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{partner.hostel} • Room {partner.room_no || 'TBA'}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 20, background: 'var(--surface-2)', padding: 12, borderRadius: 12 }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Rating</p>
                                            <p style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>⭐ {Number(partner.rating || 5.0).toFixed(1)}</p>
                                        </div>
                                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Accept</p>
                                            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>98%</p>
                                        </div>
                                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Delivered</p>
                                            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{partner.total_deliveries || 142}</p>
                                        </div>
                                        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ETA</p>
                                            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>~{Number(partner.avg_response_time || 5).toFixed(0)}m</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button className="btn hover-lift" style={{ flex: 1, padding: '12px', fontSize: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 12, fontWeight: 700 }} onClick={() => handleViewProfile(partner)}>
                                            👀 View Profile
                                        </button>
                                        <button className="btn hover-lift glow" style={{ flex: 1.5, padding: '12px', fontSize: 14, background: requestedIds.includes(partner._id) ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800 }} onClick={() => handleRequest(partner)} disabled={requesting || requestedIds.includes(partner._id)}>
                                            {requestedIds.includes(partner._id) ? '✅ Chosen' : '🚀 Choose Partner'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Partner Profile Modal */}
                {selectedProfile && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedProfile(null)}>
                        <div className="card fade-in" style={{ width: '100%', maxWidth: 480, height: '85vh', background: 'var(--bg)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '32px 24px 48px', position: 'relative', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedProfile(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
                            
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 10px 25px rgba(139,92,246,0.4)' }}>
                                    {selectedProfile.name.charAt(0)}
                                </div>
                                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{selectedProfile.name}</h2>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}>{selectedProfile.hostel} • Room {selectedProfile.room_no || 'TBA'}</p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 12, marginTop: 12 }}>
                                    🟢 Online & Ready
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 16, textAlign: 'center' }}>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Rating</p>
                                    <p style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>⭐ {Number(selectedProfile.rating || 5.0).toFixed(1)}</p>
                                </div>
                                <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 16, textAlign: 'center' }}>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Deliveries</p>
                                    <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedProfile.total_deliveries || 142}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(139,92,246,0.1)', borderRadius: 16 }}>
                                    <div style={{ fontSize: 24 }}>🏅</div>
                                    <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Top Rated Partner</h4>
                                        <p style={{ fontSize: 12, color: 'var(--primary)' }}>Consistently delivers 5-star service</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(16,185,129,0.1)', borderRadius: 16 }}>
                                    <div style={{ fontSize: 24 }}>⚡</div>
                                    <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Fast Responder</h4>
                                        <p style={{ fontSize: 12, color: 'var(--success)' }}>Usually accepts within 2 minutes</p>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <MessageCircle size={16} color="var(--primary)" /> Recent Reviews
                            </h3>
                            {loadingProfile ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 20 }}>Loading reviews...</p>
                            ) : profileReviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 0', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🤫</div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No reviews yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {profileReviews.map(rev => (
                                        <div key={rev._id} style={{ background: 'var(--card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{(rev.reviewer_id?.name || 'A').charAt(0).toUpperCase()}</div>
                                                    {rev.reviewer_id?.name || 'Anonymous'}
                                                </span>
                                                <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700, background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 10 }}>
                                                    ★ {rev.rating}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
                                                {rev.review_text || <em style={{ color: 'var(--text-muted)' }}>Left a {rev.rating} star rating.</em>}
                                            </p>
                                            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                                                {new Date(rev.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <button className="btn btn-primary btn-w-full btn-lg" style={{ marginTop: 24, position: 'sticky', bottom: 0, background: requestedIds.includes(selectedProfile._id) ? 'var(--success)' : 'var(--primary)' }} onClick={() => {
                                handleRequest(selectedProfile);
                                setSelectedProfile(null);
                            }} disabled={requesting || requestedIds.includes(selectedProfile._id)}>
                                {requestedIds.includes(selectedProfile._id) ? '✅ Already Requested' : '🚀 Send Delivery Request'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
