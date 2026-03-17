import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMessages, getOrderById } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Phone, MapPin } from 'lucide-react';

function getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const endRef = useRef(null);
    const typingTimer = useRef(null);

    const loadData = useCallback(async () => {
        try {
            const [msgRes, orderRes] = await Promise.all([getMessages(orderId), getOrderById(orderId)]);
            setMessages(msgRes.data);
            setOrder(orderRes.data);
        } catch {
            toast.error('Failed to load chat');
        }
    }, [orderId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        socket.emit('send_message', { orderId, senderId: user._id, content: text.trim() });
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

    const partner = order
        ? (order.user_id?._id === user?._id ? order.delivery_partner_id : order.user_id)
        : null;

    const statusColors = {
        accepted: 'var(--primary)', picked: 'var(--secondary)',
        on_the_way: '#2563EB', delivered: 'var(--success)',
    };

    return (
        <div className="page" style={{ height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div className="page-header">
                <button className="btn btn-icon btn-ghost" onClick={() => navigate(`/order/${orderId}/track`)}><ArrowLeft size={20} /></button>
                <div className="avatar avatar-sm">{getInitials(partner?.name || '?')}</div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 15, fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>{partner?.name || 'Loading...'}</h1>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{partner?.hostel} · {partner?.enrollment_no}</p>
                </div>
                {order && (
                    <span style={{ background: statusColors[order.status] ? `${statusColors[order.status]}22` : 'var(--bg)', color: statusColors[order.status] || 'var(--text-secondary)', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'Poppins' }}>
                        {order.status?.replace('_', ' ')}
                    </span>
                )}
                <a href={`tel:`} className="btn btn-icon btn-ghost"><Phone size={18} /></a>
            </div>

            {/* Order Info Banner */}
            {order && (
                <div style={{ background: 'rgba(79,70,229,0.06)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
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

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
                {messages.length === 0 && (
                    <div className="empty-state" style={{ paddingTop: 60 }}>
                        <div className="empty-state-icon">💬</div>
                        <p className="empty-state-title">Say Hi!</p>
                        <p className="empty-state-sub">Start chatting with your delivery partner</p>
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isMine = msg.sender_id === user?._id || msg.sender_id?._id === user?._id;
                    return (
                        <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                            <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>{msg.content}</div>
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

            {/* Input */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                    className="input"
                    style={{ flex: 1, padding: '12px 16px', margin: 0 }}
                    placeholder="Type a message..."
                    value={text}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!text.trim()}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
