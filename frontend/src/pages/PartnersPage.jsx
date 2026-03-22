import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAvailablePartners, requestPartner } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Zap, Award, Clock, Send } from 'lucide-react';

export default function PartnersPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();

    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [requestedPartnerId, setRequestedPartnerId] = useState(null);
    const [requestedPartnerName, setRequestedPartnerName] = useState('');
    const [waitingResponse, setWaitingResponse] = useState(false);

    const fetchPartners = useCallback(async () => {
        try {
            const { data } = await getAvailablePartners(orderId);
            setPartners(data.partners);
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
                setWaitingResponse(false);
                setRequestedPartnerId(null);
                setRequestedPartnerName('');
                // Refresh partner list
                fetchPartners();
            }
        });

        return () => {
            socket.off('order_request_response');
        };
    }, [socket, user, orderId, navigate, fetchPartners]);

    const handleRequest = async (partner) => {
        if (requesting) return;
        setRequesting(true);
        try {
            await requestPartner({ order_id: orderId, partner_id: partner._id });
            setRequestedPartnerId(partner._id);
            setRequestedPartnerName(partner.name);
            setWaitingResponse(true);
            toast.success(`Request sent to ${partner.name}! Waiting for response...`);
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

    const getMatchColor = (score) => {
        if (score >= 85) return '#22c55e';
        if (score >= 70) return '#f59e0b';
        return '#6366f1';
    };

    return (
        <div className="page" style={{ paddingBottom: 40, background: 'var(--bg)' }}>
            {/* Hero Header */}
            <div className="gradient-hero" style={{ padding: '40px 24px 80px', textAlign: 'left', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
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
                {/* Waiting overlay */}
                {waitingResponse && (
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: '#fff',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        padding: '2rem',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⏳</div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Waiting for {requestedPartnerName}...</h2>
                        <p style={{ opacity: 0.85, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            They'll accept or decline your request shortly
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <div className="typing-dot" style={{ background: '#fff' }}></div>
                            <div className="typing-dot" style={{ background: '#fff', animationDelay: '0.2s' }}></div>
                            <div className="typing-dot" style={{ background: '#fff', animationDelay: '0.4s' }}></div>
                        </div>
                        <button
                            className="btn btn-secondary"
                            onClick={handleCancelRequest}
                            style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}
                        >
                            Cancel & Pick Someone Else
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Finding partners near you...</p>
                    </div>
                ) : partners.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '3rem' }}>😴</div>
                        <h3>No partners online</h3>
                        <p>No delivery partners are available right now. Try again in a few minutes!</p>
                        <button className="btn btn-primary" onClick={fetchPartners}>Refresh</button>
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
                                                    <Star size={10} fill="currentColor" /> {partner.rating?.toFixed(1)}
                                                </span>
                                                <span className="badge badge-secondary">
                                                    <Zap size={10} /> {partner.total_deliveries} deliveries
                                                </span>
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

                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '1rem' }}
                                        onClick={() => handleRequest(partner)}
                                        disabled={requesting || waitingResponse}
                                    >
                                        {requestedPartnerId === partner._id ? (
                                            '⏳ Waiting for response...'
                                        ) : waitingResponse ? (
                                            'Waiting for another partner...'
                                        ) : (
                                            <><Send size={14} style={{ marginRight: 6 }} /> Send Request</>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
