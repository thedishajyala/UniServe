import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toggleAvailability, getMyOrders, getDemandAnalytics, getIncomingRequests, respondToOrder, getMyDeliveries, getOnlinePartners, getEarnings } from '../services/api';
import toast from 'react-hot-toast';
import { Home, Package, TrendingUp, User, Bell, ArrowRight, Star, RotateCcw, Truck, Users, FileText } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { OUTLETS } from '../config/campus';

/** Pickup locations that are campus food outlets, sorted by how often this user ordered. */
function getTopRestaurantsFromOrders(orders, limit = 6) {
    const counts = {};
    for (const o of orders) {
        if (o.status === 'cancelled') continue;
        if (!OUTLETS.includes(o.pickup_location)) continue;
        const name = o.pickup_location;
        counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));
}

function BottomNav() {
    const path = window.location.pathname;

    return (
        <nav className="bottom-nav">
            <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
                <div className={`nav-icon-wrapper ${path === '/' ? 'active-pill' : ''}`}><Home size={20} /></div>
                <span className="nav-label">Home</span>
            </Link>
            <Link to="/orders" className={`nav-item ${path === '/orders' ? 'active' : ''}`}>
                <div className={`nav-icon-wrapper ${path === '/orders' ? 'active-pill' : ''}`}><Package size={20} /></div>
                <span className="nav-label">Orders</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} fill="currentColor" /> {Number(rating || 0).toFixed(1)} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 10 }}>({totalDeliveries} orders)</span>
            </div>
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
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);

    const topRestaurants = useMemo(() => getTopRestaurantsFromOrders(orders, 6), [orders]);
    const recentOrdersList = useMemo(() => orders.slice(0, 5), [orders]);
    const reorderCandidates = [
        { _id: 'mock1', pickup_location: 'Gate 3', item_details: 'Delivery to D1 Hostel', pickup_type: 'custom', delivery_hostel: 'D1', delivery_room: '', payment_method: 'cash' },
        { _id: 'mock2', pickup_location: 'Tuck Shop', item_details: 'Snacks for Room 207', pickup_type: 'outlet', delivery_hostel: 'Boys Hostel', delivery_room: '207', payment_method: 'cash' },
        { _id: 'mock3', pickup_location: 'Library', item_details: 'Books to Girls Hostel B', pickup_type: 'custom', delivery_hostel: 'Girls Hostel B', delivery_room: '', payment_method: 'cash' }
    ];

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, demandRes, deliveriesRes, partnersRes, earningsRes] = await Promise.all([
                getMyOrders(), getDemandAnalytics(), getMyDeliveries(), getOnlinePartners().catch(() => ({ data: [] })),
                getEarnings().catch(() => ({ data: {} }))
            ]);
            const allOrders = ordersRes.data || [];
            const validOrders = allOrders.filter(o => {
                const isDummy = ['hj', 'dfg', 'yghj'].includes(o.pickup_location?.toLowerCase()) || 
                                ['hj', 'dfg', 'yghj'].includes(o.item_details?.toLowerCase());
                return !isDummy;
            });
            setOrders(validOrders);
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

    const goReorderFromOrder = (order) => {
        navigate('/order/create', {
            state: {
                reorder: {
                    pickup_type: order.pickup_type,
                    pickup_location: order.pickup_location,
                    delivery_hostel: order.delivery_hostel,
                    delivery_room: order.delivery_room,
                    item_details: order.item_details,
                    special_instructions: order.special_instructions || '',
                    is_prepaid: !!order.is_prepaid,
                    payment_method: order.payment_method === 'cash' ? 'cash' : 'online',
                },
            },
        });
    };

    const goOrderFromOutlet = (pickup_location) => {
        navigate('/order/create', {
            state: {
                reorder: {
                    pickup_type: 'outlet',
                    pickup_location,
                    delivery_hostel: user?.hostel || '',
                    delivery_room: user?.room_no || '',
                    item_details: '',
                },
            },
        });
    };

    return (
        <div className="page" style={{ paddingBottom: 120 }}>
            <div className="page-content" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            {/* Hero Header */}
            <div className="gradient-hero" style={{ padding: '24px 24px 32px', textAlign: 'left', position: 'relative', overflow: 'hidden', borderRadius: 32, background: 'var(--bg)' }}>
                {/* Decorative mesh circles */}
                <div style={{ position: 'absolute', top: -20, right: -40, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(50px)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div onClick={() => setShowMenuModal(true)} className="hover-lift" style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 18, boxShadow: '0 8px 20px rgba(139,92,246,0.3)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {getInitials(user?.name)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                            <div className="mode-toggle-container">
                                <button className={`mode-toggle-btn ${mode === 'order' ? 'active' : ''}`} onClick={() => setMode('order')}>Order</button>
                                <button className={`mode-toggle-btn ${mode === 'deliver' ? 'active' : ''}`} onClick={() => setMode('deliver')}>Deliver</button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h1 style={{ color: 'var(--text-primary)', fontSize: 32, marginBottom: 8, letterSpacing: '-1.5px', fontWeight: 900 }}>Hey, {user?.name?.split(' ')[0]}!</h1>
                        {mode === 'order' && (
                            <>
                                <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{onlinePartners.length} partners online near you</p>
                                
                                {/* Compact Stats Strip */}
                                <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
                                    <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px', gap: 12, flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Orders</span>
                                            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>12</span>
                                        </div>
                                        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Earned</span>
                                            <span style={{ fontSize: 14, color: '#10B981', fontWeight: 800 }}>₹425</span>
                                        </div>
                                        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Online</span>
                                            <span style={{ fontSize: 14, color: '#4ade80', fontWeight: 800 }}>{onlinePartners.length || 3}</span>
                                        </div>
                                        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Rating</span>
                                            <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Star size={14} fill="#F59E0B" color="#F59E0B" /> 98%
                                        </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {mode === 'deliver' && (
                            <>
                                <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Ready to earn? Go online now</p>
                                {/* Compact Stats Strip */}
                                <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deliveries</span>
                                        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>{activeDeliveries.length}</span>
                                    </div>
                                    <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Earned</span>
                                        <span style={{ fontSize: 14, color: '#10B981', fontWeight: 800 }}>₹{earnings?.today_earnings || 0}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 24, position: 'relative', zIndex: 2 }}>
                <div className="home-mode-stack">
                    <div className={`home-mode-panel ${mode === 'order' ? 'is-visible' : 'is-hidden'}`}>
                        {/* ── ORDER MODE CONTENT ── */}
                        <div style={{ marginTop: 0 }}>
                        
                        {/* Live Activity Feed */}
                        <div className="card fade-in" style={{ padding: 12, borderRadius: 16, marginBottom: 24, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Recent Activity</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Order #1298 Delivered</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Partner Accepted Request</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>New Review Received</p>
                                </div>
                            </div>
                        </div>

                        {/* FEATURED: Place Order */}
                        <div style={{ marginBottom: 24 }}>
                            <button className="card hover-lift glow" onClick={() => navigate('/order/create')} style={{ width: '100%', padding: '32px 24px', textAlign: 'center', background: 'var(--card)', border: '1px solid rgba(139,92,246,0.4)', backgroundImage: 'linear-gradient(var(--card), var(--card)), linear-gradient(135deg, rgba(139,92,246,0.2), rgba(255,255,255,0.02))', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', borderRadius: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 10px 40px rgba(139,92,246,0.15)' }}>
                                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(139,92,246,0.5)' }}>
                                    <Package size={36} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>Place Order</div>
                                    <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Get anything delivered across campus</div>
                                </div>
                                <div style={{ marginTop: 8, background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: 999, fontWeight: 800, fontSize: 14 }}>Create Order</div>
                            </button>
                        </div>

                        {/* Quick Actions Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
                            <button className="card hover-lift" onClick={() => navigate('/orders')} style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Truck size={20} color="var(--primary)" />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Track Order</div>
                            </button>
                            <button className="card hover-lift" onClick={() => {
                                const el = document.getElementById('partner-hub');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }} style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} color="var(--primary)" />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Partner Hub</div>
                            </button>
                            <button className="card hover-lift" onClick={() => navigate('/earnings')} style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={20} color="var(--primary)" />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Earnings</div>
                            </button>
                            <button className="card hover-lift" onClick={() => navigate('/orders')} style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color="var(--primary)" />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>My Orders</div>
                            </button>
                        </div>

                        {topRestaurants.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div className="section-header">
                                    <h3 className="section-title">Your top restaurants</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, margin: '0 -4px', WebkitOverflowScrolling: 'touch' }}>
                                    {topRestaurants.map(({ name, count }) => (
                                        <button
                                            key={name}
                                            type="button"
                                            className="card"
                                            onClick={() => goOrderFromOutlet(name)}
                                            style={{
                                                flexShrink: 0,
                                                minWidth: 132,
                                                padding: '14px 16px',
                                                borderRadius: 16,
                                                border: '1px solid var(--border)',
                                                background: 'linear-gradient(160deg, #ffffff 0%, #f9f9ff 100%)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            }}
                                        >
                                            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>{name}</p>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{count} {count === 1 ? 'order' : 'orders'}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Available Nearby Snippet */}
                        {onlinePartners.length > 0 && (
                            <div id="partner-hub" style={{ marginBottom: 32 }}>
                                <div className="section-header">
                                    <h3 className="section-title">Available Nearby</h3>
                                </div>
                                <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, margin: '0 -4px', WebkitOverflowScrolling: 'touch' }}>
                                    {onlinePartners.map((partner) => (
                                        <div key={partner._id} className="card hover-lift" style={{ flexShrink: 0, width: 280, padding: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, flexShrink: 0 }}>
                                                    {partner.name.charAt(0)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <h4 style={{ fontSize: 16, fontWeight: 800 }}>{partner.name}</h4>
                                                        <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <span style={{width: 6, height: 6, borderRadius: '50%', background: '#4ade80'}} />
                                                            Online
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{partner.hostel} • Room {partner.room_no || 'TBA'}</p>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                                                        ✓ Trusted Partner
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, background: 'var(--surface-2)', padding: 12, borderRadius: 12 }}>
                                                <div>
                                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Rating</p>
                                                    <p style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="currentColor" /> {Number(partner.rating || 5.0).toFixed(1)}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Accept Rate</p>
                                                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>98%</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deliveries</p>
                                                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{partner.total_deliveries || 142}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Response</p>
                                                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{'< 2 mins'}</p>
                                                </div>
                                            </div>
                                            <button className="btn hover-lift" style={{ width: '100%', padding: '12px', fontSize: 14, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800 }} onClick={() => setSelectedPartner(partner)}>
                                                Choose Partner
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Orders */}
                        <div>
                            <div className="section-header">
                                <h3 className="section-title">📋 Recent Orders</h3>
                                <Link to="/orders" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>See All</Link>
                            </div>
                            {recentOrdersList.length === 0 ? (
                                <div className="empty-state" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                                    <div className="empty-state-icon">🛍️</div>
                                    <p className="empty-state-title" style={{ color: 'var(--text-primary)' }}>No recent orders yet.</p>
                                    <p className="empty-state-sub" style={{ color: 'var(--text-muted)' }}>Place your first order and we'll remember it here.</p>
                                </div>
                            ) : (
                                recentOrdersList.map((order) => (
                                    <div key={order._id} className="card recent-order-card" style={{ cursor: 'pointer', padding: 16, background: 'var(--card)', border: '1px solid var(--border)', marginBottom: 10 }}
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
                                                <div style={{ background: 'var(--surface-2)', padding: 8, borderRadius: 10, position: 'relative' }}>
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
                                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--primary-light)', fontSize: 16 }}>₹{order.price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        </div>
                    </div>
                    <div className={`home-mode-panel ${mode === 'deliver' ? 'is-visible' : 'is-hidden'}`}>
                    <div style={{ marginTop: -36 }}>

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
                                                        {requester?.hostel} · Room {requester?.room_no} · {requester?.total_deliveries > 0 ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><Star size={10} fill="currentColor" /> {Number(requester.rating || 0).toFixed(1)} ({requester.total_deliveries} deli.)</span>
                                                        ) : 'New'}
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
            </div>
            </div>
            </div>

            <BottomNav />

            {/* Menu Modal */}
            {showMenuModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }} onClick={() => setShowMenuModal(false)}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 320, padding: 24, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center', borderRadius: 24 }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
                        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>UniServe</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button onClick={() => navigate('/')} style={{ padding: '14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, cursor: 'pointer' }}>View Website</button>
                            <a href="https://github.com/thedishajyala/UniServe" target="_blank" rel="noreferrer" style={{ padding: '14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, display: 'block' }}>About / GitHub</a>
                            <button onClick={() => { logoutUser(); navigate('/login'); }} style={{ padding: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Logout</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Public Partner Profile Modal */}
            {selectedPartner && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedPartner(null)}>
                    <div className="card slide-up hide-scrollbar" style={{ width: '100%', maxWidth: 480, height: '85vh', overflowY: 'auto', background: 'var(--bg)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '32px 24px 48px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedPartner(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, zIndex: 10 }}>✕</button>
                        
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 40, margin: '0 auto 16px', boxShadow: '0 10px 30px rgba(139,92,246,0.5)' }}>
                                {selectedPartner.name.charAt(0)}
                            </div>
                            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{selectedPartner.name}</h2>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}>{selectedPartner.hostel} • Room {selectedPartner.room_no || 'TBA'} • Joined Aug 2025</p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 12, marginTop: 12 }}>
                                🟢 Online & Ready
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
                            <div style={{ background: 'var(--surface-2)', padding: '16px 8px', borderRadius: 16, textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Rating</p>
                                <p style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}><Star size={16} fill="currentColor" /> {Number(selectedPartner.rating || 5.0).toFixed(1)}</p>
                            </div>
                            <div style={{ background: 'var(--surface-2)', padding: '16px 8px', borderRadius: 16, textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Deliveries</p>
                                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedPartner.total_deliveries || 142}</p>
                            </div>
                            <div style={{ background: 'var(--surface-2)', padding: '16px 8px', borderRadius: 16, textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Accepts</p>
                                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>98%</p>
                            </div>
                            <div style={{ background: 'var(--surface-2)', padding: '16px 8px', borderRadius: 16, textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Time</p>
                                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{'< 2m'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust Badges</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(16,185,129,0.1)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.2)' }}>
                                <div style={{ fontSize: 24 }}>✓</div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>Verified Partner</h4>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Identity verified by Bennett University</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(139,92,246,0.1)', borderRadius: 16, border: '1px solid rgba(139,92,246,0.2)' }}>
                                <div style={{ fontSize: 24 }}>🏅</div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-light)' }}>Top Rated Partner</h4>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Consistently delivers 5-star service</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(245,158,11,0.1)', borderRadius: 16, border: '1px solid rgba(245,158,11,0.2)' }}>
                                <div style={{ fontSize: 24 }}>⚡</div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>Lightning Fast</h4>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Average delivery time is 12 minutes</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Recent Reviews</h3>
                            <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <p style={{ fontWeight: 700, fontSize: 13 }}>"Super fast and friendly! Highly recommend."</p>
                                    <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} fill="currentColor" /> 5.0</p>
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>- Aarav M. • 2 days ago</p>
                            </div>
                        </div>

                        <button className="btn btn-primary hover-lift glow" style={{ width: '100%', height: 56, fontSize: 16, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => { setSelectedPartner(null); navigate('/order/create'); }}>
                            Choose Partner
                        </button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
