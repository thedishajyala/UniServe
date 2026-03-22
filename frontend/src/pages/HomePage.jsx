import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toggleAvailability, getMyOrders, getDemandAnalytics, getIncomingRequests, respondToOrder, getMyDeliveries, getOnlinePartners } from '../services/api';
import toast from 'react-hot-toast';
import { Home, Package, TrendingUp, User, CheckCircle, XCircle, Bell, ArrowRight, Star } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

function BottomNav() {
    return (
        <nav className="bottom-nav">
            <Link to="/" className="nav-item active">
                <div className="nav-icon-wrapper active-pill"><Home size={20} /></div>
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
            <Link to="/profile" className="nav-item">
                <div className="nav-icon-wrapper"><User size={20} /></div>
                <span className="nav-label">Profile</span>
            </Link>
        </nav>
    );
}

function statusBadge(status) {
    const map = {
        pending: '⏳ Pending',
        requested: '📨 Requested',
        accepted: '✅ Accepted',
        picked: '📦 Picked',
        on_the_way: '🚗 On Way',
        delivered: '🎉 Delivered',
        cancelled: '❌ Cancelled',
    };
    return <span className={`badge status-${status} badge-sm`} style={{ fontSize: 11, padding: '3px 10px' }}>{map[status] || status}</span>;
}

