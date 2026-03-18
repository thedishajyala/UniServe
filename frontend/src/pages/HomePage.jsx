import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toggleAvailability, getMyOrders, getDemandAnalytics, getIncomingRequests, respondToOrder, getMyDeliveries } from '../services/api';
import toast from 'react-hot-toast';
import { Home, Package, TrendingUp, User, CheckCircle, XCircle, Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

function BottomNav() {
    const { logoutUser } = useAuth();
    const navigate = useNavigate();
    return (
        <nav className="bottom-nav">
            <Link to="/" className="nav-item active"><Home /><span className="nav-label">Home</span></Link>
            <Link to="/order/create" className="nav-item"><Package /><span className="nav-label">Order</span></Link>
            <Link to="/earnings" className="nav-item"><TrendingUp /><span className="nav-label">Earnings</span></Link>
            <button className="nav-item" onClick={() => { logoutUser(); navigate('/login'); }}><User /><span className="nav-label">Logout</span></button>
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

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, demandRes, deliveriesRes] = await Promise.all([
                getMyOrders(), getDemandAnalytics(), getMyDeliveries()
            ]);
            setOrders(ordersRes.data.slice(0, 5));
            setDemand(demandRes.data);
            // Show only active (accepted/picked/on_the_way) deliveries
            setActiveDeliveries(deliveriesRes.data.filter(d =>
                ['accepted', 'picked', 'on_the_way'].includes(d.status)
            ));
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
                toast.success('Order accepted! Chat is now open 🎉');
                navigate(`/chat/${orderId}`);
            } else {
                toast('Request declined.');
                setIncomingRequests((prev) => prev.filter((r) => {
                    const id = r._id || r.order?._id;
                    return id !== orderId;
                }));
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
            <div className="gradient-hero" style={{ padding: '40px 24px 60px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 4 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋</p>
                <h1 style={{ color: 'white', fontSize: 28, marginBottom: 4 }}>{user?.name?.split(' ')[0]}</h1>
                <div className="glass" style={{ display: 'inline-flex', gap: 12, padding: '8px 16px', marginTop: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>🏠 {user?.hostel} · Room {user?.room_no}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>⭐ {user?.rating?.toFixed(1) || '5.0'}</span>
                </div>
            </div>

            <div className="page-content" style={{ marginTop: -32 }}>

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
                                    border: '2px solid var(--primary)',
                                    background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(124,58,237,0.05))',
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

                {/* Demand Banner */}
                {demand?.isCurrentlyPeak && (
                    <div className="demand-banner fade-in" style={{ marginBottom: 20 }}>
                        <span style={{ fontSize: 24 }}>🔥</span>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: 14 }}>High Demand Right Now!</p>
                            <p style={{ fontWeight: 500, fontSize: 12, opacity: 0.9 }}>Go online to earn more 💸</p>
                        </div>
                    </div>
                )}

                {/* Main Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <button className="card" style={{ border: 'none', cursor: 'pointer', padding: 20, textAlign: 'left', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white' }}
                        onClick={() => navigate('/order/create')}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15 }}>Create Order</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Request a delivery</div>
                    </button>

                    <div className="toggle-wrapper" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: 20 }}>
                        <div style={{ fontSize: 32 }}>{user?.is_available ? '🟢' : '🔴'}</div>
                        <div>
                            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14 }}>
                                {user?.is_available ? 'Online' : 'Offline'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Delivery mode</div>
                        </div>
                        <label className="toggle" style={{ marginTop: 4 }}>
                            <input type="checkbox" checked={!!user?.is_available} onChange={handleToggleAvail} disabled={togglingAvail} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="stat-grid" style={{ marginBottom: 20 }}>
                    <div className="stat-card">
                        <div className="stat-value">₹{user?.total_earnings || 0}</div>
                        <div className="stat-label">Total Earned</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{user?.total_deliveries || 0}</div>
                        <div className="stat-label">Deliveries</div>
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
                            <div key={order._id} className="order-card" style={{ cursor: 'pointer' }}
                                onClick={() => navigate(
                                    order.status === 'delivered' ? `/order/${order._id}/review` :
                                        order.status === 'accepted' ? `/chat/${order._id}` :
                                            `/order/${order._id}/track`
                                )}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: 14 }}>{order.pickup_location}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>→ {order.delivery_hostel}, Room {order.delivery_room}</p>
                                    </div>
                                    {statusBadge(order.status)}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.item_details.slice(0, 40)}{order.item_details.length > 40 ? '...' : ''}</p>
                                    <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>₹{order.price}</span>
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
