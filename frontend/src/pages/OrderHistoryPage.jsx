import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Search, Home, TrendingUp, User as UserIcon } from 'lucide-react';
import { getMyOrders } from '../services/api';

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
  return (
    <span
      className={`badge status-${status} badge-sm`}
      style={{ fontSize: 11, padding: '3px 10px' }}
    >
      {map[status] || status}
    </span>
  );
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getMyOrders();
        if (!mounted) return;
        setOrders(res.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const hay = [
        o.pickup_location,
        o.delivery_hostel,
        o.delivery_room,
        o.item_details,
        o.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query]);

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <div
        className="gradient-hero"
        style={{
          padding: '46px 24px 70px',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <button
              type="button"
              className="glass"
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.16)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.22)' }}>
                <Package size={18} color="white" />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>ORDER HISTORY</div>
                <div style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>All Orders</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ marginTop: -38, position: 'relative', zIndex: 2 }}>
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={16} color="var(--text-muted)" />
            </div>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search outlet, hostel, items, status…"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 18 }}>
            <p style={{ fontWeight: 800 }}>Loading your orders…</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Hang tight, fetching your history.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 14 }}>
            <div className="empty-state-icon">🛍️</div>
            <p className="empty-state-title">{orders.length === 0 ? 'No orders yet' : 'No matches found'}</p>
            <p className="empty-state-sub">
              {orders.length === 0 ? 'Create your first delivery request!' : 'Try a different search.'}
            </p>
            {orders.length === 0 && (
              <button className="btn btn-primary" onClick={() => navigate('/order/create')} style={{ marginTop: 12 }}>
                + Create Order
              </button>
            )}
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order._id}
              className="order-card recent-order-card"
              style={{ cursor: 'pointer', padding: 16 }}
              onClick={() =>
                navigate(
                  order.status === 'delivered'
                    ? `/order/${order._id}/review`
                    : order.status === 'accepted'
                      ? `/chat/${order._id}`
                      : `/order/${order._id}/track`
                )
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--bg)', padding: 8, borderRadius: 10 }}>
                    {order.pickup_location?.includes('Gate') ? (
                      <Package size={18} color="var(--primary)" />
                    ) : (
                      <span style={{ fontSize: 18 }}>🍔</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15 }}>{order.pickup_location}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      → {order.delivery_hostel}, Room {order.delivery_room}
                    </p>
                    {order.item_details && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        {order.item_details.slice(0, 60)}
                        {order.item_details.length > 60 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {statusBadge(order.status)}
                  <span style={{ fontFamily: 'Outfit', fontWeight: 900, color: 'var(--primary-dark)', fontSize: 16 }}>
                    ₹{order.price}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <div className="nav-icon-wrapper"><Home size={20} /></div>
          <span className="nav-label">Home</span>
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

