import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleAvailability, getMyOrders, getDemandAnalytics } from '../services/api';
import toast from 'react-hot-toast';
import { Home, Package, TrendingUp, User } from 'lucide-react';

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
    const map = { pending: '⏳ Pending', accepted: '✅ Accepted', picked: '📦 Picked', on_the_way: '🚗 On Way', delivered: '🎉 Delivered', cancelled: '❌ Cancelled' };
    return <span className={`badge status-${status} badge-sm`} style={{ fontSize: 11, padding: '3px 10px' }}>{map[status] || status}</span>;
}

export default function HomePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [demand, setDemand] = useState(null);
    const [togglingAvail, setTogglingAvail] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, demandRes] = await Promise.all([getMyOrders(), getDemandAnalytics()]);
            setOrders(ordersRes.data.slice(0, 5));
            setDemand(demandRes.data);
        } catch { }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleToggleAvail = async () => {
        setTogglingAvail(true);
        try {
            const res = await toggleAvailability();
            updateUser({ is_available: res.data.is_available });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle');
        } finally {
            setTogglingAvail(false);
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
                                onClick={() => navigate(order.status === 'delivered' ? `/order/${order._id}/review` : `/order/${order._id}/track`)}>
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
