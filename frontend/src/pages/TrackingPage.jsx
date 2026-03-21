import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrderStatus, cancelOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ORDER_STATUSES } from '../config/campus';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function TrackingPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    
    // Live Tracking State
    const [partnerLocation, setPartnerLocation] = useState(null); // { lat, lng }
    const [watchId, setWatchId] = useState(null);

    const loadOrder = useCallback(async () => {
        try {
            const res = await getOrderById(orderId);
            setOrder(res.data);
        } catch {
            toast.error('Order not found');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => { loadOrder(); }, [loadOrder]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('join_user_room', { userId: user._id });
        socket.emit('join_order_room', { orderId, userId: user._id });
        socket.on('order_status_changed', ({ status }) => {
            setOrder((o) => o ? { ...o, status } : o);
        });
        socket.on('order_cancelled', ({ cancelled_by, reason }) => {
            toast.error(`Order cancelled by ${cancelled_by}: ${reason}`);
            setOrder((o) => o ? { ...o, status: 'cancelled' } : o);
        });

        // Listen for live location updates from the partner
        socket.on('partner_location', (loc) => {
            setPartnerLocation(loc);
        });

        return () => {
            socket.off('order_status_changed');
            socket.off('order_cancelled');
            socket.off('partner_location');
        };
    }, [socket, orderId, user]);

    // Partner: Start broadcasting location when 'on_the_way'
    useEffect(() => {
        const isPartner = order?.delivery_partner_id?._id === user?._id || order?.delivery_partner_id === user?._id;
        
        if (isPartner && order?.status === 'on_the_way') {
            if ('geolocation' in navigator) {
                const id = navigator.geolocation.watchPosition(
                    (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setPartnerLocation(loc); // Show it locally too
                        if (socket) {
                            socket.emit('location_update', { orderId, lat: loc.lat, lng: loc.lng });
                        }
                    },
                    (err) => console.error("Geolocation error:", err),
                    { enableHighAccuracy: true, maximumAge: 0 }
                );
                setWatchId(id);
            } else {
                toast.error("Geolocation is not supported by your browser");
            }
        }

        // Cleanup watcher if status changes or unmount
        if (order?.status === 'delivered' && watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [order?.status]);

    const handleUpdateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const res = await updateOrderStatus({ order_id: orderId, status: newStatus });
            setOrder(res.data.order);
            socket?.emit('status_update', { orderId, status: newStatus, userId: user._id });
            toast.success(`Status updated to "${newStatus.replace('_', ' ')}" ✅`);
            if (newStatus === 'delivered') {
                setTimeout(() => navigate(`/order/${orderId}/review`), 1500);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = async () => {
        const reason = window.prompt('Reason for cancellation? (optional)');
        if (reason === null) return; // user hit Cancel on prompt
        setCancelling(true);
        try {
            await cancelOrder({ order_id: orderId, reason: reason || 'No reason given' });
            toast.success('Order cancelled');
            setOrder((o) => o ? { ...o, status: 'cancelled' } : o);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return (
        <div className="full-center">
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>Loading order...</p>
            </div>
        </div>
    );
    if (!order) return null;

    const isPartner = order.delivery_partner_id?._id === user?._id || order.delivery_partner_id === user?._id;
    const isOwner = order.user_id?._id === user?._id || order.user_id === user?._id;
    const partner = order.delivery_partner_id;
    const requester = order.user_id;

    const currentStatusIndex = ['accepted', 'picked', 'on_the_way', 'delivered'].indexOf(order.status);

    const nextStatusMap = { accepted: 'picked', picked: 'on_the_way', on_the_way: 'delivered' };
    const nextStatusLabels = { picked: '📦 Mark as Picked Up', on_the_way: '🚗 Mark as On the Way', delivered: '🎉 Mark as Delivered' };

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn btn-icon btn-ghost" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
                <h1 className="page-title">Order Tracking</h1>
                <button className="btn btn-icon btn-ghost" onClick={() => navigate(`/chat/${orderId}`)}>
                    <MessageCircle size={20} />
                </button>
            </div>

            <div className="page-content">
                {/* Order Info */}
                <div className="card" style={{ marginBottom: 20, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3 }}>FROM</p>
                            <p style={{ fontWeight: 700, fontSize: 15 }}>{order.pickup_location}</p>
                        </div>
                        <div style={{ fontSize: 24 }}>→</div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3 }}>TO</p>
                            <p style={{ fontWeight: 700, fontSize: 15 }}>{order.delivery_hostel}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Room {order.delivery_room}</p>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🛍️ {order.item_details}</p>
                        
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {order.is_prepaid ? (
                                <span className="badge" style={{ background: 'var(--success-light)', color: '#065F46' }}>✅ Items Pre-Paid</span>
                            ) : (
                                <span className="badge" style={{ background: 'var(--warning-light)', color: '#92400E' }}>💵 Pay Item Cost + Delivery</span>
                            )}
                            {order.special_instructions && (
                                <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>📝 Has Instructions</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Partner / Requester Info */}
                <div className="card" style={{ marginBottom: 20, padding: 20 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                        {isOwner ? '🚴 Delivery Partner' : '👤 Order By'}
                    </p>
                    {(isOwner ? partner : requester) ? (
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                            <div className="avatar avatar-md">{getInitials((isOwner ? partner : requester)?.name || '?')}</div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 15 }}>{(isOwner ? partner : requester)?.name}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {(isOwner ? partner : requester)?.hostel} · {(isOwner ? partner : requester)?.enrollment_no}
                                </p>
                            </div>
                            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}
                                onClick={() => navigate(`/chat/${orderId}`)}>
                                💬 Chat
                            </button>
                        </div>
                    ) : <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Waiting for partner...</p>}
                </div>

                {/* Status Stepper */}
                <div className="card" style={{ marginBottom: 20, padding: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, fontFamily: 'Outfit, sans-serif' }}>Order Status</p>
                    <div className="stepper">
                        {ORDER_STATUSES.map((s, i) => {
                            const done = currentStatusIndex > i || order.status === s.key;
                            const active = order.status === s.key;
                            return (
                                <div key={s.key} className={`stepper-item ${done ? 'done' : active ? 'active' : ''}`}>
                                    <div className="stepper-dot">{s.icon}</div>
                                    <div className="stepper-content">
                                        <p className="stepper-label" style={{ color: done || active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Live Map (Only visible if On The Way & Coordinates Exist) */}
                {order.status === 'on_the_way' && partnerLocation && (
                    <div className="card slide-up" style={{ marginBottom: 20, padding: 16, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <MapPin size={18} color="var(--primary)" />
                            <p style={{ fontWeight: 700, fontSize: 14 }}>Live Tracking 📍</p>
                        </div>
                        <div style={{ height: 250, borderRadius: 12, overflow: 'hidden', zIndex: 0 }}>
                            <MapContainer center={[partnerLocation.lat, partnerLocation.lng]} zoom={17} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                                />
                                <Marker position={[partnerLocation.lat, partnerLocation.lng]}>
                                    <Popup>
                                        <b>{(isOwner ? partner : requester)?.name || 'Partner'}</b> is here!
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Partner Action: update status */}
                {isPartner && nextStatusMap[order.status] && (
                    <button className="btn btn-success btn-w-full btn-lg"
                        onClick={() => handleUpdateStatus(nextStatusMap[order.status])}
                        disabled={updating}>
                        {updating ? '⏳ Updating...' : nextStatusLabels[nextStatusMap[order.status]]}
                    </button>
                )}

                {/* Owner: leave review after delivery */}
                {isOwner && order.status === 'delivered' && (
                    <button className="btn btn-primary btn-w-full btn-lg"
                        onClick={() => navigate(`/order/${orderId}/review`)}>
                        ⭐ Leave a Review
                    </button>
                )}

                {/* Cancel button — requester or partner, only for cancellable statuses */}
                {(isOwner || isPartner) && ['pending', 'requested', 'accepted'].includes(order.status) && (
                    <button
                        className="btn btn-w-full"
                        onClick={handleCancel}
                        disabled={cancelling}
                        style={{ marginTop: 10, background: 'transparent', border: '1.5px solid #ef4444', color: '#ef4444', fontWeight: 600 }}
                    >
                        {cancelling ? '⏳ Cancelling...' : '❌ Cancel Order'}
                    </button>
                )}
            </div>
        </div>
    );
}
