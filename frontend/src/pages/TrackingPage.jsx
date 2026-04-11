import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrderStatus, cancelOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ORDER_STATUSES, CAMPUS_COORDINATES } from '../config/campus';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, MapPin, Star, Phone, Navigation, Package, Box } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// LUXE MARKER CUSTOMIZATION
const createPulsingIcon = (color = '#4F46E5') => {
    return L.divIcon({
        className: 'custom-pulsing-icon',
        html: `
            <div style="position: relative; width: 24px; height: 24px;">
                <div style="position: absolute; inset: 0; background: ${color}; border-radius: 50%; opacity: 0.2; animation: pulse-ring 1.5s infinite;"></div>
                <div style="position: absolute; inset: 4px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.2);"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
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
    
    const [partnerLocation, setPartnerLocation] = useState(CAMPUS_COORDINATES);
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

        socket.on('partner_location', (loc) => {
            setPartnerLocation(loc);
        });

        return () => {
            socket.off('order_status_changed');
            socket.off('order_cancelled');
            socket.off('partner_location');
        };
    }, [socket, orderId, user]);

    useEffect(() => {
        const isPartner = order?.delivery_partner_id?._id === user?._id || order?.delivery_partner_id === user?._id;
        const trackingActive = ['picked', 'on_the_way'].includes(order?.status);
        
        if (isPartner && trackingActive) {
            if ('geolocation' in navigator) {
                const id = navigator.geolocation.watchPosition(
                    (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setPartnerLocation(loc);
                        if (socket) {
                            socket.emit('location_update', { orderId, lat: loc.lat, lng: loc.lng });
                        }
                    },
                    (err) => console.error("Geolocation error:", err),
                    { enableHighAccuracy: true, maximumAge: 0 }
                );
                setWatchId(id);
            }
        }

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
        if (reason === null) return;
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
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, background: '#4F46E5', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'pulse-ring 2s infinite' }}>
                    <Box color="#fff" size={28} />
                </div>
                <p style={{ color: '#4F46E5', fontWeight: 800, fontSize: 14 }}>LOADING ORDER...</p>
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
    const nextStatusLabels = { picked: 'Mark as Picked', on_the_way: 'Share Live Location', delivered: 'Confirm Arrival' };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
            {/* ── LUXE HEADER ── */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', zIndex: 1000 }}>
                <div style={{ 
                    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: '12px 20px', 
                    display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)' 
                }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 12, display: 'flex', alignItems: 'center', color: '#4F46E5' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Tracking</h1>
                        <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>ORDER ID: {order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <a href={`tel:${(isOwner ? partner : requester)?.phone}`} style={{ textDecoration: 'none', width: 40, height: 40, background: '#F1F5F9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B' }}>
                        <Phone size={18} />
                    </a>
                    <button onClick={() => navigate(`/chat/${orderId}`)} style={{ background: '#4F46E5', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <MessageCircle size={18} />
                    </button>
                </div>
            </div>

            {/* ── LIVE MAP TERMINAL ── */}
            <div style={{ flex: 1, position: 'relative', zIndex: 0 }}>
                <MapContainer center={[partnerLocation.lat, partnerLocation.lng]} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <ChangeView center={[partnerLocation.lat, partnerLocation.lng]} />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />
                    
                    {/* Pulsing Partner Marker */}
                    {['picked', 'on_the_way'].includes(order.status) && (
                        <Marker position={[partnerLocation.lat, partnerLocation.lng]} icon={createPulsingIcon()}>
                            <Popup>
                                <div style={{ fontWeight: 800, color: '#4F46E5' }}>DELIVERY PARTNER</div>
                                <div style={{ fontSize: 11 }}>{(isOwner ? partner : requester)?.name} is moving</div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* ── LUXE BOTTOM CONSOLE ── */}
            <div style={{ 
                position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderRadius: 32, padding: 32,
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.8)'
            }} className="slide-up">
                
                {/* MISSION STATUS HUD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: '#F1F5F9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {ORDER_STATUSES.find(s => s.key === order.status)?.icon || <Package size={20} />}
                        </div>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order Status</p>
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1E293B' }}>{order.status.replace('_', ' ').toUpperCase()}</h2>
                        </div>
                    </div>
                </div>

                {/* LOGISTICS DETAILS CAROUSEL-STYLE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                    <div style={{ background: '#F8FAFC', borderRadius: 20, padding: 16 }}>
                        <p style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>PICKUP LOCATION</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{order.pickup_location}</p>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: 20, padding: 16 }}>
                        <p style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>DELIVER TO</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{order.delivery_hostel} • {order.delivery_room}</p>
                    </div>
                </div>

                {/* PARTNER SNAPSHOT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'rgba(79, 70, 229, 0.04)', borderRadius: 24, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, background: '#4F46E5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>
                        {getInitials((isOwner ? partner : requester)?.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{(isOwner ? partner : requester)?.name}</p>
                        <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>BENNETT STUDENT • {isOwner ? 'Partner' : 'Customer'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontWeight: 800, fontSize: 14 }}>
                            <Star size={14} fill="#F59E0B" /> {(isOwner ? partner : requester)?.rating?.toFixed(1) || '0.0'}
                        </div>
                    </div>
                </div>

                {/* ACTION TERMINAL */}
                <div style={{ display: 'flex', gap: 12 }}>
                    {isPartner && nextStatusMap[order.status] && (
                        <button 
                            onClick={() => handleUpdateStatus(nextStatusMap[order.status])}
                            disabled={updating}
                            style={{ 
                                flex: 1, height: 56, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 18, 
                                fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)', transition: 'all 0.2s ease'
                            }}
                        >
                            {updating ? 'SAVING...' : nextStatusLabels[nextStatusMap[order.status]]}
                        </button>
                    )}
                    
                    {isOwner && order.status === 'delivered' && (
                        <button 
                            onClick={() => navigate(`/order/${orderId}/review`)}
                            style={{ flex: 1, height: 56, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 18, fontSize: 15, fontWeight: 900 }}
                        >
                            REVIEW & COMPLETE
                        </button>
                    )}

                    {(isOwner || isPartner) && ['pending', 'requested', 'accepted'].includes(order.status) && (
                        <button 
                            onClick={handleCancel}
                            disabled={cancelling}
                            style={{ width: 56, height: 56, background: '#FFF1F2', color: '#F43F5E', border: 'none', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            ❌
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