export default function HomePage() {
    const { user, updateUser } = useAuth();
    const socket = useSocket();
    const { requestPermission, notify } = useNotifications();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [demand, setDemand] = useState(null);
    const [togglingAvail, setTogglingAvail] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [respondingTo, setRespondingTo] = useState(null);
    const [activeDeliveries, setActiveDeliveries] = useState([]);

    const [onlinePartners, setOnlinePartners] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, demandRes, deliveriesRes, partnersRes] = await Promise.all([
                getMyOrders(), getDemandAnalytics(), getMyDeliveries(), getOnlinePartners().catch(() => ({ data: [] }))
            ]);
            setOrders(ordersRes.data.slice(0, 5));
            setDemand(demandRes.data);
            setActiveDeliveries(deliveriesRes.data.filter(d => ['accepted', 'picked', 'on_the_way'].includes(d.status)));
            setOnlinePartners(partnersRes.data || []);
        } catch { }
    }, []);

    // Fetch incoming requests (for delivery partners)
    const loadIncomingRequests = useCallback(async () => {
        if (!user?.is_available) return;
        try {
            const { data } = await getIncomingRequests();
            setIncomingRequests(data);
        } catch { }
    }, [user?.is_available]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { loadIncomingRequests(); }, [loadIncomingRequests]);

    // Request notification permission on first load
    useEffect(() => { requestPermission(); }, [requestPermission]);

    // Socket: join personal room and listen for incoming requests
    useEffect(() => {
        if (!socket || !user) return;

        socket.emit('join_user_room', { userId: user._id });

        socket.on('incoming_order_request', (data) => {
            setIncomingRequests((prev) => {
                if (prev.find((r) => r._id === data.order?._id)) return prev;
                return [data, ...prev];
            });
            toast('📨 New delivery request!', { icon: '🛵', duration: 5000 });
            notify('🛵 New Delivery Request!', `Earn ₹${data.order?.delivery_earning} — from ${data.requester?.name}`, '/');
        });

        socket.on('order_request_response', ({ order_id, response, partner, partnerName }) => {
            if (response === 'accepted') {
                notify('✅ Partner Accepted!', `${partner?.name} is on the way`, `/chat/${order_id}`);
            } else {
                notify('❌ Partner Declined', `${partnerName} declined your request. Pick someone else!`, '/');
            }
        });

        socket.on('order_cancelled', ({ cancelled_by, reason }) => {
            notify('🚫 Order Cancelled', `${cancelled_by}: ${reason}`, '/');
        });

        return () => {
            socket.off('incoming_order_request');
        };
    }, [socket, user]);

    const handleToggleAvail = async () => {
        setTogglingAvail(true);
        try {
            const res = await toggleAvailability();
            updateUser({ is_available: res.data.is_available });
            toast.success(res.data.message);
            if (res.data.is_available) loadIncomingRequests();
            else setIncomingRequests([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle');
        } finally {
            setTogglingAvail(false);
        }
    };

    const handleRespond = async (orderId, response, partnerName) => {
        setRespondingTo(orderId + response);
        try {
            await respondToOrder({ order_id: orderId, response });
            if (response === 'accepted') {
                toast.success('Order accepted! You can chat with them below 🎉');
                // Removed forced navigation so they can accept multiple orders
                loadData(); // Refresh active deliveries instantly
                setIncomingRequests((prev) => prev.filter((r) => (r._id || r.order?._id) !== orderId));
            } else {
                toast('Request declined.');
                setIncomingRequests((prev) => prev.filter((r) => (r._id || r.order?._id) !== orderId));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to respond');
        } finally {
            setRespondingTo(null);
        }
    };

    return (
        <div className="page" style={{ paddingBottom: 80 }}>
            {/* Hero Header */}
            <div className="gradient-hero" style={{ padding: '40px 24px 80px', textAlign: 'left', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
                <div style={{ position: 'absolute', top: -30, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 2, fontWeight: 500 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋</p>
                    <h1 style={{ color: 'white', fontSize: 26, marginBottom: 6, letterSpacing: '-0.5px' }}>{user?.name?.split(' ')[0]}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Ready to order or earn today?</p>
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12 }}>
                            <span style={{ fontSize: 13 }}>🏠</span>
                            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: 600 }}>{user?.hostel} · Room {user?.room_no}</span>
                        </div>
                        <div className="glass trust-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, cursor: 'pointer', transition: 'transform 0.2s', ':active': { transform: 'scale(0.95)' } }} onClick={() => navigate('/profile')}>
                            <Star size={14} color="#FBBF24" fill="#FBBF24" />
                            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: 700 }}>{user?.rating?.toFixed(1) || '5.0'} Rating</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-content" style={{ marginTop: -48 }}>

                {/* ── INCOMING REQUESTS PANEL (partner only, when online) ── */}
                {user?.is_available && incomingRequests.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div className="section-header">
                            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Bell size={16} color="var(--primary)" /> Incoming Requests
                                <span style={{
                                    background: 'var(--primary)', color: '#fff',
                                    borderRadius: '50%', fontSize: 11, fontWeight: 700,
                                    width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {incomingRequests.length}
                                </span>
                            </h3>
                        </div>

                        {incomingRequests.map((req) => {
                            // req can be a raw Order doc (from REST poll) OR socket payload { order, requester }
                            const order = req.order || req;
                            const requester = req.requester || req.user_id;
                            const orderId = order._id;

                            return (
                                <div key={orderId} className="card" style={{
                                    marginBottom: 12,
                                    border: '1px solid var(--primary-light)',
                                    background: 'linear-gradient(135deg, rgba(79,70,229,0.03), rgba(124,58,237,0.03))',
                                    boxShadow: '0 10px 25px rgba(79,70,229,0.1)',
                                }}>
                                    {/* Requester info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: 700, fontSize: 16,
                                        }}>
                                            {(requester?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 14 }}>{requester?.name || 'Student'}</p>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {requester?.hostel} · Room {requester?.room_no}
                                            </p>
                                        </div>
                                        <span style={{
                                            marginLeft: 'auto', background: 'var(--primary)',
                                            color: '#fff', borderRadius: 8, padding: '4px 10px',
                                            fontSize: 13, fontWeight: 700,
                                        }}>
                                            +₹{order.delivery_earning}
                                        </span>
                                    </div>

                                    {/* Order details */}
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pickup</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{order.pickup_location}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deliver to</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{order.delivery_hostel} · Room {order.delivery_room}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Items</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{order.item_details?.slice(0, 30)}{order.item_details?.length > 30 ? '...' : ''}</span>
                                        </div>
                                    </div>

                                    {/* Accept / Decline */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: 1, background: '#22c55e', borderColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            onClick={() => handleRespond(orderId, 'accepted')}
                                            disabled={respondingTo !== null}
                                        >
                                            <CheckCircle size={16} />
                                            {respondingTo === orderId + 'accepted' ? 'Accepting...' : 'Accept'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#ef4444', borderColor: '#ef4444' }}
                                            onClick={() => handleRespond(orderId, 'declined')}
                                            disabled={respondingTo !== null}
                                        >
                                            <XCircle size={16} />
                                            {respondingTo === orderId + 'declined' ? 'Declining...' : 'Decline'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── ACTIVE DELIVERIES PANEL (partner's ongoing deliveries) ── */}
                {activeDeliveries.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div className="section-header">
                            <h3 className="section-title">🚴 Active Deliveries</h3>
                        </div>
                        {activeDeliveries.map((delivery) => (
                            <div key={delivery._id} className="card" style={{
                                marginBottom: 12,
                                border: '2px solid #22c55e',
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(16,185,129,0.05))',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: 14 }}>{delivery.pickup_location} → {delivery.delivery_hostel}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Room {delivery.delivery_room}</p>
                                    </div>
                                    <span style={{
                                        background: '#22c55e22', color: '#16a34a',
                                        borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700,
                                    }}>
                                        {delivery.status === 'accepted' ? '✅ Accepted' : delivery.status === 'picked' ? '📦 Picked' : '🚗 On the Way'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }}
                                        onClick={() => navigate(`/chat/${delivery._id}`)}>
                                        💬 Open Chat
                                    </button>
                                    <button className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}
                                        onClick={() => navigate(`/order/${delivery._id}/track`)}>
                                        📍 Track
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Demand Banner Moved to Top */}
                {demand?.isCurrentlyPeak && (
                    <div className="demand-pill fade-in" style={{ 
                        margin: '-20px auto 20px', width: '90%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', 
                        color: 'white', padding: '10px 16px', borderRadius: 999, display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 13, position: 'relative', zIndex: 2,
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                    }}>
                        <span>🔥</span> High Demand — Earn more right now
                    </div>
                )}

                {/* Main Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 24, padding: '0 4px' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="card action-card premium-card" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 22, background: 'linear-gradient(145deg, #4F46E5, #6366f1)', color: 'white', border: '2px solid rgba(255,255,255,0.2)', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                            onClick={() => navigate('/order/create')}>
                            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, transform: 'scale(1.5)' }}>
                                <Package size={100} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, marginBottom: 16 }}>
                                <Package size={24} color="white" />
                            </div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Create Order</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                Fast delivery <ArrowRight size={14} />
                            </div>
                        </button>

                        <div className="card action-card toggle-card" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center', background: user?.is_available ? 'linear-gradient(145deg, #f0fdf4, #dcfce7)' : 'white', border: user?.is_available ? '1px solid #bbf7d0' : '1px solid var(--border)', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' }}>
                            <div style={{ fontSize: 28, marginBottom: 4 }}>{user?.is_available ? '🚴' : '😴'}</div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: user?.is_available ? '#166534' : 'var(--text-primary)' }}>
                                {user?.is_available ? 'Live Now' : 'Offline'}
                            </div>
                            <div style={{ fontSize: 11, color: user?.is_available ? '#15803d' : 'var(--text-muted)', marginBottom: 12, lineHeight: 1.2, fontWeight: 500 }}>
                                {user?.is_available ? "Waiting for orders..." : "Go online to earn"}
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={!!user?.is_available} onChange={handleToggleAvail} disabled={togglingAvail} />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="stat-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-value">₹{user?.total_earnings || 0}</div>
                        <div className="stat-label">
                            {user?.total_earnings > 0 ? "Total Earned 🎉" : "You haven't earned yet 👀"}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{user?.total_deliveries || 0}</div>
                        <div className="stat-label">
                            {user?.total_deliveries > 0 ? "Deliveries Done 📦" : "Start your first delivery 🚀"}
                        </div>
                    </div>
                </div>

                {/* Popular Outlets */}
                {demand?.popularOutlets?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div className="section-header"><h3 className="section-title">🔥 Trending Outlets</h3></div>
                        <div className="chip-group">
                            {demand.popularOutlets.slice(0, 4).map((o) => (
                                <div key={o.name} className="chip" style={{ cursor: 'default' }}>
                                    {o.name} <span style={{ opacity: 0.6 }}>({o.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Nearby Snippet */}
                {!user?.is_available && onlinePartners.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div className="section-header">
                            <h3 className="section-title">👥 Available Nearby</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, margin: '0 -4px' }}>
                            {onlinePartners.map((p) => (
                                <div key={p._id} className="card partner-pill" style={{ minWidth: 160, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name.split(' ')[0]}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Star size={10} color="#FBBF24" fill="#FBBF24" /> {p.rating.toFixed(1)} · {p.hostel}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Orders */}
                <div>
                    <div className="section-header">
                        <h3 className="section-title">📋 Recent Orders</h3>
                        <Link to="/order/create" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ New</Link>
                    </div>
                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🛍️</div>
                            <p className="empty-state-title">No orders yet</p>
                            <p className="empty-state-sub">Create your first delivery request!</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} className="order-card recent-order-card" style={{ cursor: 'pointer', padding: 16 }}
                                onClick={() => navigate(
                                    order.status === 'delivered' ? `/order/${order._id}/review` :
                                        order.status === 'accepted' ? `/chat/${order._id}` :
                                            `/order/${order._id}/track`
                                )}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{ background: 'var(--bg)', padding: 8, borderRadius: 10 }}>
                                            {order.pickup_location.includes('Gate') ? <Package size={18} color="var(--primary)" /> : <span style={{ fontSize: 18 }}>🍔</span>}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 15 }}>{order.pickup_location}</p>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>→ {order.delivery_hostel}, Room {order.delivery_room}</p>
                                        </div>
                                    </div>
                                    {statusBadge(order.status)}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{order.item_details.slice(0, 35)}{order.item_details.length > 35 ? '...' : ''}</p>
                                    <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--primary-dark)', fontSize: 16 }}>₹{order.price}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
