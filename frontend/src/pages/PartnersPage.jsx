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
                    <div className="empty-state fade-in" style={{ background: 'white', borderRadius: 24, padding: '60px 24px', boxShadow: 'var(--shadow-sm)', marginTop: 20 }}>
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
                                <div key={partner._id} className={`card partner-card ${idx === 0 ? 'best-match' : ''}`}>
                                    {idx === 0 && (
                                        <div className="best-match-badge">
                                            <Award size={12} /> Best Match
                                        </div>
                                    )}

                                    <div className="partner-header">
                                        <div className="partner-avatar">
                                            {partner.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="partner-info">
                                            <h3>{partner.name}</h3>
                                            <p>{partner.hostel} · Room {partner.room_no}</p>
                                            <div className="partner-badges">
                                                <span className="badge badge-primary">
                                                    <Star size={10} fill="currentColor" /> {Number(partner.rating || 0).toFixed(1)}
                                                </span>
                                                <span className="badge badge-secondary">
                                                    <Zap size={10} /> {partner.total_deliveries} deliveries
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                                                <Clock size={11} /> ~{Number(partner.avg_response_time || 0).toFixed(0)} min avg response
                                            </div>
                                        </div>
                                        <div className="match-score" style={{ color: getMatchColor(partner.matchScore) }}>
                                            <div className="match-percent">{partner.matchScore}%</div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>match</div>
                                        </div>
                                    </div>

                                    <div className="match-bar-container">
                                        <div className="match-bar-label">
                                            <Clock size={11} /> ~{partner.avg_response_time?.toFixed(0)} min avg response
                                        </div>
                                        <div className="match-bar-track">
                                            <div
                                                className="match-bar-fill"
                                                style={{
                                                    width: `${partner.matchScore}%`,
                                                    background: getMatchColor(partner.matchScore),
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ flex: 1, padding: '10px 0', fontSize: '13px' }}
                                            onClick={() => handleViewProfile(partner)}
                                        >
                                            👀 View Profile
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: 1.5, background: requestedIds.includes(partner._id) ? 'var(--success)' : 'var(--primary)' }}
                                            onClick={() => handleRequest(partner)}
                                            disabled={requesting || requestedIds.includes(partner._id)}
                                        >
                                            {requestedIds.includes(partner._id) ? (
                                                '✅ Requested'
                                            ) : (
                                                <><Send size={14} style={{ marginRight: 6 }} /> Request</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Partner Profile Modal */}
                {selectedProfile && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                    }} onClick={() => setSelectedProfile(null)}>
                        <div className="card slide-up" style={{
                            width: '100%', maxWidth: 480, height: '80vh', borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                            overflowY: 'auto', padding: 24, paddingBottom: 40, background: 'var(--bg)'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div className="avatar avatar-md" style={{ background: 'var(--primary)', color: 'white' }}>
                                        {selectedProfile.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selectedProfile.name}</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selectedProfile.hostel} · Room {selectedProfile.room_no}</p>
                                    </div>
                                </div>
                                <button className="btn btn-icon btn-ghost" onClick={() => setSelectedProfile(null)}>✕</button>
                            </div>
                            
                            <div className="stat-grid" style={{ marginBottom: 20 }}>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-value" style={{ fontSize: 20, color: '#f59e0b' }}>
                                        ★ {selectedProfile.rating?.toFixed(1) || '5.0'}
                                    </div>
                                    <div className="stat-label">Rating</div>
                                </div>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-value" style={{ fontSize: 20 }}>{selectedProfile.total_deliveries || 0}</div>
                                    <div className="stat-label">Deliveries</div>
                                </div>
                                <div className="stat-card" style={{ padding: 12 }}>
                                    <div className="stat-value" style={{ fontSize: 20 }}>{profileReviews.length}</div>
                                    <div className="stat-label">Reviews</div>
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
