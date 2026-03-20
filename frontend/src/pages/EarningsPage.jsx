import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEarnings, getMyDeliveries, getDemandAnalytics } from '../services/api';
import toast from 'react-hot-toast';
import { Home, Package, TrendingUp, User, ArrowLeft } from 'lucide-react';

export default function EarningsPage() {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const [earnings, setEarnings] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [demand, setDemand] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [eRes, dRes, analyticsRes] = await Promise.all([
                    getEarnings(), getMyDeliveries(), getDemandAnalytics()
                ]);
                setEarnings(eRes.data);
                setDeliveries(dRes.data.slice(0, 10));
                setDemand(analyticsRes.data);
            } catch {
                toast.error('Failed to load earnings');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatTime = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour} ${period}`;
    };

    return (
        <div className="page" style={{ paddingBottom: 80 }}>
            {/* Header */}
            <div className="gradient-hero" style={{ padding: '40px 24px 60px', textAlign: 'left', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <h1 style={{ color: 'white', fontSize: 26, marginBottom: 4 }}>Your Earnings 💸</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Track your delivery income</p>
            </div>

            <div className="page-content" style={{ marginTop: -32 }}>
                {/* Demand Alert */}
                {demand?.isCurrentlyPeak && (
                    <div className="demand-banner fade-in" style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 24 }}>🔥</span>
                        <p style={{ fontSize: 14 }}>{demand.demandMessage}</p>
                    </div>
                )}

                {/* Stats */}
                <div className="stat-grid" style={{ marginBottom: 16 }}>
                    <div className="stat-card">
                        <div className="stat-value">₹{earnings?.today_earnings || 0}</div>
                        <div className="stat-label">Today</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">₹{earnings?.week_earnings || 0}</div>
                        <div className="stat-label">This Week</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">₹{earnings?.total_earnings || 0}</div>
                        <div className="stat-label">Total Earned</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{earnings?.successful_deliveries || 0}</div>
                        <div className="stat-label">Deliveries</div>
                    </div>
                </div>

                {/* Rating */}
                <div className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 40 }}>⭐</div>
                    <div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: '#F59E0B', lineHeight: 1 }}>
                            {(earnings?.rating || user?.rating || 5).toFixed(1)}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Your rating</p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15 }}>
                            {earnings?.successful_deliveries || 0}/{earnings?.total_deliveries || 0}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Success rate</p>
                    </div>
                </div>

                {/* Peak Hours */}
                {demand?.peakHours?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <p className="section-title" style={{ marginBottom: 12 }}>📊 Peak Hours (Go Online to Earn More!)</p>
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {demand.peakHours.map((ph) => (
                                <div key={ph.hour} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', textAlign: 'center', minWidth: 60, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                    <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{ph.count}</p>
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatTime(ph.hour)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery History */}
                <div>
                    <p className="section-title" style={{ marginBottom: 12 }}>📦 Recent Deliveries</p>
                    {deliveries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🚴</div>
                            <p className="empty-state-title">No deliveries yet</p>
                            <p className="empty-state-sub">Go online to start earning!</p>
                        </div>
                    ) : (
                        deliveries.map((d) => (
                            <div key={d._id} className="order-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: 14 }}>{d.pickup_location}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                                            → {d.delivery_hostel} · {new Date(d.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--success)', fontSize: 17 }}>+₹{d.delivery_earning}</p>
                                        <span className={`badge status-${d.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>{d.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Nav */}
            <nav className="bottom-nav">
                <Link to="/" className="nav-item"><Home /><span className="nav-label">Home</span></Link>
                <Link to="/order/create" className="nav-item"><Package /><span className="nav-label">Order</span></Link>
                <Link to="/earnings" className="nav-item active"><TrendingUp /><span className="nav-label">Earnings</span></Link>
                <button className="nav-item" onClick={() => { logoutUser(); navigate('/login'); }}><User /><span className="nav-label">Logout</span></button>
            </nav>
        </div>
    );
}
