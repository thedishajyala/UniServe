import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMessages, getOrderById, uploadImage } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Phone, MapPin, Camera, ImagePlus, X } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Resolve image URL (relative or absolute)
function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${SOCKET_URL}${url}`;
}

export default function ChatPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [order, setOrder] = useState(null);
    const [text, setText] = useState('');
    const [typingPartner, setTypingPartner] = useState(false);
    const [imagePreview, setImagePreview] = useState(null); // { file, url }
    const [uploading, setUploading] = useState(false);
    const endRef = useRef(null);
    const typingTimer = useRef(null);
    const galleryRef = useRef(null);
    const cameraRef = useRef(null);

    const loadData = useCallback(async () => {
        try {
            const [msgRes, orderRes] = await Promise.all([getMessages(orderId), getOrderById(orderId)]);
            setMessages(msgRes.data);
            setOrder(orderRes.data);
        } catch {
            toast.error('Failed to load chat');
        }
    }, [orderId]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('join_order_room', { orderId, userId: user._id });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        socket.on('partner_typing', ({ isTyping }) => {
            setTypingPartner(isTyping);
        });
        socket.on('order_status_changed', ({ status }) => {
            setOrder((o) => o ? { ...o, status } : o);
            toast(`Order status: ${status} 📦`, { icon: '✅' });
        });

        return () => {
            socket.off('receive_message');
            socket.off('partner_typing');
            socket.off('order_status_changed');
        };
    }, [socket, orderId, user]);

    const handleSend = () => {
        if (!text.trim() || !socket) return;
        socket.emit('send_message', { orderId, senderId: user._id, content: text.trim(), type: 'text' });
        setText('');
        socket.emit('typing', { orderId, userId: user._id, isTyping: false });
    };

    const handleTyping = (e) => {
        setText(e.target.value);
        if (!socket) return;
        socket.emit('typing', { orderId, userId: user._id, isTyping: true });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            socket.emit('typing', { orderId, userId: user._id, isTyping: false });
        }, 1500);
    };

    // Handle image file selected (gallery or camera)
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setImagePreview({ file, url: previewUrl });
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const cancelPreview = () => {
        if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
        setImagePreview(null);
    };

    const sendImage = async () => {
        if (!imagePreview?.file || uploading) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', imagePreview.file);
            formData.append('order_id', orderId);

            const { data } = await uploadImage(formData);
            const msg = data.message;

            // Broadcast via socket so the other user sees it immediately
            socket?.emit('send_message', {
                orderId,
                senderId: user._id,
                type: 'image',
                image_url: msg.image_url,
                content: '',
            });

            // Add to own chat immediately (won't double because socket sends to OTHERS)
            setMessages((prev) => [...prev, {
                _id: msg._id,
                sender_id: user._id,
                type: 'image',
                image_url: msg.image_url,
                content: '',
                createdAt: msg.createdAt,
            }]);

            cancelPreview();
            toast.success('Image sent! 📷');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send image');
        } finally {
            setUploading(false);
        }
    };

    const partner = order
        ? (order.user_id?._id === user?._id || order.user_id === user?._id
            ? order.delivery_partner_id
            : order.user_id)
        : null;

    const statusColors = {
        accepted: 'var(--primary)', picked: 'var(--secondary)',
        on_the_way: '#2563EB', delivered: 'var(--success)',
    };

    return (
        <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── HEADER ── */}
            <div className="page-header" style={{ flexShrink: 0 }}>
                <button className="btn btn-icon btn-ghost" onClick={() => navigate(`/order/${orderId}/track`)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="avatar avatar-sm">{getInitials(partner?.name || '?')}</div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 15, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{partner?.name || 'Loading...'}</h1>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{partner?.hostel} · {partner?.enrollment_no}</p>
                </div>
                {order && (
                    <span style={{
                        background: statusColors[order.status] ? `${statusColors[order.status]}22` : 'var(--bg)',
                        color: statusColors[order.status] || 'var(--text-secondary)',
                        padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'Outfit',
                    }}>
                        {order.status?.replace('_', ' ')}
                    </span>
                )}
                <a href={`tel:`} className="btn btn-icon btn-ghost"><Phone size={18} /></a>
            </div>

            {/* ── ORDER INFO BANNER ── */}
            {order && (
                <div style={{ background: 'rgba(79,70,229,0.06)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                    <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <strong>{order.pickup_location}</strong> → {order.delivery_hostel} Room {order.delivery_room}
                    </p>
                    <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 11 }}
                        onClick={() => navigate(`/order/${orderId}/track`)}>
                        Track
                    </button>
                </div>
            )}

            {/* ── IMAGE PREVIEW BAR ── */}
            {imagePreview && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', background: 'rgba(79,70,229,0.08)',
                    borderBottom: '1px solid var(--border)', flexShrink: 0,
                }}>
                    <div style={{ position: 'relative' }}>
                        <img src={imagePreview.url} alt="preview"
                            style={{ height: 64, width: 64, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--primary)' }} />
                        <button onClick={cancelPreview} style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#ef4444', border: 'none', borderRadius: '50%',
                            width: 18, height: 18, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', color: '#fff', padding: 0,
                        }}>
                            <X size={11} />
                        </button>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Ready to send</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{imagePreview.file.name}</p>
                    </div>
                    <button className="btn btn-primary" onClick={sendImage} disabled={uploading}
                        style={{ padding: '8px 16px', fontSize: 13 }}>
                        {uploading ? '⏳ Sending...' : <>Send <Send size={13} style={{ marginLeft: 4 }} /></>}
                    </button>
                </div>
            )}

            {/* ── MESSAGES ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
                {messages.length === 0 && (
                    <div className="empty-state" style={{ paddingTop: 60 }}>
                        <div className="empty-state-icon">💬</div>
                        <p className="empty-state-title">Say Hi!</p>
                        <p className="empty-state-sub">Share the delivery location or any details here</p>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMine = msg.sender_id === user?._id || msg.sender_id?._id === user?._id;
                    const isImage = msg.type === 'image';

                    return (
                        <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                            {isImage ? (
                                <div style={{
                                    maxWidth: '70%',
                                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    overflow: 'hidden',
                                    border: '2px solid var(--border)',
                                    cursor: 'pointer',
                                }}
                                    onClick={() => window.open(resolveImageUrl(msg.image_url), '_blank')}
                                >
                                    <img
                                        src={resolveImageUrl(msg.image_url)}
                                        alt="shared image"
                                        style={{ display: 'block', maxWidth: '100%', maxHeight: 250, objectFit: 'cover' }}
                                        onError={(e) => { e.target.src = ''; e.target.alt = 'Image unavailable'; }}
                                    />
                                </div>
                            ) : (
                                <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>{msg.content}</div>
                            )}
                            <span className="chat-time">{formatTime(msg.createdAt)}</span>
                        </div>
                    );
                })}

                {typingPartner && (
                    <div style={{ alignSelf: 'flex-start' }}>
                        <div className="chat-bubble theirs" style={{ padding: '10px 16px' }}>
                            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                {[0, 1, 2].map(i => (
                                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `pulse-dot 1s ${i * 0.2}s infinite` }} />
                                ))}
                            </span>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* ── INPUT BAR ── */}
            <div style={{
                flexShrink: 0,
                padding: '10px 12px',
                background: 'var(--bg)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            }}>
                {/* Hidden file inputs */}
                <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageSelect} />

                {/* Gallery button */}
                <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => galleryRef.current?.click()}
                    title="Send image from gallery"
                    style={{ color: 'var(--primary)', flexShrink: 0 }}
                >
                    <ImagePlus size={20} />
                </button>

                {/* Camera button */}
                <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => cameraRef.current?.click()}
                    title="Take a photo"
                    style={{ color: 'var(--primary)', flexShrink: 0 }}
                >
                    <Camera size={20} />
                </button>

                <input
                    className="input"
                    style={{ flex: 1, padding: '11px 14px', margin: 0, fontSize: 14 }}
                    placeholder="Type a message..."
                    value={text}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />

                <button
                    className="btn btn-primary btn-icon"
                    onClick={handleSend}
                    disabled={!text.trim()}
                    style={{ flexShrink: 0 }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
