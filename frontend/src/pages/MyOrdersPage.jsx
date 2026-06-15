import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../services/api';
import { Package, User as UserIcon, Home, TrendingUp, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyOrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const res = await getMyOrders();
            // Filter out dummy data
            const validOrders = (res.data || []).filter(o => {
                const isDummy = ['hj', 'dfg', 'yghj'].includes(o.pickup_location?.toLowerCase()) || 
                                ['hj', 'dfg', 'yghj'].includes(o.item_details?.toLowerCase());
                return !isDummy;
            });
            // Sort by createdAt desc
            validOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(validOrders);
        } catch (error) {
            setOrders([]);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const activeOrders = orders.filter(o => ['pending', 'accepted', 'picked', 'on_the_way'].includes(o.status));
    const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

    const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

    const getStatusDetails = (status) => {
        switch (status) {
            case 'pending': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: 'Searching Partner', icon: <Clock size={14}/> };
            case 'accepted': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', text: 'Accepted', icon: <Package size={14}/> };
            case 'picked': return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', text: 'Picked Up', icon: <Package size={14}/> };
            case 'on_the_way': return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', text: 'On the Way', icon: <MapPin size={14}/> };
            case 'delivered': return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', text: 'Delivered', icon: <CheckCircle size={14}/> };
            case 'cancelled': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: 'Cancelled', icon: <XCircle size={14}/> };
            default: return { color: 'var(--text-muted)', bg: 'var(--surface)', text: status, icon: <Package size={14}/> };
        }
    };

    return (
        <div className="page" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 100 }}>
            <div className="gradient-hero" style={{ padding: '40px 24px 80px', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, textAlign: 'center' }}>
                <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>My Orders</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>Track and manage your deliveries</p>
                
                {/* Tabs */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, marginTop: 20, maxWidth: 300, margin: '20px auto 0' }}>
                    <button 
                        style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: activeTab === 'active' ? 'white' : 'transparent', color: activeTab === 'active' ? 'var(--bg)' : 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setActiveTab('active')}
                    >
                        Active ({activeOrders.length})
                    </button>
                    <button 
                        style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: activeTab === 'past' ? 'white' : 'transparent', color: activeTab === 'past' ? 'var(--bg)' : 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setActiveTab('past')}
                    >
                        Past ({pastOrders.length})
                    </button>
                </div>
            </div>

            <div className="page-content" style={{ marginTop: -40 }}>
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                ) : displayedOrders.length === 0 ? (
                    <div className="empty-state fade-in" style={{ background: 'var(--surface-2)', borderRadius: 24, padding: '60px 24px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div className="empty-state-icon" style={{ fontSize: '4rem', marginBottom: 20 }}>📦</div>
                        <h3 className="empty-state-title" style={{ fontSize: 20, marginBottom: 8 }}>No {activeTab} orders</h3>
                        <p className="empty-state-sub" style={{ color: 'var(--text-muted)' }}>
                            {activeTab === 'active' ? 'You don\'t have any ongoing deliveries right now.' : 'You haven\'t made any past orders yet.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {displayedOrders.map((order) => {
                            const status = getStatusDetails(order.status);
                            
                            return (
                                <div key={order._id} className="card" onClick={() => navigate(order.status === 'pending' ? `/order/${order._id}/partners` : `/order/${order._id}/track`)} style={{ padding: 16, cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid var(--border)', transition: 'transform 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {status.icon} {status.text}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    
                                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>
                                        {order.item_details}
                                    </h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, padding: '12px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pickup</span>
                                            <span style={{ fontSize: 13, fontWeight: 700 }}>{order.pickup_location}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drop</span>
                                            <span style={{ fontSize: 13, fontWeight: 700 }}>{order.delivery_hostel} · Rm {order.delivery_room}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {order.partner_id ? (
                                                <>
                                                    <div className="avatar" style={{ width: 28, height: 28, background: 'var(--primary)', color: 'white', fontSize: 12 }}>
                                                        {order.partner_id.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 13, fontWeight: 700 }}>{order.partner_id.name}</p>
                                                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Partner</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No partner assigned</span>
                                            )}
                                        </div>
                                        
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>₹{order.price}</p>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.payment_method === 'cash' ? 'Cash on Door' : 'Paid'}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <nav className="bottom-nav">
                <Link to="/" className="nav-item">
                    <div className="nav-icon-wrapper"><Home size={20} /></div>
                    <span className="nav-label">Home</span>
                </Link>
                <Link to="/orders" className="nav-item active">
                    <div className="nav-icon-wrapper active-pill"><Package size={20} /></div>
                    <span className="nav-label">Orders</span>
                </Link>
                <Link to="/earnings" className="nav-item">
                    <div className="nav-icon-wrapper"><TrendingUp size={20} /></div>
                    <span className="nav-label">Earnings</span>
                </Link>
                <Link to="/profile" className="nav-item">
                    <div className="nav-icon-wrapper"><UserIcon size={20} /></div>
                    <span className="nav-label">Profile</span>
                </Link>
            </nav>
        </div>
    );
}