import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addReview, getOrderById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Send, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';

const REVIEW_LABELS = ['', 'CRITICAL_FAILURE', 'UNSATISFACTORY', 'OPERATIONAL', 'EXCEPTIONAL', 'PRISTINE_EXECUTION'];
const QUICK_TAGS = ['RAPID_DELIVERY', 'RELIABLE_OP', 'PUNCTUAL_SYNC', 'PERFECT_LOGISTICS'];

export default function ReviewPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    React.useEffect(() => {
        const load = async () => {
            try {
                const res = await getOrderById(orderId);
                setOrder(res.data);
            } catch {
                toast.error('SYNC_ERROR');
            }
        };
        load();
    }, [orderId]);

    const isRequester = order?.user_id?._id === user?._id || order?.user_id === user?._id;
    const reviewee = isRequester ? order?.delivery_partner_id : order?.user_id;

    const handleSubmit = async () => {
        if (!rating) { toast.error('PROTOCOL_ERROR: SELECT_RATING'); return; }
        setLoading(true);
        try {
            await addReview({ order_id: orderId, rating, review_text: text });
            setDone(true);
            toast.success('DEBRIEF_COMPLETE');
        } catch (err) {
            toast.error(err.response?.data?.message || 'SYNC_FAILURE');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    if (done) return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div className="slide-up">
                <div style={{ width: 80, height: 80, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22C55E' }}>
                    <CheckCircle2 size={40} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1E293B', marginBottom: 12 }}>Mission Log Archived</h2>
                <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
                    YOUR FEEDBACK HAS BEEN INTEGRATED INTO THE UNISERVE PROTOCOL. <br /> THANK YOU FOR STRENGTHENING THE HUB.
                </p>
                <button onClick={() => navigate('/')} style={{ width: '100%', height: 56, background: '#1E293B', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    RETURN_TO_HUB <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Plus Jakarta Sans' }}>
            <div style={{ padding: '24px', position: 'relative', zIndex: 100 }}>
                <button onClick={() => navigate('/')} style={{ background: 'white', border: '1px solid #E2E8F0', padding: 8, borderRadius: 12, cursor: 'pointer', color: '#1E293B' }}>
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }} className="slide-up">
                    <div style={{ position: 'relative', margin: '0 auto 32px', width: 80, height: 80 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: 28, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800 }}>
                            {reviewee ? getInitials(reviewee.name) : <Star size={32} />}
                        </div>
                        <div style={{ position: 'absolute', bottom: -10, right: -10, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '4px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                            <Star size={16} fill="currentColor" />
                        </div>
                    </div>
                    
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1E293B', letterSpacing: '-px', marginBottom: 8 }}>
                        {isRequester ? 'Rate Delivery Partner' : 'Rate Order Creator'}
                    </h1>
                    <p style={{ color: '#64748B', fontSize: 14, fontWeight: 500, marginBottom: 40, letterSpacing: '0.05em' }}>
                        DEBRIEFING MISSION_ID: {orderId?.slice(-6).toUpperCase()}
                    </p>

                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>How was your interaction with {reviewee?.name || 'the participant'}?</p>

                    {/* LUXE STAR TERMINAL */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                onClick={() => setRating(s)}
                                onMouseEnter={() => setHover(s)}
                                onMouseLeave={() => setHover(0)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 48,
                                    color: s <= (hover || rating) ? '#F59E0B' : '#E2E8F0',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    transform: s <= (hover || rating) ? 'scale(1.1)' : 'scale(1)',
                                    textShadow: s <= (hover || rating) ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
                                }}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    <div style={{ height: 32, marginBottom: 40 }}>
                        {(hover || rating) > 0 && (
                            <p style={{ fontSize: 12, fontWeight: 900, color: '#4F46E5', letterSpacing: '0.1em' }}>
                                [{REVIEW_LABELS[hover || rating]}]
                            </p>
                        )}
                    </div>

                    {/* QUICK TAGS */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
                        {QUICK_TAGS.map((t) => (
                            <button
                                key={t}
                                onClick={() => setText(t)}
                                style={{
                                    padding: '10px 18px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 800,
                                    background: text === t ? '#1E293B' : '#F1F5F9',
                                    color: text === t ? '#fff' : '#64748B',
                                    cursor: 'pointer', transition: 'all 0.2s ease'
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', width: '100%', marginBottom: 32 }}>
                        <textarea
                            style={{ width: '100%', minHeight: 120, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 20, fontSize: 14, fontWeight: 500, outline: 'none', resize: 'none' }}
                            placeholder="Detailed mission report (optional)..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !rating}
                        style={{
                            width: '100%', height: 64, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 20,
                            fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                            boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)', transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'ARCHIVING...' : 'SUBMIT_DEBRIEF'} <Send size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
