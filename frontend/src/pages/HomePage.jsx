import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toggleAvailability, getMyOrders, getDemandAnalytics, getIncomingRequests, respondToOrder, getMyDeliveries, getOnlinePartners } from '../services/api';
import toast from 'react-hot-toast';
import { Home, Package, TrendingUp, User, CheckCircle, XCircle, Bell, ArrowRight, Star } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

function BottomNav() {
    const navigate = useNavigate();
    const path = window.location.pathname;

    return (
        <nav className="bottom-nav">
            <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
                <div className={`nav-icon-wrapper ${path === '/' ? 'active-pill' : ''}`}><Home size={20} /></div>
                <span className="nav-label">Home</span>
            </Link>
            <Link to="/order/create" className={`nav-item ${path === '/order/create' ? 'active' : ''}`}>
                <div className={`nav-icon-wrapper ${path === '/order/create' ? 'active-pill' : ''}`}><Package size={20} /></div>
                <span className="nav-label">Order</span>
            </Link>
            <Link to="/earnings" className={`nav-item ${path === '/earnings' ? 'active' : ''}`}>
                <div className={`nav-icon-wrapper ${path === '/earnings' ? 'active-pill' : ''}`}><TrendingUp size={20} /></div>
                <span className="nav-label">Earnings</span>
            </Link>
            <Link to="/profile" className={`nav-item ${path === '/profile' ? 'active' : ''}`}>
                <div className={`nav-icon-wrapper ${path === '/profile' ? 'active-pill' : ''}`}><User size={20} /></div>
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

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function renderRating(rating, totalReviews, totalDeliveries = 0) {
    if (totalDeliveries === 0) return <span className="badge badge-info" style={{ fontSize: 10 }}>New 🆕</span>;
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#F59E0B' }}>
            ⭐ {Number(rating || 0).toFixed(1)} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 10 }}>({totalDeliveries} orders)</span>
        </span>
    );
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
    const [earnings, setEarnings] = useState(null);
    const [mode, setMode] = useState('order'); // 'order' or 'deliver'

    const [onlinePartners, setOnlinePartners] = useState([]);
    const [unreadOrders, setUnreadOrders] = useState({}); // { orderId: true }

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, demandRes, deliveriesRes, partnersRes, earningsRes] = await Promise.all([
                getMyOrders(), getDemandAnalytics(), getMyDeliveries(), getOnlinePartners().catch(() => ({ data: [] })),
                getEarnings().catch(() => ({ data: {} }))
            ]);
            setOrders(ordersRes.data.slice(0, 5));
            setDemand(demandRes.data);
            setActiveDeliveries(deliveriesRes.data.filter(d => ['accepted', 'picked', 'on_the_way'].includes(d.status)));
            setOnlinePartners(partnersRes.data || []);
            setEarnings(earningsRes.data);
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

        socket.on('order_taken', ({ order_id }) => {
            setIncomingRequests((prev) => prev.filter((r) => (r._id || r.order?._id) !== order_id));
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

        socket.on('new_chat_message', (data) => {
            // Only show if not already on the chat page for this order
            if (window.location.pathname !== `/chat/${data.orderId}`) {
                setUnreadOrders(prev => ({ ...prev, [data.orderId]: true }));
                toast(`${data.senderName}: ${data.content}`, {
                    icon: '💬',
                    duration: 4000,
                    onClick: () => navigate(`/chat/${data.orderId}`)
                });
                notify(`💬 New Message from ${data.senderName}`, data.content, `/chat/${data.orderId}`);
            }
        });

        return () => {
            socket.off('incoming_order_request');
            socket.off('order_taken');
            socket.off('order_request_response');
            socket.off('order_cancelled');
            socket.off('new_chat_message');
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
            <div className="gradient-hero" style={{ padding: '60px 24px 120px', textAlign: 'left', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
                {/* Decorative mesh circles */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -20, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <span style={{ fontSize: 20 }}>🚀</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="mode-toggle-container">
                                <button className={`mode-toggle-btn ${mode === 'order' ? 'active' : ''}`} onClick={() => setMode('order')}>Order</button>
                                <button className={`mode-toggle-btn ${mode === 'deliver' ? 'active' : ''}`} onClick={() => setMode('deliver')}>Deliver</button>
                            </div>
                            <div className="glass" style={{ padding: '6px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                                <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{Number(user?.rating || 5.0).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 4, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                            </p>
                            <h1 style={{ color: 'white', fontSize: 32, marginBottom: 0, letterSpacing: '-1.5px', fontWeight: 900 }}>Hey, {user?.name?.split(' ')[0]}!</h1>
                        </div>

                        {/* Glass Stats Card */}
                        <div className="glass-card" style={{ padding: '12px 20px', borderRadius: 24, display: 'flex', gap: 20, marginBottom: -4 }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deliveries</p>
                                <p style={{ fontSize: 18, color: 'white', fontWeight: 900 }}>{activeDeliveries.length}</p>
                            </div>
                            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)', alignSelf: 'center' }} />
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earned Today</p>
                                <p style={{ fontSize: 18, color: 'white', fontWeight: 900 }}>₹{earnings?.today_earnings || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-content" style={{ marginTop: -48, position: 'relative', zIndex: 2 }}>
                
                {mode === 'order' ? (
                    <div className="fade-in">
                        {/* ── ORDER MODE CONTENT ── */}
                        
                        {/* Main Call to Action */}
                        <button className="card action-card premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 24, background: 'linear-gradient(145deg, #6366f1, #4f46e5)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 30px rgba(99,102,241,0.25)', width: '100%', marginBottom: 24 }}
                            onClick={() => navigate('/order/create')}>
                            <div style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.1, transform: 'rotate(-15deg)' }}>
                                <Package size={80} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.25)', padding: 10, borderRadius: 14, marginBottom: 18, backdropFilter: 'blur(10px)' }}>
                                <Package size={24} color="white" />
                            </div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 19, marginBottom: 4 }}>Place Order</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                Get it delivered directly to your room <ArrowRight size={14} />
                            </div>
                        </button>

                        {/* Available Nearby Snippet */}
                        {onlinePartners.length > 0 && (
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
                                                    {renderRating(p.rating, p.total_reviews, p.total_deliveries)} · {p.hostel}
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
                                        onClick={() => {
                                            setUnreadOrders(prev => ({ ...prev, [order._id]: false }));
                                            navigate(
                                                order.status === 'delivered' ? `/order/${order._id}/review` :
                                                    order.status === 'accepted' ? `/chat/${order._id}` :
                                                        `/order/${order._id}/track`
                                            )
                                        }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <div style={{ background: 'var(--bg)', padding: 8, borderRadius: 10, position: 'relative' }}>
                                                    {order.pickup_location.includes('Gate') ? <Package size={18} color="var(--primary)" /> : <span style={{ fontSize: 18 }}>🍔</span>}
                                                    {unreadOrders[order._id] && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: '#EF4444', border: '2px solid white' }} />}
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
                ) : (
                    <div className="fade-in">
                        {/* ── DELIVER MODE CONTENT ── */}
                        
                        {/* Go Online Toggle */}
                        <div className="card action-card toggle-card" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: user?.is_available ? 'linear-gradient(145deg, #ECFDF5, #D1FAE5)' : 'white', border: user?.is_available ? '1px solid #A7F3D0' : '1px solid var(--border-strong)', boxShadow: '0 8px 25px rgba(0,0,0,0.04)', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ fontSize: 32, filter: user?.is_available ? 'drop-shadow(0 4px 10px rgba(34,197,94,0.2))' : 'none' }}>{user?.is_available ? '🚴' : '😴'}</div>
                                <div>
                                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: user?.is_available ? '#065F46' : 'var(--text-primary)' }}>
                                        {user?.is_available ? 'Live Now' : 'Offline'}
                                    </div>
                                    <div style={{ fontSize: 12, color: user?.is_available ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>
                                        {user?.is_available ? "Active & Earning" : "Start a micro-gig"}
                                    </div>
                                </div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={!!user?.is_available} onChange={handleToggleAvail} disabled={togglingAvail} />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        {/* Demand Banner */}
                        {demand?.isCurrentlyPeak && (
                            <div className="demand-pill" style={{ 
                                marginBottom: 20, background: 'linear-gradient(135deg, #F59E0B, #D97706)', 
                                color: 'white', padding: '12px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', 
                                gap: 10, fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                            }}>
                                <span style={{ fontSize: 20 }}>🔥</span> High Demand — Peak rates active!
                            </div>
                        )}

                        {/* Incoming Requests */}
                        {user?.is_available && incomingRequests.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
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
                                    const order = req.order || req;
                                    const requester = req.requester || req.user_id;
                                    const orderId = order._id;

                                    return (
                                        <div key={orderId} className="card" style={{
                                            marginBottom: 12,
                                            border: '1px solid var(--primary-light)',
                                            background: 'linear-gradient(135deg, rgba(79,70,229,0.03), rgba(124,58,237,0.03))',
                                            boxShadow: '0 10px 25px rgba(79,70,229,0.1)',
                                            padding: 16
                                        }}>
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
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 4 }}>
                                                        {requester?.hostel} · Room {requester?.room_no} · {requester?.total_deliveries > 0 ? `⭐ ${Number(requester.rating || 0).toFixed(1)} (${requester.total_deliveries} deli.)` : 'New'}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    marginLeft: 'auto', background: 'var(--primary)',
                                                    color: '#fff', borderRadius: 8, padding: '4px 10px',
                                                    fontSize: 14, fontWeight: 800,
                                                }}>
                                                    +₹{order.delivery_earning}
                                                </span>
                                            </div>

                                            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px', marginBottom: 12, border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pickup</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{order.pickup_location}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deliver to</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{order.delivery_hostel} · Room {order.delivery_room}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Items</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{order.item_details?.slice(0, 30)}...</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button className="btn btn-primary" style={{ flex: 1, background: '#22c55e', borderColor: '#22c55e', height: 44, padding: 0 }}
                                                    onClick={() => handleRespond(orderId, 'accepted')} disabled={respondingTo !== null}>
                                                    {respondingTo === orderId + 'accepted' ? '...' : 'Accept'}
                                                </button>
                                                <button className="btn btn-secondary" style={{ flex: 1, color: '#ef4444', borderColor: '#ef4444', height: 44, padding: 0 }}
                                                    onClick={() => handleRespond(orderId, 'declined')} disabled={respondingTo !== null}>
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Active Deliveries */}
                        {activeDeliveries.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <div className="section-header">
                                    <h3 className="section-title">🚴 Active Deliveries</h3>
                                </div>
                                {activeDeliveries.map((delivery) => (
                                    <div key={delivery._id} className="card" style={{
                                        marginBottom: 12,
                                        border: '2px solid #22c55e',
                                        background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(16,185,129,0.05))',
                                        padding: 16
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <div>
                                                <p style={{ fontWeight: 800, fontSize: 15 }}>{delivery.pickup_location} → {delivery.delivery_hostel}</p>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Room {delivery.delivery_room}</p>
                                            </div>
                                            <span style={{
                                                background: '#22c55e22', color: '#16a34a',
                                                borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 800,
                                            }}>
                                                {delivery.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-primary btn-sm" style={{ flex: 1, position: 'relative' }}
                                                onClick={() => {
                                                    setUnreadOrders(prev => ({ ...prev, [delivery._id]: false }));
                                                    navigate(`/chat/${delivery._id}`);
                                                }}>
                                                💬 Chat
                                                {unreadOrders[delivery._id] && <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: '#EF4444', border: '2px solid white', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }} />}
                                            </button>
                                            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                                                onClick={() => navigate(`/order/${delivery._id}/track`)}>📍 Track</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="stat-grid" style={{ marginBottom: 24 }}>
                            <div className="stat-card">
                                <div className="stat-value">₹{user?.total_earnings || 0}</div>
                                <div className="stat-label">Total Earned</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{user?.total_deliveries || 0}</div>
                                <div className="stat-label">Deliveries Done</div>
                            </div>
                        </div>

                        {/* Trending Outlets */}
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
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
